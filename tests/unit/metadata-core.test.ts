import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
	defineEndpointManifest,
	syncRestOpenApi,
	type EndpointManifestDefinition,
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
});
