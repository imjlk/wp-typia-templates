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
	type ValidationResult,
} from "./client";

type CacheKey = string;

interface EndpointDataSnapshot {
	data: unknown;
	error: unknown;
	invalidatedAt: number;
	isFetching: boolean;
	updatedAt: number;
	validation: ValidationResult<unknown> | null;
}

type EndpointDataListener = () => void;
type EndpointDataUpdater<T> = T | ((current: T | undefined) => T | undefined);
type QueryRefetcher = () => Promise<ValidationResult<unknown>>;

interface EndpointDataCacheEntry {
	data: unknown;
	error: unknown;
	invalidatedAt: number;
	isFetching: boolean;
	listeners: Set<EndpointDataListener>;
	promise: Promise<ValidationResult<unknown>> | null;
	refetchers: Set<QueryRefetcher>;
	snapshot: EndpointDataSnapshot;
	updatedAt: number;
	validation: ValidationResult<unknown> | null;
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
	__publishValidation<Res>(cacheKey: CacheKey, validation: ValidationResult<Res>): void;
	__registerRefetcher(cacheKey: CacheKey, refetcher: QueryRefetcher): () => void;
	__runQuery<Res>(
		cacheKey: CacheKey,
		execute: () => Promise<ValidationResult<Res>>,
		options: { force?: boolean; staleTime: number },
	): Promise<ValidationResult<Res>>;
	__seedData<Res>(cacheKey: CacheKey, data: Res): void;
	__subscribe(cacheKey: CacheKey, listener: EndpointDataListener): () => void;
}

export interface EndpointInvalidateTarget<Req = any, Res = any> {
	endpoint: ApiEndpoint<Req, Res>;
	request?: Req;
}

type EndpointInvalidateTargets =
	| EndpointInvalidateTarget<any, any>
	| readonly EndpointInvalidateTarget<any, any>[]
	| undefined;

export interface UseEndpointQueryOptions<Req, Res, Selected = Res> {
	client?: EndpointDataClient;
	enabled?: boolean;
	fetchFn?: ApiFetch;
	initialData?: Res;
	onError?: (error: unknown) => void | Promise<void>;
	onSuccess?: (
		data: Selected,
		validation: ValidationResult<Res>,
	) => void | Promise<void>;
	resolveCallOptions?: () => EndpointCallOptions | undefined;
	select?: (data: Res) => Selected;
	staleTime?: number;
}

export interface UseEndpointQueryResult<Res, Selected = Res> {
	data: Selected | undefined;
	error: unknown;
	isFetching: boolean;
	isLoading: boolean;
	refetch: () => Promise<ValidationResult<Res>>;
	validation: ValidationResult<Res> | null;
}

export interface UseEndpointMutationOptions<Req, Res, Context = unknown> {
	client?: EndpointDataClient;
	fetchFn?: ApiFetch;
	invalidate?:
		| EndpointInvalidateTargets
		| ((
				data: Res | undefined,
				variables: Req,
				validation: ValidationResult<Res>,
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
			validation: ValidationResult<Res> | null;
		},
		variables: Req,
		client: EndpointDataClient,
		context: Context | undefined,
	) => void | Promise<void>;
	onSuccess?: (
		data: Res | undefined,
		variables: Req,
		validation: ValidationResult<Res>,
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
	mutateAsync: (variables: Req) => Promise<ValidationResult<Res>>;
	reset: () => void;
	validation: ValidationResult<Res> | null;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

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

	return Date.now() - entry.updatedAt > staleTime;
}

function asInternalClient(client: EndpointDataClient): InternalEndpointDataClient {
	return client as InternalEndpointDataClient;
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
				entry.validation = {
					data: resolvedNext,
					errors: [],
					isValid: true,
				};
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
			entry.validation = validation as ValidationResult<unknown>;
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
			if (!force) {
					if (entry.promise) {
						return entry.promise as Promise<ValidationResult<any>>;
					}
					if (!isEntryStale(entry, staleTime) && entry.validation) {
						return entry.validation as ValidationResult<any>;
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
							entry.validation = validation as ValidationResult<unknown>;
							if (validation.isValid) {
								entry.data = validation.data;
							}
						}
						syncSnapshot(entry);
						return validation;
					})
					.catch((error: unknown) => {
						entry.error = error;
						syncSnapshot(entry);
						throw error;
					})
					.finally(() => {
						entry.isFetching = false;
						entry.promise = null;
						syncSnapshot(entry);
						notify(cacheKey);
					});

				entry.promise = promise as Promise<ValidationResult<unknown>>;
				return promise as Promise<ValidationResult<any>>;
			},
		__seedData(cacheKey, data) {
			const entry = getOrCreateEntry(entries, cacheKey);
			if (entry.validation) {
				return;
			}

			entry.data = data;
			entry.error = null;
			entry.updatedAt = Date.now();
				entry.validation = {
					data,
					errors: [],
					isValid: true,
				};
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
): UseEndpointQueryResult<Res, Selected> {
	if (endpoint.method !== "GET") {
		throw new Error("useEndpointQuery only supports GET endpoints in v1.");
	}

	const client = asInternalClient(options.client ?? useEndpointDataClient());
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

	const refetchRef = useRef<() => Promise<ValidationResult<Res>>>();
	const executeQueryRef = useRef<
		(force: boolean) => Promise<ValidationResult<Res>>
	>();
	if (!executeQueryRef.current) {
		executeQueryRef.current = async (force) => {
			const latest = latestRef.current;
			if (!latest.requestValidation.isValid) {
				const invalidValidation =
					latest.requestValidation as unknown as ValidationResult<Res>;
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

				if (validation.isValid && validation.data !== undefined) {
					const selected =
						latest.select !== undefined
							? latest.select(validation.data)
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
			refetch() as Promise<ValidationResult<unknown>>,
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
				prepared.requestValidation,
			);
			return;
		}

		if (snapshot.isFetching) {
			return;
		}

		const shouldFetch =
			snapshot.updatedAt === 0
				? initialData === undefined
				: snapshot.invalidatedAt > snapshot.updatedAt ||
					Date.now() - snapshot.updatedAt > staleTime;

		if (!shouldFetch) {
			return;
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
			snapshot.data === undefined ? initialData : (snapshot.data as Res | undefined);
		if (rawData === undefined) {
			return undefined;
		}

		return select !== undefined
			? select(rawData)
			: (rawData as unknown as Selected);
	}, [initialData, select, snapshot.data]);

	return {
		data,
		error: snapshot.error,
		isFetching: snapshot.isFetching,
		isLoading:
			snapshot.isFetching &&
			data === undefined,
		refetch,
		validation: snapshot.validation as ValidationResult<Res> | null,
	};
}

export function useEndpointMutation<Req, Res, Context = unknown>(
	endpoint: ApiEndpoint<Req, Res>,
	options: UseEndpointMutationOptions<Req, Res, Context> = {},
): UseEndpointMutationResult<Req, Res> {
	const client = options.client ?? useEndpointDataClient();
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
	const [validation, setValidation] = useState<ValidationResult<Res> | null>(null);
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

	const mutateAsyncRef = useRef<(variables: Req) => Promise<ValidationResult<Res>>>();
	if (!mutateAsyncRef.current) {
		mutateAsyncRef.current = async (variables: Req) => {
			const latest = latestRef.current;
			setIsPending(true);
			setError(null);
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
				}

				await latest.onSettled?.(
					{
						data: result.data,
						error: null,
						validation: result,
					},
					variables,
					latest.client,
					context,
				);

				return result;
			} catch (nextError) {
				setError(nextError);
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
				setIsPending(false);
			}
		};
	}
	const mutateAsync = mutateAsyncRef.current;

	const mutate = (variables: Req) => {
		void mutateAsync(variables).catch(() => {});
	};

	const reset = () => {
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
