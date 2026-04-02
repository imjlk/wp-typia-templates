import { describe, expect, test } from 'bun:test';

import type { EndpointManifestEndpointDefinition } from '../../packages/create/src/runtime/metadata-core';
import counterOpenApiDocument from '../../examples/persistence-examples/src/blocks/counter/api.openapi.json';
import {
	counterEndpointManifest,
	getCounterAdapterRouteTable,
	startCounterAdapterServer,
} from '../../examples/rest-contract-adapter-poc/src/counter-adapter';
import { counterContractValidators } from '../../examples/rest-contract-adapter-poc/src/contract-validation';

function toRouteSignature(
	route: Pick< EndpointManifestEndpointDefinition, 'method' | 'path' >
): string {
	return `${route.method} ${route.path}`;
}

function getOpenApiRouteSignatures(document: {
	paths: Record<string, Record<string, unknown>>;
}): string[] {
	const httpMethods = new Set([
		'delete',
		'get',
		'head',
		'options',
		'patch',
		'post',
		'put',
	]);

	return Object.entries(document.paths).flatMap(([path, item]) => {
		return Object.keys(item)
			.filter((method) => httpMethods.has(method))
			.map((method) => `${method.toUpperCase()} ${path}`);
	});
}

describe('REST contract adapter PoC', () => {
	test('mounts the same route table described by the shared endpoint manifest and OpenAPI document', () => {
		const adapterRoutes = getCounterAdapterRouteTable()
			.map(toRouteSignature)
			.sort();
		const manifestRoutes = counterEndpointManifest.endpoints
			.map(toRouteSignature)
			.sort();
		const openApiRoutes = getOpenApiRouteSignatures(counterOpenApiDocument).sort();

		expect(adapterRoutes).toEqual(manifestRoutes);
		expect(openApiRoutes).toEqual(manifestRoutes);
	});

	test('serves GET and POST counter state with the shared TypeScript contracts', async () => {
		const server = await startCounterAdapterServer();

		try {
			const initialResponse = await fetch(
				`${server.url}/persistence-examples/v1/counter?postId=7&resourceKey=demo`
			);
			const initialPayload = await initialResponse.json();
			const initialValidation =
				counterContractValidators.counterResponse(initialPayload);

			expect(initialResponse.status).toBe(200);
			expect(initialValidation.isValid).toBe(true);
			expect(initialValidation.data).toEqual({
				count: 0,
				postId: 7,
				resourceKey: 'demo',
				storage: 'custom-table',
			});

			const writeResponse = await fetch(
				`${server.url}/persistence-examples/v1/counter`,
				{
					body: JSON.stringify({
						delta: 3,
						postId: 7,
						publicWriteToken: 'adapter-proof-token',
						resourceKey: 'demo',
					}),
					headers: {
						'content-type': 'application/json',
					},
					method: 'POST',
				}
			);
			const writePayload = await writeResponse.json();
			const writeValidation =
				counterContractValidators.counterResponse(writePayload);

			expect(writeResponse.status).toBe(200);
			expect(writeValidation.isValid).toBe(true);
			expect(writeValidation.data?.count).toBe(3);

			const followUpResponse = await fetch(
				`${server.url}/persistence-examples/v1/counter?postId=7&resourceKey=demo`
			);
			const followUpPayload = await followUpResponse.json();
			const followUpValidation =
				counterContractValidators.counterResponse(followUpPayload);

			expect(followUpResponse.status).toBe(200);
			expect(followUpValidation.isValid).toBe(true);
			expect(followUpValidation.data?.count).toBe(3);
		} finally {
			await server.close();
		}
	});

	test('rejects blank or out-of-contract identifiers instead of coercing them into valid state keys', async () => {
		const server = await startCounterAdapterServer();

		try {
			const blankPostIdResponse = await fetch(
				`${server.url}/persistence-examples/v1/counter?postId=&resourceKey=demo`
			);
			const blankPostIdPayload = await blankPostIdResponse.json();

			expect(blankPostIdResponse.status).toBe(400);
			expect(blankPostIdPayload.message).toBe(
				'The request did not match the counter query contract.'
			);

			const fractionalWriteResponse = await fetch(
				`${server.url}/persistence-examples/v1/counter`,
				{
					body: JSON.stringify({
						delta: 1,
						postId: 1.5,
						resourceKey: 'demo',
					}),
					headers: {
						'content-type': 'application/json',
					},
					method: 'POST',
				}
			);
			const fractionalWritePayload = await fractionalWriteResponse.json();

			expect(fractionalWriteResponse.status).toBe(400);
			expect(fractionalWritePayload.message).toBe(
				'The request did not match the counter write contract.'
			);
		} finally {
			await server.close();
		}
	});
});
