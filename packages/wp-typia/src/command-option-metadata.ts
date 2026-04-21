import { z } from "zod";

export type CommandOptionMetadata = {
	argumentKind?: "flag";
	description: string;
	short?: string;
	type: "boolean" | "string";
};

type CommandOptionMetadataMap = Record<string, CommandOptionMetadata>;

/**
 * Shared `wp-typia create` option metadata used by both the Bunli command
 * definitions and the Node fallback parser/help surface.
 */
export const CREATE_OPTION_METADATA = {
	"alternate-render-targets": {
		description:
			"Comma-separated alternate render targets for dynamic block scaffolds (email,mjml,plain-text).",
		type: "string",
	},
	"data-storage": {
		description: "Persistence storage mode for persistence-capable templates.",
		type: "string",
	},
	"dry-run": {
		argumentKind: "flag",
		description: "Preview scaffold output without writing files to the target directory.",
		type: "boolean",
	},
	"external-layer-id": {
		description: "Explicit layer id when an external layer package exposes multiple selectable layers.",
		type: "string",
	},
	"external-layer-source": {
		description: "Local path, GitHub locator, or npm package that exposes wp-typia.layers.json for built-in templates.",
		type: "string",
	},
	namespace: {
		description: "Override the default block namespace.",
		type: "string",
	},
	"no-install": {
		argumentKind: "flag",
		description: "Skip dependency installation after scaffold.",
		type: "boolean",
	},
	"package-manager": {
		description: "Package manager to use for install and scripts.",
		short: "p",
		type: "string",
	},
	"persistence-policy": {
		description: "Authenticated or public write policy for persistence-capable templates.",
		type: "string",
	},
	"php-prefix": {
		description: "Custom PHP symbol prefix.",
		type: "string",
	},
	"query-post-type": {
		description: "Default post type assigned to Query Loop variation scaffolds.",
		type: "string",
	},
	template: {
		description: "Template id or external template package.",
		short: "t",
		type: "string",
	},
	"text-domain": {
		description: "Custom text domain for the generated project.",
		type: "string",
	},
	variant: {
		description: "Optional template variant identifier.",
		type: "string",
	},
	"with-migration-ui": {
		argumentKind: "flag",
		description: "Enable migration UI support when the template supports it.",
		type: "boolean",
	},
	"with-test-preset": {
		argumentKind: "flag",
		description: "Include the Playwright smoke-test preset.",
		type: "boolean",
	},
	"with-wp-env": {
		argumentKind: "flag",
		description: "Include a local wp-env preset.",
		type: "boolean",
	},
	yes: {
		argumentKind: "flag",
		description: "Accept defaults without prompt fallbacks.",
		short: "y",
		type: "boolean",
	},
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia add` option metadata used by both runtime entry paths.
 */
export const ADD_OPTION_METADATA = {
	"alternate-render-targets": {
		description:
			"Comma-separated alternate render targets for dynamic block scaffolds (email,mjml,plain-text).",
		type: "string",
	},
	anchor: {
		description: "Anchor block name for hooked-block workflows.",
		type: "string",
	},
	block: {
		description: "Target block slug for variation workflows.",
		type: "string",
	},
	"data-storage": {
		description: "Persistence storage mode for persistence-capable templates.",
		type: "string",
	},
	"dry-run": {
		argumentKind: "flag",
		description: "Preview workspace file updates without writing them.",
		type: "boolean",
	},
	"external-layer-id": {
		description: "Explicit layer id when an external layer package exposes multiple selectable layers.",
		type: "string",
	},
	"external-layer-source": {
		description: "Local path, GitHub locator, or npm package that exposes wp-typia.layers.json for built-in block templates.",
		type: "string",
	},
	methods: {
		description: "Comma-separated REST resource methods for rest-resource workflows.",
		type: "string",
	},
	namespace: {
		description: "REST namespace for rest-resource workflows.",
		type: "string",
	},
	"persistence-policy": {
		description: "Persistence write policy for persistence-capable templates.",
		type: "string",
	},
	position: {
		description: "Hook position for hooked-block workflows.",
		type: "string",
	},
	slot: {
		description: "Document editor shell slot for editor-plugin workflows.",
		type: "string",
	},
	template: {
		description: "Built-in block family for the new block.",
		type: "string",
	},
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia migrate` option metadata used by both runtime entry paths.
 */
export const MIGRATE_OPTION_METADATA = {
	all: {
		argumentKind: "flag",
		description: "Run across every configured migration version and block target.",
		type: "boolean",
	},
	"current-migration-version": {
		description: "Current migration version label for `migrate init`.",
		type: "string",
	},
	force: {
		argumentKind: "flag",
		description: "Force overwrite behavior where supported.",
		type: "boolean",
	},
	"from-migration-version": {
		description: "Source migration version label.",
		type: "string",
	},
	iterations: {
		description: "Iteration count for `migrate fuzz`.",
		type: "string",
	},
	"migration-version": {
		description: "Version label to capture with `migrate snapshot`.",
		type: "string",
	},
	seed: {
		description: "Deterministic fuzz seed.",
		type: "string",
	},
	"to-migration-version": {
		description: "Target migration version label.",
		type: "string",
	},
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia templates` option metadata.
 */
export const TEMPLATES_OPTION_METADATA = {
	id: {
		description: "Template id for `templates inspect`.",
		type: "string",
	},
} as const satisfies CommandOptionMetadataMap;

/**
 * Global option metadata used by Node fallback parsing before command dispatch.
 */
export const GLOBAL_OPTION_METADATA = {
	config: {
		description: "Config override file path.",
		short: "c",
		type: "string",
	},
	format: {
		description: "Output format for supported commands.",
		type: "string",
	},
	id: {
		description: "Template id for top-level `templates inspect` convenience.",
		type: "string",
	},
	"output-dir": {
		description: "Output directory for generated MCP metadata.",
		type: "string",
	},
} as const satisfies CommandOptionMetadataMap;

export function buildCommandOptions<TOptions extends CommandOptionMetadataMap>(
	metadata: TOptions,
): Record<string, {
	argumentKind?: "flag";
	description: string;
	schema: z.ZodDefault<z.ZodBoolean> | z.ZodOptional<z.ZodString>;
	short?: string;
}> {
	return Object.fromEntries(
		Object.entries(metadata).map(([name, option]) => [
			name,
			{
				...(option.argumentKind ? { argumentKind: option.argumentKind } : {}),
				description: option.description,
				schema:
					option.type === "boolean"
						? z.boolean().default(false)
						: z.string().optional(),
				...(option.short ? { short: option.short } : {}),
			},
		]),
	);
}

export function collectOptionNamesByType(
	metadata: CommandOptionMetadataMap,
	type: CommandOptionMetadata["type"],
): string[] {
	return Object.entries(metadata)
		.filter(([, option]) => option.type === type)
		.map(([name]) => name);
}

export function formatNodeFallbackOptionHelp(
	metadata: CommandOptionMetadataMap,
): string[] {
	return Object.entries(metadata).map(([name, option]) => {
		const short = option.short ? `, -${option.short}` : "";
		return `- --${name}${short}: ${option.description}`;
	});
}
