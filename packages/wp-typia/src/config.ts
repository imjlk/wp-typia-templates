import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { isPlainObject as isRecord } from "@wp-typia/api-client/runtime-primitives";
import {
	CLI_DIAGNOSTIC_CODES,
	createCliDiagnosticCodeError,
} from "@wp-typia/project-tools/cli-diagnostics";

export type WpTypiaSchemaSource = {
	namespace: string;
	path: string;
};

export type WpTypiaUserConfig = {
	create?: {
		"alternate-render-targets"?: string;
		"inner-blocks-preset"?: string;
		"data-storage"?: string;
		"dry-run"?: boolean;
		"external-layer-id"?: string;
		"external-layer-source"?: string;
		namespace?: string;
		"no-install"?: boolean;
		"package-manager"?: string;
		"persistence-policy"?: string;
		"php-prefix"?: string;
		"query-post-type"?: string;
		template?: string;
		"text-domain"?: string;
		variant?: string;
		"with-migration-ui"?: boolean;
		"with-test-preset"?: boolean;
		"with-wp-env"?: boolean;
		yes?: boolean;
	};
	add?: {
		block?: {
			"alternate-render-targets"?: string;
			"data-storage"?: string;
			"external-layer-id"?: string;
			"external-layer-source"?: string;
			"inner-blocks-preset"?: string;
			"persistence-policy"?: string;
			template?: string;
		};
	};
	mcp?: {
		schemaSources?: WpTypiaSchemaSource[];
	};
};

export const WP_TYPIA_CONFIG_SOURCES = [
	"~/.config/wp-typia/config.json",
	".wp-typiarc",
	".wp-typiarc.json",
] as const;
type JsonRecord = Record<string, unknown>;

function deepMerge<T extends JsonRecord>(base: T, incoming: JsonRecord): T {
	const merged: JsonRecord = { ...base };

	for (const [key, value] of Object.entries(incoming)) {
		if (Array.isArray(value)) {
			merged[key] = value.slice();
			continue;
		}
		if (isRecord(value) && isRecord(merged[key])) {
			merged[key] = deepMerge(merged[key] as JsonRecord, value);
			continue;
		}
		merged[key] = value;
	}

	return merged as T;
}

async function readJsonFile(filePath: string): Promise<JsonRecord | null> {
	try {
		const source = await fs.readFile(filePath, "utf8");
		const parsed = JSON.parse(source);
		return isRecord(parsed) ? parsed : null;
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			return null;
		}
		const message = error instanceof Error ? error.message : String(error);
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			`Unable to parse ${filePath}: ${message}`,
			error instanceof Error ? { cause: error } : undefined,
		);
	}
}

function resolveConfigPath(cwd: string, source: string): string {
	if (source.startsWith("~/")) {
		return path.join(os.homedir(), source.slice(2));
	}
	return path.resolve(cwd, source);
}

export function mergeWpTypiaUserConfig(
	base: WpTypiaUserConfig,
	incoming: WpTypiaUserConfig,
): WpTypiaUserConfig {
	return deepMerge(base as JsonRecord, incoming as JsonRecord) as WpTypiaUserConfig;
}

export async function loadWpTypiaUserConfigFromSource(
	cwd: string,
	source: string,
): Promise<WpTypiaUserConfig> {
	const config = await readJsonFile(resolveConfigPath(cwd, source));
	return (config ?? {}) as WpTypiaUserConfig;
}

export async function loadWpTypiaUserConfig(cwd: string): Promise<WpTypiaUserConfig> {
	let merged: JsonRecord = {};

	for (const source of WP_TYPIA_CONFIG_SOURCES) {
		const configPath = resolveConfigPath(cwd, source);
		const config = await readJsonFile(configPath);
		if (config) {
			merged = deepMerge(merged, config);
		}
	}

	const packageJson = await readJsonFile(path.join(cwd, "package.json"));
	if (packageJson && isRecord(packageJson["wp-typia"])) {
		merged = deepMerge(merged, packageJson["wp-typia"] as JsonRecord);
	}

	return merged as WpTypiaUserConfig;
}

export function getCreateDefaults(config: WpTypiaUserConfig): NonNullable<WpTypiaUserConfig["create"]> {
	return config.create ?? {};
}

export function getAddBlockDefaults(
	config: WpTypiaUserConfig,
): NonNullable<NonNullable<WpTypiaUserConfig["add"]>["block"]> {
	return config.add?.block ?? {};
}

export function getMcpSchemaSources(config: WpTypiaUserConfig): WpTypiaSchemaSource[] {
	return config.mcp?.schemaSources ?? [];
}
