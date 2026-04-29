import { describe, expect, test } from 'bun:test';
import type { ApiFetch } from '@wordpress/api-fetch';

import {
  callEndpoint,
  createEndpoint,
  defineRestResource,
  defineRestResourceListQuery,
  toRestResourceListRequest,
  toValidationResult,
  type RestResourceEndpointSet,
  type ValidationLike,
} from '../src/index';

function success<T>(data: T): ValidationLike<T> {
  return {
    data,
    errors: [],
    success: true,
  };
}

function failure<T>(expected: string, path = '(root)'): ValidationLike<T> {
  return {
    errors: [{ expected, path, value: undefined }],
    success: false,
  };
}

function asApiFetch(fn: (...args: any[]) => Promise<unknown>): ApiFetch {
  return fn as unknown as ApiFetch;
}

describe('@wp-typia/rest resource helpers', () => {
  test('groups endpoint contracts into a resource facade without forcing a full CRUD surface', async () => {
    let seenPath = '';
    let seenBody = '';
    const resource = defineRestResource({
      endpoints: {
        create: createEndpoint<
          { title: string },
          { id: number; title: string }
        >({
          method: 'POST',
          path: '/products',
          validateRequest: (input: unknown) =>
            typeof input === 'object' &&
            input !== null &&
            typeof (input as { title?: unknown }).title === 'string'
              ? toValidationResult(success(input as { title: string }))
              : toValidationResult(
                  failure<{ title: string }>('{ title: string }', '$.title'),
                ),
          validateResponse: (input: unknown) =>
            typeof input === 'object' &&
            input !== null &&
            typeof (input as { id?: unknown }).id === 'number' &&
            typeof (input as { title?: unknown }).title === 'string'
              ? toValidationResult(
                  success(input as { id: number; title: string }),
                )
              : toValidationResult(
                  failure<{ id: number; title: string }>(
                    '{ id: number; title: string }',
                    '$.id',
                  ),
                ),
        }),
        list: createEndpoint<
          { page: number; search?: string },
          { items: number[] }
        >({
          method: 'GET',
          path: '/products',
          validateRequest: (input: unknown) =>
            typeof input === 'object' &&
            input !== null &&
            typeof (input as { page?: unknown }).page === 'number'
              ? toValidationResult(
                  success(input as { page: number; search?: string }),
                )
              : toValidationResult(
                  failure<{ page: number; search?: string }>(
                    '{ page: number }',
                    '$.page',
                  ),
                ),
          validateResponse: (input: unknown) =>
            typeof input === 'object' &&
            input !== null &&
            Array.isArray((input as { items?: unknown }).items)
              ? toValidationResult(success(input as { items: number[] }))
              : toValidationResult(
                  failure<{ items: number[] }>(
                    '{ items: number[] }',
                    '$.items',
                  ),
                ),
        }),
      },
      idField: 'id',
      listQuery: defineRestResourceListQuery(
        (query: { page: number; term?: string }) => ({
          page: query.page,
          ...(query.term ? { search: query.term } : {}),
        }),
      ),
      namespace: 'demo/v1',
      path: '/products',
    });

    const listRequest = toRestResourceListRequest(resource, {
      page: 2,
      term: 'hero',
    });
    const listResult = await resource.list(listRequest, {
      fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
        seenPath = String(options.path);
        return { items: [1, 2] } as never;
      }),
    });
    const createResult = await resource.create(
      { title: 'Hero card' },
      {
        fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
          seenBody = String(options.body);
          return { id: 9, title: 'Hero card' } as never;
        }),
      },
    );

    expect(resource.idField).toBe('id');
    expect(resource.namespace).toBe('demo/v1');
    expect(resource.path).toBe('/products');
    expect('read' in resource).toBe(false);
    expect('update' in resource).toBe(false);
    expect('delete' in resource).toBe(false);
    expect(seenPath).toBe('/products?page=2&search=hero');
    expect(listResult.isValid).toBe(true);
    expect(listResult.data).toEqual({ items: [1, 2] });
    expect(seenBody).toBe(JSON.stringify({ title: 'Hero card' }));
    expect(createResult.isValid).toBe(true);
    expect(createResult.data).toEqual({ id: 9, title: 'Hero card' });
  });

  test('preserves request validation behavior through resource call helpers', async () => {
    let fetchCalled = false;
    const resource = defineRestResource({
      endpoints: {
        list: createEndpoint<{ page: number }, { items: number[] }>({
          method: 'GET',
          path: '/products',
          validateRequest: (input: unknown) =>
            typeof input === 'object' &&
            input !== null &&
            typeof (input as { page?: unknown }).page === 'number'
              ? toValidationResult(success(input as { page: number }))
              : toValidationResult(
                  failure<{ page: number }>('{ page: number }', '$.page'),
                ),
          validateResponse: (input: unknown) =>
            typeof input === 'object' &&
            input !== null &&
            Array.isArray((input as { items?: unknown }).items)
              ? toValidationResult(success(input as { items: number[] }))
              : toValidationResult(
                  failure<{ items: number[] }>(
                    '{ items: number[] }',
                    '$.items',
                  ),
                ),
        }),
      },
    });

    const result = await resource.list({ page: 'invalid' } as never, {
      fetchFn: asApiFetch(async () => {
        fetchCalled = true;
        return { items: [] } as never;
      }),
    });

    expect(fetchCalled).toBe(false);
    expect(result.isValid).toBe(false);
    expect(result.validationTarget).toBe('request');
    expect(result.errors[0]?.path).toBe('$.page');
  });

  test('resource helpers remain compatible with direct callEndpoint usage', async () => {
    let helperPath = '';
    let directPath = '';
    const endpoint = createEndpoint<{ page: number }, { items: number[] }>({
      method: 'GET',
      path: '/products',
      validateRequest: (input: unknown) =>
        typeof input === 'object' &&
        input !== null &&
        typeof (input as { page?: unknown }).page === 'number'
          ? toValidationResult(success(input as { page: number }))
          : toValidationResult(
              failure<{ page: number }>('{ page: number }', '$.page'),
            ),
      validateResponse: (input: unknown) =>
        typeof input === 'object' &&
        input !== null &&
        Array.isArray((input as { items?: unknown }).items)
          ? toValidationResult(success(input as { items: number[] }))
          : toValidationResult(
              failure<{ items: number[] }>('{ items: number[] }', '$.items'),
            ),
    });
    const resource = defineRestResource({
      endpoints: {
        list: endpoint,
      },
    });

    await resource.list(
      { page: 3 },
      {
        fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
          helperPath = String(options.path);
          return { items: [3] } as never;
        }),
      },
    );
    await callEndpoint(
      endpoint,
      { page: 4 },
      {
        fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
          directPath = String(options.path);
          return { items: [4] } as never;
        }),
      },
    );

    expect(helperPath).toBe('/products?page=3');
    expect(directPath).toBe('/products?page=4');
  });

  test('keeps list helpers available when callers widen endpoint maps to the shared endpoint-set type', async () => {
    let seenPath = '';
    const listEndpoint = createEndpoint<{ page: number }, { items: number[] }>({
      method: 'GET',
      path: '/products',
      validateRequest: (input: unknown) =>
        typeof input === 'object' &&
        input !== null &&
        typeof (input as { page?: unknown }).page === 'number'
          ? toValidationResult(success(input as { page: number }))
          : toValidationResult(
              failure<{ page: number }>('{ page: number }', '$.page'),
            ),
      validateResponse: (input: unknown) =>
        typeof input === 'object' &&
        input !== null &&
        Array.isArray((input as { items?: unknown }).items)
          ? toValidationResult(success(input as { items: number[] }))
          : toValidationResult(
              failure<{ items: number[] }>('{ items: number[] }', '$.items'),
            ),
    });
    const endpoints: RestResourceEndpointSet = {
      list: listEndpoint,
    };
    const resource = defineRestResource({
      endpoints,
    });

    expect(typeof resource.list).toBe('function');
    const result = await resource.list!(
      { page: 5 },
      {
        fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
          seenPath = String(options.path);
          return { items: [5] } as never;
        }),
      },
    );

    expect(seenPath).toBe('/products?page=5');
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({ items: [5] });
  });
});
