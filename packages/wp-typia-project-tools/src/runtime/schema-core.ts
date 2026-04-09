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

/**
 * Full JSON Schema document for a manifest-derived root object.
 */
export interface JsonSchemaDocument extends JsonSchemaObject {
	$schema: string;
	additionalProperties: boolean;
	properties: Record<string, JsonSchemaObject>;
	required: string[];
	title: string;
	type: "object";
}

/**
 * Document-level metadata applied to generated OpenAPI files.
 */
export interface OpenApiInfo {
	description?: string;
	title?: string;
	version?: string;
}

/**
 * JSON Schema reference used inside generated OpenAPI documents.
 */
export interface OpenApiSchemaReference extends JsonSchemaObject {
	$ref: string;
}

/**
 * OpenAPI query parameter emitted from a manifest attribute.
 */
export interface OpenApiParameter extends JsonSchemaObject {
	in: "query";
	name: string;
	required: boolean;
	schema: JsonSchemaObject;
}

/**
 * OpenAPI media type wrapper for JSON responses and request bodies.
 */
export interface OpenApiMediaType extends JsonSchemaObject {
	schema: OpenApiSchemaReference;
}

/**
 * OpenAPI request body definition for generated JSON endpoints.
 */
export interface OpenApiRequestBody extends JsonSchemaObject {
	content: {
		"application/json": OpenApiMediaType;
	};
	required: true;
}

/**
 * Successful JSON response entry in the generated OpenAPI document.
 */
export interface OpenApiResponse extends JsonSchemaObject {
	content: {
		"application/json": OpenApiMediaType;
	};
	description: string;
	headers?: Record<string, JsonSchemaObject>;
}

/**
 * Header-based security scheme used by authenticated WordPress REST routes.
 */
export interface OpenApiSecurityScheme extends JsonSchemaObject {
	description?: string;
	in: "header";
	name: string;
	type: "apiKey";
}

/**
 * One generated OpenAPI operation for a scaffolded REST endpoint.
 */
export interface OpenApiOperation extends JsonSchemaObject {
	operationId: string;
	parameters?: OpenApiParameter[];
	requestBody?: OpenApiRequestBody;
	responses: Record<string, OpenApiResponse>;
	security?: Array<Record<string, string[]>>;
	summary?: string;
	tags: string[];
	"x-typia-authIntent": EndpointAuthIntent;
	"x-wp-typia-authPolicy"?: EndpointOpenApiAuthMode;
	"x-wp-typia-publicTokenField"?: string;
}

/**
 * Path item containing one or more generated REST operations.
 */
export type OpenApiPathItem = JsonSchemaObject &
	Partial<Record<Lowercase<EndpointOpenApiMethod>, OpenApiOperation>>;

/**
 * Named tag entry surfaced at the top level of generated OpenAPI docs.
 */
export interface OpenApiTag extends JsonSchemaObject {
	name: string;
}

/**
 * OpenAPI component registry for generated schemas and security schemes.
 */
export interface OpenApiComponents extends JsonSchemaObject {
	schemas: Record<string, JsonSchemaDocument>;
	securitySchemes?: Record<string, OpenApiSecurityScheme>;
}

/**
 * Complete OpenAPI 3.1 document emitted for endpoint-aware REST contracts.
 */
export interface OpenApiDocument extends JsonSchemaObject {
	components: OpenApiComponents;
	info: {
		description?: string;
		title: string;
		version: string;
	};
	openapi: "3.1.0";
	paths: Record<string, OpenApiPathItem>;
	tags?: OpenApiTag[];
}

/**
 * Backend-neutral auth intent for one manifest-defined endpoint.
 */
export type EndpointAuthIntent =
	| "authenticated"
	| "public"
	| "public-write-protected";

/**
 * WordPress-specific authentication mechanisms that can implement neutral auth intent.
 */
export type EndpointWordPressAuthMechanism =
	| "public-signed-token"
	| "rest-nonce";

/**
 * Optional WordPress adapter metadata that explains how the default runtime satisfies auth intent.
 */
export interface EndpointWordPressAuthDefinition {
	mechanism: EndpointWordPressAuthMechanism;
	publicTokenField?: string;
}

/**
 * Legacy WordPress auth-mode literals kept for backward compatibility.
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

interface EndpointOpenApiEndpointBaseDefinition {
	/** Authentication policy surfaced in OpenAPI metadata. */
	auth?: EndpointAuthIntent;
	/** @deprecated Prefer `auth` plus `wordpressAuth` for new manifests. */
	authMode?: EndpointOpenApiAuthMode;
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
	tags: readonly string[];
	/** Optional WordPress adapter metadata for the default runtime. */
	wordpressAuth?: EndpointWordPressAuthDefinition;
}

/**
 * Route metadata for one REST endpoint in the aggregate OpenAPI document.
 */
export type EndpointOpenApiEndpointDefinition =
	| (EndpointOpenApiEndpointBaseDefinition & {
			auth: EndpointAuthIntent;
	  })
	| (EndpointOpenApiEndpointBaseDefinition & {
			/** @deprecated Prefer `auth` plus `wordpressAuth` for new manifests. */
			authMode: EndpointOpenApiAuthMode;
	  });

export interface NormalizedEndpointAuthDefinition {
	auth: EndpointAuthIntent;
	authMode?: EndpointOpenApiAuthMode;
	wordpressAuth?: EndpointWordPressAuthDefinition;
}

/**
 * Options for building an aggregate endpoint-aware OpenAPI document.
 */
export interface EndpointOpenApiDocumentOptions {
	/** Named contract documents keyed by the endpoint registry identifiers. */
	contracts: Readonly<Record<string, EndpointOpenApiContractDocument>>;
	/** Route definitions that should appear in the generated OpenAPI file. */
	endpoints: readonly EndpointOpenApiEndpointDefinition[];
	/** Optional document-level OpenAPI info metadata. */
	info?: OpenApiInfo;
}

/**
 * Supported schema projection profiles derived from one canonical wp-typia JSON Schema document.
 */
export type JsonSchemaProjectionProfile = "ai-structured-output" | "rest";

/**
 * Options for projecting one generated JSON Schema document into another consumer-facing profile.
 */
export interface JsonSchemaProjectionOptions {
	/** Projection profile that controls schema transformation rules. */
	profile: JsonSchemaProjectionProfile;
}

const WP_TYPIA_OPENAPI_EXTENSION_KEYS = {
	AUTH_INTENT: "x-typia-authIntent",
	AUTH_POLICY: "x-wp-typia-authPolicy",
	PUBLIC_TOKEN_FIELD: "x-wp-typia-publicTokenField",
	TYPE_TAG: "x-typeTag",
} as const;

const WP_TYPIA_OPENAPI_LITERALS = {
	JSON_CONTENT_TYPE: "application/json",
	PUBLIC_WRITE_TOKEN_FIELD: "publicWriteToken",
	QUERY_LOCATION: "query" as const,
	SUCCESS_RESPONSE_DESCRIPTION: "Successful response",
	WORDPRESS_PUBLIC_TOKEN_MECHANISM: "public-signed-token" as const,
	WORDPRESS_REST_NONCE_MECHANISM: "rest-nonce" as const,
	WP_REST_NONCE_HEADER: "X-WP-Nonce",
	WP_REST_NONCE_SCHEME: "wpRestNonce",
} as const;

const WP_TYPIA_SCHEMA_UINT32_MAX = 4_294_967_295;
const WP_TYPIA_SCHEMA_INT32_MAX = 2_147_483_647;
const WP_TYPIA_SCHEMA_INT32_MIN = -2_147_483_648;

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
	applyConstraintIfString(
		schema,
		WP_TYPIA_OPENAPI_EXTENSION_KEYS.TYPE_TAG,
		constraints.typeTag,
	);

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

function createUnionDiscriminatorProperty(branchKey: string): JsonSchemaObject {
	return {
		const: branchKey,
		enum: [branchKey],
		type: "string",
	};
}

function addDiscriminatorToObjectBranch(
	schema: JsonSchemaObject,
	discriminator: string,
	branchKey: string,
): JsonSchemaObject | null {
	if (
		typeof schema.properties !== "object" ||
		schema.properties === null ||
		Array.isArray(schema.properties)
	) {
		return null;
	}

	const properties = schema.properties as Record<string, JsonSchemaObject>;
	properties[discriminator] = createUnionDiscriminatorProperty(branchKey);
	const required = Array.isArray(schema.required)
		? [...new Set([...(schema.required as string[]), discriminator])]
		: [discriminator];
	schema.required = required;
	return schema;
}

function isJsonSchemaObject(value: unknown): value is JsonSchemaObject {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneJsonSchemaNode<T extends JsonValue | JsonSchemaObject>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) =>
			isJsonSchemaObject(item) || Array.isArray(item)
				? cloneJsonSchemaNode(item as JsonValue | JsonSchemaObject)
				: item,
		) as T;
	}

	if (!isJsonSchemaObject(value)) {
		return value;
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, child]) => [
			key,
			child === undefined
				? undefined
				: isJsonSchemaObject(child) || Array.isArray(child)
					? cloneJsonSchemaNode(child as JsonValue | JsonSchemaObject)
					: child,
		]),
	) as T;
}

function isWpTypiaSchemaExtensionKey(key: string): boolean {
	return key.startsWith("x-wp-typia-");
}

function getProjectedNumericMultipleOf(
	schema: JsonSchemaObject,
	path: string,
	typeTag: string,
): number {
	const currentMultipleOf = schema.multipleOf;
	if (
		currentMultipleOf !== undefined &&
		(typeof currentMultipleOf !== "number" ||
			!Number.isFinite(currentMultipleOf) ||
			!Number.isInteger(currentMultipleOf) ||
			currentMultipleOf <= 0)
	) {
		throw new Error(
			`Unable to project unsupported ${typeTag} multipleOf at "${path}".`,
		);
	}

	return typeof currentMultipleOf === "number" ? currentMultipleOf : 1;
}

function applyProjectedUint32Constraints(
	schema: JsonSchemaObject,
	path: string,
): void {
	const currentMinimum = schema.minimum;
	if (typeof currentMinimum === "number" && Number.isFinite(currentMinimum)) {
		schema.minimum = Math.max(currentMinimum, 0);
	} else {
		schema.minimum = 0;
	}

	const currentMaximum = schema.maximum;
	if (typeof currentMaximum === "number" && Number.isFinite(currentMaximum)) {
		schema.maximum = Math.min(currentMaximum, WP_TYPIA_SCHEMA_UINT32_MAX);
	} else {
		schema.maximum = WP_TYPIA_SCHEMA_UINT32_MAX;
	}

	schema.multipleOf = getProjectedNumericMultipleOf(schema, path, "uint32");
	schema.type = "integer";
}

function applyProjectedInt32Constraints(
	schema: JsonSchemaObject,
	path: string,
): void {
	const currentMinimum = schema.minimum;
	if (typeof currentMinimum === "number" && Number.isFinite(currentMinimum)) {
		schema.minimum = Math.max(currentMinimum, WP_TYPIA_SCHEMA_INT32_MIN);
	} else {
		schema.minimum = WP_TYPIA_SCHEMA_INT32_MIN;
	}

	const currentMaximum = schema.maximum;
	if (typeof currentMaximum === "number" && Number.isFinite(currentMaximum)) {
		schema.maximum = Math.min(currentMaximum, WP_TYPIA_SCHEMA_INT32_MAX);
	} else {
		schema.maximum = WP_TYPIA_SCHEMA_INT32_MAX;
	}

	schema.multipleOf = getProjectedNumericMultipleOf(schema, path, "int32");
	schema.type = "integer";
}

function applyProjectedTypeTag(
	schema: JsonSchemaObject,
	typeTag: string,
	path: string,
): void {
	switch (typeTag) {
		case "uint32":
			applyProjectedUint32Constraints(schema, path);
			break;
		case "int32":
			applyProjectedInt32Constraints(schema, path);
			break;
		case "float":
		case "double":
			schema.type = "number";
			break;
		default:
			throw new Error(
				`Unsupported wp-typia schema type tag "${typeTag}" at "${path}".`,
			);
	}
}

function projectSchemaArrayItemsForAiStructuredOutput(
	items: JsonSchemaObject[],
	path: string,
): JsonSchemaObject[] {
	return items.map((item, index) =>
		projectSchemaObjectForAiStructuredOutput(item, `${path}/${index}`),
	);
}

function projectSchemaArrayItemsForRest(
	items: JsonSchemaObject[],
	path: string,
): JsonSchemaObject[] {
	return items.map((item, index) =>
		projectSchemaObjectForRest(item, `${path}/${index}`),
	);
}

function projectSchemaPropertyMapForAiStructuredOutput(
	properties: Record<string, JsonSchemaObject>,
	path: string,
): Record<string, JsonSchemaObject> {
	return Object.fromEntries(
		Object.entries(properties).map(([key, value]) => [
			key,
			projectSchemaObjectForAiStructuredOutput(value, `${path}/${key}`),
		]),
	);
}

function projectSchemaPropertyMapForRest(
	properties: Record<string, JsonSchemaObject>,
	path: string,
): Record<string, JsonSchemaObject> {
	return Object.fromEntries(
		Object.entries(properties).map(([key, value]) => [
			key,
			projectSchemaObjectForRest(value, `${path}/${key}`),
		]),
	);
}

function projectSchemaObjectForAiStructuredOutput(
	node: JsonSchemaObject,
	path: string,
): JsonSchemaObject {
	const projectedNode = cloneJsonSchemaNode(node);
	const rawTypeTag = projectedNode[WP_TYPIA_OPENAPI_EXTENSION_KEYS.TYPE_TAG];

	if (typeof rawTypeTag === "string") {
		applyProjectedTypeTag(projectedNode, rawTypeTag, path);
	}

	delete projectedNode[WP_TYPIA_OPENAPI_EXTENSION_KEYS.TYPE_TAG];

	for (const key of Object.keys(projectedNode)) {
		if (isWpTypiaSchemaExtensionKey(key)) {
			delete projectedNode[key];
			continue;
		}

		const child = projectedNode[key];
		if (Array.isArray(child)) {
			projectedNode[key] = child.every(isJsonSchemaObject)
				? projectSchemaArrayItemsForAiStructuredOutput(
						child as JsonSchemaObject[],
						`${path}/${key}`,
					)
				: child;
			continue;
		}

		if (!isJsonSchemaObject(child)) {
			continue;
		}

		if (key === "properties") {
			projectedNode[key] = projectSchemaPropertyMapForAiStructuredOutput(
				child as Record<string, JsonSchemaObject>,
				`${path}/${key}`,
			);
			continue;
		}

		projectedNode[key] = projectSchemaObjectForAiStructuredOutput(
			child,
			`${path}/${key}`,
		);
	}

	return projectedNode;
}

function projectSchemaObjectForRest(
	node: JsonSchemaObject,
	path: string,
): JsonSchemaObject {
	const projectedNode = cloneJsonSchemaNode(node);
	const rawTypeTag = projectedNode[WP_TYPIA_OPENAPI_EXTENSION_KEYS.TYPE_TAG];

	if (typeof rawTypeTag === "string") {
		applyProjectedTypeTag(projectedNode, rawTypeTag, path);
	}

	for (const key of Object.keys(projectedNode)) {
		const child = projectedNode[key];
		if (Array.isArray(child)) {
			projectedNode[key] = child.every(isJsonSchemaObject)
				? projectSchemaArrayItemsForRest(
						child as JsonSchemaObject[],
						`${path}/${key}`,
					)
				: child;
			continue;
		}

		if (!isJsonSchemaObject(child)) {
			continue;
		}

		if (key === "properties") {
			projectedNode[key] = projectSchemaPropertyMapForRest(
				child as Record<string, JsonSchemaObject>,
				`${path}/${key}`,
			);
			continue;
		}

		projectedNode[key] = projectSchemaObjectForRest(child, `${path}/${key}`);
	}

	applyProjectedBootstrapContract(projectedNode);

	return projectedNode;
}

function applyProjectedBootstrapContract(schema: JsonSchemaObject): void {
	if (schema.type !== "object" || !isJsonSchemaObject(schema.properties)) {
		return;
	}

	const properties = schema.properties as Record<string, JsonSchemaObject>;
	if (properties.canWrite?.type !== "boolean") {
		return;
	}

	const allOf = Array.isArray(schema.allOf)
		? [...(schema.allOf as JsonSchemaObject[])]
		: [];
	const canWriteIsTrue: JsonSchemaObject = {
		properties: {
			canWrite: {
				const: true,
			},
		},
		required: ["canWrite"],
	};

	if (properties.restNonce?.type === "string") {
		allOf.push({
			if: canWriteIsTrue,
			then: {
				required: ["restNonce"],
			},
			else: {
				not: {
					required: ["restNonce"],
				},
			},
		});
	}

	if (
		properties.publicWriteToken?.type === "string" &&
		isJsonSchemaObject(properties.publicWriteExpiresAt)
	) {
		allOf.push({
			if: canWriteIsTrue,
			then: {
				required: ["publicWriteExpiresAt", "publicWriteToken"],
			},
			else: {
				not: {
					required: ["publicWriteToken"],
				},
			},
		});
	}

	if (allOf.length > 0) {
		schema.allOf = allOf;
	}
}

function manifestUnionToJsonSchema(union: ManifestUnionMetadata): JsonSchemaObject {
	const oneOf = Object.entries(union.branches).map(([branchKey, branch]) => {
		if (branch.ts.kind !== "object") {
			throw new Error(
				`Discriminated union branch "${branchKey}" must be an object to carry "${union.discriminator}".`,
			);
		}

		const schema = manifestAttributeToJsonSchema(branch);
		const objectSchema = addDiscriminatorToObjectBranch(
			schema,
			union.discriminator,
			branchKey,
		);
		if (!objectSchema) {
			throw new Error(
				`Discriminated union branch "${branchKey}" is missing an object schema for "${union.discriminator}".`,
			);
		}

		return objectSchema;
	});

	return {
		discriminator: {
			propertyName: union.discriminator,
		},
		oneOf,
	};
}

/**
 * Converts one manifest attribute definition into a JSON Schema fragment.
 *
 * @param attribute Manifest-derived attribute metadata.
 * @returns A JSON-compatible schema fragment for the attribute.
 */
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

/**
 * Builds a full JSON Schema document from a Typia manifest document.
 *
 * @param doc Manifest-derived attribute document.
 * @returns A draft 2020-12 JSON Schema document for the manifest root object.
 */
export function manifestToJsonSchema(doc: ManifestDocument): JsonSchemaDocument {
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

/**
 * Projects one generated wp-typia JSON Schema document into a consumer-facing profile.
 *
 * @param schema Existing generated JSON Schema document.
 * @param options Projection profile options.
 * @returns A cloned schema document adjusted for the requested profile.
 */
export function projectJsonSchemaDocument<
	Schema extends JsonSchemaDocument | JsonSchemaObject,
>(schema: Schema, options: JsonSchemaProjectionOptions): Schema {
	if (options.profile === "rest") {
		return projectSchemaObjectForRest(schema, "#") as Schema;
	}

	if (options.profile === "ai-structured-output") {
		return projectSchemaObjectForAiStructuredOutput(schema, "#") as Schema;
	}

	throw new Error(
		`Unsupported JSON Schema projection profile "${String(
			(options as { profile?: unknown }).profile,
		)}".`,
	);
}

/**
 * Wraps a manifest-derived JSON Schema document in a minimal OpenAPI 3.1 shell.
 *
 * @param doc Manifest-derived attribute document.
 * @param info Optional OpenAPI document metadata.
 * @returns An OpenAPI document containing the schema as a single component.
 */
export function manifestToOpenApi(
	doc: ManifestDocument,
	info: OpenApiInfo = {},
): OpenApiDocument {
	const schemaName = doc.sourceType ?? "TypiaDocument";
	const projectedSchema = projectJsonSchemaDocument(manifestToJsonSchema(doc), {
		profile: "rest",
	});
	delete (projectedSchema as { $schema?: string }).$schema;
	return {
		components: {
			schemas: {
				[schemaName]: projectedSchema,
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

function createOpenApiSchemaRef(schemaName: string): OpenApiSchemaReference {
	return {
		$ref: `#/components/schemas/${schemaName}`,
	};
}

function formatEndpointDescription(endpoint: EndpointOpenApiEndpointDefinition): string {
	return `${endpoint.operationId} (${endpoint.method} ${endpoint.path})`;
}

function normalizeWordPressAuthDefinition(
	wordpressAuth: EndpointWordPressAuthDefinition | undefined,
): EndpointWordPressAuthDefinition | undefined {
	if (!wordpressAuth) {
		return undefined;
	}

	if (
		wordpressAuth.mechanism !==
		WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_PUBLIC_TOKEN_MECHANISM
	) {
		return {
			mechanism: wordpressAuth.mechanism,
		};
	}

	return {
		mechanism: wordpressAuth.mechanism,
		publicTokenField:
			wordpressAuth.publicTokenField ??
			WP_TYPIA_OPENAPI_LITERALS.PUBLIC_WRITE_TOKEN_FIELD,
	};
}

function deriveLegacyAuthModeFromNormalizedAuth(
	auth: EndpointAuthIntent,
	wordpressAuth: EndpointWordPressAuthDefinition | undefined,
): EndpointOpenApiAuthMode | undefined {
	if (auth === "public") {
		return "public-read";
	}

	if (
		auth === "authenticated" &&
		wordpressAuth?.mechanism ===
			WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_REST_NONCE_MECHANISM
	) {
		return "authenticated-rest-nonce";
	}

	if (
		auth === "public-write-protected" &&
		wordpressAuth?.mechanism ===
			WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_PUBLIC_TOKEN_MECHANISM
	) {
		return "public-signed-token";
	}

	return undefined;
}

function compareNormalizedEndpointAuth(
	left: NormalizedEndpointAuthDefinition,
	right: NormalizedEndpointAuthDefinition,
): boolean {
	return (
		left.auth === right.auth &&
		left.authMode === right.authMode &&
		left.wordpressAuth?.mechanism === right.wordpressAuth?.mechanism &&
		left.wordpressAuth?.publicTokenField === right.wordpressAuth?.publicTokenField
	);
}

/**
 * Normalizes endpoint auth metadata into backend-neutral intent plus optional
 * WordPress adapter details.
 *
 * This public runtime helper accepts either the authored `auth` and optional
 * `wordpressAuth` shape or the deprecated `authMode` field. It validates that
 * the provided fields are compatible, resolves the legacy compatibility mode,
 * and returns a normalized definition without mutating the input endpoint.
 *
 * @param endpoint - Endpoint auth fields to normalize, including `auth`,
 * `authMode`, `wordpressAuth`, and optional identity fields used in error
 * messages (`operationId`, `path`, and `method`).
 * @returns The normalized auth definition for the endpoint.
 * @throws When `auth` and deprecated `authMode` conflict.
 * @throws When `wordpressAuth` is attached to the `public` auth intent.
 * @throws When the selected `wordpressAuth` mechanism is incompatible with the
 * chosen auth intent.
 * @throws When neither `auth` nor deprecated `authMode` is defined.
 */
export function normalizeEndpointAuthDefinition(
	endpoint: Pick<
		EndpointOpenApiEndpointDefinition,
		"auth" | "authMode" | "operationId" | "path" | "wordpressAuth" | "method"
	>,
): NormalizedEndpointAuthDefinition {
	const endpointDescription =
		typeof endpoint.operationId === "string" &&
		typeof endpoint.path === "string" &&
		typeof endpoint.method === "string"
			? formatEndpointDescription(endpoint as EndpointOpenApiEndpointDefinition)
			: "the current endpoint";
	const nextWordPressAuth = normalizeWordPressAuthDefinition(
		endpoint.wordpressAuth,
	);

	let normalized: NormalizedEndpointAuthDefinition | null = null;
	if (endpoint.auth) {
		normalized = {
			auth: endpoint.auth,
			authMode: deriveLegacyAuthModeFromNormalizedAuth(
				endpoint.auth,
				nextWordPressAuth,
			),
			...(nextWordPressAuth ? { wordpressAuth: nextWordPressAuth } : {}),
		};

		if (endpoint.auth === "public" && nextWordPressAuth) {
			throw new Error(
				`Endpoint "${endpointDescription}" cannot attach wordpressAuth when auth intent is "public".`,
			);
		}
		if (
			endpoint.auth === "authenticated" &&
			nextWordPressAuth?.mechanism ===
				WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_PUBLIC_TOKEN_MECHANISM
		) {
			throw new Error(
				`Endpoint "${endpointDescription}" uses auth intent "authenticated" but wordpressAuth mechanism "${nextWordPressAuth.mechanism}" only supports "public-write-protected".`,
			);
		}
		if (
			endpoint.auth === "public-write-protected" &&
			nextWordPressAuth?.mechanism ===
				WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_REST_NONCE_MECHANISM
		) {
			throw new Error(
				`Endpoint "${endpointDescription}" uses auth intent "public-write-protected" but wordpressAuth mechanism "${nextWordPressAuth.mechanism}" only supports "authenticated".`,
			);
		}
	}

	let legacyNormalized: NormalizedEndpointAuthDefinition | null = null;
	if (endpoint.authMode) {
		legacyNormalized =
			endpoint.authMode === "public-read"
				? {
						auth: "public",
						authMode: "public-read",
				  }
				: endpoint.authMode === "authenticated-rest-nonce"
					? {
							auth: "authenticated",
							authMode: "authenticated-rest-nonce",
							wordpressAuth: {
								mechanism:
									WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_REST_NONCE_MECHANISM,
							},
					  }
					: {
							auth: "public-write-protected",
							authMode: "public-signed-token",
							wordpressAuth: {
								mechanism:
									WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_PUBLIC_TOKEN_MECHANISM,
								publicTokenField:
									WP_TYPIA_OPENAPI_LITERALS.PUBLIC_WRITE_TOKEN_FIELD,
							},
					  };
	}

	if (normalized && legacyNormalized) {
		if (!compareNormalizedEndpointAuth(normalized, legacyNormalized)) {
			throw new Error(
				`Endpoint "${endpointDescription}" defines conflicting auth metadata between auth/wordpressAuth and deprecated authMode.`,
			);
		}

		return normalized;
	}

	if (normalized) {
		return normalized;
	}

	if (legacyNormalized) {
		return legacyNormalized;
	}

	throw new Error(
		`Endpoint "${endpointDescription}" must define either auth or deprecated authMode.`,
	);
}

function getContractSchemaName(
	contractKey: string,
	contract: EndpointOpenApiContractDocument | undefined,
	endpoint?: EndpointOpenApiEndpointDefinition,
	role = "contract",
): string {
	if (!contract) {
		if (endpoint) {
			throw new Error(
				`Missing ${role} contract "${contractKey}" while building endpoint "${formatEndpointDescription(endpoint)}"`,
			);
		}

		throw new Error(`Missing OpenAPI contract definition for "${contractKey}"`);
	}

	return contract.schemaName ?? contract.document.sourceType ?? contractKey;
}

function buildQueryParameters(contract: EndpointOpenApiContractDocument): OpenApiParameter[] {
	const attributes = contract.document.attributes ?? {};

	return Object.entries(attributes).map(([name, attribute]) => ({
		in: WP_TYPIA_OPENAPI_LITERALS.QUERY_LOCATION,
		name,
		required: attribute.ts.required !== false,
		schema: manifestAttributeToJsonSchema(attribute),
	}));
}

function createBootstrapResponseHeaders(
	normalizedAuth: NormalizedEndpointAuthDefinition,
): Record<string, JsonSchemaObject> {
	const headers: Record<string, JsonSchemaObject> = {
		"Cache-Control": {
			description:
				"Must be non-cacheable for fresh bootstrap write/session state.",
			schema: {
				type: "string",
				example: "private, no-store, no-cache, must-revalidate",
			},
		},
		Pragma: {
			description: "Legacy non-cacheable bootstrap response directive.",
			schema: {
				type: "string",
				example: "no-cache",
			},
		},
	};

	if (
		normalizedAuth.wordpressAuth?.mechanism ===
		WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_REST_NONCE_MECHANISM
	) {
		headers.Vary = {
			description:
				"Viewer-aware bootstrap responses should vary on cookie-backed auth state.",
			schema: {
				type: "string",
				example: "Cookie",
			},
		};
	}

	return headers;
}

function createSuccessResponse(
	schemaName: string,
	headers?: Record<string, JsonSchemaObject>,
): OpenApiResponse {
	return {
		content: {
			[WP_TYPIA_OPENAPI_LITERALS.JSON_CONTENT_TYPE]: {
				schema: createOpenApiSchemaRef(schemaName),
			},
		},
		description: WP_TYPIA_OPENAPI_LITERALS.SUCCESS_RESPONSE_DESCRIPTION,
		...(headers ? { headers } : {}),
	};
}

function buildEndpointOpenApiOperation(
	endpoint: EndpointOpenApiEndpointDefinition,
	contracts: Readonly<Record<string, EndpointOpenApiContractDocument>>,
): OpenApiOperation {
	const normalizedAuth = normalizeEndpointAuthDefinition(endpoint);
	const isBootstrapEndpoint = endpoint.path.endsWith("/bootstrap");
	const operation: OpenApiOperation = {
		operationId: endpoint.operationId,
		responses: {
			"200": createSuccessResponse(
				getContractSchemaName(
					endpoint.responseContract,
					contracts[endpoint.responseContract],
					endpoint,
					"response",
				),
				isBootstrapEndpoint
					? createBootstrapResponseHeaders(normalizedAuth)
					: undefined,
			),
		},
		tags: [ ...endpoint.tags ],
		[WP_TYPIA_OPENAPI_EXTENSION_KEYS.AUTH_INTENT]: normalizedAuth.auth,
		...(normalizedAuth.authMode
			? {
					[WP_TYPIA_OPENAPI_EXTENSION_KEYS.AUTH_POLICY]:
						normalizedAuth.authMode,
			  }
			: {}),
	};

	if (typeof endpoint.summary === "string" && endpoint.summary.length > 0) {
		operation.summary = endpoint.summary;
	}

	if (typeof endpoint.queryContract === "string") {
		operation.parameters = buildQueryParameters(
			contracts[endpoint.queryContract] ??
				(() => {
					throw new Error(
						`Missing query contract "${endpoint.queryContract}" while building endpoint "${formatEndpointDescription(endpoint)}"`,
					);
				})(),
		);
	}

	if (typeof endpoint.bodyContract === "string") {
		operation.requestBody = {
			content: {
				[WP_TYPIA_OPENAPI_LITERALS.JSON_CONTENT_TYPE]: {
					schema: createOpenApiSchemaRef(
						getContractSchemaName(
							endpoint.bodyContract,
							contracts[endpoint.bodyContract],
							endpoint,
							"request body",
						),
					),
				},
			},
			required: true,
		};
	}

	if (
		normalizedAuth.wordpressAuth?.mechanism ===
		WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_REST_NONCE_MECHANISM
	) {
		operation.security = [
			{
				[WP_TYPIA_OPENAPI_LITERALS.WP_REST_NONCE_SCHEME]: [],
			},
		];
	} else if (
		normalizedAuth.wordpressAuth?.mechanism ===
		WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_PUBLIC_TOKEN_MECHANISM
	) {
		operation[WP_TYPIA_OPENAPI_EXTENSION_KEYS.PUBLIC_TOKEN_FIELD] =
			normalizedAuth.wordpressAuth.publicTokenField ??
			WP_TYPIA_OPENAPI_LITERALS.PUBLIC_WRITE_TOKEN_FIELD;
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
): OpenApiDocument {
	const contractEntries = Object.entries(options.contracts);
	const schemas = Object.fromEntries(
		contractEntries.map(([contractKey, contract]) => {
			const projectedSchema = projectJsonSchemaDocument(
				manifestToJsonSchema(contract.document),
				{
					profile: "rest",
				},
			);
			delete (projectedSchema as { $schema?: string }).$schema;

			return [getContractSchemaName(contractKey, contract), projectedSchema];
		}),
	);
	const paths: Record<string, OpenApiPathItem> = {};
	const topLevelTags = [...new Set(options.endpoints.flatMap((endpoint) => endpoint.tags))]
		.filter((tag) => typeof tag === "string" && tag.length > 0)
		.map((name) => ({ name }));
	const usesWpRestNonce = options.endpoints.some(
		(endpoint) =>
			normalizeEndpointAuthDefinition(endpoint).wordpressAuth?.mechanism ===
			WP_TYPIA_OPENAPI_LITERALS.WORDPRESS_REST_NONCE_MECHANISM,
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
							[WP_TYPIA_OPENAPI_LITERALS.WP_REST_NONCE_SCHEME]: {
								description: "WordPress REST nonce sent in the X-WP-Nonce header.",
								in: "header",
								name: WP_TYPIA_OPENAPI_LITERALS.WP_REST_NONCE_HEADER,
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
