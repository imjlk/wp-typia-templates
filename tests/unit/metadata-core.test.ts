import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
	defineEndpointManifest,
	syncEndpointClient,
	syncRestOpenApi,
	type EndpointManifestDefinition,
	type SyncEndpointClientOptions,
	type SyncRestOpenApiContractsOptions,
	type SyncRestOpenApiManifestOptions,
	type SyncRestOpenApiOptions,
} from "../../packages/create/src/runtime/metadata-core";

const manifest = defineEndpointManifest({
	contracts: {
		query: { sourceTypeName: "CounterQuery" },
		request: { sourceTypeName: "WriteCounterRequest" },
		response: { sourceTypeName: "CounterResponse" },
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
			authMode: "authenticated-rest-nonce",
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
		version: "1.0.0",
	},
} as const);

const manifestOptions: SyncRestOpenApiManifestOptions = {
	manifest,
	openApiFile: "src/api.openapi.json",
	typesFile: "src/api-types.ts",
};
const clientOptions: SyncEndpointClientOptions = {
	clientFile: "src/api-client.ts",
	manifest,
	typesFile: "src/api-types.ts",
};

const compatibilityOptions: SyncRestOpenApiContractsOptions = {
	contracts: manifest.contracts,
	endpoints: manifest.endpoints,
	openApiFile: "src/api.openapi.json",
	openApiInfo: manifest.info,
	typesFile: "src/api-types.ts",
};

const manifestShape: EndpointManifestDefinition = manifest;
const syncOptions: SyncRestOpenApiOptions = manifestOptions;

void manifestShape;
void syncOptions;
void compatibilityOptions;
void clientOptions;

function createTempProject(): { root: string; typesFile: string } {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-metadata-core-"));
	const typesDir = path.join(root, "src");
	fs.mkdirSync(typesDir, { recursive: true });
	fs.writeFileSync(
		path.join(typesDir, "api-types.ts"),
		[
			"export interface CounterQuery {",
			"  postId: number;",
			"}",
			"",
			"export interface WriteCounterRequest {",
			"  postId: number;",
			"  publicWriteToken?: string;",
			"}",
			"",
			"export interface CounterResponse {",
			"  count: number;",
			"}",
			"",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(
		path.join(typesDir, "api-validators.ts"),
		[
			"import type { ValidationResult } from '@wp-typia/api-client';",
			"import type { CounterQuery, CounterResponse, WriteCounterRequest } from './api-types';",
			"",
			"function ok<T>(input: T): ValidationResult<T> {",
			"  return { data: input, errors: [], isValid: true };",
			"}",
			"",
			"export const apiValidators = {",
			"  query: (input: unknown): ValidationResult<CounterQuery> => ok(input as CounterQuery),",
			"  request: (input: unknown): ValidationResult<WriteCounterRequest> => ok(input as WriteCounterRequest),",
			"  response: (input: unknown): ValidationResult<CounterResponse> => ok(input as CounterResponse),",
			"};",
			"",
		].join("\n"),
		"utf8",
	);

	return {
		root,
		typesFile: "src/api-types.ts",
	};
}

describe("metadata-core endpoint manifests", () => {
	test("defineEndpointManifest preserves the manifest payload", () => {
		expect(manifest.contracts.query.sourceTypeName).toBe("CounterQuery");
		expect(manifest.endpoints[0]).toMatchObject({
			authMode: "public-read",
			method: "GET",
			operationId: "getCounterState",
			path: "/demo/v1/counter/state",
			queryContract: "query",
			responseContract: "response",
		});
		expect(manifest.info).toEqual({
			title: "Counter REST API",
			version: "1.0.0",
		});
	});

	test("syncRestOpenApi accepts manifest-first input and preserves the existing output shape", async () => {
		const project = createTempProject();

		try {
			const manifestResult = await syncRestOpenApi({
				manifest,
				openApiFile: "build/manifest.openapi.json",
				projectRoot: project.root,
				typesFile: project.typesFile,
			});
			const compatibilityResult = await syncRestOpenApi({
				contracts: manifest.contracts,
				endpoints: manifest.endpoints,
				openApiFile: "build/compat.openapi.json",
				openApiInfo: manifest.info,
				projectRoot: project.root,
				typesFile: project.typesFile,
			});

			const manifestOpenApi = JSON.parse(
				fs.readFileSync(path.join(project.root, "build", "manifest.openapi.json"), "utf8"),
			);
			const compatibilityOpenApi = JSON.parse(
				fs.readFileSync(path.join(project.root, "build", "compat.openapi.json"), "utf8"),
			);

			expect(manifestResult.schemaNames).toEqual([
				"CounterQuery",
				"WriteCounterRequest",
				"CounterResponse",
			]);
			expect(compatibilityResult.schemaNames).toEqual(manifestResult.schemaNames);
			expect(manifestOpenApi).toEqual(compatibilityOpenApi);
			expect(manifestOpenApi.paths["/demo/v1/counter/state"].get).toBeDefined();
			expect(manifestOpenApi.paths["/demo/v1/counter/state"].post).toBeDefined();
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
		}
	});

	test("syncEndpointClient emits a portable manifest-first client module", async () => {
		const project = createTempProject();

		try {
			const result = await syncEndpointClient({
				clientFile: "build/api-client.ts",
				manifest,
				projectRoot: project.root,
				typesFile: project.typesFile,
			});
			const generatedClient = fs.readFileSync(
				path.join(project.root, "build", "api-client.ts"),
				"utf8",
			);

			expect(result.endpointCount).toBe(2);
			expect(result.operationIds).toEqual([
				"getCounterState",
				"writeCounterState",
			]);
			expect(generatedClient).toContain("from '@wp-typia/api-client'");
			expect(generatedClient).toContain("import type {");
			expect(generatedClient).toContain("\tCounterQuery,");
			expect(generatedClient).toContain("\tCounterResponse,");
			expect(generatedClient).toContain("\tWriteCounterRequest,");
			expect(generatedClient).toContain("import { apiValidators } from '../src/api-validators'");
			expect(generatedClient).toContain("validateRequest: apiValidators.query");
			expect(generatedClient).toContain("validateRequest: apiValidators.request");
			expect(generatedClient).toContain("validateResponse: apiValidators.response");
			expect(generatedClient).toContain("export const getCounterStateEndpoint = createEndpoint<");
			expect(generatedClient).toContain("export function getCounterState(");
			expect(generatedClient).toContain("export function writeCounterState(");
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
		}
	});

	test("syncEndpointClient rejects unresolved manifest source type names before emitting the client", async () => {
		const project = createTempProject();
		const brokenManifest = defineEndpointManifest({
			contracts: {
				query: { sourceTypeName: "MissingQuery" },
				response: { sourceTypeName: "CounterResponse" },
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
		});

		try {
			await expect(
				syncEndpointClient({
					clientFile: "build/api-client.ts",
					manifest: brokenManifest,
					projectRoot: project.root,
					typesFile: project.typesFile,
				}),
			).rejects.toThrow(/MissingQuery/u);
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
		}
	});

	test("syncEndpointClient rejects nonstandard types filenames when validatorsFile cannot be inferred", async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-metadata-core-"));
		const typesDir = path.join(root, "src");
		fs.mkdirSync(typesDir, { recursive: true });
		fs.writeFileSync(
			path.join(typesDir, "contracts.ts"),
			"export interface CounterResponse { count: number; }\n",
			"utf8",
		);
		fs.writeFileSync(
			path.join(typesDir, "contracts.validators.ts"),
			"export const apiValidators = {};\n",
			"utf8",
		);

		try {
			await expect(
				syncEndpointClient({
					clientFile: "build/api-client.ts",
					manifest: defineEndpointManifest({
						contracts: {
							response: { sourceTypeName: "CounterResponse" },
						},
						endpoints: [
							{
								authMode: "public-read",
								method: "GET",
								operationId: "getCounterState",
								path: "/demo/v1/counter/state",
								responseContract: "response",
								tags: ["Counter"],
							},
						],
					}),
					projectRoot: root,
					typesFile: "src/contracts.ts",
				}),
			).rejects.toThrow(
				"syncEndpointClient() could not infer validatorsFile from typesFile; pass validatorsFile explicitly.",
			);
		} finally {
			fs.rmSync(root, { force: true, recursive: true });
		}
	});

	test("syncEndpointClient rejects colliding validator property names", async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-metadata-core-"));
		const typesDir = path.join(root, "src");
		fs.mkdirSync(typesDir, { recursive: true });
		fs.writeFileSync(
			path.join(typesDir, "api-types.ts"),
			[
				"export interface FirstQuery {",
				"  page: number;",
				"}",
				"",
				"export interface FirstResponse {",
				"  ok: boolean;",
				"}",
				"",
			].join("\n"),
			"utf8",
		);
		fs.writeFileSync(
			path.join(typesDir, "api-validators.ts"),
			"export const apiValidators = {};\n",
			"utf8",
		);

		try {
			await expect(
				syncEndpointClient({
					clientFile: "build/api-client.ts",
					manifest: defineEndpointManifest({
						contracts: {
							"first-query": { sourceTypeName: "FirstQuery" },
							"first--query": { sourceTypeName: "FirstQuery" },
							response: { sourceTypeName: "FirstResponse" },
						},
						endpoints: [
							{
								authMode: "public-read",
								method: "GET",
								operationId: "getFirstState",
								path: "/demo/v1/first/state",
								queryContract: "first-query",
								responseContract: "response",
								tags: ["First"],
							},
							{
								authMode: "public-read",
								method: "GET",
								operationId: "getSecondState",
								path: "/demo/v1/second/state",
								queryContract: "first--query",
								responseContract: "response",
								tags: ["Second"],
							},
						],
					}),
					projectRoot: root,
					typesFile: "src/api-types.ts",
				}),
			).rejects.toThrow(/both normalize to apiValidators/u);
		} finally {
			fs.rmSync(root, { force: true, recursive: true });
		}
	});

	test("syncEndpointClient rejects endpoints that define both bodyContract and queryContract", async () => {
		const project = createTempProject();
		const ambiguousManifest = defineEndpointManifest({
			contracts: manifest.contracts,
			endpoints: [
				{
					authMode: "public-read",
					bodyContract: "request",
					method: "POST",
					operationId: "writeCounterState",
					path: "/demo/v1/counter/state",
					queryContract: "query",
					responseContract: "response",
					tags: ["Counter"],
				},
			],
		});

		try {
			await expect(
				syncEndpointClient({
					clientFile: "build/api-client.ts",
					manifest: ambiguousManifest,
					projectRoot: project.root,
					typesFile: project.typesFile,
				}),
			).rejects.toThrow(
				'Endpoint "writeCounterState" defines both bodyContract and queryContract; generated portable clients require a single request contract.',
			);
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
		}
	});

	test("syncEndpointClient rejects reserved-word operation identifiers", async () => {
		const project = createTempProject();

		try {
			await expect(
				syncEndpointClient({
					clientFile: "build/api-client.ts",
					manifest: defineEndpointManifest({
						contracts: {
							response: { sourceTypeName: "CounterResponse" },
						},
						endpoints: [
							{
								authMode: "public-read",
								method: "GET",
								operationId: "default",
								path: "/demo/v1/counter/state",
								responseContract: "response",
								tags: ["Counter"],
							},
						],
					}),
					projectRoot: project.root,
					typesFile: project.typesFile,
				}),
			).rejects.toThrow(
				'Generated endpoint client operationId "default" is a reserved JavaScript identifier.',
			);
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
		}
	});

	test("syncRestOpenApi rejects mixed manifest and decomposed inputs", async () => {
		const project = createTempProject();

		try {
			await expect(
				syncRestOpenApi({
					manifest,
					contracts: manifest.contracts,
					endpoints: manifest.endpoints,
					openApiFile: "build/mixed.openapi.json",
					typesFile: project.typesFile,
					projectRoot: project.root,
				} as unknown as SyncRestOpenApiOptions),
			).rejects.toThrow(
				"syncRestOpenApi() accepts either { manifest, ... } or { contracts, endpoints, ... }, but not both.",
			);
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
			}
		});

	test("syncRestOpenApi rejects an undefined manifest value", async () => {
		const project = createTempProject();

		try {
			await expect(
				syncRestOpenApi({
					manifest: undefined,
					openApiFile: "build/undefined.openapi.json",
					projectRoot: project.root,
					typesFile: project.typesFile,
				} as unknown as SyncRestOpenApiOptions),
			).rejects.toThrow(
				"syncRestOpenApi() requires a manifest object when using { manifest, ... }.",
			);
		} finally {
			fs.rmSync(project.root, { force: true, recursive: true });
		}
	});
});
