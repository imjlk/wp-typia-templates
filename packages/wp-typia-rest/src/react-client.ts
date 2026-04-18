import { createContext, createElement, useContext } from '@wordpress/element';
import type { ApiFetch } from '@wordpress/api-fetch';

import {
  callEndpoint,
  type ApiEndpoint,
  type EndpointCallOptions,
  type EndpointRequestValidationResult,
  type EndpointResponseValidationResult,
  type EndpointValidationResult,
  type ValidationResult,
} from './client.js';
import { isPlainObject } from './internal/runtime-primitives.js';

type CacheKey = string;
type AnyEndpointValidationResult = EndpointValidationResult<unknown, unknown>;

interface EndpointDataSnapshot {
  data: unknown;
  error: unknown;
  invalidatedAt: number;
  isFetching: boolean;
  updatedAt: number;
  validation: AnyEndpointValidationResult | null;
}

type EndpointDataListener = () => void;
type EndpointDataUpdater<T> = T | ((current: T | undefined) => T | undefined);
type QueryRefetcher = () => Promise<AnyEndpointValidationResult>;

interface EndpointDataCacheEntry {
  data: unknown;
  error: unknown;
  invalidatedAt: number;
  isFetching: boolean;
  listeners: Set<EndpointDataListener>;
  promise: Promise<AnyEndpointValidationResult> | null;
  refetchers: Set<QueryRefetcher>;
  snapshot: EndpointDataSnapshot;
  updatedAt: number;
  validation: AnyEndpointValidationResult | null;
}

/**
 * Shared cache client used by the React query and mutation helpers.
 *
 * @remarks
 * The client owns normalized cache keys, invalidation, and optimistic cache
 * writes without exposing transport implementation details to components.
 *
 * @category React
 */
export interface EndpointDataClient {
  invalidate<Req, Res>(endpoint: ApiEndpoint<Req, Res>, request?: Req): void;
  refetch<Req, Res>(
    endpoint: ApiEndpoint<Req, Res>,
    request?: Req,
  ): Promise<void>;
  getData<Req, Res>(
    endpoint: ApiEndpoint<Req, Res>,
    request: Req,
  ): Res | undefined;
  setData<Req, Res>(
    endpoint: ApiEndpoint<Req, Res>,
    request: Req,
    next: EndpointDataUpdater<Res>,
  ): void;
}

export interface InternalEndpointDataClient extends EndpointDataClient {
  __getSnapshot(cacheKey: CacheKey): EndpointDataSnapshot;
  __publishValidation<Req, Res>(
    cacheKey: CacheKey,
    validation: EndpointValidationResult<Req, Res>,
  ): void;
  __registerRefetcher(
    cacheKey: CacheKey,
    refetcher: QueryRefetcher,
  ): () => void;
  __runQuery<Req, Res>(
    cacheKey: CacheKey,
    execute: () => Promise<EndpointValidationResult<Req, Res>>,
    options: { force?: boolean; staleTime: number },
  ): Promise<EndpointValidationResult<Req, Res>>;
  __seedData<Res>(cacheKey: CacheKey, data: Res): void;
  __subscribe(cacheKey: CacheKey, listener: EndpointDataListener): () => void;
}

export interface EndpointInvalidateTarget<
  E extends ApiEndpoint<any, any> = ApiEndpoint<any, any>,
> {
  endpoint: E;
  request?: E extends ApiEndpoint<infer Req, any> ? Req : never;
}

type EndpointInvalidateTargets =
  | EndpointInvalidateTarget
  | readonly EndpointInvalidateTarget[]
  | undefined;

/**
 * Options for `useEndpointQuery()`.
 *
 * @category React
 */
export interface UseEndpointQueryOptions<_Req, Res, Selected = Res> {
  client?: EndpointDataClient;
  enabled?: boolean;
  fetchFn?: ApiFetch;
  initialData?: Res;
  onError?: (error: unknown) => void | Promise<void>;
  onSuccess?: (
    data: Selected,
    validation: EndpointResponseValidationResult<Res>,
  ) => void | Promise<void>;
  resolveCallOptions?: () => EndpointCallOptions | undefined;
  select?: (data: Res) => Selected;
  staleTime?: number;
}

/**
 * Result object returned by `useEndpointQuery()`.
 *
 * @category React
 */
export interface UseEndpointQueryResult<Res, Selected = Res, Req = unknown> {
  data: Selected | undefined;
  error: unknown;
  isFetching: boolean;
  isLoading: boolean;
  refetch: () => Promise<EndpointValidationResult<Req, Res>>;
  validation: EndpointValidationResult<Req, Res> | null;
}

/**
 * Options for `useEndpointMutation()`.
 *
 * @category React
 */
export interface UseEndpointMutationOptions<Req, Res, Context = unknown> {
  client?: EndpointDataClient;
  fetchFn?: ApiFetch;
  invalidate?:
    | EndpointInvalidateTargets
    | ((
        data: Res | undefined,
        variables: Req,
        validation: EndpointValidationResult<Req, Res>,
      ) => EndpointInvalidateTargets);
  onError?: (
    error: unknown,
    variables: Req,
    client: EndpointDataClient,
    context: Context | undefined,
  ) => void | Promise<void>;
  onMutate?: (
    variables: Req,
    client: EndpointDataClient,
  ) => Context | Promise<Context>;
  onSettled?: (
    result: {
      data: Res | undefined;
      error: unknown;
      validation: EndpointValidationResult<Req, Res> | null;
    },
    variables: Req,
    client: EndpointDataClient,
    context: Context | undefined,
  ) => void | Promise<void>;
  onSuccess?: (
    data: Res | undefined,
    variables: Req,
    validation: EndpointResponseValidationResult<Res>,
    client: EndpointDataClient,
    context: Context | undefined,
  ) => void | Promise<void>;
  resolveCallOptions?: (variables: Req) => EndpointCallOptions | undefined;
}

/**
 * Result object returned by `useEndpointMutation()`.
 *
 * @category React
 */
export interface UseEndpointMutationResult<Req, Res> {
  data: Res | undefined;
  error: unknown;
  isPending: boolean;
  mutate: (variables: Req) => void;
  mutateAsync: (variables: Req) => Promise<EndpointValidationResult<Req, Res>>;
  reset: () => void;
  validation: EndpointValidationResult<Req, Res> | null;
}

/**
 * Props for `EndpointDataProvider`.
 *
 * @category React
 */
export interface EndpointDataProviderProps {
  children?: Parameters<typeof createElement>[2];
  client: EndpointDataClient;
}

const EMPTY_SNAPSHOT: EndpointDataSnapshot = {
  data: undefined,
  error: null,
  invalidatedAt: 0,
  isFetching: false,
  updatedAt: 0,
  validation: null,
};

const EndpointDataClientContext = createContext<EndpointDataClient | null>(
  null,
);
const endpointIdentityIds = new WeakMap<object, number>();
let nextEndpointIdentityId = 0;

function getStableEndpointIdentity(value: object): number {
  const existing = endpointIdentityIds.get(value);
  if (existing !== undefined) {
    return existing;
  }

  const created = nextEndpointIdentityId;
  nextEndpointIdentityId += 1;
  endpointIdentityIds.set(value, created);
  return created;
}

function normalizeCacheValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return { __bigint: String(value) };
  }

  if (value instanceof URLSearchParams) {
    return {
      __urlSearchParams: [...value.entries()].sort(
        ([leftKey, leftValue], [rightKey, rightValue]) =>
          leftKey === rightKey
            ? leftValue.localeCompare(rightValue)
            : leftKey.localeCompare(rightKey),
      ),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeCacheValue(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, item]) => [key, normalizeCacheValue(item)]),
    );
  }

  if (value instanceof Date) {
    return { __date: value.toISOString() };
  }

  return String(value);
}

function createEndpointPrefix<Req, Res>(
  endpoint: ApiEndpoint<Req, Res>,
): string {
  const requestValidatorId = getStableEndpointIdentity(
    endpoint.validateRequest as object,
  );
  const responseValidatorId = getStableEndpointIdentity(
    endpoint.validateResponse as object,
  );
  const requestBuilderId =
    endpoint.buildRequestOptions !== undefined
      ? getStableEndpointIdentity(endpoint.buildRequestOptions as object)
      : -1;

  return [
    endpoint.method,
    endpoint.path,
    `request:${requestValidatorId}`,
    `response:${responseValidatorId}`,
    `builder:${requestBuilderId}`,
  ].join(' ');
}

export function createCacheKey<Req, Res>(
  endpoint: ApiEndpoint<Req, Res>,
  request: Req,
): { cacheKey: CacheKey; requestValidation: ValidationResult<Req> } {
  const requestValidation = endpoint.validateRequest(request);
  const normalizedRequest = requestValidation.isValid
    ? (requestValidation.data ?? request)
    : request;

  return {
    cacheKey: `${createEndpointPrefix(endpoint)}::${JSON.stringify(
      normalizeCacheValue(normalizedRequest),
    )}`,
    requestValidation,
  };
}

export function normalizeInvalidateTargets(
  targets: EndpointInvalidateTargets,
): readonly EndpointInvalidateTarget[] {
  if (!targets) {
    return [];
  }

  return (
    Array.isArray(targets) ? targets : [targets]
  ) as readonly EndpointInvalidateTarget[];
}

function getOrCreateEntry(
  entries: Map<CacheKey, EndpointDataCacheEntry>,
  cacheKey: CacheKey,
): EndpointDataCacheEntry {
  const existing = entries.get(cacheKey);
  if (existing) {
    return existing;
  }

  const created: EndpointDataCacheEntry = {
    ...EMPTY_SNAPSHOT,
    listeners: new Set(),
    promise: null,
    refetchers: new Set(),
    snapshot: EMPTY_SNAPSHOT,
  };
  entries.set(cacheKey, created);
  return created;
}

function syncSnapshot(entry: EndpointDataCacheEntry) {
  entry.snapshot = {
    data: entry.data,
    error: entry.error,
    invalidatedAt: entry.invalidatedAt,
    isFetching: entry.isFetching,
    updatedAt: entry.updatedAt,
    validation: entry.validation,
  };
}

function isEntryStale(
  entry: EndpointDataCacheEntry,
  staleTime: number,
): boolean {
  if (entry.updatedAt === 0) {
    return true;
  }

  if (entry.invalidatedAt > entry.updatedAt) {
    return true;
  }

  if (staleTime === 0) {
    return true;
  }

  return Date.now() - entry.updatedAt > staleTime;
}

export function asInternalClient(
  client: EndpointDataClient,
): InternalEndpointDataClient {
  return client as InternalEndpointDataClient;
}

export function castEndpointValidationResult<Req, Res>(
  validation: AnyEndpointValidationResult,
): EndpointValidationResult<Req, Res> {
  return validation as EndpointValidationResult<Req, Res>;
}

function castEndpointValidationPromise<Req, Res>(
  promise: Promise<AnyEndpointValidationResult>,
): Promise<EndpointValidationResult<Req, Res>> {
  return promise as Promise<EndpointValidationResult<Req, Res>>;
}

export function selectEndpointData<Res, Selected>(
  data: Res | undefined,
  select?: (data: Res) => Selected,
): Selected {
  if (select) {
    return select(data as Res);
  }

  // The default selector is identity, but TypeScript cannot express that when
  // Selected is an unconstrained generic chosen by the caller.
  return data as unknown as Selected;
}

export function isInvalidValidationResult<Req>(
  validation: ValidationResult<Req>,
): validation is ValidationResult<Req> & { isValid: false } {
  return validation.isValid === false;
}

export function toEndpointRequestValidationResult<Req>(
  validation: ValidationResult<Req> & { isValid: false },
): EndpointRequestValidationResult<Req> {
  return {
    ...validation,
    validationTarget: 'request',
  };
}

export function toEndpointResponseValidationResult<Res>(
  validation: ValidationResult<Res>,
): EndpointResponseValidationResult<Res> {
  return {
    ...validation,
    validationTarget: 'response',
  };
}

/**
 * Create an in-memory cache client for endpoint query and mutation hooks.
 *
 * @returns A cache client suitable for `EndpointDataProvider`.
 * @example
 * ```tsx
 * const client = createEndpointDataClient();
 * ```
 * @category React
 */
export function createEndpointDataClient(): EndpointDataClient {
  const entries = new Map<CacheKey, EndpointDataCacheEntry>();

  function notify(cacheKey: CacheKey) {
    const entry = entries.get(cacheKey);
    if (!entry) {
      return;
    }

    for (const listener of entry.listeners) {
      listener();
    }
  }

  const client: InternalEndpointDataClient = {
    invalidate(endpoint, request) {
      if (request !== undefined) {
        const { cacheKey } = createCacheKey(endpoint, request);
        const entry = entries.get(cacheKey);
        if (!entry) {
          return;
        }

        entry.invalidatedAt = Date.now();
        syncSnapshot(entry);
        notify(cacheKey);
        return;
      }

      const prefix = createEndpointPrefix(endpoint);
      for (const [cacheKey, entry] of entries.entries()) {
        if (!cacheKey.startsWith(`${prefix}::`)) {
          continue;
        }

        entry.invalidatedAt = Date.now();
        syncSnapshot(entry);
        notify(cacheKey);
      }
    },
    async refetch(endpoint, request) {
      const callbacks = new Set<QueryRefetcher>();
      if (request !== undefined) {
        const { cacheKey } = createCacheKey(endpoint, request);
        for (const refetcher of entries.get(cacheKey)?.refetchers ?? []) {
          callbacks.add(refetcher);
        }
      } else {
        const prefix = createEndpointPrefix(endpoint);
        for (const [cacheKey, entry] of entries.entries()) {
          if (!cacheKey.startsWith(`${prefix}::`)) {
            continue;
          }
          for (const refetcher of entry.refetchers) {
            callbacks.add(refetcher);
          }
        }
      }

      await Promise.all([...callbacks].map((refetcher) => refetcher()));
    },
    getData<Req, Res>(endpoint: ApiEndpoint<Req, Res>, request: Req) {
      const { cacheKey } = createCacheKey(endpoint, request);
      return entries.get(cacheKey)?.data as Res | undefined;
    },
    setData(endpoint, request, next) {
      const { cacheKey } = createCacheKey(endpoint, request);
      const entry = getOrCreateEntry(entries, cacheKey);
      const resolvedNext =
        typeof next === 'function'
          ? (next as (current: unknown) => unknown)(entry.data)
          : next;

      entry.data = resolvedNext;
      entry.error = null;
      entry.updatedAt = Date.now();
      entry.validation = toEndpointResponseValidationResult({
        data: resolvedNext,
        errors: [],
        isValid: true,
      });
      syncSnapshot(entry);
      notify(cacheKey);
    },
    __getSnapshot(cacheKey) {
      const entry = entries.get(cacheKey);
      if (!entry) {
        return EMPTY_SNAPSHOT;
      }

      return entry.snapshot;
    },
    __publishValidation(cacheKey, validation) {
      const entry = getOrCreateEntry(entries, cacheKey);
      entry.error = null;
      entry.updatedAt = Date.now();
      entry.validation = validation;
      if (validation.isValid) {
        entry.data = validation.data;
      } else if (validation.validationTarget === 'request') {
        entry.data = undefined;
      }
      syncSnapshot(entry);
      notify(cacheKey);
    },
    __registerRefetcher(cacheKey, refetcher) {
      const entry = getOrCreateEntry(entries, cacheKey);
      entry.refetchers.add(refetcher);

      return () => {
        entry.refetchers.delete(refetcher);
      };
    },
    async __runQuery<Req, Res>(
      cacheKey: CacheKey,
      execute: () => Promise<EndpointValidationResult<Req, Res>>,
      { force = false, staleTime }: { force?: boolean; staleTime: number },
    ) {
      const entry = getOrCreateEntry(entries, cacheKey);
      if (entry.promise) {
        return castEndpointValidationPromise(entry.promise);
      }

      if (!force) {
        if (!isEntryStale(entry, staleTime) && entry.validation) {
          return castEndpointValidationResult(entry.validation);
        }
      }

      entry.error = null;
      entry.isFetching = true;
      syncSnapshot(entry);
      notify(cacheKey);

      const startedAt = Date.now();
      const promise = execute()
        .then((validation) => {
          entry.error = null;
          if (entry.invalidatedAt <= startedAt) {
            entry.updatedAt = Date.now();
            entry.validation = validation;
            if (validation.isValid) {
              entry.data = validation.data;
            }
          }
          syncSnapshot(entry);
          return validation;
        })
        .catch((error: unknown) => {
          entry.error = error;
          if (entry.invalidatedAt <= startedAt) {
            entry.updatedAt = Date.now();
          }
          syncSnapshot(entry);
          throw error;
        })
        .finally(() => {
          entry.isFetching = false;
          entry.promise = null;
          syncSnapshot(entry);
          notify(cacheKey);
        });

      entry.promise = promise;
      return castEndpointValidationPromise(promise);
    },
    __seedData(cacheKey, data) {
      const entry = getOrCreateEntry(entries, cacheKey);
      if (entry.validation) {
        return;
      }

      entry.data = data;
      entry.error = null;
      entry.updatedAt = Date.now();
      entry.validation = toEndpointResponseValidationResult({
        data,
        errors: [],
        isValid: true,
      });
      syncSnapshot(entry);
      notify(cacheKey);
    },
    __subscribe(cacheKey, listener) {
      const entry = getOrCreateEntry(entries, cacheKey);
      entry.listeners.add(listener);

      return () => {
        entry.listeners.delete(listener);
      };
    },
  };

  return client;
}

const defaultEndpointDataClient = createEndpointDataClient();

/**
 * Provide a shared endpoint cache client to descendant components.
 *
 * @param props - Provider props including the cache client and optional children.
 * @returns A context provider element for endpoint cache access.
 * @category React
 */
export function EndpointDataProvider(
  props: EndpointDataProviderProps,
): ReturnType<typeof createElement> {
  const { children, client } = props;
  return children === undefined
    ? createElement(EndpointDataClientContext.Provider, { value: client })
    : createElement(
        EndpointDataClientContext.Provider,
        { value: client },
        children,
      );
}

/**
 * Read the nearest endpoint cache client from context.
 *
 * @returns The active endpoint cache client, or the default singleton client.
 * @category React
 */
export function useEndpointDataClient(): EndpointDataClient {
  return useContext(EndpointDataClientContext) ?? defaultEndpointDataClient;
}
