import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';

import {
  buildEndpointOpenApiDocument,
  type EndpointOpenApiEndpointDefinition,
  manifestToJsonSchema,
  manifestToOpenApi,
  type OpenApiInfo,
} from './schema-core.js';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type AttributeKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'union';
type WordPressAttributeKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object';

interface AttributeConstraints {
  exclusiveMaximum: number | null;
  exclusiveMinimum: number | null;
  format: string | null;
  maxLength: number | null;
  maxItems: number | null;
  maximum: number | null;
  minLength: number | null;
  minItems: number | null;
  minimum: number | null;
  multipleOf: number | null;
  pattern: string | null;
  typeTag: string | null;
}

interface AttributeNode {
  constraints: AttributeConstraints;
  defaultValue?: JsonValue;
  enumValues: Array<string | number | boolean> | null;
  items?: AttributeNode;
  kind: AttributeKind;
  path: string;
  properties?: Record<string, AttributeNode>;
  required: boolean;
  union?: AttributeUnion | null;
}

interface AttributeUnion {
  branches: Record<string, AttributeNode>;
  discriminator: string;
}

interface BlockJsonAttribute {
  default?: JsonValue;
  enum?: Array<string | number | boolean>;
  type: WordPressAttributeKind;
}

interface ManifestAttribute {
  typia: {
    constraints: AttributeConstraints;
    defaultValue: JsonValue | null;
    hasDefault: boolean;
  };
  ts: {
    items: ManifestAttribute | null;
    kind: AttributeKind;
    properties: Record<string, ManifestAttribute> | null;
    required: boolean;
    union: ManifestUnion | null;
  };
  wp: {
    defaultValue: JsonValue | null;
    enum: Array<string | number | boolean> | null;
    hasDefault: boolean;
    type: WordPressAttributeKind;
  };
}

interface ManifestUnion {
  branches: Record<string, ManifestAttribute>;
  discriminator: string;
}

interface ManifestDocument {
  attributes: Record<string, ManifestAttribute>;
  manifestVersion: 2;
  sourceType: string;
}

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
export interface EndpointManifestEndpointDefinition extends EndpointOpenApiEndpointDefinition {}

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
export interface RestOpenApiEndpointDefinition extends EndpointManifestEndpointDefinition {}

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

interface AnalysisContext {
  allowedExternalPackages: Set<string>;
  checker: ts.TypeChecker;
  packageNameCache: Map<string, string | null>;
  projectRoot: string;
  program: ts.Program;
  recursionGuard: Set<string>;
}

const SUPPORTED_TAGS = new Set([
  'Default',
  'ExclusiveMaximum',
  'ExclusiveMinimum',
  'Format',
  'MaxLength',
  'MaxItems',
  'Maximum',
  'MinLength',
  'MinItems',
  'Minimum',
  'MultipleOf',
  'Pattern',
  'Type',
]);

const DEFAULT_CONSTRAINTS = (): AttributeConstraints => ({
  exclusiveMaximum: null,
  exclusiveMinimum: null,
  format: null,
  maxLength: null,
  maxItems: null,
  maximum: null,
  minLength: null,
  minItems: null,
  minimum: null,
  multipleOf: null,
  pattern: null,
  typeTag: null,
});

const SYNC_BLOCK_METADATA_FAILURE_CODE = Symbol(
  'sync-block-metadata-failure-code',
);

type TaggedSyncBlockMetadataError = Error & {
  [SYNC_BLOCK_METADATA_FAILURE_CODE]?: SyncBlockMetadataFailureCode;
};

interface ResolvedSyncBlockMetadataPaths {
  blockJsonPath: string;
  jsonSchemaPath: string | null;
  manifestPath: string;
  openApiPath: string | null;
  phpValidatorPath: string;
  projectRoot: string;
}

function tagSyncBlockMetadataError(
  error: Error,
  code: SyncBlockMetadataFailureCode,
): Error {
  (
    error as TaggedSyncBlockMetadataError
  )[SYNC_BLOCK_METADATA_FAILURE_CODE] = code;
  return error;
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

  const manifest: ManifestDocument = {
    attributes: Object.fromEntries(
      Object.entries(rootNode.properties).map(([key, node]) => [
        key,
        createManifestAttribute(node),
      ]),
    ),
    manifestVersion: 2,
    sourceType: options.sourceTypeName,
  };

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

  const manifest = {
    attributes: Object.fromEntries(
      Object.entries(rootNode.properties).map(([key, node]) => [
        key,
        createManifestAttribute(node),
      ]),
    ),
    manifestVersion: 2 as const,
    sourceType: options.sourceTypeName,
  };

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
          document: {
            attributes: Object.fromEntries(
              Object.entries(rootNode.properties).map(([key, node]) => [
                key,
                createManifestAttribute(node),
              ]),
            ),
            manifestVersion: 2 as const,
            sourceType: contract.sourceTypeName,
          },
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

function analyzeSourceType(
  options: Pick<
    SyncBlockMetadataOptions,
    'projectRoot' | 'sourceTypeName' | 'typesFile'
  >,
): { projectRoot: string; rootNode: AttributeNode } {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const rootNodes = analyzeSourceTypes(
    {
      projectRoot,
      typesFile: options.typesFile,
    },
    [options.sourceTypeName],
  );

  return {
    projectRoot,
    rootNode: rootNodes[options.sourceTypeName],
  };
}

function analyzeSourceTypes(
  options: Pick<SyncBlockMetadataOptions, 'projectRoot' | 'typesFile'>,
  sourceTypeNames: string[],
): Record<string, AttributeNode> {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const typesFilePath = path.resolve(projectRoot, options.typesFile);
  const ctx = createAnalysisContext(projectRoot, typesFilePath);
  const sourceFile = ctx.program.getSourceFile(typesFilePath);
  if (sourceFile === undefined) {
    throw new Error(`Unable to load types file: ${typesFilePath}`);
  }

  return Object.fromEntries(
    sourceTypeNames.map((sourceTypeName) => {
      const declaration = findNamedDeclaration(sourceFile, sourceTypeName);
      if (declaration === undefined) {
        throw new Error(
          `Unable to find source type "${sourceTypeName}" in ${path.relative(projectRoot, typesFilePath)}`,
        );
      }

      return [
        sourceTypeName,
        parseNamedDeclaration(declaration, ctx, sourceTypeName, true),
      ];
    }),
  );
}

function createAnalysisContext(
  projectRoot: string,
  typesFilePath: string,
): AnalysisContext {
  const configPath = ts.findConfigFile(
    projectRoot,
    ts.sys.fileExists,
    'tsconfig.json',
  );
  const compilerOptions: ts.CompilerOptions = {
    allowJs: false,
    esModuleInterop: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    resolveJsonModule: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
  };

  let rootNames = [typesFilePath];

  if (configPath !== undefined) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
      throw formatDiagnosticError(configFile.error);
    }

    const parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath),
      compilerOptions,
      configPath,
    );

    if (parsed.errors.length > 0) {
      throw formatDiagnosticError(parsed.errors[0]);
    }

    rootNames = parsed.fileNames.includes(typesFilePath)
      ? parsed.fileNames
      : [...parsed.fileNames, typesFilePath];
    Object.assign(compilerOptions, parsed.options);
  }

  const program = ts.createProgram({
    options: compilerOptions,
    rootNames,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const blockingDiagnostic = diagnostics.find(
    (diagnostic) =>
      diagnostic.category === ts.DiagnosticCategory.Error &&
      diagnostic.file?.fileName === typesFilePath,
  );
  if (blockingDiagnostic) {
    throw formatDiagnosticError(blockingDiagnostic);
  }

  return {
    allowedExternalPackages: new Set(['@wp-typia/block-types']),
    checker: program.getTypeChecker(),
    packageNameCache: new Map(),
    projectRoot,
    program,
    recursionGuard: new Set<string>(),
  };
}

function findNamedDeclaration(
  sourceFile: ts.SourceFile,
  name: string,
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
  for (const statement of sourceFile.statements) {
    if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === name
    ) {
      return statement;
    }
  }
  return undefined;
}

function parseNamedDeclaration(
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  ctx: AnalysisContext,
  pathLabel: string,
  required: boolean,
): AttributeNode {
  const recursionKey = `${declaration.getSourceFile().fileName}:${declaration.name.text}`;
  if (ctx.recursionGuard.has(recursionKey)) {
    throw new Error(`Recursive types are not supported: ${pathLabel}`);
  }

  ctx.recursionGuard.add(recursionKey);
  try {
    if (ts.isInterfaceDeclaration(declaration)) {
      return parseInterfaceDeclaration(declaration, ctx, pathLabel, required);
    }
    return withRequired(
      parseTypeNode(declaration.type, ctx, pathLabel),
      required,
    );
  } finally {
    ctx.recursionGuard.delete(recursionKey);
  }
}

function parseInterfaceDeclaration(
  declaration: ts.InterfaceDeclaration,
  ctx: AnalysisContext,
  pathLabel: string,
  required: boolean,
): AttributeNode {
  const properties: Record<string, AttributeNode> = {};

  for (const heritageClause of declaration.heritageClauses ?? []) {
    if (heritageClause.token !== ts.SyntaxKind.ExtendsKeyword) {
      continue;
    }

    for (const baseType of heritageClause.types) {
      const baseNode = parseTypeReference(
        baseType,
        ctx,
        `${pathLabel}<extends>`,
      );
      if (baseNode.kind !== 'object' || baseNode.properties === undefined) {
        throw new Error(
          `Only object-like interface extensions are supported: ${pathLabel}`,
        );
      }
      Object.assign(properties, cloneProperties(baseNode.properties));
    }
  }

  for (const member of declaration.members) {
    if (!ts.isPropertySignature(member) || member.type === undefined) {
      throw new Error(
        `Unsupported member in ${pathLabel}; only typed properties are supported`,
      );
    }

    const propertyName = getPropertyName(member.name);
    properties[propertyName] = withRequired(
      parseTypeNode(member.type, ctx, `${pathLabel}.${propertyName}`),
      member.questionToken === undefined,
    );
  }

  return {
    constraints: DEFAULT_CONSTRAINTS(),
    enumValues: null,
    kind: 'object',
    path: pathLabel,
    properties,
    required,
    union: null,
  };
}

function parseTypeNode(
  node: ts.TypeNode,
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  if (ts.isParenthesizedTypeNode(node)) {
    return parseTypeNode(node.type, ctx, pathLabel);
  }
  if (ts.isIndexedAccessTypeNode(node)) {
    return parseIndexedAccessType(node, ctx, pathLabel);
  }
  if (ts.isIntersectionTypeNode(node)) {
    return parseIntersectionType(node, ctx, pathLabel);
  }
  if (ts.isUnionTypeNode(node)) {
    return parseUnionType(node, ctx, pathLabel);
  }
  if (ts.isTypeLiteralNode(node)) {
    return parseTypeLiteral(node, ctx, pathLabel);
  }
  if (ts.isArrayTypeNode(node)) {
    return {
      constraints: DEFAULT_CONSTRAINTS(),
      enumValues: null,
      items: withRequired(
        parseTypeNode(node.elementType, ctx, `${pathLabel}[]`),
        true,
      ),
      kind: 'array',
      path: pathLabel,
      required: true,
      union: null,
    };
  }
  if (ts.isLiteralTypeNode(node)) {
    return parseLiteralType(node, pathLabel);
  }
  if (ts.isTypeReferenceNode(node)) {
    return parseTypeReference(node, ctx, pathLabel);
  }
  if (node.kind === ts.SyntaxKind.StringKeyword) {
    return baseNode('string', pathLabel);
  }
  if (
    node.kind === ts.SyntaxKind.NumberKeyword ||
    node.kind === ts.SyntaxKind.BigIntKeyword
  ) {
    return baseNode('number', pathLabel);
  }
  if (node.kind === ts.SyntaxKind.BooleanKeyword) {
    return baseNode('boolean', pathLabel);
  }

  throw new Error(`Unsupported type node at ${pathLabel}: ${node.getText()}`);
}

function parseIntersectionType(
  node: ts.IntersectionTypeNode,
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  const tagNodes: ts.TypeReferenceNode[] = [];
  const valueNodes: ts.TypeNode[] = [];

  for (const typeNode of node.types) {
    if (
      ts.isTypeReferenceNode(typeNode) &&
      getSupportedTagName(typeNode) !== null
    ) {
      tagNodes.push(typeNode);
    } else {
      valueNodes.push(typeNode);
    }
  }

  if (valueNodes.length === 0) {
    throw new Error(
      `Intersection at ${pathLabel} does not contain a value type`,
    );
  }
  const parsedNodes = valueNodes.map((valueNode) =>
    parseTypeNode(valueNode, ctx, pathLabel),
  );
  const parsed =
    parsedNodes.length === 1
      ? parsedNodes[0]
      : mergePrimitiveIntersection(parsedNodes, pathLabel);
  for (const tagNode of tagNodes) {
    applyTag(parsed, tagNode, pathLabel);
  }

  return parsed;
}

function parseIndexedAccessType(
  node: ts.IndexedAccessTypeNode,
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  const keyValue = extractLiteralValue(node.indexType);
  if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
    throw new Error(
      `Indexed access requires a string or number literal key at ${pathLabel}: ${node.indexType.getText()}`,
    );
  }

  const propertyKey = String(keyValue);
  const propertyDeclaration = resolveIndexedAccessPropertyDeclaration(
    node.objectType,
    propertyKey,
    ctx,
    pathLabel,
  );
  if (propertyDeclaration.type === undefined) {
    throw new Error(
      `Indexed access property "${propertyKey}" is missing an explicit type at ${pathLabel}`,
    );
  }

  return withRequired(
    parseTypeNode(propertyDeclaration.type, ctx, pathLabel),
    propertyDeclaration.questionToken === undefined,
  );
}

function parseUnionType(
  node: ts.UnionTypeNode,
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  const literalValues = node.types
    .map((typeNode) => extractLiteralValue(typeNode))
    .filter((value): value is string | number | boolean => value !== undefined);

  if (literalValues.length === node.types.length && literalValues.length > 0) {
    const uniqueKinds = new Set(literalValues.map((value) => typeof value));
    if (uniqueKinds.size !== 1) {
      throw new Error(
        `Mixed primitive enums are not supported at ${pathLabel}`,
      );
    }

    const kind = [...uniqueKinds][0] as 'string' | 'number' | 'boolean';
    return {
      constraints: DEFAULT_CONSTRAINTS(),
      enumValues: literalValues,
      kind,
      path: pathLabel,
      required: true,
      union: null,
    };
  }

  const withoutUndefined = node.types.filter(
    (typeNode) =>
      typeNode.kind !== ts.SyntaxKind.UndefinedKeyword &&
      typeNode.kind !== ts.SyntaxKind.NullKeyword,
  );

  if (withoutUndefined.length === 1) {
    return parseTypeNode(withoutUndefined[0], ctx, pathLabel);
  }

  if (withoutUndefined.length > 1) {
    return parseDiscriminatedUnion(withoutUndefined, ctx, pathLabel);
  }

  throw new Error(`Unsupported union type at ${pathLabel}: ${node.getText()}`);
}

function parseDiscriminatedUnion(
  typeNodes: ts.TypeNode[],
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  const branchNodes = typeNodes.map((typeNode, index) => ({
    node: parseTypeNode(typeNode, ctx, `${pathLabel}<branch:${index}>`),
    source: typeNode,
  }));

  for (const branch of branchNodes) {
    if (branch.node.kind !== 'object' || branch.node.properties === undefined) {
      throw new Error(
        `Unsupported union type at ${pathLabel}; only discriminated object unions are supported`,
      );
    }
  }

  const discriminator = findDiscriminatorKey(
    branchNodes.map((branch) => branch.node),
    pathLabel,
  );
  const branches: Record<string, AttributeNode> = {};

  for (const branch of branchNodes) {
    const discriminatorNode = branch.node.properties?.[discriminator];
    const discriminatorValue = discriminatorNode?.enumValues?.[0];

    if (typeof discriminatorValue !== 'string') {
      throw new Error(
        `Discriminated union at ${pathLabel} must use string literal discriminator values`,
      );
    }
    if (branches[discriminatorValue] !== undefined) {
      throw new Error(
        `Discriminated union at ${pathLabel} has duplicate discriminator value "${discriminatorValue}"`,
      );
    }

    branches[discriminatorValue] = withRequired(branch.node, true);
  }

  return {
    constraints: DEFAULT_CONSTRAINTS(),
    enumValues: null,
    kind: 'union',
    path: pathLabel,
    required: true,
    union: {
      branches,
      discriminator,
    },
  };
}

function findDiscriminatorKey(
  branches: AttributeNode[],
  pathLabel: string,
): string {
  const candidateKeys = new Set(Object.keys(branches[0].properties ?? {}));

  for (const branch of branches.slice(1)) {
    for (const key of [...candidateKeys]) {
      if (!(branch.properties && key in branch.properties)) {
        candidateKeys.delete(key);
      }
    }
  }

  const discriminatorCandidates = [...candidateKeys].filter((key) =>
    branches.every((branch) =>
      isDiscriminatorProperty(branch.properties?.[key]),
    ),
  );

  if (discriminatorCandidates.length !== 1) {
    throw new Error(
      `Unsupported union type at ${pathLabel}; expected exactly one shared discriminator property`,
    );
  }

  return discriminatorCandidates[0];
}

function isDiscriminatorProperty(node: AttributeNode | undefined): boolean {
  return Boolean(
    node &&
    node.required &&
    node.kind === 'string' &&
    node.enumValues !== null &&
    node.enumValues.length === 1 &&
    typeof node.enumValues[0] === 'string',
  );
}

function parseTypeLiteral(
  node: ts.TypeLiteralNode,
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  const properties: Record<string, AttributeNode> = {};

  for (const member of node.members) {
    if (!ts.isPropertySignature(member) || member.type === undefined) {
      throw new Error(`Unsupported inline object member at ${pathLabel}`);
    }

    const propertyName = getPropertyName(member.name);
    properties[propertyName] = withRequired(
      parseTypeNode(member.type, ctx, `${pathLabel}.${propertyName}`),
      member.questionToken === undefined,
    );
  }

  return {
    constraints: DEFAULT_CONSTRAINTS(),
    enumValues: null,
    kind: 'object',
    path: pathLabel,
    properties,
    required: true,
    union: null,
  };
}

function parseLiteralType(
  node: ts.LiteralTypeNode,
  pathLabel: string,
): AttributeNode {
  const literal = extractLiteralValue(node);
  if (literal === undefined) {
    throw new Error(
      `Unsupported literal type at ${pathLabel}: ${node.getText()}`,
    );
  }

  return {
    constraints: DEFAULT_CONSTRAINTS(),
    enumValues: [literal],
    kind: typeof literal as 'string' | 'number' | 'boolean',
    path: pathLabel,
    required: true,
    union: null,
  };
}

function parseTypeReference(
  node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
  ctx: AnalysisContext,
  pathLabel: string,
): AttributeNode {
  const typeName = getReferenceName(node);
  const typeArguments = node.typeArguments ?? [];

  if (typeName === 'Array' || typeName === 'ReadonlyArray') {
    const [itemNode] = typeArguments;
    if (itemNode === undefined) {
      throw new Error(`Array type is missing an item type at ${pathLabel}`);
    }

    return {
      constraints: DEFAULT_CONSTRAINTS(),
      enumValues: null,
      items: withRequired(parseTypeNode(itemNode, ctx, `${pathLabel}[]`), true),
      kind: 'array',
      path: pathLabel,
      required: true,
      union: null,
    };
  }
  if (typeArguments.length > 0) {
    throw new Error(
      `Generic type references are not supported at ${pathLabel}: ${typeName}`,
    );
  }

  const symbol = resolveSymbol(node, ctx.checker);
  if (symbol === undefined) {
    throw new Error(
      `Unable to resolve type reference "${typeName}" at ${pathLabel}`,
    );
  }

  const declaration = symbol.declarations?.find(
    (candidate) =>
      ts.isInterfaceDeclaration(candidate) ||
      ts.isTypeAliasDeclaration(candidate) ||
      ts.isEnumDeclaration(candidate) ||
      ts.isClassDeclaration(candidate),
  );
  if (declaration === undefined) {
    throw new Error(
      `Unsupported referenced type "${typeName}" at ${pathLabel}`,
    );
  }
  if (!isSerializableExternalDeclaration(declaration, ctx)) {
    throw new Error(
      `External or non-serializable referenced type "${typeName}" is not supported at ${pathLabel}`,
    );
  }
  if (ts.isClassDeclaration(declaration) || ts.isEnumDeclaration(declaration)) {
    throw new Error(
      `Class and enum references are not supported at ${pathLabel}`,
    );
  }
  if ((declaration.typeParameters?.length ?? 0) > 0) {
    throw new Error(
      `Generic type declarations are not supported at ${pathLabel}: ${typeName}`,
    );
  }

  return parseNamedDeclaration(declaration, ctx, pathLabel, true);
}

function resolveIndexedAccessPropertyDeclaration(
  objectTypeNode: ts.TypeNode,
  propertyKey: string,
  ctx: AnalysisContext,
  pathLabel: string,
): ts.PropertySignature | ts.PropertyDeclaration {
  const objectType = ctx.checker.getTypeFromTypeNode(objectTypeNode);
  const propertySymbol = ctx.checker
    .getPropertiesOfType(objectType)
    .find((candidate) => candidate.name === propertyKey);

  if (propertySymbol === undefined) {
    throw new Error(
      `Indexed access could not resolve property "${propertyKey}" at ${pathLabel}`,
    );
  }

  const valueDeclaration = propertySymbol.valueDeclaration;
  const declaration =
    valueDeclaration !== undefined &&
    (ts.isPropertySignature(valueDeclaration) ||
      ts.isPropertyDeclaration(valueDeclaration))
      ? valueDeclaration
      : propertySymbol.declarations?.find(
          (candidate): candidate is ts.PropertySignature | ts.PropertyDeclaration =>
            ts.isPropertySignature(candidate) ||
            ts.isPropertyDeclaration(candidate),
        );
  if (declaration === undefined) {
    throw new Error(
      `Indexed access property "${propertyKey}" does not resolve to a typed property at ${pathLabel}`,
    );
  }
  if (!isSerializableExternalDeclaration(declaration, ctx)) {
    throw new Error(
      `External or non-serializable indexed access property "${propertyKey}" is not supported at ${pathLabel}`,
    );
  }

  return declaration;
}

function mergePrimitiveIntersection(
  nodes: AttributeNode[],
  pathLabel: string,
): AttributeNode {
  const [first, ...rest] = nodes;

  if (!isPrimitiveCompatibleNode(first)) {
    throw new Error(
      `Unsupported intersection at ${pathLabel}; only primitive-compatible intersections are supported`,
    );
  }

  let merged = withRequired(first, first.required);
  for (const node of rest) {
    if (!isPrimitiveCompatibleNode(node) || node.kind !== merged.kind) {
      throw new Error(
        `Unsupported intersection at ${pathLabel}; only a single primitive kind plus typia tags is supported`,
      );
    }

    merged = {
      ...merged,
      constraints: mergeConstraints(
        merged.constraints,
        node.constraints,
        pathLabel,
      ),
      defaultValue: mergeDefaultValue(
        merged.defaultValue,
        node.defaultValue,
        pathLabel,
      ),
      enumValues: intersectEnumValues(
        merged.enumValues,
        node.enumValues,
        pathLabel,
      ),
      required: merged.required && node.required,
    };
  }

  return merged;
}

function isPrimitiveCompatibleNode(node: AttributeNode): boolean {
  return (
    (node.kind === 'string' ||
      node.kind === 'number' ||
      node.kind === 'boolean') &&
    node.items === undefined &&
    node.properties === undefined &&
    node.union === null
  );
}

function mergeConstraints(
  left: AttributeConstraints,
  right: AttributeConstraints,
  pathLabel: string,
): AttributeConstraints {
  return {
    exclusiveMaximum: mergeMaximumLike(
      left.exclusiveMaximum,
      right.exclusiveMaximum,
    ),
    exclusiveMinimum: mergeMinimumLike(
      left.exclusiveMinimum,
      right.exclusiveMinimum,
    ),
    format: mergeExactLike(left.format, right.format, pathLabel, 'format'),
    maxLength: mergeMaximumLike(left.maxLength, right.maxLength),
    maxItems: mergeMaximumLike(left.maxItems, right.maxItems),
    maximum: mergeMaximumLike(left.maximum, right.maximum),
    minLength: mergeMinimumLike(left.minLength, right.minLength),
    minItems: mergeMinimumLike(left.minItems, right.minItems),
    minimum: mergeMinimumLike(left.minimum, right.minimum),
    multipleOf: mergeExactLike(
      left.multipleOf,
      right.multipleOf,
      pathLabel,
      'multipleOf',
    ),
    pattern: mergeExactLike(left.pattern, right.pattern, pathLabel, 'pattern'),
    typeTag: mergeExactLike(left.typeTag, right.typeTag, pathLabel, 'typeTag'),
  };
}

function mergeMinimumLike(
  left: number | null,
  right: number | null,
): number | null {
  if (left === null) {
    return right;
  }
  if (right === null) {
    return left;
  }
  return Math.max(left, right);
}

function mergeMaximumLike(
  left: number | null,
  right: number | null,
): number | null {
  if (left === null) {
    return right;
  }
  if (right === null) {
    return left;
  }
  return Math.min(left, right);
}

function mergeExactLike<T extends string | number>(
  left: T | null,
  right: T | null,
  pathLabel: string,
  label: string,
): T | null {
  if (left === null) {
    return right;
  }
  if (right === null) {
    return left;
  }
  if (left !== right) {
    throw new Error(
      `Conflicting ${label} constraints in intersection at ${pathLabel}: ${left} vs ${right}`,
    );
  }
  return left;
}

function mergeDefaultValue(
  left: JsonValue | undefined,
  right: JsonValue | undefined,
  pathLabel: string,
): JsonValue | undefined {
  if (left === undefined) {
    return right;
  }
  if (right === undefined) {
    return left;
  }
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    throw new Error(
      `Conflicting default values in intersection at ${pathLabel}`,
    );
  }
  return cloneJson(left);
}

function intersectEnumValues(
  left: Array<string | number | boolean> | null,
  right: Array<string | number | boolean> | null,
  pathLabel: string,
): Array<string | number | boolean> | null {
  if (left === null) {
    return right ? [...right] : null;
  }
  if (right === null) {
    return [...left];
  }

  const allowed = new Set(right);
  const intersection = left.filter((value) => allowed.has(value));
  if (intersection.length === 0) {
    throw new Error(`Intersection at ${pathLabel} resolves to an empty enum`);
  }
  return intersection;
}

function applyTag(
  node: AttributeNode,
  tagNode: ts.TypeReferenceNode,
  pathLabel: string,
): void {
  const tagName = getSupportedTagName(tagNode);
  if (tagName === null) {
    return;
  }

  const [arg] = tagNode.typeArguments ?? [];
  if (arg === undefined) {
    throw new Error(
      `Tag "${tagName}" is missing its generic argument at ${pathLabel}`,
    );
  }

  switch (tagName) {
    case 'Default': {
      const value = parseDefaultValue(arg, pathLabel);
      if (value === undefined) {
        throw new Error(
          `Unsupported Default value at ${pathLabel}: ${arg.getText()}`,
        );
      }
      node.defaultValue = value;
      return;
    }
    case 'Format':
      node.constraints.format = parseStringLikeArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'Pattern':
      node.constraints.pattern = parseStringLikeArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'Type':
      node.constraints.typeTag = parseStringLikeArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'MinLength':
      node.constraints.minLength = parseNumericArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'MaxLength':
      node.constraints.maxLength = parseNumericArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'MinItems':
      node.constraints.minItems = parseNumericArgument(arg, tagName, pathLabel);
      return;
    case 'MaxItems':
      node.constraints.maxItems = parseNumericArgument(arg, tagName, pathLabel);
      return;
    case 'Minimum':
      node.constraints.minimum = parseNumericArgument(arg, tagName, pathLabel);
      return;
    case 'Maximum':
      node.constraints.maximum = parseNumericArgument(arg, tagName, pathLabel);
      return;
    case 'ExclusiveMinimum':
      node.constraints.exclusiveMinimum = parseNumericArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'ExclusiveMaximum':
      node.constraints.exclusiveMaximum = parseNumericArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    case 'MultipleOf':
      node.constraints.multipleOf = parseNumericArgument(
        arg,
        tagName,
        pathLabel,
      );
      return;
    default:
      return;
  }
}

function parseDefaultValue(
  node: ts.TypeNode,
  pathLabel: string,
): JsonValue | undefined {
  if (ts.isParenthesizedTypeNode(node)) {
    return parseDefaultValue(node.type, pathLabel);
  }
  if (ts.isLiteralTypeNode(node)) {
    const literal = extractLiteralValue(node);
    return literal === undefined ? undefined : literal;
  }
  if (ts.isTypeLiteralNode(node)) {
    const objectValue: Record<string, JsonValue> = {};
    for (const member of node.members) {
      if (!ts.isPropertySignature(member) || member.type === undefined) {
        throw new Error(`Unsupported object Default value at ${pathLabel}`);
      }
      const propertyName = getPropertyName(member.name);
      const value = parseDefaultValue(
        member.type,
        `${pathLabel}.${propertyName}`,
      );
      if (value === undefined) {
        throw new Error(
          `Unsupported object Default value at ${pathLabel}.${propertyName}`,
        );
      }
      objectValue[propertyName] = value;
    }
    return objectValue;
  }
  if (ts.isTupleTypeNode(node)) {
    return node.elements.map((element, index) => {
      const value = parseDefaultValue(element, `${pathLabel}[${index}]`);
      if (value === undefined) {
        throw new Error(
          `Unsupported array Default value at ${pathLabel}[${index}]`,
        );
      }
      return value;
    });
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  return undefined;
}

function parseNumericArgument(
  node: ts.TypeNode,
  tagName: string,
  pathLabel: string,
): number {
  const value = extractLiteralValue(node);
  if (typeof value !== 'number') {
    throw new Error(
      `Tag "${tagName}" expects a numeric literal at ${pathLabel}`,
    );
  }
  return value;
}

function parseStringLikeArgument(
  node: ts.TypeNode,
  tagName: string,
  pathLabel: string,
): string {
  const value = extractLiteralValue(node);
  if (typeof value !== 'string') {
    throw new Error(
      `Tag "${tagName}" expects a string literal at ${pathLabel}`,
    );
  }
  return value;
}

function extractLiteralValue(
  node: ts.TypeNode | ts.Node,
): string | number | boolean | undefined {
  if (ts.isParenthesizedTypeNode(node)) {
    return extractLiteralValue(node.type);
  }
  if (ts.isLiteralTypeNode(node)) {
    return extractLiteralValue(node.literal);
  }
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  return undefined;
}

function createBlockJsonAttribute(
  node: AttributeNode,
  warnings: string[],
): BlockJsonAttribute {
  const attribute: BlockJsonAttribute = {
    type: getWordPressKind(node),
  };

  if (node.defaultValue !== undefined) {
    attribute.default = cloneJson(node.defaultValue);
  }
  if (node.enumValues !== null && node.enumValues.length > 0) {
    attribute.enum = [...node.enumValues];
  }

  const reasons: string[] = [];
  if (node.constraints.exclusiveMaximum !== null)
    reasons.push('exclusiveMaximum');
  if (node.constraints.exclusiveMinimum !== null)
    reasons.push('exclusiveMinimum');
  if (node.constraints.format !== null) reasons.push('format');
  if (node.constraints.maxLength !== null) reasons.push('maxLength');
  if (node.constraints.maxItems !== null) reasons.push('maxItems');
  if (node.constraints.maximum !== null) reasons.push('maximum');
  if (node.constraints.minLength !== null) reasons.push('minLength');
  if (node.constraints.minItems !== null) reasons.push('minItems');
  if (node.constraints.minimum !== null) reasons.push('minimum');
  if (node.constraints.multipleOf !== null) reasons.push('multipleOf');
  if (node.constraints.pattern !== null) reasons.push('pattern');
  if (node.constraints.typeTag !== null) reasons.push('typeTag');
  if (node.kind === 'array' && node.items !== undefined) reasons.push('items');
  if (node.kind === 'object' && node.properties !== undefined)
    reasons.push('properties');
  if (node.kind === 'union' && node.union !== null) reasons.push('union');

  if (reasons.length > 0) {
    warnings.push(`${node.path}: ${reasons.join(', ')}`);
  }

  return attribute;
}

function createManifestAttribute(node: AttributeNode): ManifestAttribute {
  return {
    typia: {
      constraints: { ...node.constraints },
      defaultValue:
        node.defaultValue === undefined ? null : cloneJson(node.defaultValue),
      hasDefault: node.defaultValue !== undefined,
    },
    ts: {
      items: node.items ? createManifestAttribute(node.items) : null,
      kind: node.kind,
      properties: node.properties
        ? Object.fromEntries(
            Object.entries(node.properties).map(([key, property]) => [
              key,
              createManifestAttribute(property),
            ]),
          )
        : null,
      required: node.required,
      union: node.union
        ? {
            branches: Object.fromEntries(
              Object.entries(node.union.branches).map(([key, branch]) => [
                key,
                createManifestAttribute(branch),
              ]),
            ),
            discriminator: node.union.discriminator,
          }
        : null,
    },
    wp: {
      defaultValue:
        node.defaultValue === undefined ? null : cloneJson(node.defaultValue),
      enum: node.enumValues ? [...node.enumValues] : null,
      hasDefault: node.defaultValue !== undefined,
      type: getWordPressKind(node),
    },
  };
}

function renderPhpValidator(manifest: ManifestDocument): {
  source: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  for (const [key, attribute] of Object.entries(manifest.attributes)) {
    collectPhpGenerationWarnings(attribute, key, warnings);
  }

  const phpManifest = renderPhpValue(manifest, 2);

  return {
    source: `<?php
declare(strict_types=1);

/**
 * Generated from typia.manifest.json. Do not edit manually.
 */
return new class {
\tprivate array $manifest = ${phpManifest};

\tpublic function apply_defaults(array $attributes): array
\t{
\t\treturn $this->applyDefaultsForObject($attributes, $this->manifest['attributes'] ?? []);
\t}

\tpublic function validate(array $attributes): array
\t{
\t\t$normalized = $this->apply_defaults($attributes);
\t\t$errors = [];

\t\tforeach (($this->manifest['attributes'] ?? []) as $name => $attribute) {
\t\t\t$this->validateAttribute(
\t\t\t\tarray_key_exists($name, $normalized),
\t\t\t\t$normalized[$name] ?? null,
\t\t\t\t$attribute,
\t\t\t\t(string) $name,
\t\t\t\t$errors,
\t\t\t);
\t\t}

\t\treturn [
\t\t\t'errors' => $errors,
\t\t\t'valid' => count($errors) === 0,
\t\t];
\t}

\tpublic function is_valid(array $attributes): bool
\t{
\t\treturn $this->validate($attributes)['valid'];
\t}

\tprivate function applyDefaultsForObject(array $attributes, array $schema): array
\t{
\t\t$result = $attributes;

\t\tforeach ($schema as $name => $attribute) {
\t\t\tif (!array_key_exists($name, $result)) {
\t\t\t\t$derivedDefault = $this->deriveDefaultValue($attribute);
\t\t\t\tif ($derivedDefault !== null) {
\t\t\t\t\t$result[$name] = $derivedDefault;
\t\t\t\t}
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$result[$name] = $this->applyDefaultsForNode($result[$name], $attribute);
\t\t}

\t\treturn $result;
\t}

\tprivate function applyDefaultsForNode($value, array $attribute)
\t{
\t\tif ($value === null) {
\t\t\treturn null;
\t\t}

\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
\t\tif ($kind === 'union') {
\t\t\treturn $this->applyDefaultsForUnion($value, $attribute);
\t\t}
\t\tif ($kind === 'object' && is_array($value) && !$this->isListArray($value)) {
\t\t\treturn $this->applyDefaultsForObject($value, $attribute['ts']['properties'] ?? []);
\t\t}
\t\tif (
\t\t\t$kind === 'array' &&
\t\t\tis_array($value) &&
\t\t\t$this->isListArray($value) &&
\t\t\tisset($attribute['ts']['items']) &&
\t\t\tis_array($attribute['ts']['items'])
\t\t) {
\t\t\t$result = [];
\t\t\tforeach ($value as $index => $item) {
\t\t\t\t$result[$index] = $this->applyDefaultsForNode($item, $attribute['ts']['items']);
\t\t\t}
\t\t\treturn $result;
\t\t}

\t\treturn $value;
\t}

\tprivate function deriveDefaultValue(array $attribute)
\t{
\t\tif ($this->hasDefault($attribute)) {
\t\t\treturn $attribute['typia']['defaultValue'];
\t\t}

\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
\t\tif ($kind !== 'object') {
\t\t\treturn null;
\t\t}

\t\t$properties = $attribute['ts']['properties'] ?? null;
\t\tif (!is_array($properties)) {
\t\t\treturn null;
\t\t}

\t\t$derived = [];
\t\tforeach ($properties as $name => $child) {
\t\t\tif (!is_array($child)) {
\t\t\t\tcontinue;
\t\t\t}
\t\t\t$childDefault = $this->deriveDefaultValue($child);
\t\t\tif ($childDefault !== null) {
\t\t\t\t$derived[$name] = $childDefault;
\t\t\t}
\t\t}

\t\treturn count($derived) > 0 ? $derived : null;
\t}

\tprivate function applyDefaultsForUnion($value, array $attribute)
\t{
\t\tif (!is_array($value) || $this->isListArray($value)) {
\t\t\treturn $value;
\t\t}

\t\t$union = $attribute['ts']['union'] ?? null;
\t\tif (!is_array($union)) {
\t\t\treturn $value;
\t\t}

\t\t$discriminator = $union['discriminator'] ?? null;
\t\tif (!is_string($discriminator) || !array_key_exists($discriminator, $value)) {
\t\t\treturn $value;
\t\t}

\t\t$branchKey = $value[$discriminator];
\t\tif (!is_string($branchKey) || !isset($union['branches'][$branchKey]) || !is_array($union['branches'][$branchKey])) {
\t\t\treturn $value;
\t\t}

\t\treturn $this->applyDefaultsForNode($value, $union['branches'][$branchKey]);
\t}

\tprivate function validateAttribute(bool $exists, $value, array $attribute, string $path, array &$errors): void
\t{
\t\tif (!$exists) {
\t\t\tif (($attribute['ts']['required'] ?? false) && !$this->hasDefault($attribute)) {
\t\t\t\t$errors[] = sprintf('%s is required', $path);
\t\t\t}
\t\t\treturn;
\t\t}

\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
\t\tif (!is_string($kind) || $kind === '') {
\t\t\t$errors[] = sprintf('%s has an invalid schema kind', $path);
\t\t\treturn;
\t\t}
\t\tif ($value === null) {
\t\t\t$errors[] = sprintf('%s must be %s', $path, $this->expectedKindLabel($attribute));
\t\t\treturn;
\t\t}

\t\tif (($attribute['wp']['enum'] ?? null) !== null && !$this->valueInEnum($value, $attribute['wp']['enum'])) {
\t\t\t$errors[] = sprintf('%s must be one of %s', $path, implode(', ', $attribute['wp']['enum']));
\t\t}

\t\tswitch ($kind) {
\t\t\tcase 'string':
\t\t\t\tif (!is_string($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be string', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\t$this->validateString($value, $attribute, $path, $errors);
\t\t\t\treturn;
\t\t\tcase 'number':
\t\t\t\tif (!$this->isNumber($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be number', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\t$this->validateNumber($value, $attribute, $path, $errors);
\t\t\t\treturn;
\t\t\tcase 'boolean':
\t\t\t\tif (!is_bool($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be boolean', $path);
\t\t\t\t}
\t\t\t\treturn;
\t\t\tcase 'array':
\t\t\t\tif (!is_array($value) || !$this->isListArray($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be array', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\t$this->validateArray($value, $attribute, $path, $errors);
\t\t\t\tif (isset($attribute['ts']['items']) && is_array($attribute['ts']['items'])) {
\t\t\t\t\tforeach ($value as $index => $item) {
\t\t\t\t\t\t$this->validateAttribute(true, $item, $attribute['ts']['items'], sprintf('%s[%s]', $path, (string) $index), $errors);
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\treturn;
\t\t\tcase 'object':
\t\t\t\tif (!is_array($value) || $this->isListArray($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be object', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tforeach (($attribute['ts']['properties'] ?? []) as $name => $child) {
\t\t\t\t\t$this->validateAttribute(
\t\t\t\t\t\tarray_key_exists($name, $value),
\t\t\t\t\t\t$value[$name] ?? null,
\t\t\t\t\t\t$child,
\t\t\t\t\t\tsprintf('%s.%s', $path, (string) $name),
\t\t\t\t\t\t$errors,
\t\t\t\t\t);
\t\t\t\t}
\t\t\t\treturn;
\t\t\tcase 'union':
\t\t\t\t$this->validateUnion($value, $attribute, $path, $errors);
\t\t\t\treturn;
\t\t\tdefault:
\t\t\t\t$errors[] = sprintf('%s has unsupported schema kind %s', $path, $kind);
\t\t}
\t}

\tprivate function validateUnion($value, array $attribute, string $path, array &$errors): void
\t{
\t\tif (!is_array($value) || $this->isListArray($value)) {
\t\t\t$errors[] = sprintf('%s must be object', $path);
\t\t\treturn;
\t\t}

\t\t$union = $attribute['ts']['union'] ?? null;
\t\tif (!is_array($union)) {
\t\t\t$errors[] = sprintf('%s has invalid union schema metadata', $path);
\t\t\treturn;
\t\t}

\t\t$discriminator = $union['discriminator'] ?? null;
\t\tif (!is_string($discriminator) || $discriminator === '') {
\t\t\t$errors[] = sprintf('%s has invalid union discriminator metadata', $path);
\t\t\treturn;
\t\t}
\t\tif (!array_key_exists($discriminator, $value)) {
\t\t\t$errors[] = sprintf('%s.%s is required', $path, $discriminator);
\t\t\treturn;
\t\t}

\t\t$branchKey = $value[$discriminator];
\t\tif (!is_string($branchKey)) {
\t\t\t$errors[] = sprintf('%s.%s must be string', $path, $discriminator);
\t\t\treturn;
\t\t}
\t\tif (!isset($union['branches'][$branchKey]) || !is_array($union['branches'][$branchKey])) {
\t\t\t$errors[] = sprintf('%s.%s must be one of %s', $path, $discriminator, implode(', ', array_keys($union['branches'] ?? [])));
\t\t\treturn;
\t\t}

\t\t$this->validateAttribute(true, $value, $union['branches'][$branchKey], $path, $errors);
\t}

\tprivate function validateString(string $value, array $attribute, string $path, array &$errors): void
\t{
\t\t$constraints = $attribute['typia']['constraints'] ?? [];

\t\tif (isset($constraints['minLength']) && is_int($constraints['minLength']) && strlen($value) < $constraints['minLength']) {
\t\t\t$errors[] = sprintf('%s must be at least %d characters', $path, $constraints['minLength']);
\t\t}
\t\tif (isset($constraints['maxLength']) && is_int($constraints['maxLength']) && strlen($value) > $constraints['maxLength']) {
\t\t\t$errors[] = sprintf('%s must be at most %d characters', $path, $constraints['maxLength']);
\t\t}
\t\tif (
\t\t\tisset($constraints['pattern']) &&
\t\t\tis_string($constraints['pattern']) &&
\t\t\t$constraints['pattern'] !== '' &&
\t\t\t!$this->matchesPattern($constraints['pattern'], $value)
\t\t) {
\t\t\t$errors[] = sprintf('%s does not match %s', $path, $constraints['pattern']);
\t\t}
\t\tif (
\t\t\tisset($constraints['format']) &&
\t\t\tis_string($constraints['format']) &&
\t\t\t!$this->matchesFormat($constraints['format'], $value)
\t\t) {
\t\t\t$errors[] = sprintf('%s must match format %s', $path, $constraints['format']);
\t\t}
\t}

\tprivate function validateArray(array $value, array $attribute, string $path, array &$errors): void
\t{
\t\t$constraints = $attribute['typia']['constraints'] ?? [];

\t\tif (isset($constraints['minItems']) && is_int($constraints['minItems']) && count($value) < $constraints['minItems']) {
\t\t\t$errors[] = sprintf('%s must have at least %d items', $path, $constraints['minItems']);
\t\t}
\t\tif (isset($constraints['maxItems']) && is_int($constraints['maxItems']) && count($value) > $constraints['maxItems']) {
\t\t\t$errors[] = sprintf('%s must have at most %d items', $path, $constraints['maxItems']);
\t\t}
\t}

\tprivate function validateNumber($value, array $attribute, string $path, array &$errors): void
\t{
\t\t$constraints = $attribute['typia']['constraints'] ?? [];

\t\tif (isset($constraints['minimum']) && $this->isNumber($constraints['minimum']) && $value < $constraints['minimum']) {
\t\t\t$errors[] = sprintf('%s must be >= %s', $path, (string) $constraints['minimum']);
\t\t}
\t\tif (isset($constraints['maximum']) && $this->isNumber($constraints['maximum']) && $value > $constraints['maximum']) {
\t\t\t$errors[] = sprintf('%s must be <= %s', $path, (string) $constraints['maximum']);
\t\t}
\t\tif (
\t\t\tisset($constraints['exclusiveMinimum']) &&
\t\t\t$this->isNumber($constraints['exclusiveMinimum']) &&
\t\t\t$value <= $constraints['exclusiveMinimum']
\t\t) {
\t\t\t$errors[] = sprintf('%s must be > %s', $path, (string) $constraints['exclusiveMinimum']);
\t\t}
\t\tif (
\t\t\tisset($constraints['exclusiveMaximum']) &&
\t\t\t$this->isNumber($constraints['exclusiveMaximum']) &&
\t\t\t$value >= $constraints['exclusiveMaximum']
\t\t) {
\t\t\t$errors[] = sprintf('%s must be < %s', $path, (string) $constraints['exclusiveMaximum']);
\t\t}
\t\tif (
\t\t\tisset($constraints['multipleOf']) &&
\t\t\t$this->isNumber($constraints['multipleOf']) &&
\t\t\t!$this->matchesMultipleOf($value, $constraints['multipleOf'])
\t\t) {
\t\t\t$errors[] = sprintf('%s must be a multiple of %s', $path, (string) $constraints['multipleOf']);
\t\t}
\t\tif (
\t\t\tisset($constraints['typeTag']) &&
\t\t\tis_string($constraints['typeTag']) &&
\t\t\t!$this->matchesTypeTag($value, $constraints['typeTag'])
\t\t) {
\t\t\t$errors[] = sprintf('%s must be a %s', $path, $constraints['typeTag']);
\t\t}
\t}

\tprivate function hasDefault(array $attribute): bool
\t{
\t\treturn ($attribute['typia']['hasDefault'] ?? false) === true;
\t}

\tprivate function valueInEnum($value, array $enum): bool
\t{
\t\tforeach ($enum as $candidate) {
\t\t\tif ($candidate === $value) {
\t\t\t\treturn true;
\t\t\t}
\t\t}
\t\treturn false;
\t}

\tprivate function matchesPattern(string $pattern, string $value): bool
\t{
\t\t$escapedPattern = str_replace('~', '\\\\~', $pattern);
\t\t$result = @preg_match('~' . $escapedPattern . '~u', $value);
\t\treturn $result === 1;
\t}

\tprivate function matchesFormat(string $format, string $value): bool
\t{
\t\tswitch ($format) {
\t\t\tcase 'uuid':
\t\t\t\treturn preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) === 1;
\t\t\tcase 'email':
\t\t\t\treturn filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
\t\t\tcase 'url':
\t\t\tcase 'uri':
\t\t\t\treturn filter_var($value, FILTER_VALIDATE_URL) !== false;
\t\t\tcase 'ipv4':
\t\t\t\treturn filter_var($value, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false;
\t\t\tcase 'ipv6':
\t\t\t\treturn filter_var($value, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;
\t\t\tcase 'date-time':
\t\t\t\treturn preg_match('/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$/', $value) === 1;
\t\t\tdefault:
\t\t\t\treturn true;
\t\t}
\t}

\tprivate function matchesTypeTag($value, string $typeTag): bool
\t{
\t\tswitch ($typeTag) {
\t\t\tcase 'uint32':
\t\t\t\treturn is_int($value) && $value >= 0 && $value <= 4294967295;
\t\t\tcase 'int32':
\t\t\t\treturn is_int($value) && $value >= -2147483648 && $value <= 2147483647;
\t\t\tcase 'uint64':
\t\t\t\treturn is_int($value) && $value >= 0;
\t\t\tcase 'float':
\t\t\tcase 'double':
\t\t\t\treturn is_int($value) || is_float($value);
\t\t\tdefault:
\t\t\t\treturn true;
\t\t}
\t}

\tprivate function matchesMultipleOf($value, $multipleOf): bool
\t{
\t\tif ($multipleOf == 0) {
\t\t\treturn true;
\t\t}
\t\tif (is_int($value) && is_int($multipleOf)) {
\t\t\treturn $value % $multipleOf === 0;
\t\t}

\t\t$remainder = fmod((float) $value, (float) $multipleOf);
\t\t$epsilon = 0.000000001;
\t\treturn abs($remainder) < $epsilon || abs(abs((float) $multipleOf) - abs($remainder)) < $epsilon;
\t}

\tprivate function isNumber($value): bool
\t{
\t\treturn is_int($value) || is_float($value);
\t}

\tprivate function isListArray(array $value): bool
\t{
\t\t$expectedKey = 0;
\t\tforeach ($value as $key => $_item) {
\t\t\tif ($key !== $expectedKey) {
\t\t\t\treturn false;
\t\t\t}
\t\t\t$expectedKey += 1;
\t\t}
\t\treturn true;
\t}

\tprivate function expectedKindLabel(array $attribute): string
\t{
\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? 'value';
\t\treturn $kind === 'union' ? 'object' : (string) $kind;
\t}
};
`,
    warnings,
  };
}

function collectPhpGenerationWarnings(
  attribute: ManifestAttribute,
  pathLabel: string,
  warnings: string[],
): void {
  const { format, typeTag } = attribute.typia.constraints;
  if (
    format !== null &&
    !new Set(['uuid', 'email', 'url', 'uri', 'ipv4', 'ipv6', 'date-time']).has(
      format,
    )
  ) {
    warnings.push(`${pathLabel}: unsupported PHP validator format "${format}"`);
  }
  if (
    typeTag !== null &&
    !new Set(['uint32', 'int32', 'uint64', 'float', 'double']).has(typeTag)
  ) {
    warnings.push(
      `${pathLabel}: unsupported PHP validator type tag "${typeTag}"`,
    );
  }

  if (attribute.ts.items) {
    collectPhpGenerationWarnings(
      attribute.ts.items,
      `${pathLabel}[]`,
      warnings,
    );
  }
  for (const [key, property] of Object.entries(attribute.ts.properties ?? {})) {
    collectPhpGenerationWarnings(property, `${pathLabel}.${key}`, warnings);
  }
  for (const [branchKey, branch] of Object.entries(
    attribute.ts.union?.branches ?? {},
  )) {
    collectPhpGenerationWarnings(
      branch,
      `${pathLabel}<${branchKey}>`,
      warnings,
    );
  }
}

function renderPhpValue(value: unknown, indentLevel: number): string {
  const indent = '\t'.repeat(indentLevel);
  const nestedIndent = '\t'.repeat(indentLevel + 1);

  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const items = value.map(
      (item) => `${nestedIndent}${renderPhpValue(item, indentLevel + 1)}`,
    );
    return `[\n${items.join(',\n')}\n${indent}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '[]';
    }
    const items = entries.map(
      ([key, item]) =>
        `${nestedIndent}'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' => ${renderPhpValue(item, indentLevel + 1)}`,
    );
    return `[\n${items.join(',\n')}\n${indent}]`;
  }

  throw new Error(
    `Unable to encode PHP value for manifest node: ${String(value)}`,
  );
}

function createExampleValue(node: AttributeNode, key: string): JsonValue {
  if (node.defaultValue !== undefined) {
    return cloneJson(node.defaultValue);
  }
  if (node.enumValues !== null && node.enumValues.length > 0) {
    return cloneJson(node.enumValues[0]);
  }

  switch (node.kind) {
    case 'string':
      if (node.constraints.format === 'uuid') {
        return '00000000-0000-4000-8000-000000000000';
      }
      return `Example ${key}`;
    case 'number':
      return node.constraints.minimum ?? 42;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object':
      return Object.fromEntries(
        Object.entries(node.properties ?? {}).map(
          ([propertyKey, propertyNode]) => [
            propertyKey,
            createExampleValue(propertyNode, propertyKey),
          ],
        ),
      );
    case 'union': {
      const firstBranch = node.union
        ? Object.values(node.union.branches)[0]
        : undefined;
      if (!firstBranch || firstBranch.kind !== 'object') {
        return {};
      }
      return Object.fromEntries(
        Object.entries(firstBranch.properties ?? {}).map(
          ([propertyKey, propertyNode]) => [
            propertyKey,
            createExampleValue(propertyNode, propertyKey),
          ],
        ),
      );
    }
  }
}

function getWordPressKind(node: AttributeNode): WordPressAttributeKind {
  return node.kind === 'union' ? 'object' : node.kind;
}

function baseNode(kind: AttributeKind, pathLabel: string): AttributeNode {
  return {
    constraints: DEFAULT_CONSTRAINTS(),
    enumValues: null,
    kind,
    path: pathLabel,
    required: true,
    union: null,
  };
}

function withRequired(node: AttributeNode, required: boolean): AttributeNode {
  return {
    ...node,
    items: node.items
      ? withRequired(node.items, node.items.required)
      : undefined,
    properties: node.properties ? cloneProperties(node.properties) : undefined,
    required,
    union: node.union ? cloneUnion(node.union) : null,
  };
}

function cloneUnion(union: AttributeUnion): AttributeUnion {
  return {
    branches: Object.fromEntries(
      Object.entries(union.branches).map(([key, branch]) => [
        key,
        withRequired(branch, branch.required),
      ]),
    ),
    discriminator: union.discriminator,
  };
}

function cloneProperties(
  properties: Record<string, AttributeNode>,
): Record<string, AttributeNode> {
  return Object.fromEntries(
    Object.entries(properties).map(([key, node]) => [
      key,
      withRequired(node, node.required),
    ]),
  );
}

function cloneJson<T extends JsonValue | Array<string | number | boolean>>(
  value: T,
): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getPropertyName(name: ts.PropertyName): string {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  throw new Error(`Unsupported property name: ${name.getText()}`);
}

function getSupportedTagName(node: ts.TypeReferenceNode): string | null {
  const typeName = getEntityNameText(node.typeName);
  const [, tagName] = typeName.split('.');
  if (
    !typeName.startsWith('tags.') ||
    tagName === undefined ||
    !SUPPORTED_TAGS.has(tagName)
  ) {
    return null;
  }
  return tagName;
}

function getEntityNameText(name: ts.EntityName): string {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  return `${getEntityNameText(name.left)}.${name.right.text}`;
}

function resolveSymbol(
  node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
  checker: ts.TypeChecker,
): ts.Symbol | undefined {
  const symbol = checker.getSymbolAtLocation(
    ts.isTypeReferenceNode(node) ? node.typeName : node.expression,
  );
  if (symbol === undefined) {
    return undefined;
  }
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function getReferenceName(
  node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
): string {
  if (ts.isTypeReferenceNode(node)) {
    return getEntityNameText(node.typeName);
  }
  return node.expression.getText();
}

function isProjectLocalDeclaration(
  declaration: ts.Declaration,
  projectRoot: string,
): boolean {
  const fileName = declaration.getSourceFile().fileName;
  return (
    !fileName.includes('node_modules') &&
    !path.relative(projectRoot, fileName).startsWith('..')
  );
}

function isSerializableExternalDeclaration(
  declaration: ts.Declaration,
  ctx: AnalysisContext,
): boolean {
  if (isProjectLocalDeclaration(declaration, ctx.projectRoot)) {
    return true;
  }

  const packageName = getOwningPackageName(
    declaration.getSourceFile().fileName,
    ctx.packageNameCache,
  );
  return packageName !== null && ctx.allowedExternalPackages.has(packageName);
}

function getOwningPackageName(
  fileName: string,
  cache: Map<string, string | null>,
): string | null {
  let currentDir = path.dirname(fileName);

  while (true) {
    if (cache.has(currentDir)) {
      return cache.get(currentDir) ?? null;
    }

    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8'),
        ) as {
          name?: string;
        };
        const packageName =
          typeof packageJson.name === 'string' ? packageJson.name : null;
        cache.set(currentDir, packageName);
        return packageName;
      } catch {
        cache.set(currentDir, null);
        return null;
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      cache.set(currentDir, null);
      return null;
    }

    currentDir = parentDir;
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
  const taggedCode = (
    error as TaggedSyncBlockMetadataError
  )[SYNC_BLOCK_METADATA_FAILURE_CODE];
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
    message.startsWith('Indexed access ') ||
    message.startsWith('Intersection at ') ||
    message.startsWith('Generic type references are not supported at ') ||
    message.startsWith('Class and enum references are not supported at ') ||
    message.startsWith('Discriminated union at ') ||
    message.startsWith('Tag "') ||
    message.startsWith('Only object-like interface extensions are supported:') ||
    message.startsWith('Array type is missing an item type at ')
  ) {
    return 'unsupported-type-pattern';
  }

  return 'unknown-internal-error';
}

function formatDiagnosticError(diagnostic: ts.Diagnostic): Error {
  return tagSyncBlockMetadataError(
    new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    'typescript-diagnostic',
  );
}
