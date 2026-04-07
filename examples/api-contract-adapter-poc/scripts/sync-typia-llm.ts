/* eslint-disable no-console */
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import type { ILlmFunction, ILlmSchema, ILlmStructuredOutput } from "typia";
import { BLOCKS } from "../../persistence-examples/scripts/block-config";
import type { EndpointManifestDefinition } from "../../../packages/create/src/runtime/metadata-core";
import {
  buildTypiaLlmEndpointMethodDescriptors,
  renderTypiaLlmModule,
  type TypiaLlmEndpointMethodDescriptor,
} from "../../../packages/create/src/internal/typia-llm";

const execFileAsync = promisify(execFile);

export interface ProjectedTypiaLlmFunctionArtifact {
  description?: string;
  name: string;
  output?: ILlmSchema.IParameters;
  parameters: ILlmSchema.IParameters;
  tags?: string[];
}

export interface ProjectedTypiaLlmApplicationArtifact {
  functions: ProjectedTypiaLlmFunctionArtifact[];
  generatedFrom: {
    baselineOpenApiPath: string;
    blockSlug: string;
    manifestSource: "endpoint-manifest+typescript";
  };
}

export interface ProjectedTypiaStructuredOutputArtifact {
  generatedFrom: {
    aiSchemaPath: string;
    blockSlug: string;
    outputTypeName: string;
  };
  parameters: ILlmStructuredOutput["parameters"];
}

type JsonObject = Record<string, unknown>;
type OpenApiDocument = {
  components?: {
    schemas?: Record<string, JsonObject>;
  };
  paths?: Record<string, JsonObject>;
};

interface SyncTypiaLlmCliOptions {
  check: boolean;
}

interface GeneratedArtifactFile {
  content: string;
  path: string;
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLE_ROOT = path.resolve(SCRIPT_DIR, "..");
const COUNTER_BLOCK = (() => {
  const block = BLOCKS.find((candidate) => candidate.slug === "counter");
  if (!block) {
    throw new Error(
      "Unable to locate the persistence counter block configuration."
    );
  }

  return block;
})();

const GENERATED_DIR = path.join(EXAMPLE_ROOT, "src", "typia-llm");
const GENERATED_SOURCE_FILE = path.join(
  GENERATED_DIR,
  "counter.llm.generated.ts"
);
const GENERATED_APPLICATION_FILE = path.join(
  GENERATED_DIR,
  "counter.llm.application.json"
);
const GENERATED_STRUCTURED_OUTPUT_FILE = path.join(
  GENERATED_DIR,
  "counter-response.structured-output.json"
);
const COMPILED_OUTPUT_DIR = path.join(EXAMPLE_ROOT, ".typia-llm-dist");
const TSCONFIG_FILE = path.join(EXAMPLE_ROOT, "tsconfig.typia-llm.json");
export const COUNTER_LLM_GENERATED_SOURCE_RELATIVE_PATH = path.relative(
  EXAMPLE_ROOT,
  GENERATED_SOURCE_FILE
);
export const COUNTER_LLM_APPLICATION_RELATIVE_PATH = path.relative(
  EXAMPLE_ROOT,
  GENERATED_APPLICATION_FILE
);
export const COUNTER_LLM_STRUCTURED_OUTPUT_RELATIVE_PATH = path.relative(
  EXAMPLE_ROOT,
  GENERATED_STRUCTURED_OUTPUT_FILE
);

function getCounterApiTypesFile(): string {
  return path.resolve(
    EXAMPLE_ROOT,
    "..",
    "persistence-examples",
    "src",
    "blocks",
    "counter",
    "api-types.ts"
  );
}

function getCounterAiSchemaFile(): string {
  return path.resolve(
    EXAMPLE_ROOT,
    "..",
    "persistence-examples",
    "src",
    "blocks",
    "counter",
    "wordpress-ai",
    "counter-response.ai.schema.json"
  );
}

function getCounterOpenApiFile(): string {
  return path.resolve(
    EXAMPLE_ROOT,
    "..",
    "persistence-examples",
    "src",
    "blocks",
    "counter",
    "api.openapi.json"
  );
}

function toPosixRelativePath(fromFile: string, targetFile: string): string {
  const relative = path
    .relative(path.dirname(fromFile), targetFile)
    .split(path.sep)
    .join("/");
  return relative.startsWith(".")
    ? relative.replace(/\.ts$/, "")
    : `./${relative.replace(/\.ts$/, "")}`;
}

function parseCliOptions(argv: string[]): SyncTypiaLlmCliOptions {
  const options: SyncTypiaLlmCliOptions = {
    check: false,
  };

  for (const argument of argv) {
    if (argument === "--check") {
      options.check = true;
      continue;
    }

    throw new Error(`Unknown sync-typia-llm flag: ${argument}`);
  }

  return options;
}

function normalizeGeneratedArtifactContentForComparison(content: string): string {
  return content.replace(/\r\n?/g, "\n");
}

async function reconcileGeneratedArtifacts(
  artifacts: readonly GeneratedArtifactFile[],
  options: SyncTypiaLlmCliOptions
) {
  if (options.check !== true) {
    await mkdir(GENERATED_DIR, { recursive: true });

    for (const artifact of artifacts) {
      await writeFile(artifact.path, artifact.content, "utf8");
    }

    return;
  }

  const issues: string[] = [];

  for (const artifact of artifacts) {
    try {
      const current = await readFile(artifact.path, "utf8");
      if (
        normalizeGeneratedArtifactContentForComparison(current) !==
        normalizeGeneratedArtifactContentForComparison(artifact.content)
      ) {
        issues.push(`- ${artifact.path} (stale)`);
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        issues.push(`- ${artifact.path} (missing)`);
        continue;
      }

      throw error;
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Generated artifacts are missing or stale:\n${issues.join("\n")}`
    );
  }
}

function projectApplicationFunction(
  functionSchema: ILlmFunction
): ProjectedTypiaLlmFunctionArtifact {
  return {
    description: functionSchema.description,
    name: functionSchema.name,
    output: functionSchema.output,
    parameters: functionSchema.parameters,
    tags: functionSchema.tags,
  };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveOpenApiSchema(
  document: OpenApiDocument,
  schema: unknown
): JsonObject {
  if (!isJsonObject(schema)) {
    return {};
  }

  const reference = schema.$ref;
  if (typeof reference !== "string") {
    return schema;
  }

  const match = reference.match(/^#\/components\/schemas\/(.+)$/);
  if (!match) {
    throw new Error(`Unsupported OpenAPI schema reference "${reference}".`);
  }

  const resolved = document.components?.schemas?.[match[1]];
  if (!resolved) {
    throw new Error(
      `Unable to resolve OpenAPI schema reference "${reference}".`
    );
  }

  return resolved;
}

function mergeOpenApiSchema(
  target: JsonObject,
  source: JsonObject
): JsonObject {
  const merged = target;

  for (const key of [
    "type",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "multipleOf",
    "pattern",
    "format",
    "default",
    "enum",
    "const",
    "additionalProperties",
  ] as const) {
    if (source[key] !== undefined) {
      merged[key] = cloneJson(source[key]);
    }
  }

  if (Array.isArray(source.required)) {
    merged.required = [...source.required];
  }

  if (isJsonObject(source.items)) {
    const nextItems = isJsonObject(merged.items) ? merged.items : {};
    merged.items = mergeOpenApiSchema(nextItems, source.items);
  }

  if (isJsonObject(source.properties)) {
    const targetProperties = isJsonObject(merged.properties)
      ? merged.properties
      : {};

    for (const [propertyName, propertySchema] of Object.entries(
      source.properties
    )) {
      if (!isJsonObject(propertySchema)) {
        continue;
      }

      const nextProperty = isJsonObject(targetProperties[propertyName])
        ? targetProperties[propertyName]
        : {};
      targetProperties[propertyName] = mergeOpenApiSchema(
        nextProperty,
        propertySchema
      );
    }

    merged.properties = targetProperties;
  }

  return merged;
}

function findOperationById(
  document: OpenApiDocument,
  operationId: string
): JsonObject | null {
  for (const pathItem of Object.values(document.paths ?? {})) {
    if (!isJsonObject(pathItem)) {
      continue;
    }

    for (const method of ["delete", "get", "patch", "post", "put"] as const) {
      const operation = pathItem[method];
      if (!isJsonObject(operation)) {
        continue;
      }

      if (operation.operationId === operationId) {
        return operation;
      }
    }
  }

  return null;
}

function applyOpenApiConstraintsToFunctionParameters(
  parameters: ILlmSchema.IParameters,
  operation: JsonObject | null,
  document: OpenApiDocument
): ILlmSchema.IParameters {
  const mergedParameters = cloneJson(parameters) as unknown as JsonObject;

  if (!operation) {
    return mergedParameters as unknown as ILlmSchema.IParameters;
  }

  const requestBodySchema = resolveOpenApiSchema(
    document,
    operation.requestBody &&
      isJsonObject(operation.requestBody) &&
      isJsonObject(operation.requestBody.content) &&
      isJsonObject(operation.requestBody.content["application/json"]) &&
      isJsonObject(operation.requestBody.content["application/json"].schema)
      ? operation.requestBody.content["application/json"].schema
      : null
  );
  mergeOpenApiSchema(mergedParameters, requestBodySchema);

  for (const parameter of Array.isArray(operation.parameters)
    ? operation.parameters
    : []) {
    if (
      !isJsonObject(parameter) ||
      parameter.in !== "query" ||
      typeof parameter.name !== "string"
    ) {
      continue;
    }

    const targetProperties = isJsonObject(mergedParameters.properties)
      ? mergedParameters.properties
      : {};
    const existingProperty = targetProperties[parameter.name];
    const nextProperty: JsonObject = isJsonObject(existingProperty)
      ? existingProperty
      : {};

    targetProperties[parameter.name] = mergeOpenApiSchema(
      nextProperty,
      resolveOpenApiSchema(document, parameter.schema)
    );
    mergedParameters.properties = targetProperties;

    if (parameter.required === true) {
      const required = new Set(
        Array.isArray(mergedParameters.required)
          ? mergedParameters.required
          : []
      );
      required.add(parameter.name);
      mergedParameters.required = [...required];
    }
  }

  return mergedParameters as unknown as ILlmSchema.IParameters;
}

async function readCounterOpenApiDocument(): Promise<OpenApiDocument> {
  return JSON.parse(
    await readFile(getCounterOpenApiFile(), "utf8")
  ) as OpenApiDocument;
}

async function importCompiledModule(moduleFile: string): Promise<{
  counterLlmApplication: { functions: ILlmFunction[] };
  counterResponseStructuredOutput: ILlmStructuredOutput;
}> {
  const require = createRequire(import.meta.url);
  return require(moduleFile) as {
    counterLlmApplication: { functions: ILlmFunction[] };
    counterResponseStructuredOutput: ILlmStructuredOutput;
  };
}

async function compileGeneratedModule() {
  const require = createRequire(import.meta.url);
  const tspcBin = require.resolve("ts-patch/bin/tspc.js");

  await rm(COMPILED_OUTPUT_DIR, { force: true, recursive: true });
  await execFileAsync("node", [tspcBin, "-p", TSCONFIG_FILE], {
    cwd: EXAMPLE_ROOT,
    env: process.env,
  });
}

function getCompiledModuleFile(): string {
  return path.join(
    COMPILED_OUTPUT_DIR,
    "api-contract-adapter-poc",
    "src",
    "typia-llm",
    "counter.llm.generated.js"
  );
}

export function buildCounterTypiaLlmMethodDescriptors(
  manifest: EndpointManifestDefinition = COUNTER_BLOCK.restManifest
): TypiaLlmEndpointMethodDescriptor[] {
  return buildTypiaLlmEndpointMethodDescriptors(manifest);
}

export function renderCounterTypiaLlmGeneratedSource(
  manifest: EndpointManifestDefinition = COUNTER_BLOCK.restManifest
): string {
  return renderTypiaLlmModule({
    applicationExportName: "counterLlmApplication",
    interfaceName: "CounterRestToolController",
    manifest,
    structuredOutputExportName: "counterResponseStructuredOutput",
    structuredOutputTypeName: "PersistenceCounterResponse",
    typesImportPath: toPosixRelativePath(
      GENERATED_SOURCE_FILE,
      getCounterApiTypesFile()
    ),
  });
}

export async function buildCounterTypiaLlmArtifacts(): Promise<{
  applicationArtifact: ProjectedTypiaLlmApplicationArtifact;
  structuredOutputArtifact: ProjectedTypiaStructuredOutputArtifact;
}> {
  try {
    await compileGeneratedModule();

    const compiledModule = await importCompiledModule(getCompiledModuleFile());
    const openApiDocument = await readCounterOpenApiDocument();

    return {
      applicationArtifact: {
        functions: compiledModule.counterLlmApplication.functions.map(
          (functionSchema) => ({
            ...projectApplicationFunction(functionSchema),
            parameters: applyOpenApiConstraintsToFunctionParameters(
              functionSchema.parameters,
              findOperationById(openApiDocument, functionSchema.name),
              openApiDocument
            ),
          })
        ),
        generatedFrom: {
          baselineOpenApiPath: path.relative(
            EXAMPLE_ROOT,
            getCounterOpenApiFile()
          ),
          blockSlug: COUNTER_BLOCK.slug,
          manifestSource: "endpoint-manifest+typescript",
        },
      },
      structuredOutputArtifact: {
        generatedFrom: {
          aiSchemaPath: path.relative(EXAMPLE_ROOT, getCounterAiSchemaFile()),
          blockSlug: COUNTER_BLOCK.slug,
          outputTypeName: "PersistenceCounterResponse",
        },
        parameters: compiledModule.counterResponseStructuredOutput.parameters,
      },
    };
  } finally {
    await rm(COMPILED_OUTPUT_DIR, { force: true, recursive: true });
  }
}

export async function syncCounterTypiaLlmArtifacts(
  options: SyncTypiaLlmCliOptions = { check: false }
) {
  const generatedSource = renderCounterTypiaLlmGeneratedSource() + "\n";

  await reconcileGeneratedArtifacts(
    [
      {
        content: generatedSource,
        path: GENERATED_SOURCE_FILE,
      },
    ],
    options
  );

  const { applicationArtifact, structuredOutputArtifact } =
    await buildCounterTypiaLlmArtifacts();

  await reconcileGeneratedArtifacts(
    [
      {
        content: JSON.stringify(applicationArtifact, null, 2) + "\n",
        path: GENERATED_APPLICATION_FILE,
      },
      {
        content: JSON.stringify(structuredOutputArtifact, null, 2) + "\n",
        path: GENERATED_STRUCTURED_OUTPUT_FILE,
      },
    ],
    options
  );
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (entrypoint === import.meta.url) {
  Promise.resolve()
    .then(() => parseCliOptions(process.argv.slice(2)))
    .then(async (options) => {
      await syncCounterTypiaLlmArtifacts(options);
      console.log(
        options.check
          ? "✅ typia.llm artifacts are already up to date!"
          : "✅ typia.llm artifacts generated from the REST manifest and Typia contracts!"
      );
    })
    .catch((error) => {
      console.error("❌ typia.llm sync failed:", error);
      process.exit(1);
    });
}
