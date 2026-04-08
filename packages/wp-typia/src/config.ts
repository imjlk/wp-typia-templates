import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type WpTypiaSchemaSource = {
	namespace: string;
	path: string;
};

export type WpTypiaUserConfig = {
	create?: {
		"data-storage"?: string;
		namespace?: string;
		"no-install"?: boolean;
		"package-manager"?: string;
		"persistence-policy"?: string;
		"php-prefix"?: string;
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
			"data-storage"?: string;
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

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
		throw error;
	}
}

function resolveConfigPath(cwd: string, source: string): string {
	if (source.startsWith("~/")) {
		return path.join(os.homedir(), source.slice(2));
	}
	return path.resolve(cwd, source);
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
