import type { ApiEndpoint } from './client.js';

import {
  createCacheKey,
  getEndpointCachePrefix,
} from './react-client-cache-key.js';
import type {
  AnyEndpointValidationResult,
  CacheKey,
  EndpointDataCacheEntry,
  EndpointDataClient,
  EndpointDataSnapshot,
  InternalEndpointDataClient,
} from './react-client-types.js';
import { toEndpointResponseValidationResult } from './react-client-utils.js';

const EMPTY_SNAPSHOT: EndpointDataSnapshot = {
  data: undefined,
  error: null,
  invalidatedAt: 0,
  isFetching: false,
  updatedAt: 0,
  validation: null,
};

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

function castEndpointValidationPromise<Req, Res>(
  promise: Promise<AnyEndpointValidationResult>,
) {
  return promise as Promise<import('./client.js').EndpointValidationResult<Req, Res>>;
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

      const prefix = getEndpointCachePrefix(endpoint);
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
      const callbacks = new Set<() => Promise<AnyEndpointValidationResult>>();
      if (request !== undefined) {
        const { cacheKey } = createCacheKey(endpoint, request);
        for (const refetcher of entries.get(cacheKey)?.refetchers ?? []) {
          callbacks.add(refetcher);
        }
      } else {
        const prefix = getEndpointCachePrefix(endpoint);
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
    async __runQuery(cacheKey, execute, { force = false, staleTime }) {
      const entry = getOrCreateEntry(entries, cacheKey);
      if (entry.promise) {
        return castEndpointValidationPromise(entry.promise);
      }

      if (!force && !isEntryStale(entry, staleTime) && entry.validation) {
        return entry.validation as never;
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
