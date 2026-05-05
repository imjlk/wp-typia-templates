import fs from "node:fs/promises";
import path from "node:path";

import { Result } from "better-result";
import {
	createCommandsFromMCPTools,
	extractCommandMetadata,
	generateMCPTypes,
	type MCPToolGroup,
	type MCPTool,
} from "@bunli/plugin-mcp";
import {
	CLI_DIAGNOSTIC_CODES,
	createCliDiagnosticCodeError,
} from "@wp-typia/project-tools/cli-diagnostics";

import type { WpTypiaSchemaSource } from "./config";

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTool(value: unknown): value is MCPTool {
	return (
		isObject(value) &&
		typeof value.name === "string" &&
		(value.description === undefined || typeof value.description === "string")
	);
}

function isToolGroup(value: unknown): value is MCPToolGroup {
	return (
		isObject(value) &&
		typeof value.namespace === "string" &&
		Array.isArray(value.tools) &&
		value.tools.every(isTool)
	);
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function getErrorCauseOptions(error: unknown): ErrorOptions | undefined {
	return error instanceof Error ? { cause: error } : undefined;
}

async function readSchemaSource(
	cwd: string,
	source: WpTypiaSchemaSource,
): Promise<MCPToolGroup> {
	const schemaPath = path.resolve(cwd, source.path);
	const raw = await fs.readFile(schemaPath, "utf8");
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			`Schema source "${source.path}" must contain valid JSON. ${getErrorMessage(error)}`,
			getErrorCauseOptions(error),
		);
	}

	if (isToolGroup(parsed)) {
		return parsed;
	}

	if (Array.isArray(parsed) && parsed.every(isTool)) {
		return {
			namespace: source.namespace,
			tools: parsed,
		};
	}

	throw createCliDiagnosticCodeError(
		CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
		`Schema source "${source.path}" must contain either one MCPToolGroup object or an array of MCP tools.`,
	);
}

export async function loadMcpToolGroups(
	cwd: string,
	schemaSources: WpTypiaSchemaSource[],
): Promise<MCPToolGroup[]> {
	return Promise.all(schemaSources.map((source) => readSchemaSource(cwd, source)));
}

export async function syncMcpSchemas(
	cwd: string,
	schemaSources: WpTypiaSchemaSource[],
	outputDir = path.join(cwd, ".bunli", "mcp"),
): Promise<{
	commandCount: number;
	groups: MCPToolGroup[];
	outputDir: string;
}> {
	const groups = await loadMcpToolGroups(cwd, schemaSources);
	const result = await generateMCPTypes({
		outputDir,
		tools: groups,
	});
	if (Result.isError(result)) {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			getErrorMessage(result.error),
			getErrorCauseOptions(result.error),
		);
	}

	const registry = groups.map((group) => ({
		namespace: group.namespace,
		tools: group.tools.map((tool) => extractCommandMetadata(tool, group.namespace)),
	}));

	for (const group of groups) {
		const convert = createCommandsFromMCPTools(group.tools, {
			createHandler: () => async () => {},
			namespace: group.namespace,
		});
		if (Result.isError(convert)) {
			throw createCliDiagnosticCodeError(
				CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
				getErrorMessage(convert.error),
				getErrorCauseOptions(convert.error),
			);
		}
	}

	await fs.mkdir(outputDir, { recursive: true });
	await fs.writeFile(
		path.join(outputDir, "registry.json"),
		`${JSON.stringify(registry, null, 2)}\n`,
		"utf8",
	);

	return {
		commandCount: registry.reduce((count, group) => count + group.tools.length, 0),
		groups,
		outputDir,
	};
}
