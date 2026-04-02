import { describe, expect, test } from "bun:test";

import {
	defineEndpointManifest,
	type EndpointManifestDefinition,
	type SyncRestOpenApiOptions,
} from "../../packages/create/src/runtime/metadata-core";

const manifest = defineEndpointManifest({
	contracts: {
		query: { sourceTypeName: "CounterQuery" },
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
	info: {
		title: "Counter REST API",
		version: "1.0.0",
	},
} as const);

const syncOptions: SyncRestOpenApiOptions = {
	contracts: manifest.contracts,
	endpoints: manifest.endpoints,
	openApiFile: "src/api.openapi.json",
	openApiInfo: manifest.info,
	typesFile: "src/api-types.ts",
};

const manifestShape: EndpointManifestDefinition = manifest;

void syncOptions;
void manifestShape;

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
});
