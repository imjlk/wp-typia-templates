import path from "node:path";

import { readJsonFile, readJsonFileSync } from "./json-utils.js";
import type { WorkspacePostMetaInventoryEntry } from "./workspace-inventory-types.js";

export interface PostMetaBindingField {
	fallbackValue: string;
	label: string;
	name: string;
	required: boolean;
	schemaType: string;
}

type JsonRecord = Record<string, unknown>;

const SUPPORTED_SCHEMA_TYPES = new Set([
	"array",
	"boolean",
	"integer",
	"number",
	"object",
	"string",
]);

function isJsonRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveSchemaType(schema: JsonRecord): string {
	const type = schema.type;
	if (typeof type === "string" && SUPPORTED_SCHEMA_TYPES.has(type)) {
		return type;
	}
	if (
		Array.isArray(type) &&
		type.every((entry) => typeof entry === "string") &&
		type.includes("string")
	) {
		return "string";
	}
	if (Array.isArray(schema.enum) && schema.enum.length > 0) {
		return "string";
	}

	return "unknown";
}

function resolveFallbackValue(name: string, schema: JsonRecord, schemaType: string): string {
	const enumValue = Array.isArray(schema.enum)
		? schema.enum.find((entry) => typeof entry === "string")
		: undefined;
	if (typeof enumValue === "string") {
		return enumValue;
	}

	switch (schemaType) {
		case "array":
			return "[]";
		case "boolean":
			return "false";
		case "integer":
		case "number":
			return "0";
		case "object":
			return "{}";
		default:
			return `${name} preview`;
	}
}

function resolveFieldLabel(name: string): string {
	return name
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (match) => match.toUpperCase());
}

function extractPostMetaBindingFields(
	schema: unknown,
	context: string,
): PostMetaBindingField[] {
	if (!isJsonRecord(schema) || !isJsonRecord(schema.properties)) {
		throw new Error(
			`${context} must expose an object schema with top-level properties before it can back a binding source.`,
		);
	}

	const required = Array.isArray(schema.required)
		? new Set(schema.required.filter((entry): entry is string => typeof entry === "string"))
		: new Set<string>();
	const fields = Object.entries(schema.properties).map(([name, propertySchema]) => {
		const property = isJsonRecord(propertySchema) ? propertySchema : {};
		const schemaType = resolveSchemaType(property);

		return {
			fallbackValue: resolveFallbackValue(name, property, schemaType),
			label: resolveFieldLabel(name),
			name,
			required: required.has(name),
			schemaType,
		};
	});

	if (fields.length === 0) {
		throw new Error(
			`${context} does not expose any top-level properties that can back binding fields.`,
		);
	}

	return fields;
}

export async function loadPostMetaBindingFields(
	projectDir: string,
	postMeta: WorkspacePostMetaInventoryEntry,
): Promise<PostMetaBindingField[]> {
	const schemaPath = path.join(projectDir, postMeta.schemaFile);
	const schema = await readJsonFile(schemaPath, {
		context: `post meta schema for ${postMeta.slug}`,
	});

	return extractPostMetaBindingFields(schema, postMeta.schemaFile);
}

export function loadPostMetaBindingFieldsSync(
	projectDir: string,
	postMeta: WorkspacePostMetaInventoryEntry,
): PostMetaBindingField[] {
	const schemaPath = path.join(projectDir, postMeta.schemaFile);
	const schema = readJsonFileSync(schemaPath, {
		context: `post meta schema for ${postMeta.slug}`,
	});

	return extractPostMetaBindingFields(schema, postMeta.schemaFile);
}

export function assertPostMetaBindingPath(
	fields: readonly PostMetaBindingField[],
	postMetaSlug: string,
	metaPath: string,
): PostMetaBindingField {
	const trimmed = metaPath.trim();
	if (!trimmed) {
		throw new Error("Post meta binding path must include a value.");
	}
	if (trimmed.includes(".")) {
		throw new Error(
			`Nested post meta path "${trimmed}" for "${postMetaSlug}" is not supported yet. Use one of the top-level fields: ${fields.map((field) => field.name).join(", ")}.`,
		);
	}

	const field = fields.find((candidate) => candidate.name === trimmed);
	if (!field) {
		throw new Error(
			`Post meta path "${trimmed}" does not exist in the "${postMetaSlug}" schema. Expected one of: ${fields.map((candidate) => candidate.name).join(", ")}.`,
		);
	}

	return field;
}
