import type {} from './typia-tags.js';

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  type GeneratedArtifactFile,
  type GeneratedArtifactDriftIssue,
  normalizeSyncBlockMetadataFailure,
  reconcileGeneratedArtifacts,
  resolveSyncBlockMetadataPaths,
} from './metadata-core-artifacts.js';
import {
  assertValidClientIdentifier,
  normalizeSyncEndpointClientOptions,
  normalizeSyncRestOpenApiOptions,
  reserveUniqueClientTypeIdentifier,
  resolveEndpointClientContract,
  toJavaScriptStringLiteral,
  toModuleImportPath,
  toValidatorAccessExpression,
} from './metadata-core-endpoint-client.js';
import { renderPhpValidator } from './metadata-php-render.js';
import { analyzeSourceType, analyzeSourceTypes } from './metadata-parser.js';
import {
  createBlockJsonAttribute,
  createExampleValue,
  createManifestDocument,
  validateWordPressExtractionAttributes,
} from './metadata-projection.js';
import {
  buildEndpointOpenApiDocument,
  type EndpointOpenApiEndpointDefinition,
  manifestToJsonSchema,
  manifestToOpenApi,
  normalizeEndpointAuthDefinition,
  type OpenApiInfo,
  projectJsonSchemaDocument,
} from './schema-core.js';

export interface SyncBlockMetadataOptions {
  blockJsonFile: string;
  jsonSchemaFile?: string;
  manifestFile?: string;
  openApiFile?: string;
  phpValidatorFile?: string;
  projectRoot?: string;
  sourceTypeName: string;
  typesFile: string;
}

export interface SyncBlockMetadataResult {
  attributeNames: string[];
  blockJsonPath: string;
  jsonSchemaPath?: string;
  lossyProjectionWarnings: string[];
  manifestPath: string;
  openApiPath?: string;
  phpGenerationWarnings: string[];
  phpValidatorPath: string;
}

export interface ArtifactSyncExecutionOptions {
  /**
   * Verify that generated artifacts are already current without rewriting them.
   */
  check?: boolean;
}

/**
 * High-level outcome for one `runSyncBlockMetadata()` execution.
 *
 * - `success`: metadata sync completed without warnings.
 * - `warning`: metadata sync completed, but warn-only findings were recorded.
 * - `error`: metadata sync failed, or warnings were promoted to errors by flags.
 */
export type SyncBlockMetadataStatus = 'success' | 'warning' | 'error';

/**
 * Stable failure bucket for structured `sync-types` error reporting.
 */
export type SyncBlockMetadataFailureCode =
  /** Generated artifact files are missing or stale relative to the current sources. */
  | 'stale-generated-artifact'
  /** A TypeScript node kind is not supported by the metadata parser. */
  | 'unsupported-type-node'
  /** A supported node kind was used in an unsupported pattern or combination. */
  | 'unsupported-type-pattern'
  /** Recursive type analysis was detected and aborted. */
  | 'recursive-type'
  /** The configured types file or source type could not be resolved correctly. */
  | 'invalid-source-type'
  /** TypeScript diagnostics blocked analysis before metadata generation ran. */
  | 'typescript-diagnostic'
  /** The failure did not match a more specific structured bucket. */
  | 'unknown-internal-error';

/**
 * Structured failure payload returned when `runSyncBlockMetadata()` does not complete.
 */
export interface SyncBlockMetadataFailure {
  /** Stable failure bucket suitable for branching in scripts or CI. */
  code: SyncBlockMetadataFailureCode;
  /** Human-readable error message captured from the original failure. */
  message: string;
  /** Original thrown error name when available. */
  name: string;
}

/**
 * Optional execution flags that control how warnings affect the final report status.
 */
export interface SyncBlockMetadataExecutionOptions
  extends ArtifactSyncExecutionOptions {
  /** Promote lossy WordPress projection warnings to `error` status. */
  failOnLossy?: boolean;
  /** Promote PHP validator coverage warnings to `error` status. */
  failOnPhpWarnings?: boolean;
  /**
   * Promote all warnings to `error` status.
   *
   * When `true`, this behaves like setting both `failOnLossy` and
   * `failOnPhpWarnings` to `true`.
   */
  strict?: boolean;
}

/**
 * Structured result returned by `runSyncBlockMetadata()`.
 */
export interface SyncBlockMetadataReport {
  /** Attribute keys discovered from the source type. Empty when analysis fails early. */
  attributeNames: string[];
  /** Absolute path to the generated or target `block.json`. */
  blockJsonPath: string | null;
  /** Absolute path to the generated JSON Schema file when schema output is enabled. */
  jsonSchemaPath: string | null;
  /** Warn-only notices for Typia constraints that cannot round-trip into `block.json`. */
  lossyProjectionWarnings: string[];
  /** Absolute path to the generated or target manifest file. */
  manifestPath: string | null;
  /** Absolute path to the generated aggregate OpenAPI file when enabled. */
  openApiPath: string | null;
  /** Warn-only notices for Typia constraints not yet enforced by PHP validation. */
  phpGenerationWarnings: string[];
  /** Absolute path to the generated or target PHP validator file. */
  phpValidatorPath: string | null;
  /** Structured failure payload when analysis or generation throws. */
  failure: SyncBlockMetadataFailure | null;
  /** Effective lossy-warning failure flag after `strict` has been applied. */
  failOnLossy: boolean;
  /** Effective PHP-warning failure flag after `strict` has been applied. */
  failOnPhpWarnings: boolean;
  /** Final execution status after warnings and failure handling are applied. */
  status: SyncBlockMetadataStatus;
  /** Whether the report was computed in strict mode. */
  strict: boolean;
}

export interface SyncTypeSchemaOptions {
  jsonSchemaFile: string;
  openApiFile?: string;
  openApiInfo?: OpenApiInfo;
  projectRoot?: string;
  sourceTypeName: string;
  typesFile: string;
}

export interface SyncTypeSchemaResult {
  jsonSchemaPath: string;
  openApiPath?: string;
  sourceTypeName: string;
}

/**
 * Source type mapping used by endpoint manifests and aggregate REST OpenAPI generation.
 */
export interface EndpointManifestContractDefinition {
  /** Optional component name override for the generated schema reference. */
  schemaName?: string;
  /** Type name exported from the source `typesFile`. */
  sourceTypeName: string;
}

/**
 * Portable route metadata stored in one endpoint manifest entry.
 */
export type EndpointManifestEndpointDefinition = EndpointOpenApiEndpointDefinition;

/**
 * Canonical TypeScript description of one scaffolded REST surface.
 */
export interface EndpointManifestDefinition<
  Contracts extends Readonly<
    Record<string, EndpointManifestContractDefinition>
  > = Readonly<Record<string, EndpointManifestContractDefinition>>,
  Endpoints extends readonly EndpointManifestEndpointDefinition[] =
    readonly EndpointManifestEndpointDefinition[],
> {
  /** Contract registry keyed by logical route contract ids. */
  contracts: Contracts;
  /** Route registry keyed by concrete REST path and method pairs. */
  endpoints: Endpoints;
  /** Optional document-level metadata for aggregate OpenAPI output. */
  info?: OpenApiInfo;
}

/**
 * Preserve literal TypeScript inference for backend-neutral endpoint manifests.
 *
 * @param manifest Canonical REST surface metadata authored in TypeScript.
 * @returns The same manifest object with literal contract and endpoint metadata preserved.
 */
export function defineEndpointManifest<
  const Contracts extends Readonly<
    Record<string, EndpointManifestContractDefinition>
  >,
  const Endpoints extends readonly EndpointManifestEndpointDefinition[],
>(
  manifest: EndpointManifestDefinition<Contracts, Endpoints>,
): EndpointManifestDefinition<Contracts, Endpoints> {
  return manifest;
}

/**
 * Backward-compatible source type mapping used when generating aggregate REST OpenAPI documents.
 */
export interface RestOpenApiContractDefinition extends EndpointManifestContractDefinition {}

/**
 * Backward-compatible route metadata consumed by `syncRestOpenApi()`.
 */
export type RestOpenApiEndpointDefinition = EndpointManifestEndpointDefinition;

/**
 * Shared file and project inputs for REST OpenAPI generation.
 */
interface SyncRestOpenApiBaseOptions {
  /** Output path for the aggregate OpenAPI document. */
  openApiFile: string;
  /** Optional project root used to resolve file paths. */
  projectRoot?: string;
  /** Source file that exports the REST contract types. */
  typesFile: string;
}

/**
 * Manifest-first options for writing a canonical endpoint-aware REST OpenAPI document.
 */
export interface SyncRestOpenApiManifestOptions extends SyncRestOpenApiBaseOptions {
  /** Canonical endpoint manifest describing the REST surface. */
  manifest: EndpointManifestDefinition;
  /** Not accepted when `manifest` is provided. */
  contracts?: never;
  /** Not accepted when `manifest` is provided. */
  endpoints?: never;
  /** Not accepted when `manifest` is provided. */
  openApiInfo?: never;
}

/**
 * Backward-compatible options for writing a canonical endpoint-aware REST OpenAPI document.
 */
export interface SyncRestOpenApiContractsOptions extends SyncRestOpenApiBaseOptions {
  /** Contract registry keyed by logical route contract ids. */
  contracts: Readonly<Record<string, RestOpenApiContractDefinition>>;
  /** Endpoint registry describing the REST paths, methods, and auth policies to document. */
  endpoints: readonly RestOpenApiEndpointDefinition[];
  /** Optional OpenAPI document metadata. */
  openApiInfo?: OpenApiInfo;
  /** Not accepted when `contracts` and `endpoints` are provided directly. */
  manifest?: never;
}

/**
 * Options for writing a canonical endpoint-aware REST OpenAPI document.
 */
export type SyncRestOpenApiOptions =
  | SyncRestOpenApiManifestOptions
  | SyncRestOpenApiContractsOptions;

/**
 * Result returned after writing an aggregate REST OpenAPI document.
 */
export interface SyncRestOpenApiResult {
  /** Number of endpoints included in the generated OpenAPI file. */
  endpointCount: number;
  /** Absolute path to the generated OpenAPI file. */
  openApiPath: string;
  /** Component schema names included in the generated document. */
  schemaNames: string[];
}

interface SyncEndpointClientBaseOptions {
  /** Output path for the generated portable client module. */
  clientFile: string;
  /** Optional project root used to resolve file paths. */
  projectRoot?: string;
  /** Source file that exports the endpoint contract types. */
  typesFile: string;
  /** Optional explicit path to the validator module. */
  validatorsFile?: string;
}

/**
 * Manifest-first options for writing a portable endpoint client module.
 */
export interface SyncEndpointClientOptions extends SyncEndpointClientBaseOptions {
  /** Canonical endpoint manifest describing the REST surface. */
  manifest: EndpointManifestDefinition;
}

/**
 * Result returned after writing a generated portable endpoint client module.
 */
export interface SyncEndpointClientResult {
  /** Number of endpoints included in the generated client file. */
  endpointCount: number;
  /** Absolute path to the generated client file. */
  clientPath: string;
  /** Operation ids emitted as endpoint constants and convenience wrappers. */
  operationIds: string[];
}

/**
 * Synchronizes block metadata artifacts from a source TypeScript contract.
 *
 * This updates `block.json` attributes/examples and emits the related JSON
 * Schema, manifest, OpenAPI, and optional PHP validator artifacts derived from
 * the same source type.
 *
 * @param options Configuration for locating the project root, source types
 * file/type name, and output artifact paths.
 * @returns The generated artifact paths plus any lossy WordPress projection or
 * PHP validator coverage warnings discovered during synchronization.
 */
export async function syncBlockMetadata(
  options: SyncBlockMetadataOptions,
  executionOptions: ArtifactSyncExecutionOptions = {},
): Promise<SyncBlockMetadataResult> {
  const { blockJsonPath, jsonSchemaPath, manifestPath, openApiPath, phpValidatorPath } =
    resolveSyncBlockMetadataPaths(options);
  const { rootNode } = analyzeSourceType(options);

  if (rootNode.kind !== 'object' || rootNode.properties === undefined) {
    throw new Error(
      `Source type "${options.sourceTypeName}" must resolve to an object shape`,
    );
  }
  validateWordPressExtractionAttributes(rootNode.properties);

  const driftIssues: GeneratedArtifactDriftIssue[] = [];
  const lossyProjectionWarnings: string[] = [];
  let blockJsonArtifact: GeneratedArtifactFile | null = null;

  if (fs.existsSync(blockJsonPath)) {
    const blockJson = JSON.parse(
      fs.readFileSync(blockJsonPath, 'utf8'),
    ) as Record<string, unknown>;

    blockJson.attributes = Object.fromEntries(
      Object.entries(rootNode.properties).map(([key, node]) => [
        key,
        createBlockJsonAttribute(node, lossyProjectionWarnings),
      ]),
    );
    blockJson.example = {
      attributes: Object.fromEntries(
        Object.entries(rootNode.properties).map(([key, node]) => [
          key,
          createExampleValue(node, key),
        ]),
      ),
    };

    blockJsonArtifact = {
      content: JSON.stringify(blockJson, null, '\t'),
      path: blockJsonPath,
    };
  } else if (executionOptions.check === true) {
    driftIssues.push({
      path: blockJsonPath,
      reason: 'missing',
    });
  } else {
    fs.readFileSync(blockJsonPath, 'utf8');
  }

  if (blockJsonArtifact === null) {
    Object.values(rootNode.properties).forEach((node) => {
      createBlockJsonAttribute(node, lossyProjectionWarnings);
    });
  }

  const manifest = createManifestDocument(
    options.sourceTypeName,
    rootNode.properties,
  );
  const manifestContent = JSON.stringify(manifest, null, '\t');
  const jsonSchemaContent = jsonSchemaPath
    ? JSON.stringify(manifestToJsonSchema(manifest as never), null, '\t')
    : null;
  const openApiContent = openApiPath
    ? JSON.stringify(
        manifestToOpenApi(manifest as never, {
          title: options.sourceTypeName,
        }),
        null,
        '\t',
      )
    : null;
  const phpValidator = renderPhpValidator(manifest);

  reconcileGeneratedArtifacts(
    [
      ...(blockJsonArtifact ? [blockJsonArtifact] : []),
      {
        content: manifestContent,
        path: manifestPath,
      },
      ...(jsonSchemaContent && jsonSchemaPath
        ? [
            {
              content: jsonSchemaContent,
              path: jsonSchemaPath,
            },
          ]
        : []),
      ...(openApiContent && openApiPath
        ? [
            {
              content: openApiContent,
              path: openApiPath,
            },
          ]
        : []),
      {
        content: phpValidator.source,
        path: phpValidatorPath,
      },
    ],
    executionOptions,
    driftIssues,
  );

  return {
    attributeNames: Object.keys(rootNode.properties),
    blockJsonPath,
    ...(jsonSchemaPath ? { jsonSchemaPath } : {}),
    lossyProjectionWarnings: [...new Set(lossyProjectionWarnings)].sort(),
    manifestPath,
    ...(openApiPath ? { openApiPath } : {}),
    phpGenerationWarnings: [...new Set(phpValidator.warnings)].sort(),
    phpValidatorPath,
  };
}

/**
 * Execute `syncBlockMetadata()` and return a structured status report.
 *
 * This wrapper preserves the existing artifact-generation behavior while adding
 * stable status, warning, and failure metadata for scripts and CI integrations.
 * Hard analysis failures are normalized into `failure`, and warning promotion is
 * controlled by `strict`, `failOnLossy`, and `failOnPhpWarnings`.
 *
 * @param options Artifact generation inputs shared with `syncBlockMetadata()`.
 * @param executionOptions Optional warning-promotion flags for CI/reporting flows.
 * @returns A structured execution report describing generated paths, warnings, and failures.
 */
export async function runSyncBlockMetadata(
  options: SyncBlockMetadataOptions,
  executionOptions: SyncBlockMetadataExecutionOptions = {},
): Promise<SyncBlockMetadataReport> {
  const strict = executionOptions.strict === true;
  const failOnLossy = strict || executionOptions.failOnLossy === true;
  const failOnPhpWarnings = strict || executionOptions.failOnPhpWarnings === true;
  const resolvedPaths = resolveSyncBlockMetadataPaths(options);

  try {
    const result = await syncBlockMetadata(options, {
      check: executionOptions.check,
    });
    const hasLossyWarnings = result.lossyProjectionWarnings.length > 0;
    const hasPhpWarnings = result.phpGenerationWarnings.length > 0;
    const hasWarnings = hasLossyWarnings || hasPhpWarnings;
    const warningsAreErrors =
      (hasLossyWarnings && failOnLossy) || (hasPhpWarnings && failOnPhpWarnings);

    return {
      attributeNames: result.attributeNames,
      blockJsonPath: result.blockJsonPath,
      jsonSchemaPath: result.jsonSchemaPath ?? null,
      lossyProjectionWarnings: result.lossyProjectionWarnings,
      manifestPath: result.manifestPath,
      openApiPath: result.openApiPath ?? null,
      phpGenerationWarnings: result.phpGenerationWarnings,
      phpValidatorPath: result.phpValidatorPath,
      failure: null,
      failOnLossy,
      failOnPhpWarnings,
      status: warningsAreErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      strict,
    };
  } catch (error) {
    return {
      attributeNames: [],
      blockJsonPath: resolvedPaths.blockJsonPath,
      jsonSchemaPath: resolvedPaths.jsonSchemaPath,
      lossyProjectionWarnings: [],
      manifestPath: resolvedPaths.manifestPath,
      openApiPath: resolvedPaths.openApiPath,
      phpGenerationWarnings: [],
      phpValidatorPath: resolvedPaths.phpValidatorPath,
      failure: normalizeSyncBlockMetadataFailure(error),
      failOnLossy,
      failOnPhpWarnings,
      status: 'error',
      strict,
    };
  }
}

export async function syncTypeSchemas(
  options: SyncTypeSchemaOptions,
  executionOptions: ArtifactSyncExecutionOptions = {},
): Promise<SyncTypeSchemaResult> {
  const { projectRoot, rootNode } = analyzeSourceType(options);
  if (rootNode.kind !== 'object' || rootNode.properties === undefined) {
    throw new Error(
      `Source type "${options.sourceTypeName}" must resolve to an object shape for schema generation`,
    );
  }

  const manifest = createManifestDocument(
    options.sourceTypeName,
    rootNode.properties,
  );

  const jsonSchemaPath = path.resolve(projectRoot, options.jsonSchemaFile);
  const openApiPath = options.openApiFile
    ? path.resolve(projectRoot, options.openApiFile)
    : undefined;
  reconcileGeneratedArtifacts(
    [
      {
        content: JSON.stringify(
          projectJsonSchemaDocument(manifestToJsonSchema(manifest as never), {
            profile: 'rest',
          }),
          null,
          '\t',
        ),
        path: jsonSchemaPath,
      },
      ...(openApiPath
        ? [
            {
              content: JSON.stringify(
                manifestToOpenApi(
                  manifest as never,
                  options.openApiInfo ?? { title: options.sourceTypeName },
                ),
                null,
                '\t',
              ),
              path: openApiPath,
            },
          ]
        : []),
    ],
    executionOptions,
  );

  return {
    jsonSchemaPath,
    openApiPath,
    sourceTypeName: options.sourceTypeName,
  };
}

/**
 * Generate and write a canonical OpenAPI document for scaffolded REST contracts.
 *
 * @param options Contracts, endpoint metadata, source file, and output file settings.
 * @returns Information about the generated OpenAPI document and included schema components.
 */
export async function syncRestOpenApi(
  options: SyncRestOpenApiOptions,
  executionOptions: ArtifactSyncExecutionOptions = {},
): Promise<SyncRestOpenApiResult> {
  const { manifest, openApiPath, projectRoot, typesFile } =
    normalizeSyncRestOpenApiOptions(options);
  const sourceTypeNames = Object.values(manifest.contracts).map(
    (contract) => contract.sourceTypeName,
  );
  const analyzedTypes = analyzeSourceTypes(
    {
      projectRoot,
      typesFile,
    },
    sourceTypeNames,
  );
  const contracts = Object.fromEntries(
    Object.entries(manifest.contracts).map(([contractKey, contract]) => {
      const rootNode = analyzedTypes[contract.sourceTypeName];
      if (rootNode.kind !== 'object' || rootNode.properties === undefined) {
        throw new Error(
          `Source type "${contract.sourceTypeName}" must resolve to an object shape for REST OpenAPI generation`,
        );
      }

      return [
        contractKey,
        {
          document: createManifestDocument(
            contract.sourceTypeName,
            rootNode.properties,
          ),
          ...(typeof contract.schemaName === 'string' &&
          contract.schemaName.length > 0
            ? { schemaName: contract.schemaName }
            : {}),
        },
      ];
    }),
  );
  reconcileGeneratedArtifacts(
    [
      {
        content: JSON.stringify(
          buildEndpointOpenApiDocument({
            contracts,
            endpoints: manifest.endpoints,
            info: manifest.info,
          }),
          null,
          '\t',
        ),
        path: openApiPath,
      },
    ],
    executionOptions,
  );

  return {
    endpointCount: manifest.endpoints.length,
    openApiPath,
    schemaNames: Object.values(manifest.contracts).map(
      (contract) => contract.schemaName ?? contract.sourceTypeName,
    ),
  };
}

/**
 * Generate and write a manifest-first portable endpoint client module.
 *
 * @param options Manifest, source file, validator file, and output path settings.
 * @returns Information about the generated client file and emitted operation ids.
 */
export async function syncEndpointClient(
  options: SyncEndpointClientOptions,
  executionOptions: ArtifactSyncExecutionOptions = {},
): Promise<SyncEndpointClientResult> {
  const { clientPath, manifest, projectRoot, typesFile, validatorsFile } =
    normalizeSyncEndpointClientOptions(options);
  analyzeSourceTypes(
    { projectRoot, typesFile },
    [...new Set(Object.values(manifest.contracts).map((contract) => contract.sourceTypeName))],
  );
  const operationIds = new Set<string>();
  const importedTypeNames = new Set<string>();
  const endpointLines: string[] = [];
  const inlineHelpers = new Set<string>();
  const validatorPropertyNames = new Map<string, string>();
  const hasCombinedRequestEndpoints = manifest.endpoints.some(
    (endpoint) => Boolean(endpoint.bodyContract && endpoint.queryContract),
  );
  const occupiedIdentifiers = new Set([
    'apiValidators',
    'callEndpoint',
    'createEndpoint',
    ...(manifest.endpoints.some(
      (endpoint) => !endpoint.bodyContract && !endpoint.queryContract,
    )
      ? ['validateNoRequest']
      : []),
    ...(hasCombinedRequestEndpoints ? ['validateCombinedRequest'] : []),
  ]);

  for (const endpoint of manifest.endpoints) {
    const normalizedAuth = normalizeEndpointAuthDefinition(endpoint);
    const endpointConstantName = `${endpoint.operationId}Endpoint`;
    assertValidClientIdentifier(endpoint.operationId, 'operationId');
    assertValidClientIdentifier(endpointConstantName, 'endpoint constant');
    if (operationIds.has(endpoint.operationId)) {
      throw new Error(
        `Duplicate endpoint operationId "${endpoint.operationId}" detected while generating the endpoint client.`,
      );
    }
    for (const identifier of [endpoint.operationId, endpointConstantName]) {
      if (occupiedIdentifiers.has(identifier)) {
        throw new Error(
          `Generated endpoint client identifier "${identifier}" collides with another emitted symbol.`,
        );
      }
    }
    operationIds.add(endpoint.operationId);
    occupiedIdentifiers.add(endpoint.operationId);
    occupiedIdentifiers.add(endpointConstantName);

    const queryContractKey = endpoint.queryContract ?? null;
    const bodyContractKey = endpoint.bodyContract ?? null;
    const hasRequest = Boolean(queryContractKey || bodyContractKey);
    const responseContract = resolveEndpointClientContract(
      manifest,
      endpoint.responseContract,
      endpoint.operationId,
      'responseContract',
    );
    importedTypeNames.add(responseContract.sourceTypeName);

    let requestTypeName = 'undefined';
    let requestValidatorExpression = 'validateNoRequest';
    let requestLocationExpression: string | null = null;
    const queryContract = queryContractKey
      ? resolveEndpointClientContract(
          manifest,
          queryContractKey,
          endpoint.operationId,
          'queryContract',
        )
      : null;
    const bodyContract = bodyContractKey
      ? resolveEndpointClientContract(
          manifest,
          bodyContractKey,
          endpoint.operationId,
          'bodyContract',
        )
      : null;

    if (queryContract && bodyContract) {
      const queryValidatorExpression = toValidatorAccessExpression(
        queryContractKey!,
        validatorPropertyNames,
      );
      const bodyValidatorExpression = toValidatorAccessExpression(
        bodyContractKey!,
        validatorPropertyNames,
      );
      requestTypeName = `{ query: ${queryContract.sourceTypeName}; body: ${bodyContract.sourceTypeName} }`;
      requestValidatorExpression = `(input) => validateCombinedRequest( input, ${queryValidatorExpression}, ${bodyValidatorExpression} )`;
      requestLocationExpression = "'query-and-body'";
      importedTypeNames.add(queryContract.sourceTypeName);
      importedTypeNames.add(bodyContract.sourceTypeName);
      inlineHelpers.add('validateCombinedRequest');
    } else if (queryContract) {
      requestTypeName = queryContract.sourceTypeName;
      requestValidatorExpression = toValidatorAccessExpression(
        queryContractKey!,
        validatorPropertyNames,
      );
      requestLocationExpression = "'query'";
      importedTypeNames.add(queryContract.sourceTypeName);
    } else if (bodyContract) {
      requestTypeName = bodyContract.sourceTypeName;
      requestValidatorExpression = toValidatorAccessExpression(
        bodyContractKey!,
        validatorPropertyNames,
      );
      requestLocationExpression = "'body'";
      importedTypeNames.add(bodyContract.sourceTypeName);
    } else {
      inlineHelpers.add('validateNoRequest');
    }

    const returnCallExpression = hasRequest
      ? `callEndpoint( ${endpoint.operationId}Endpoint, request, options )`
      : `callEndpoint( ${endpoint.operationId}Endpoint, undefined, options )`;
    const returnCallLines =
      returnCallExpression.length <= 68
        ? [`\treturn ${returnCallExpression};`]
        : [
            `\treturn callEndpoint(`,
            `\t\t${endpoint.operationId}Endpoint,`,
            `\t\t${hasRequest ? 'request' : 'undefined'},`,
            `\t\toptions`,
            `\t);`,
          ];

    endpointLines.push(
      [
        `export const ${endpointConstantName} = createEndpoint<`,
        `\t${requestTypeName},`,
        `\t${responseContract.sourceTypeName}`,
        `>( {`,
        `\tauthIntent: ${toJavaScriptStringLiteral(normalizedAuth.auth)},`,
        ...(normalizedAuth.authMode
          ? [`\tauthMode: ${toJavaScriptStringLiteral(normalizedAuth.authMode)},`]
          : []),
        `\tmethod: ${toJavaScriptStringLiteral(endpoint.method)},`,
        `\toperationId: ${toJavaScriptStringLiteral(endpoint.operationId)},`,
        `\tpath: ${toJavaScriptStringLiteral(endpoint.path)},`,
        ...(requestLocationExpression
          ? [`\trequestLocation: ${requestLocationExpression},`]
          : []),
        `\tvalidateRequest: ${requestValidatorExpression},`,
        `\tvalidateResponse: ${toValidatorAccessExpression(
          endpoint.responseContract,
          validatorPropertyNames,
        )},`,
        `} );`,
        '',
        `export function ${endpoint.operationId}(`,
        ...(hasRequest ? [`\trequest: ${requestTypeName},`] : []),
        `\toptions: EndpointCallOptions`,
        `) {`,
        ...returnCallLines,
        `}`,
      ].join('\n'),
    );
  }

  const sortedTypeNames = [...importedTypeNames].sort();
  const helperTypeNames = new Set(sortedTypeNames);
  const combinedValidationErrorTypeName = inlineHelpers.has('validateCombinedRequest')
    ? reserveUniqueClientTypeIdentifier('PortableValidationError', helperTypeNames)
    : null;
  const combinedValidationResultTypeName = inlineHelpers.has('validateCombinedRequest')
    ? reserveUniqueClientTypeIdentifier('PortableValidationResult', helperTypeNames)
    : null;
  const lines = [
    `import {`,
    `\tcallEndpoint,`,
    `\tcreateEndpoint,`,
    `\ttype EndpointCallOptions,`,
    ...(inlineHelpers.has('validateCombinedRequest')
      ? [
          `\ttype ValidationError as ${combinedValidationErrorTypeName},`,
          `\ttype ValidationResult as ${combinedValidationResultTypeName},`,
        ]
      : []),
    `} from '@wp-typia/api-client';`,
    ...(sortedTypeNames.length === 1
      ? [
          `import type { ${sortedTypeNames[0]} } from ${toJavaScriptStringLiteral(
            toModuleImportPath(clientPath, path.resolve(projectRoot, typesFile)),
          )};`,
        ]
      : [
          `import type {`,
          ...sortedTypeNames.map((typeName) => `\t${typeName},`),
          `} from ${toJavaScriptStringLiteral(
            toModuleImportPath(clientPath, path.resolve(projectRoot, typesFile)),
          )};`,
        ]),
    `import { apiValidators } from ${toJavaScriptStringLiteral(
      toModuleImportPath(clientPath, path.resolve(projectRoot, validatorsFile)),
    )};`,
    '',
    ...(inlineHelpers.has('validateNoRequest')
      ? [
          `function validateNoRequest(input: unknown) {`,
          `\tif (input !== undefined) {`,
          `\t\treturn {`,
          `\t\t\tdata: undefined,`,
          `\t\t\terrors: [`,
          `\t\t\t\t{`,
          `\t\t\t\t\texpected: 'undefined',`,
          `\t\t\t\t\tpath: '(root)',`,
          `\t\t\t\t\tvalue: input,`,
          `\t\t\t\t},`,
          `\t\t\t],`,
          `\t\t\tisValid: false,`,
          `\t\t};`,
          `\t}`,
          '',
          `\treturn {`,
          `\t\tdata: undefined,`,
          `\t\terrors: [],`,
          `\t\tisValid: true,`,
          `\t};`,
          `}`,
          '',
        ]
      : []),
    ...(inlineHelpers.has('validateCombinedRequest')
      ? [
          `function validateCombinedRequest<TQuery, TBody>(`,
          `\tinput: unknown,`,
          `\tvalidateQuery: (input: unknown) => ${combinedValidationResultTypeName}<TQuery>,`,
          `\tvalidateBody: (input: unknown) => ${combinedValidationResultTypeName}<TBody>,`,
          `): ${combinedValidationResultTypeName}<{ query: TQuery; body: TBody }> {`,
          `\tif ( input === null || typeof input !== 'object' || Array.isArray( input ) ) {`,
          `\t\treturn {`,
          `\t\t\tdata: undefined,`,
          `\t\t\terrors: [`,
          `\t\t\t\t{`,
          `\t\t\t\t\texpected: '{ query, body }',`,
          `\t\t\t\t\tpath: '(root)',`,
          `\t\t\t\t\tvalue: input,`,
          `\t\t\t\t},`,
          `\t\t\t],`,
          `\t\t\tisValid: false,`,
          `\t\t};`,
          `\t}`,
          ``,
          `\tconst request = input as { query?: unknown; body?: unknown };`,
          `\tif ( !Object.prototype.hasOwnProperty.call( request, 'query' ) || !Object.prototype.hasOwnProperty.call( request, 'body' ) ) {`,
          `\t\treturn {`,
          `\t\t\tdata: undefined,`,
          `\t\t\terrors: [`,
          `\t\t\t\t{`,
          `\t\t\t\t\texpected: '{ query, body }',`,
          `\t\t\t\t\tpath: '(root)',`,
          `\t\t\t\t\tvalue: input,`,
          `\t\t\t\t},`,
          `\t\t\t],`,
          `\t\t\tisValid: false,`,
          `\t\t};`,
          `\t}`,
          ``,
          `\tconst prefixPath = (prefix: '$.query' | '$.body', path: string): string => {`,
          `\t\tif ( path === '(root)' ) {`,
          `\t\t\treturn prefix;`,
          `\t\t}`,
          ``,
          `\t\treturn path.startsWith( '$' ) ? \`\${prefix}\${path.slice( 1 )}\` : \`\${prefix}.\${path}\`;`,
          `\t};`,
          ``,
          `\tconst queryValidation = validateQuery( request.query );`,
          `\tconst bodyValidation = validateBody( request.body );`,
          `\tconst errors: ${combinedValidationErrorTypeName}[] = [`,
          `\t\t...queryValidation.errors.map( ( error ) => ( {`,
          `\t\t\t...error,`,
          `\t\t\tpath: prefixPath( '$.query', error.path ),`,
          `\t\t} ) ),`,
          `\t\t...bodyValidation.errors.map( ( error ) => ( {`,
          `\t\t\t...error,`,
          `\t\t\tpath: prefixPath( '$.body', error.path ),`,
          `\t\t} ) ),`,
          `\t];`,
          ``,
          `\tif ( !queryValidation.isValid || !bodyValidation.isValid ) {`,
          `\t\treturn {`,
          `\t\t\tdata: undefined,`,
          `\t\t\terrors,`,
          `\t\t\tisValid: false,`,
          `\t\t};`,
          `\t}`,
          ``,
          `\treturn {`,
          `\t\tdata: {`,
          `\t\t\tbody: bodyValidation.data ?? ( request.body as TBody ),`,
          `\t\t\tquery: queryValidation.data ?? ( request.query as TQuery ),`,
          `\t\t},`,
          `\t\terrors: [],`,
          `\t\tisValid: true,`,
          `\t};`,
          `}`,
          '',
        ]
      : []),
    ...endpointLines.flatMap((entry) => [entry, '']),
  ];

  reconcileGeneratedArtifacts(
    [
      {
        content: `${lines.join('\n').trimEnd()}\n`,
        path: clientPath,
      },
    ],
    executionOptions,
  );

  return {
    clientPath,
    endpointCount: manifest.endpoints.length,
    operationIds: [...operationIds],
  };
}
