/* eslint-disable no-console */
import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
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

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLE_ROOT = path.resolve(SCRIPT_DIR, "..");
const COUNTER_BLOCK = (() => {
	const block = BLOCKS.find((candidate) => candidate.slug === "counter");
	if (!block) {
		throw new Error("Unable to locate the persistence counter block configuration.");
	}

	return block;
})();

const GENERATED_DIR = path.join(EXAMPLE_ROOT, "src", "typia-llm");
const GENERATED_SOURCE_FILE = path.join(GENERATED_DIR, "counter.llm.generated.ts");
const GENERATED_APPLICATION_FILE = path.join(GENERATED_DIR, "counter.llm.application.json");
const GENERATED_STRUCTURED_OUTPUT_FILE = path.join(
	GENERATED_DIR,
	"counter-response.structured-output.json",
);
const COMPILED_OUTPUT_DIR = path.join(EXAMPLE_ROOT, ".typia-llm-dist");
const TSCONFIG_FILE = path.join(EXAMPLE_ROOT, "tsconfig.typia-llm.json");
export const COUNTER_LLM_GENERATED_SOURCE_RELATIVE_PATH = path.relative(
	EXAMPLE_ROOT,
	GENERATED_SOURCE_FILE,
);
export const COUNTER_LLM_APPLICATION_RELATIVE_PATH = path.relative(
	EXAMPLE_ROOT,
	GENERATED_APPLICATION_FILE,
);
export const COUNTER_LLM_STRUCTURED_OUTPUT_RELATIVE_PATH = path.relative(
	EXAMPLE_ROOT,
	GENERATED_STRUCTURED_OUTPUT_FILE,
);

function getCounterApiTypesFile(): string {
	return path.resolve(
		EXAMPLE_ROOT,
		"..",
		"persistence-examples",
		"src",
		"blocks",
		"counter",
		"api-types.ts",
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
		"counter-response.ai.schema.json",
	);
}

function toPosixRelativePath(fromFile: string, targetFile: string): string {
	const relative = path.relative(path.dirname(fromFile), targetFile).split(path.sep).join("/");
	return relative.startsWith(".") ? relative.replace(/\.ts$/, "") : `./${relative.replace(/\.ts$/, "")}`;
}

function projectApplicationFunction(functionSchema: ILlmFunction): ProjectedTypiaLlmFunctionArtifact {
	return {
		description: functionSchema.description,
		name: functionSchema.name,
		output: functionSchema.output,
		parameters: functionSchema.parameters,
		tags: functionSchema.tags,
	};
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
		"rest-contract-adapter-poc",
		"src",
		"typia-llm",
		"counter.llm.generated.js",
	);
}

export function buildCounterTypiaLlmMethodDescriptors(
	manifest: EndpointManifestDefinition = COUNTER_BLOCK.restManifest,
): TypiaLlmEndpointMethodDescriptor[] {
	return buildTypiaLlmEndpointMethodDescriptors(manifest);
}

export function renderCounterTypiaLlmGeneratedSource(
	manifest: EndpointManifestDefinition = COUNTER_BLOCK.restManifest,
): string {
	return renderTypiaLlmModule({
		applicationExportName: "counterLlmApplication",
		interfaceName: "CounterRestToolController",
		manifest,
		structuredOutputExportName: "counterResponseStructuredOutput",
		structuredOutputTypeName: "PersistenceCounterResponse",
		typesImportPath: toPosixRelativePath(GENERATED_SOURCE_FILE, getCounterApiTypesFile()),
	});
}

export async function buildCounterTypiaLlmArtifacts(): Promise<{
	applicationArtifact: ProjectedTypiaLlmApplicationArtifact;
	structuredOutputArtifact: ProjectedTypiaStructuredOutputArtifact;
}> {
	await compileGeneratedModule();

	try {
		const compiledModule = await importCompiledModule(getCompiledModuleFile());

		return {
			applicationArtifact: {
				functions: compiledModule.counterLlmApplication.functions.map(projectApplicationFunction),
				generatedFrom: {
					baselineOpenApiPath: path.relative(
						EXAMPLE_ROOT,
						path.join(EXAMPLE_ROOT, COUNTER_BLOCK.openApiFile),
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

export async function syncCounterTypiaLlmArtifacts() {
	await mkdir(GENERATED_DIR, { recursive: true });

	await writeFile(
		GENERATED_SOURCE_FILE,
		renderCounterTypiaLlmGeneratedSource() + "\n",
		"utf8",
	);

	const { applicationArtifact, structuredOutputArtifact } =
		await buildCounterTypiaLlmArtifacts();

	await writeFile(
		GENERATED_APPLICATION_FILE,
		JSON.stringify(applicationArtifact, null, 2) + "\n",
		"utf8",
	);
	await writeFile(
		GENERATED_STRUCTURED_OUTPUT_FILE,
		JSON.stringify(structuredOutputArtifact, null, 2) + "\n",
		"utf8",
	);
}

const entrypoint = process.argv[1]
	? pathToFileURL(path.resolve(process.argv[1])).href
	: null;

if (entrypoint === import.meta.url) {
	syncCounterTypiaLlmArtifacts().catch((error) => {
		console.error("❌ typia.llm sync failed:", error);
		process.exit(1);
	});
}
