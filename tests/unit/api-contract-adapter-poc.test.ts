import { describe, expect, test } from 'bun:test';

import type { EndpointManifestEndpointDefinition } from '../../packages/create/src/runtime/metadata-core';
import counterOpenApiDocument from '../../examples/persistence-examples/src/blocks/counter/api.openapi.json';
import {
	counterEndpointManifest,
	getCounterAdapterRouteTable,
	startCounterAdapterServer,
} from '../../examples/api-contract-adapter-poc/src/counter-adapter';
import {
	counterOperationResponseValidators,
} from '../../examples/api-contract-adapter-poc/src/contract-validation';
import { runRestAdapterConformanceSuite } from '../helpers/rest-adapter-conformance';

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
		await runRestAdapterConformanceSuite( {
			manifest: counterEndpointManifest,
			responseValidators: counterOperationResponseValidators,
			scenarios: [
				{
					name: 'counter read/write flow',
					steps: [
						{
							assertBody: ( payload ) => {
								expect( payload ).toEqual( {
									count: 0,
									postId: 7,
									resourceKey: 'demo',
									storage: 'custom-table',
								} );
							},
							description: 'reads the initial counter state',
							expected: {
								status: 200,
							},
							operationId: 'getPersistenceCounterState',
							request: {
								postId: 7,
								resourceKey: 'demo',
							},
						},
						{
							assertBody: ( payload ) => {
								expect(
									( payload as { count?: unknown } ).count
								).toBe( 3 );
							},
							description: 'increments the counter state',
							expected: {
								status: 200,
							},
							operationId: 'incrementPersistenceCounterState',
							request: {
								delta: 3,
								postId: 7,
								publicWriteRequestId: 'adapter-request-1',
								publicWriteToken: 'adapter-proof-token',
								resourceKey: 'demo',
							},
						},
						{
							assertBody: ( payload ) => {
								expect(
									( payload as { count?: unknown } ).count
								).toBe( 3 );
							},
							description: 'reads the updated counter state',
							expected: {
								status: 200,
							},
							operationId: 'getPersistenceCounterState',
							request: {
								postId: 7,
								resourceKey: 'demo',
							},
						},
					],
				},
			],
			startServer: () => startCounterAdapterServer(),
		} );
	});

	test('rejects blank or out-of-contract identifiers instead of coercing them into valid state keys', async () => {
		await runRestAdapterConformanceSuite( {
			coveredOperationIds: [
				'getPersistenceCounterState',
				'incrementPersistenceCounterState',
			],
			manifest: counterEndpointManifest,
			responseValidators: counterOperationResponseValidators,
			scenarios: [
				{
					name: 'invalid counter inputs',
					steps: [
						{
							description: 'rejects a blank post id in the query string',
							expected: {
								message: 'The request did not match the counter query contract.',
								status: 400,
							},
							operationId: 'getPersistenceCounterState',
							rawRequest: {
								query: {
									postId: '',
									resourceKey: 'demo',
								},
							},
						},
						{
							description: 'rejects a fractional post id in the write body',
							expected: {
								message: 'The request did not match the counter write contract.',
								status: 400,
							},
							operationId: 'incrementPersistenceCounterState',
							rawRequest: {
								body: JSON.stringify( {
									delta: 1,
									postId: 1.5,
									publicWriteRequestId: 'adapter-request-2',
									publicWriteToken: 'adapter-proof-token',
									resourceKey: 'demo',
								} ),
								headers: {
									'content-type': 'application/json',
								},
							},
						},
					],
				},
			],
			startServer: () => startCounterAdapterServer(),
		} );
	});
});
