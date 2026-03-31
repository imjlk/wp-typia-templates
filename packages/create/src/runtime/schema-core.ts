import type {
	JsonValue,
	ManifestAttribute,
	ManifestConstraints,
	ManifestDocument,
	ManifestUnionMetadata,
} from "./migration-types.js";

export interface JsonSchemaObject {
	[key: string]: JsonValue | JsonSchemaObject | JsonSchemaObject[] | undefined;
}

export interface OpenApiInfo {
	description?: string;
	title?: string;
	version?: string;
}

function applyConstraintIfNumber(
	schema: JsonSchemaObject,
	key: string,
	value: number | null | undefined,
): void {
	if (typeof value === "number" && Number.isFinite(value)) {
		schema[key] = value;
	}
}

function applyConstraintIfString(
	schema: JsonSchemaObject,
	key: string,
	value: string | null | undefined,
): void {
	if (typeof value === "string" && value.length > 0) {
		schema[key] = value;
	}
}

function applyCommonConstraints(
	schema: JsonSchemaObject,
	constraints: ManifestConstraints,
): void {
	applyConstraintIfString(schema, "format", constraints.format);
	applyConstraintIfString(schema, "pattern", constraints.pattern);
	applyConstraintIfString(schema, "x-typeTag", constraints.typeTag);

	applyConstraintIfNumber(schema, "minLength", constraints.minLength);
	applyConstraintIfNumber(schema, "maxLength", constraints.maxLength);
	applyConstraintIfNumber(schema, "minimum", constraints.minimum);
	applyConstraintIfNumber(schema, "maximum", constraints.maximum);
	applyConstraintIfNumber(schema, "exclusiveMinimum", constraints.exclusiveMinimum);
	applyConstraintIfNumber(schema, "exclusiveMaximum", constraints.exclusiveMaximum);
	applyConstraintIfNumber(schema, "multipleOf", constraints.multipleOf);
	applyConstraintIfNumber(schema, "minItems", constraints.minItems);
	applyConstraintIfNumber(schema, "maxItems", constraints.maxItems);
}

function manifestUnionToJsonSchema(union: ManifestUnionMetadata): JsonSchemaObject {
	const oneOf = Object.entries(union.branches).map(([branchKey, branch]) => {
		const schema = manifestAttributeToJsonSchema(branch);
		const branchKind = branch.ts.kind;
		if (
			branchKind === "object" &&
			typeof schema.properties === "object" &&
			schema.properties !== null &&
			!Array.isArray(schema.properties)
		) {
			const properties = schema.properties as Record<string, JsonSchemaObject>;
			properties[union.discriminator] = {
				const: branchKey,
				enum: [branchKey],
				type: "string",
			};
			const required = Array.isArray(schema.required)
				? [...new Set([...(schema.required as string[]), union.discriminator])]
				: [union.discriminator];
			schema.required = required;
			return schema;
		}

		return {
			allOf: [
				schema,
				{
					properties: {
						[union.discriminator]: {
							const: branchKey,
							enum: [branchKey],
							type: "string",
						},
					},
					required: [union.discriminator],
					type: "object",
				},
			],
		};
	});

	return {
		discriminator: {
			propertyName: union.discriminator,
		},
		oneOf,
	};
}

export function manifestAttributeToJsonSchema(attribute: ManifestAttribute): JsonSchemaObject {
	if (attribute.ts.union) {
		const schema = manifestUnionToJsonSchema(attribute.ts.union);
		if (attribute.typia.hasDefault) {
			schema.default = attribute.typia.defaultValue ?? null;
		}
		return schema;
	}

	const schema: JsonSchemaObject = {};
	const enumValues = Array.isArray(attribute.wp.enum) ? attribute.wp.enum : null;
	if (enumValues && enumValues.length > 0) {
		schema.enum = enumValues;
	}
	if (attribute.typia.hasDefault) {
		schema.default = attribute.typia.defaultValue ?? null;
	}

	switch (attribute.ts.kind) {
		case "string":
			schema.type = "string";
			break;
		case "number":
			schema.type = "number";
			break;
		case "boolean":
			schema.type = "boolean";
			break;
		case "array":
			schema.type = "array";
			if (attribute.ts.items) {
				schema.items = manifestAttributeToJsonSchema(attribute.ts.items);
			}
			break;
		case "object": {
			schema.type = "object";
			schema.additionalProperties = false;
			const properties = attribute.ts.properties ?? {};
			schema.properties = Object.fromEntries(
				Object.entries(properties).map(([key, value]) => [
					key,
					manifestAttributeToJsonSchema(value),
				]),
			);
			const required = Object.entries(properties)
				.filter(([, value]) => value.ts.required !== false)
				.map(([key]) => key);
			if (required.length > 0) {
				schema.required = required;
			}
			break;
		}
		case "union":
			if (attribute.ts.union) {
				return manifestUnionToJsonSchema(attribute.ts.union);
			}
			schema.oneOf = [];
			break;
		default:
			schema.type = attribute.wp.type ?? "string";
			break;
	}

	applyCommonConstraints(schema, attribute.typia.constraints);
	return schema;
}

export function manifestToJsonSchema(doc: ManifestDocument): JsonSchemaObject {
	const attributes = doc.attributes ?? {};
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		additionalProperties: false,
		properties: Object.fromEntries(
			Object.entries(attributes).map(([key, value]) => [
				key,
				manifestAttributeToJsonSchema(value),
			]),
		),
		required: Object.entries(attributes)
			.filter(([, value]) => value.ts.required !== false)
			.map(([key]) => key),
		title: doc.sourceType ?? "TypiaDocument",
		type: "object",
	};
}

export function manifestToOpenApi(
	doc: ManifestDocument,
	info: OpenApiInfo = {},
): JsonSchemaObject {
	const schemaName = doc.sourceType ?? "TypiaDocument";
	return {
		components: {
			schemas: {
				[schemaName]: manifestToJsonSchema(doc),
			},
		},
		info: {
			title: info.title ?? schemaName,
			version: info.version ?? "1.0.0",
			...(info.description ? { description: info.description } : {}),
		},
		openapi: "3.1.0",
		paths: {},
	};
}
