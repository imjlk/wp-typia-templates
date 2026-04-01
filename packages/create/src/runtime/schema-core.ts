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

/**
 * Authentication mode metadata for generated REST OpenAPI endpoints.
 */
export type EndpointOpenApiAuthMode =
	| "authenticated-rest-nonce"
	| "public-read"
	| "public-signed-token";

/**
 * Supported HTTP methods for generated REST OpenAPI endpoints.
 */
export type EndpointOpenApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

/**
 * Contract document used when composing an endpoint-aware OpenAPI file.
 */
export interface EndpointOpenApiContractDocument {
	/** Manifest-derived contract document for this schema component. */
	document: ManifestDocument;
	/** Optional component name override for the generated schema reference. */
	schemaName?: string;
}

/**
 * Route metadata for one REST endpoint in the aggregate OpenAPI document.
 */
export interface EndpointOpenApiEndpointDefinition {
	/** Authentication policy surfaced in OpenAPI metadata. */
	authMode: EndpointOpenApiAuthMode;
	/** Contract key for a JSON request body, when the endpoint accepts one. */
	bodyContract?: string;
	/** HTTP method exposed by the route. */
	method: EndpointOpenApiMethod;
	/** Stable OpenAPI operation id for this route. */
	operationId: string;
	/** Absolute REST path including namespace and version. */
	path: string;
	/** Contract key for query parameters, when the endpoint reads from the query string. */
	queryContract?: string;
	/** Contract key for the successful JSON response body. */
	responseContract: string;
	/** Optional short endpoint summary shown in generated docs. */
	summary?: string;
	/** OpenAPI tag names applied to this endpoint. */
	tags: string[];
}

/**
 * Options for building an aggregate endpoint-aware OpenAPI document.
 */
export interface EndpointOpenApiDocumentOptions {
	/** Named contract documents keyed by the endpoint registry identifiers. */
	contracts: Record<string, EndpointOpenApiContractDocument>;
	/** Route definitions that should appear in the generated OpenAPI file. */
	endpoints: EndpointOpenApiEndpointDefinition[];
	/** Optional document-level OpenAPI info metadata. */
	info?: OpenApiInfo;
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

function createOpenApiSchemaRef(schemaName: string): JsonSchemaObject {
	return {
		$ref: `#/components/schemas/${schemaName}`,
	};
}

function getContractSchemaName(
	contractKey: string,
	contract: EndpointOpenApiContractDocument | undefined,
): string {
	if (!contract) {
		throw new Error(`Missing OpenAPI contract definition for "${contractKey}"`);
	}

	return contract.schemaName ?? contract.document.sourceType ?? contractKey;
}

function buildQueryParameters(contract: EndpointOpenApiContractDocument): JsonSchemaObject[] {
	const attributes = contract.document.attributes ?? {};

	return Object.entries(attributes).map(([name, attribute]) => ({
		in: "query",
		name,
		required: attribute.ts.required !== false,
		schema: manifestAttributeToJsonSchema(attribute),
	}));
}

function buildEndpointOpenApiOperation(
	endpoint: EndpointOpenApiEndpointDefinition,
	contracts: Record<string, EndpointOpenApiContractDocument>,
): JsonSchemaObject {
	const operation: JsonSchemaObject = {
		operationId: endpoint.operationId,
		responses: {
			"200": {
				content: {
					"application/json": {
						schema: createOpenApiSchemaRef(
							getContractSchemaName(endpoint.responseContract, contracts[endpoint.responseContract]),
						),
					},
				},
				description: "Successful response",
			},
		},
		tags: endpoint.tags,
		"x-wp-typia-authPolicy": endpoint.authMode,
	};

	if (typeof endpoint.summary === "string" && endpoint.summary.length > 0) {
		operation.summary = endpoint.summary;
	}

	if (typeof endpoint.queryContract === "string") {
		operation.parameters = buildQueryParameters(
			contracts[endpoint.queryContract] ??
				(() => {
					throw new Error(`Missing query contract "${endpoint.queryContract}"`);
				})(),
		);
	}

	if (typeof endpoint.bodyContract === "string") {
		operation.requestBody = {
			content: {
				"application/json": {
					schema: createOpenApiSchemaRef(
						getContractSchemaName(endpoint.bodyContract, contracts[endpoint.bodyContract]),
					),
				},
			},
			required: true,
		};
	}

	if (endpoint.authMode === "authenticated-rest-nonce") {
		operation.security = [
			{
				wpRestNonce: [],
			},
		];
	} else if (endpoint.authMode === "public-signed-token") {
		operation["x-wp-typia-publicTokenField"] = "publicWriteToken";
	}

	return operation;
}

/**
 * Build a complete OpenAPI 3.1 document from contract manifests and route metadata.
 *
 * @param options Aggregate contract and endpoint definitions for the REST surface.
 * @returns A JSON-compatible OpenAPI document with paths, components, and auth metadata.
 */
export function buildEndpointOpenApiDocument(
	options: EndpointOpenApiDocumentOptions,
): JsonSchemaObject {
	const contractEntries = Object.entries(options.contracts);
	const schemas = Object.fromEntries(
		contractEntries.map(([contractKey, contract]) => [
			getContractSchemaName(contractKey, contract),
			manifestToJsonSchema(contract.document),
		]),
	);
	const paths: Record<string, JsonSchemaObject> = {};
	const topLevelTags = [...new Set(options.endpoints.flatMap((endpoint) => endpoint.tags))]
		.filter((tag) => typeof tag === "string" && tag.length > 0)
		.map((name) => ({ name }));
	const usesWpRestNonce = options.endpoints.some(
		(endpoint) => endpoint.authMode === "authenticated-rest-nonce",
	);

	for (const endpoint of options.endpoints) {
		const pathItem = paths[endpoint.path] ?? {};
		pathItem[endpoint.method.toLowerCase()] = buildEndpointOpenApiOperation(
			endpoint,
			options.contracts,
		);
		paths[endpoint.path] = pathItem;
	}

	return {
		components: {
			schemas,
			...(usesWpRestNonce
				? {
						securitySchemes: {
							wpRestNonce: {
								description: "WordPress REST nonce sent in the X-WP-Nonce header.",
								in: "header",
								name: "X-WP-Nonce",
								type: "apiKey",
							},
						},
				  }
				: {}),
		},
		info: {
			title: options.info?.title ?? "Typia REST API",
			version: options.info?.version ?? "1.0.0",
			...(options.info?.description ? { description: options.info.description } : {}),
		},
		openapi: "3.1.0",
		paths,
		...(topLevelTags.length > 0 ? { tags: topLevelTags } : {}),
	};
}
