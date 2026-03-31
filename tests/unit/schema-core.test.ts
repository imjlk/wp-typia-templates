import { describe, expect, test } from "bun:test";

import {
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
});
