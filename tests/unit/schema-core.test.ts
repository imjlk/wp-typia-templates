import { describe, expect, test } from "bun:test";

import {
	buildEndpointOpenApiDocument,
	manifestAttributeToJsonSchema,
	manifestToJsonSchema,
	manifestToOpenApi,
} from "../../packages/create/src/runtime/schema-core";
import type { ManifestAttribute, ManifestDocument } from "../../packages/create/src/runtime/editor";

interface AttributeOverride {
	typia?: Partial<ManifestAttribute["typia"]>;
	ts?: Partial<ManifestAttribute["ts"]>;
	wp?: Partial<ManifestAttribute["wp"]>;
}

function createAttribute(overrides: AttributeOverride): ManifestAttribute {
	return {
		typia: {
			constraints: {
				exclusiveMaximum: null,
				exclusiveMinimum: null,
				format: null,
				maxLength: null,
				maxItems: null,
				maximum: null,
				minLength: null,
				minItems: null,
				minimum: null,
				multipleOf: null,
				pattern: null,
				typeTag: null,
			},
			defaultValue: null,
			hasDefault: false,
			...(overrides.typia ?? {}),
		},
		ts: {
			items: null,
			kind: "string",
			properties: null,
			required: false,
			union: null,
			...(overrides.ts ?? {}),
		},
		wp: {
			defaultValue: null,
			enum: null,
			hasDefault: false,
			type: "string",
			...(overrides.wp ?? {}),
		},
	};
}

describe("schema-core", () => {
	test("manifestAttributeToJsonSchema preserves unions with discriminators", () => {
		const attribute = createAttribute({
			ts: {
				kind: "union",
				union: {
					branches: {
						post: createAttribute({
							ts: {
								kind: "object",
								properties: {
									postId: createAttribute({
										ts: { kind: "number", required: true },
										typia: {
											constraints: {
												exclusiveMaximum: null,
												exclusiveMinimum: null,
												format: null,
												maxLength: null,
												maxItems: null,
												maximum: null,
												minLength: null,
												minItems: null,
												minimum: 1,
												multipleOf: null,
												pattern: null,
												typeTag: "uint32",
											},
										},
										wp: { type: "number" },
									}),
								},
								required: true,
							},
							wp: { type: "object" },
						}),
						url: createAttribute({
							ts: {
								kind: "object",
								properties: {
									href: createAttribute({
										ts: { kind: "string", required: true },
										typia: {
											constraints: {
												exclusiveMaximum: null,
												exclusiveMinimum: null,
												format: "uri",
												maxLength: null,
												maxItems: null,
												maximum: null,
												minLength: 1,
												minItems: null,
												minimum: null,
												multipleOf: null,
												pattern: null,
												typeTag: null,
											},
										},
										wp: { type: "string" },
									}),
								},
								required: true,
							},
							wp: { type: "object" },
						}),
					},
					discriminator: "kind",
				},
			},
			wp: { type: "object" },
		});

		const schema = manifestAttributeToJsonSchema(attribute);

		expect(schema.discriminator).toEqual({ propertyName: "kind" });
		expect(Array.isArray(schema.oneOf)).toBe(true);
		expect((schema.oneOf as unknown[]).length).toBe(2);
	});

	test("manifestToJsonSchema derives JSON Schema from manifest attributes", () => {
		const manifest: ManifestDocument = {
			attributes: {
				count: createAttribute({
					ts: { kind: "number", required: true },
					typia: {
						constraints: {
							exclusiveMaximum: null,
							exclusiveMinimum: null,
							format: null,
							maxLength: null,
							maxItems: null,
							maximum: 10,
							minLength: null,
							minItems: null,
							minimum: 0,
							multipleOf: 1,
							pattern: null,
							typeTag: "uint32",
						},
						defaultValue: 0,
						hasDefault: true,
					},
					wp: {
						defaultValue: 0,
						enum: null,
						hasDefault: true,
						type: "number",
					},
				}),
				status: createAttribute({
					ts: { kind: "string", required: false },
					typia: {
						defaultValue: "idle",
						hasDefault: true,
					},
					wp: {
						defaultValue: "idle",
						enum: ["idle", "loading", "done"],
						hasDefault: true,
						type: "string",
					},
				}),
			},
			manifestVersion: 2,
			sourceType: "CounterDocument",
		};

		const schema = manifestToJsonSchema(manifest);
		const properties = schema.properties as Record<string, Record<string, unknown>>;

		expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
		expect(schema.title).toBe("CounterDocument");
		expect(schema.required).toEqual(["count"]);
		expect(properties.count.type).toBe("number");
		expect(properties.count.minimum).toBe(0);
		expect(properties.count.multipleOf).toBe(1);
		expect(properties.status.enum).toEqual(["idle", "loading", "done"]);
		expect(properties.status.default).toBe("idle");
	});

	test("manifestToOpenApi wraps the derived schema in an OpenAPI document", () => {
		const manifest: ManifestDocument = {
			attributes: {},
			manifestVersion: 2,
			sourceType: "EmptyDocument",
		};

		const openApi = manifestToOpenApi(manifest, {
			description: "Demo schema export",
			title: "Demo API",
			version: "2.0.0",
		});

		const components = openApi.components as Record<string, Record<string, unknown>>;
		const schemas = components.schemas as Record<string, unknown>;

		expect(openApi.openapi).toBe("3.1.0");
		expect(openApi.info).toEqual({
			description: "Demo schema export",
			title: "Demo API",
			version: "2.0.0",
		});
		expect(schemas.EmptyDocument).toBeDefined();
	});

	test("buildEndpointOpenApiDocument composes GET query and POST body operations", () => {
		const queryDocument: ManifestDocument = {
			attributes: {
				postId: createAttribute({
					ts: { kind: "number", required: true },
					typia: {
						constraints: {
							exclusiveMaximum: null,
							exclusiveMinimum: null,
							format: null,
							maxLength: null,
							maxItems: null,
							maximum: null,
							minLength: null,
							minItems: null,
							minimum: 1,
							multipleOf: 1,
							pattern: null,
							typeTag: "uint32",
						},
					},
					wp: { type: "number" },
				}),
			},
			manifestVersion: 2,
			sourceType: "CounterQuery",
		};
		const requestDocument: ManifestDocument = {
			attributes: {
				postId: createAttribute({
					ts: { kind: "number", required: true },
					wp: { type: "number" },
				}),
				publicWriteToken: createAttribute({
					ts: { kind: "string", required: false },
					typia: {
						constraints: {
							exclusiveMaximum: null,
							exclusiveMinimum: null,
							format: null,
							maxLength: 512,
							maxItems: null,
							maximum: null,
							minLength: 1,
							minItems: null,
							minimum: null,
							multipleOf: null,
							pattern: null,
							typeTag: null,
						},
					},
					wp: { type: "string" },
				}),
			},
			manifestVersion: 2,
			sourceType: "WriteCounterRequest",
		};
		const responseDocument: ManifestDocument = {
			attributes: {
				count: createAttribute({
					ts: { kind: "number", required: true },
					wp: { type: "number" },
				}),
			},
			manifestVersion: 2,
			sourceType: "CounterResponse",
		};

		const openApi = buildEndpointOpenApiDocument({
			contracts: {
				query: { document: queryDocument },
				request: { document: requestDocument },
				response: { document: responseDocument },
			},
			endpoints: [
				{
					authMode: "public-read",
					method: "GET",
					operationId: "getCounterState",
					path: "/demo/v1/counter/state",
					queryContract: "query",
					responseContract: "response",
					tags: ["Counter"],
				},
				{
					authMode: "public-signed-token",
					bodyContract: "request",
					method: "POST",
					operationId: "writeCounterState",
					path: "/demo/v1/counter/state",
					responseContract: "response",
					tags: ["Counter"],
				},
			],
			info: {
				title: "Counter REST API",
			},
		});

		const components = openApi.components as Record<string, Record<string, unknown>>;
		const schemas = components.schemas as Record<string, unknown>;
		const paths = openApi.paths as Record<string, Record<string, Record<string, unknown>>>;
		const getOperation = paths["/demo/v1/counter/state"].get;
		const postOperation = paths["/demo/v1/counter/state"].post;

		expect(schemas.CounterQuery).toBeDefined();
		expect(schemas.WriteCounterRequest).toBeDefined();
		expect(schemas.CounterResponse).toBeDefined();
		expect(openApi.info).toEqual({
			title: "Counter REST API",
			version: "1.0.0",
		});
		expect(openApi.tags).toEqual([{ name: "Counter" }]);
		expect(paths["/demo/v1/counter/state"]).toBeDefined();
		expect(getOperation["x-wp-typia-authPolicy"]).toBe("public-read");
		expect((getOperation.parameters as Array<Record<string, unknown>>)[0]).toMatchObject({
			in: "query",
			name: "postId",
			required: true,
		});
		expect(postOperation["x-wp-typia-authPolicy"]).toBe("public-signed-token");
		expect(postOperation["x-wp-typia-publicTokenField"]).toBe("publicWriteToken");
		expect(
			(
				(
					(postOperation.requestBody as Record<string, Record<string, Record<string, Record<string, string>>>>)
						.content["application/json"].schema
				) as Record<string, string>
			).$ref,
		).toBe("#/components/schemas/WriteCounterRequest");
	});

	test("buildEndpointOpenApiDocument adds wpRestNonce security metadata for authenticated writes", () => {
		const responseDocument: ManifestDocument = {
			attributes: {},
			manifestVersion: 2,
			sourceType: "LikeStatusResponse",
		};
		const requestDocument: ManifestDocument = {
			attributes: {
				postId: createAttribute({
					ts: { kind: "number", required: true },
					wp: { type: "number" },
				}),
			},
			manifestVersion: 2,
			sourceType: "ToggleLikeRequest",
		};

		const openApi = buildEndpointOpenApiDocument({
			contracts: {
				request: { document: requestDocument },
				response: { document: responseDocument },
			},
			endpoints: [
				{
					authMode: "authenticated-rest-nonce",
					bodyContract: "request",
					method: "POST",
					operationId: "toggleLikeStatus",
					path: "/demo/v1/likes",
					responseContract: "response",
					tags: ["Likes"],
				},
			],
		});

		const components = openApi.components as Record<string, Record<string, unknown>>;
		const securitySchemes = components.securitySchemes as Record<string, Record<string, unknown>>;
		const paths = openApi.paths as Record<string, Record<string, Record<string, unknown>>>;
		const operation = paths["/demo/v1/likes"].post;

		expect(securitySchemes.wpRestNonce).toMatchObject({
			in: "header",
			name: "X-WP-Nonce",
			type: "apiKey",
		});
		expect(operation["x-wp-typia-authPolicy"]).toBe("authenticated-rest-nonce");
		expect(operation.security).toEqual([{ wpRestNonce: [] }]);
	});

	test("buildEndpointOpenApiDocument includes endpoint context in missing response contract errors", () => {
		expect(() =>
			buildEndpointOpenApiDocument({
				contracts: {},
				endpoints: [
					{
						authMode: "public-read",
						method: "GET",
						operationId: "getCounterState",
						path: "/demo/v1/counter/state",
						queryContract: "query",
						responseContract: "response",
						tags: ["Counter"],
					},
				],
			}),
		).toThrow(
			'Missing response contract "response" while building endpoint "getCounterState (GET /demo/v1/counter/state)"',
		);
	});

	test("buildEndpointOpenApiDocument includes endpoint context in missing request body contract errors", () => {
		const responseDocument: ManifestDocument = {
			attributes: {},
			manifestVersion: 2,
			sourceType: "CounterResponse",
		};

		expect(() =>
			buildEndpointOpenApiDocument({
				contracts: {
					response: { document: responseDocument },
				},
				endpoints: [
					{
						authMode: "public-signed-token",
						bodyContract: "request",
						method: "POST",
						operationId: "writeCounterState",
						path: "/demo/v1/counter/state",
						responseContract: "response",
						tags: ["Counter"],
					},
				],
			}),
		).toThrow(
			'Missing request body contract "request" while building endpoint "writeCounterState (POST /demo/v1/counter/state)"',
		);
	});

	test("buildEndpointOpenApiDocument includes endpoint context in missing query-only contract errors", () => {
		const responseDocument: ManifestDocument = {
			attributes: {},
			manifestVersion: 2,
			sourceType: "CounterResponse",
		};

		expect(() =>
			buildEndpointOpenApiDocument({
				contracts: {
					response: { document: responseDocument },
				},
				endpoints: [
					{
						authMode: "public-read",
						method: "GET",
						operationId: "getCounterState",
						path: "/demo/v1/counter/state",
						queryContract: "query",
						responseContract: "response",
						tags: ["Counter"],
					},
				],
			}),
		).toThrow(
			'Missing query contract "query" while building endpoint "getCounterState (GET /demo/v1/counter/state)"',
		);
	});
});
