import {
	createContext,
	createElement,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "@wordpress/element";
import type { ApiFetch } from "@wordpress/api-fetch";

import {
	callEndpoint,
	type ApiEndpoint,
	type EndpointCallOptions,
	type EndpointRequestValidationResult,
	type EndpointResponseValidationResult,
	type EndpointValidationResult,
	type ValidationResult,
} from "./client";
import { isPlainObject } from "./internal/runtime-primitives.js";

type CacheKey = string;

interface EndpointDataSnapshot {
	data: unknown;
	error: unknown;
	invalidatedAt: number;
	isFetching: boolean;
	updatedAt: number;
	validation: EndpointValidationResult<unknown, unknown> | null;
}

type EndpointDataListener = () => void;
type EndpointDataUpdater<T> = T | ((current: T | undefined) => T | undefined);
type QueryRefetcher = () => Promise<EndpointValidationResult<unknown, unknown>>;

interface EndpointDataCacheEntry {
	data: unknown;
	error: unknown;
	invalidatedAt: number;
	isFetching: boolean;
	listeners: Set<EndpointDataListener>;
	promise: Promise<EndpointValidationResult<unknown, unknown>> | null;
	refetchers: Set<QueryRefetcher>;
	snapshot: EndpointDataSnapshot;
	updatedAt: number;
	validation: EndpointValidationResult<unknown, unknown> | null;
}

export interface EndpointDataClient {
	invalidate<Req, Res>(endpoint: ApiEndpoint<Req, Res>, request?: Req): void;
	refetch<Req, Res>(endpoint: ApiEndpoint<Req, Res>, request?: Req): Promise<void>;
	getData<Req, Res>(endpoint: ApiEndpoint<Req, Res>, request: Req): Res | undefined;
	setData<Req, Res>(
		endpoint: ApiEndpoint<Req, Res>,
		request: Req,
		next: EndpointDataUpdater<Res>,
	): void;
}

interface InternalEndpointDataClient extends EndpointDataClient {
	__getSnapshot(cacheKey: CacheKey): EndpointDataSnapshot;
	__publishValidation<Req, Res>(
		cacheKey: CacheKey,
		validation: EndpointValidationResult<Req, Res>,
	): void;
	__registerRefetcher(cacheKey: CacheKey, refetcher: QueryRefetcher): () => void;
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

export interface UseEndpointQueryResult<Req, Res, Selected = Res> {
	data: Selected | undefined;
	error: unknown;
	isFetching: boolean;
	isLoading: boolean;
	refetch: () => Promise<EndpointValidationResult<Req, Res>>;
	validation: EndpointValidationResult<Req, Res> | null;
}

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
	resolveCallOptions?: (
		variables: Req,
	) => EndpointCallOptions | undefined;
}

export interface UseEndpointMutationResult<Req, Res> {
	data: Res | undefined;
	error: unknown;
	isPending: boolean;
	mutate: (variables: Req) => void;
	mutateAsync: (variables: Req) => Promise<EndpointValidationResult<Req, Res>>;
	reset: () => void;
	validation: EndpointValidationResult<Req, Res> | null;
}

export interface EndpointDataProviderProps {
	children?: unknown;
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

const EndpointDataClientContext = createContext<EndpointDataClient | null>(null);

function normalizeCacheValue(value: unknown): unknown {
	if (value === undefined) {
		return undefined;
	}

	if (
		value === null ||
		typeof value === "boolean" ||
		typeof value === "number" ||
		typeof value === "string"
	) {
		return value;
	}

	if (typeof value === "bigint") {
		return { __bigint: String(value) };
	}

	if (value instanceof URLSearchParams) {
		return {
			__urlSearchParams: [...value.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) =>
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

function createEndpointPrefix<Req, Res>(endpoint: ApiEndpoint<Req, Res>): string {
	return `${endpoint.method} ${endpoint.path}`;
}

function createCacheKey<Req, Res>(
	endpoint: ApiEndpoint<Req, Res>,
	request: Req,
): { cacheKey: CacheKey; requestValidation: ValidationResult<Req> } {
	const requestValidation = endpoint.validateRequest(request);
	const normalizedRequest = requestValidation.isValid
		? requestValidation.data ?? request
		: request;

	return {
		cacheKey: `${createEndpointPrefix(endpoint)}::${JSON.stringify(
			normalizeCacheValue(normalizedRequest),
		)}`,
		requestValidation,
	};
}

function normalizeInvalidateTargets(
	targets: EndpointInvalidateTargets,
): readonly EndpointInvalidateTarget[] {
	if (!targets) {
		return [];
	}

	return (Array.isArray(targets) ? targets : [targets]) as readonly EndpointInvalidateTarget[];
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

function isEntryStale(entry: EndpointDataCacheEntry, staleTime: number): boolean {
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

function asInternalClient(client: EndpointDataClient): InternalEndpointDataClient {
	return client as InternalEndpointDataClient;
}

function toEndpointRequestValidationResult<Req>(
	validation: ValidationResult<Req>,
): EndpointRequestValidationResult<Req> {
	return {
		...validation,
		isValid: false,
		validationTarget: "request",
	};
}

function toEndpointResponseValidationResult<Res>(
	validation: ValidationResult<Res>,
): EndpointResponseValidationResult<Res> {
	return {
		...validation,
		validationTarget: "response",
	};
}

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
			getData(endpoint, request) {
				const { cacheKey } = createCacheKey(endpoint, request);
				return entries.get(cacheKey)?.data as any;
			},
		setData(endpoint, request, next) {
			const { cacheKey } = createCacheKey(endpoint, request);
			const entry = getOrCreateEntry(entries, cacheKey);
			const resolvedNext =
				typeof next === "function"
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
				entry.validation = validation as EndpointValidationResult<unknown, unknown>;
				if (validation.isValid) {
					entry.data = validation.data;
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
				return entry.promise as Promise<EndpointValidationResult<any, any>>;
			}

			if (!force) {
				if (!isEntryStale(entry, staleTime) && entry.validation) {
					return entry.validation as EndpointValidationResult<any, any>;
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
						entry.validation = validation as EndpointValidationResult<unknown, unknown>;
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

			entry.promise = promise as Promise<EndpointValidationResult<unknown, unknown>>;
			return promise as Promise<EndpointValidationResult<any, any>>;
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

export function EndpointDataProvider({
	children,
	client,
}: EndpointDataProviderProps): ReturnType<typeof createElement> {
	return createElement(
		EndpointDataClientContext.Provider,
		{ value: client },
		children as any,
	);
}

export function useEndpointDataClient(): EndpointDataClient {
	return useContext(EndpointDataClientContext) ?? defaultEndpointDataClient;
}

export function useEndpointQuery<Req, Res, Selected = Res>(
	endpoint: ApiEndpoint<Req, Res>,
	request: Req,
	options: UseEndpointQueryOptions<Req, Res, Selected> = {},
): UseEndpointQueryResult<Req, Res, Selected> {
	if (endpoint.method !== "GET") {
		throw new Error("useEndpointQuery only supports GET endpoints in v1.");
	}

	const defaultClient = useEndpointDataClient();
	const client = asInternalClient(options.client ?? defaultClient);
	const {
		enabled = true,
		fetchFn,
		initialData,
		onError,
		onSuccess,
		resolveCallOptions,
		select,
		staleTime = 0,
	} = options;
	const prepared = useMemo(
		() => createCacheKey(endpoint, request),
		[endpoint, request],
	);
	const snapshot = useSyncExternalStore(
		(listener) => client.__subscribe(prepared.cacheKey, listener),
		() => client.__getSnapshot(prepared.cacheKey),
		() => client.__getSnapshot(prepared.cacheKey),
	);
	const latestRef = useRef({
		cacheKey: prepared.cacheKey,
		client,
		endpoint,
		fetchFn,
		onError,
		onSuccess,
		request,
		requestValidation: prepared.requestValidation,
		resolveCallOptions,
		select,
		staleTime,
	});
	latestRef.current = {
		cacheKey: prepared.cacheKey,
		client,
		endpoint,
		fetchFn,
		onError,
		onSuccess,
		request,
		requestValidation: prepared.requestValidation,
		resolveCallOptions,
		select,
		staleTime,
	};

	const refetchRef = useRef<() => Promise<EndpointValidationResult<Req, Res>>>();
	const executeQueryRef = useRef<
		(force: boolean) => Promise<EndpointValidationResult<Req, Res>>
	>();
	const hasAutoFetchedZeroStaleRef = useRef(false);
	useEffect(() => {
		hasAutoFetchedZeroStaleRef.current = false;
	}, [enabled, prepared.cacheKey, staleTime]);
	// Keep these callbacks stable while still reading the latest runtime inputs
	// from latestRef.current on each execution.
	if (!executeQueryRef.current) {
		executeQueryRef.current = async (force) => {
			const latest = latestRef.current;
			if (!latest.requestValidation.isValid) {
				const invalidValidation = toEndpointRequestValidationResult(
					latest.requestValidation,
				);
				latest.client.__publishValidation(latest.cacheKey, invalidValidation);
				return invalidValidation;
			}

			try {
				const callOptions = latest.resolveCallOptions?.();
				const validation = await latest.client.__runQuery(
					latest.cacheKey,
					() =>
						callEndpoint(latest.endpoint, latest.request, {
							fetchFn: callOptions?.fetchFn ?? latest.fetchFn,
							requestOptions: callOptions?.requestOptions,
						}),
					{ force, staleTime: latest.staleTime },
				);

				if (validation.isValid) {
					const selected =
						latest.select !== undefined
							? latest.select(validation.data as Res)
							: (validation.data as unknown as Selected);
					await latest.onSuccess?.(selected, validation);
				}

				return validation;
			} catch (error) {
				await latest.onError?.(error);
				throw error;
			}
		};
	}
	const executeQuery = executeQueryRef.current;
	if (!refetchRef.current) {
		refetchRef.current = () => executeQuery(true);
	}
	const refetch = refetchRef.current;

	useEffect(() => {
		return client.__registerRefetcher(prepared.cacheKey, () =>
			refetch() as Promise<EndpointValidationResult<unknown, unknown>>,
		);
	}, [client, prepared.cacheKey, refetch]);

	useEffect(() => {
		if (initialData === undefined || snapshot.validation) {
			return;
		}

		client.__seedData(prepared.cacheKey, initialData);
	}, [client, initialData, prepared.cacheKey, snapshot.validation]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		if (!prepared.requestValidation.isValid) {
			if (snapshot.validation?.isValid === false) {
				return;
			}

			client.__publishValidation(
				prepared.cacheKey,
				toEndpointRequestValidationResult(prepared.requestValidation),
			);
			return;
		}

		if (snapshot.isFetching) {
			return;
		}

		const shouldFetch =
			snapshot.updatedAt === 0
				? initialData === undefined
				: snapshot.invalidatedAt > snapshot.updatedAt
					? true
					: snapshot.error !== null
						? false
						: staleTime === 0
							? !hasAutoFetchedZeroStaleRef.current
							: Date.now() - snapshot.updatedAt > staleTime;

		if (!shouldFetch) {
			return;
		}

		if (staleTime === 0) {
			hasAutoFetchedZeroStaleRef.current = true;
		}
		void executeQuery(false).catch(() => {});
	}, [
		client,
		enabled,
		executeQuery,
		initialData,
		prepared.cacheKey,
		prepared.requestValidation.isValid,
		snapshot.isFetching,
		refetch,
		snapshot.invalidatedAt,
		snapshot.updatedAt,
		staleTime,
	]);

	const data = useMemo(() => {
		const rawData =
			snapshot.data === undefined && snapshot.validation === null
				? initialData
				: (snapshot.data as Res | undefined);
		if (rawData === undefined) {
			return undefined;
		}

		return select !== undefined
			? select(rawData)
			: (rawData as unknown as Selected);
	}, [initialData, select, snapshot.data, snapshot.validation]);

	return {
		data,
		error: snapshot.error,
		isFetching: snapshot.isFetching,
		isLoading:
			snapshot.isFetching &&
			data === undefined,
		refetch,
		validation: snapshot.validation as EndpointValidationResult<Req, Res> | null,
	};
}

export function useEndpointMutation<Req, Res, Context = unknown>(
	endpoint: ApiEndpoint<Req, Res>,
	options: UseEndpointMutationOptions<Req, Res, Context> = {},
): UseEndpointMutationResult<Req, Res> {
	const defaultClient = useEndpointDataClient();
	const client = options.client ?? defaultClient;
	const {
		fetchFn,
		invalidate,
		onError,
		onMutate,
		onSettled,
		onSuccess,
		resolveCallOptions,
	} = options;
	const [data, setData] = useState<Res | undefined>(undefined);
	const [error, setError] = useState<unknown>(null);
	const [isPending, setIsPending] = useState(false);
	const [validation, setValidation] = useState<
		EndpointValidationResult<Req, Res> | null
	>(null);
	const pendingCountRef = useRef(0);
	const latestRef = useRef({
		client,
		endpoint,
		fetchFn,
		invalidate,
		onError,
		onMutate,
		onSettled,
		onSuccess,
		resolveCallOptions,
	});
	latestRef.current = {
		client,
		endpoint,
		fetchFn,
		invalidate,
		onError,
		onMutate,
		onSettled,
		onSuccess,
		resolveCallOptions,
	};

	const mutateAsyncRef = useRef<
		(variables: Req) => Promise<EndpointValidationResult<Req, Res>>
	>();
	if (!mutateAsyncRef.current) {
		mutateAsyncRef.current = async (variables: Req) => {
			const latest = latestRef.current;
			pendingCountRef.current += 1;
			setIsPending(true);
			setError(null);
			setValidation(null);
			let context: Context | undefined;

			try {
				context = latest.onMutate
					? await latest.onMutate(variables, latest.client)
					: undefined;
				const callOptions = latest.resolveCallOptions?.(variables);
				const result = await callEndpoint(latest.endpoint, variables, {
					fetchFn: callOptions?.fetchFn ?? latest.fetchFn,
					requestOptions: callOptions?.requestOptions,
				});
				setValidation(result);

				if (result.isValid) {
					setData(result.data);
					await latest.onSuccess?.(
						result.data,
						variables,
						result,
						latest.client,
						context,
					);

					const targets = normalizeInvalidateTargets(
						typeof latest.invalidate === "function"
							? latest.invalidate(result.data, variables, result)
							: latest.invalidate,
					);
					for (const target of targets) {
						latest.client.invalidate(target.endpoint, target.request);
					}
				} else {
					setData(undefined);
					setError(result);

					await latest.onError?.(
						result,
						variables,
						latest.client,
						context,
					);

					const targets = normalizeInvalidateTargets(
						typeof latest.invalidate === "function"
							? latest.invalidate(undefined, variables, result)
							: latest.invalidate,
					);
					for (const target of targets) {
						latest.client.invalidate(target.endpoint, target.request);
					}
				}

				await latest.onSettled?.(
					{
						data: result.isValid ? result.data : undefined,
						error: result.isValid ? null : result,
						validation: result,
					},
					variables,
					latest.client,
					context,
				);

				return result;
			} catch (nextError) {
				setData(undefined);
				setError(nextError);
				setValidation(null);
				await latest.onError?.(
					nextError,
					variables,
					latest.client,
					context,
				);
				await latest.onSettled?.(
					{
						data: undefined,
						error: nextError,
						validation: null,
					},
					variables,
					latest.client,
					context,
				);
				throw nextError;
			} finally {
				pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
				setIsPending(pendingCountRef.current > 0);
			}
		};
	}
	const mutateAsync = mutateAsyncRef.current;

	const mutate = (variables: Req) => {
		void mutateAsync(variables).catch(() => {});
	};

	const reset = () => {
		pendingCountRef.current = 0;
		setData(undefined);
		setError(null);
		setIsPending(false);
		setValidation(null);
	};

	return {
		data,
		error,
		isPending,
		mutate,
		mutateAsync,
		reset,
		validation,
	};
}
