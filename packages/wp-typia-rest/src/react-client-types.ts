import type { ApiFetch } from '@wordpress/api-fetch';

import type {
  ApiEndpoint,
  EndpointCallOptions,
  EndpointResponseValidationResult,
  EndpointValidationResult,
  ValidationResult,
} from './client.js';

export type CacheKey = string;
export type AnyEndpointValidationResult = EndpointValidationResult<unknown, unknown>;

export interface EndpointDataSnapshot {
  data: unknown;
  error: unknown;
  invalidatedAt: number;
  isFetching: boolean;
  updatedAt: number;
  validation: AnyEndpointValidationResult | null;
}

export type EndpointDataListener = () => void;
export type EndpointDataUpdater<T> = T | ((current: T | undefined) => T | undefined);
export type QueryRefetcher = () => Promise<AnyEndpointValidationResult>;

export interface EndpointDataCacheEntry {
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

export type EndpointInvalidateTargets =
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

export type CacheKeyResult<Req> = {
  cacheKey: CacheKey;
  requestValidation: ValidationResult<Req>;
};
