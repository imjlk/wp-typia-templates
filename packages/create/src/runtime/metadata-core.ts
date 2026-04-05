import type {} from './typia-tags.js';

import * as fs from 'node:fs';
import * as path from 'node:path';

import { getTaggedSyncBlockMetadataFailureCode } from './metadata-analysis.js';
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
export interface SyncBlockMetadataExecutionOptions {
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

interface NormalizedSyncRestOpenApiOptions {
  manifest: EndpointManifestDefinition;
  openApiPath: string;
  projectRoot: string;
  typesFile: string;
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

interface NormalizedSyncEndpointClientOptions {
  clientPath: string;
  manifest: EndpointManifestDefinition;
  projectRoot: string;
  typesFile: string;
  validatorsFile: string;
}

interface ResolvedSyncBlockMetadataPaths {
  blockJsonPath: string;
  jsonSchemaPath: string | null;
  manifestPath: string;
  openApiPath: string | null;
  phpValidatorPath: string;
  projectRoot: string;
}

function resolveSyncBlockMetadataPaths(
  options: SyncBlockMetadataOptions,
): ResolvedSyncBlockMetadataPaths {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const blockJsonPath = path.resolve(projectRoot, options.blockJsonFile);
  const manifestRelativePath =
    options.manifestFile ??
    path.join(path.dirname(options.blockJsonFile), 'typia.manifest.json');
  const manifestPath = path.resolve(projectRoot, manifestRelativePath);
  const phpValidatorPath = path.resolve(
    projectRoot,
    options.phpValidatorFile ??
      path.join(path.dirname(manifestRelativePath), 'typia-validator.php'),
  );

  return {
    blockJsonPath,
    jsonSchemaPath: options.jsonSchemaFile
      ? path.resolve(projectRoot, options.jsonSchemaFile)
      : null,
    manifestPath,
    openApiPath: options.openApiFile
      ? path.resolve(projectRoot, options.openApiFile)
      : null,
    phpValidatorPath,
    projectRoot,
  };
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

  const blockJson = JSON.parse(
    fs.readFileSync(blockJsonPath, 'utf8'),
  ) as Record<string, unknown>;
  const lossyProjectionWarnings: string[] = [];

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

  const manifest = createManifestDocument(
    options.sourceTypeName,
    rootNode.properties,
  );

  fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, '\t'));
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t'));

  if (jsonSchemaPath) {
    fs.mkdirSync(path.dirname(jsonSchemaPath), { recursive: true });
    fs.writeFileSync(
      jsonSchemaPath,
      JSON.stringify(manifestToJsonSchema(manifest as never), null, '\t'),
    );
  }
  if (openApiPath) {
    fs.mkdirSync(path.dirname(openApiPath), { recursive: true });
    fs.writeFileSync(
      openApiPath,
      JSON.stringify(
        manifestToOpenApi(manifest as never, {
          title: options.sourceTypeName,
        }),
        null,
        '\t',
      ),
    );
  }

  const phpValidator = renderPhpValidator(manifest);
  fs.mkdirSync(path.dirname(phpValidatorPath), { recursive: true });
  fs.writeFileSync(phpValidatorPath, phpValidator.source);

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
    const result = await syncBlockMetadata(options);
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
  fs.mkdirSync(path.dirname(jsonSchemaPath), { recursive: true });
  fs.writeFileSync(
    jsonSchemaPath,
    JSON.stringify(manifestToJsonSchema(manifest as never), null, '\t'),
  );

  const openApiPath = options.openApiFile
    ? path.resolve(projectRoot, options.openApiFile)
    : undefined;
  if (openApiPath) {
    fs.mkdirSync(path.dirname(openApiPath), { recursive: true });
    fs.writeFileSync(
      openApiPath,
      JSON.stringify(
        manifestToOpenApi(
          manifest as never,
          options.openApiInfo ?? { title: options.sourceTypeName },
        ),
        null,
        '\t',
      ),
    );
  }

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
  fs.mkdirSync(path.dirname(openApiPath), { recursive: true });
  fs.writeFileSync(
    openApiPath,
    JSON.stringify(
      buildEndpointOpenApiDocument({
        contracts,
        endpoints: manifest.endpoints,
        info: manifest.info,
      }),
      null,
      '\t',
    ),
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

  fs.mkdirSync(path.dirname(clientPath), { recursive: true });
  fs.writeFileSync(clientPath, `${lines.join('\n').trimEnd()}\n`, 'utf8');

  return {
    clientPath,
    endpointCount: manifest.endpoints.length,
    operationIds: [...operationIds],
  };
}

function normalizeSyncRestOpenApiOptions(
  options: SyncRestOpenApiOptions,
): NormalizedSyncRestOpenApiOptions {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const openApiPath = path.resolve(projectRoot, options.openApiFile);

  if ('manifest' in options) {
    const hasDecomposedInputs =
      'contracts' in options ||
      'endpoints' in options ||
      'openApiInfo' in options;
    if (hasDecomposedInputs) {
      throw new Error(
        'syncRestOpenApi() accepts either { manifest, ... } or { contracts, endpoints, ... }, but not both.',
      );
    }
    if (options.manifest == null) {
      throw new Error(
        'syncRestOpenApi() requires a manifest object when using { manifest, ... }.',
      );
    }

    return {
      manifest: options.manifest,
      openApiPath,
      projectRoot,
      typesFile: options.typesFile,
    };
  }

  return {
    manifest: {
      contracts: options.contracts,
      endpoints: options.endpoints,
      ...(options.openApiInfo ? { info: options.openApiInfo } : {}),
    },
    openApiPath,
    projectRoot,
    typesFile: options.typesFile,
  };
}

function normalizeSyncEndpointClientOptions(
  options: SyncEndpointClientOptions,
): NormalizedSyncEndpointClientOptions {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const clientPath = path.resolve(projectRoot, options.clientFile);
  const typesFile = path.resolve(projectRoot, options.typesFile);
  const inferredValidatorsFile =
    options.validatorsFile ??
    (() => {
      const nextPath = options.typesFile.replace(/api-types\.ts$/u, 'api-validators.ts');
      if (nextPath === options.typesFile) {
        throw new Error(
          'syncEndpointClient() could not infer validatorsFile from typesFile; pass validatorsFile explicitly.',
        );
      }

      return nextPath;
    })();
  const validatorsFile = path.resolve(projectRoot, inferredValidatorsFile);

  if (!fs.existsSync(typesFile)) {
    throw new Error(`Unable to generate an endpoint client because the types file does not exist: ${typesFile}`);
  }
  if (!fs.existsSync(validatorsFile)) {
    throw new Error(
      `Unable to generate an endpoint client because the validators file does not exist: ${validatorsFile}`,
    );
  }

  return {
    clientPath,
    manifest: options.manifest,
    projectRoot,
    typesFile: options.typesFile,
    validatorsFile: path.relative(projectRoot, validatorsFile),
  };
}

function resolveEndpointClientContract(
  manifest: EndpointManifestDefinition,
  contractKey: string,
  operationId: string,
  fieldName: 'bodyContract' | 'queryContract' | 'responseContract',
): EndpointManifestContractDefinition {
  const contract = manifest.contracts[contractKey];
  if (!contract) {
    throw new Error(
      `Endpoint "${operationId}" references missing ${fieldName} "${contractKey}" while generating the endpoint client.`,
    );
  }

  return contract;
}

function toClientPropertyName(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+(.)/g, (_match, next: string) => next.toUpperCase())
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function toValidatorAccessExpression(
  contractKey: string,
  seenPropertyNames: Map<string, string>,
): string {
  const propertyName = toClientPropertyName(contractKey);
  const previousContractKey = seenPropertyNames.get(propertyName);

  if (previousContractKey && previousContractKey !== contractKey) {
    throw new Error(
      `Contract keys "${previousContractKey}" and "${contractKey}" both normalize to apiValidators[${toJavaScriptStringLiteral(
        propertyName,
      )}] while generating the endpoint client.`,
    );
  }

  seenPropertyNames.set(propertyName, contractKey);
  return /^[$A-Z_][0-9A-Z_$]*$/iu.test(propertyName)
    ? `apiValidators.${propertyName}`
    : `apiValidators[${toJavaScriptStringLiteral(propertyName)}]`;
}

function toModuleImportPath(fromFile: string, targetFile: string): string {
  let relativePath = path.relative(path.dirname(fromFile), targetFile).replace(/\\/g, '/');
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }

  return relativePath.replace(/\.[^.]+$/u, '');
}

function toJavaScriptStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
}

const RESERVED_CLIENT_IDENTIFIERS = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'instanceof',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

/**
 * Guard generated client identifiers so emitted modules remain valid JavaScript.
 *
 * @param value Candidate identifier to validate before code generation.
 * @param label Human-readable label for error reporting.
 * @throws {Error} When the identifier is syntactically invalid or reserved.
 */
function assertValidClientIdentifier(value: string, label: string): void {
  if (!/^[$A-Z_][0-9A-Z_$]*$/iu.test(value)) {
    throw new Error(
      `Generated endpoint client ${label} "${value}" is not a valid JavaScript identifier.`,
    );
  }
  if (RESERVED_CLIENT_IDENTIFIERS.has(value)) {
    throw new Error(
      `Generated endpoint client ${label} "${value}" is a reserved JavaScript identifier.`,
    );
  }
}

function reserveUniqueClientTypeIdentifier(
  preferred: string,
  occupied: Set<string>,
): string {
  let suffix = 0;

  while (true) {
    const candidate =
      suffix === 0
        ? preferred
        : suffix === 1
          ? `${preferred}Alias`
          : `${preferred}Alias${suffix}`;
    if (!occupied.has(candidate) && !RESERVED_CLIENT_IDENTIFIERS.has(candidate)) {
      assertValidClientIdentifier(candidate, 'type alias');
      occupied.add(candidate);
      return candidate;
    }
    suffix += 1;
  }
}

function normalizeSyncBlockMetadataFailure(
  error: unknown,
): SyncBlockMetadataFailure {
  if (error instanceof Error) {
    return {
      code: resolveSyncBlockMetadataFailureCode(error),
      message: error.message,
      name: error.name,
    };
  }

  return {
    code: 'unknown-internal-error',
    message: String(error),
    name: 'NonErrorThrow',
  };
}

function resolveSyncBlockMetadataFailureCode(
  error: Error,
): SyncBlockMetadataFailureCode {
  const taggedCode = getTaggedSyncBlockMetadataFailureCode(error);
  if (taggedCode) {
    return taggedCode;
  }

  const { message } = error;
  if (message.startsWith('Unsupported type node at ')) {
    return 'unsupported-type-node';
  }
  if (
    message.startsWith('Recursive types are not supported:') ||
    message.startsWith('Recursive type')
  ) {
    return 'recursive-type';
  }
  if (
    message.startsWith('Unable to load types file:') ||
    message.startsWith('Unable to find source type "') ||
    message.startsWith('Unable to resolve type reference "') ||
    message.includes('must resolve to an object shape')
  ) {
    return 'invalid-source-type';
  }
  if (
    message.startsWith('Unsupported ') ||
    message.startsWith('Mixed primitive enums are not supported at ') ||
    message.startsWith('Indexed access ') ||
    message.startsWith('Intersection at ') ||
    message.startsWith('WordPress extraction ') ||
    message.startsWith('Generic type declarations are not supported at ') ||
    message.startsWith('Generic type references are not supported at ') ||
    message.startsWith('Class and enum references are not supported at ') ||
    message.startsWith('Discriminated union at ') ||
    message.startsWith('External or non-serializable ') ||
    message.startsWith('Conflicting ') ||
    message.startsWith('Tag "') ||
    message.startsWith('Only object-like interface extensions are supported:') ||
    message.startsWith('Array type is missing an item type at ')
  ) {
    return 'unsupported-type-pattern';
  }

  return 'unknown-internal-error';
}
