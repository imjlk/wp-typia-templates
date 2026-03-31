import type { APIFetchOptions, ApiFetch } from "@wordpress/api-fetch";
import type { IValidation } from "@typia/interface";

export interface ValidationError {
	description?: string;
	expected: string;
	path: string;
	value: unknown;
}

export interface ValidationResult<T> {
	data?: T;
	errors: ValidationError[];
	isValid: boolean;
}

export type ValidationLike<T> =
	| IValidation<T>
	| {
			data?: unknown;
			errors?: unknown;
			success?: unknown;
	  };

export interface ValidatedFetch<T> {
	assertFetch(options: APIFetchOptions): Promise<T>;
	fetch(options: APIFetchOptions): Promise<ValidationResult<T>>;
	fetchWithResponse(
		options: APIFetchOptions<false>,
	): Promise<{ response: Response; validation: ValidationResult<T> }>;
	isFetch(options: APIFetchOptions): Promise<T | null>;
}

export interface ApiEndpoint<Req, Res> {
	buildRequestOptions?: (request: Req) => Partial<APIFetchOptions>;
	method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
	path: string;
	validateRequest: (input: unknown) => ValidationResult<Req>;
	validateResponse: (input: unknown) => ValidationResult<Res>;
}

export interface EndpointCallOptions {
	fetchFn?: ApiFetch;
	requestOptions?: Partial<APIFetchOptions>;
}

interface RawValidationError {
	description?: string;
	expected?: string;
	path?: string;
	value?: unknown;
}

function getDefaultRestRoot(): string {
	if (typeof window !== "undefined") {
		const wpApiSettings = (window as typeof window & {
			wpApiSettings?: { root?: string };
		}).wpApiSettings;

		if (typeof wpApiSettings?.root === "string" && wpApiSettings.root.length > 0) {
			return wpApiSettings.root;
		}

		if (typeof document !== "undefined") {
			const apiLink = document.querySelector('link[rel="https://api.w.org/"]');
			const href = apiLink?.getAttribute("href");

			if (typeof href === "string" && href.length > 0) {
				return href;
			}
		}

		return `${window.location.origin}/wp-json/`;
	}

	return "http://localhost/wp-json/";
}

export function resolveRestRouteUrl(routePath: string, root = getDefaultRestRoot()): string {
	const [pathWithQuery, hash = ""] = routePath.split("#", 2);
	const [rawPath, rawQuery = ""] = pathWithQuery.split("?", 2);
	const normalizedRoute = `/${rawPath.replace(/^\/+/, "").replace(/\/+$/, "")}/`;
	const queryParams = new URLSearchParams(rawQuery);
	const resolvedRoot = typeof window !== "undefined" ? new URL(root, window.location.origin) : new URL(root);

	if (resolvedRoot.searchParams.has("rest_route")) {
		resolvedRoot.searchParams.set("rest_route", normalizedRoute);
		for (const [key, value] of queryParams) {
			resolvedRoot.searchParams.append(key, value);
		}
		if (hash) {
			resolvedRoot.hash = hash;
		}
		return resolvedRoot.toString();
	}

	const basePath = resolvedRoot.pathname.endsWith("/") ? resolvedRoot.pathname : `${resolvedRoot.pathname}/`;
	resolvedRoot.pathname = `${basePath}${normalizedRoute.slice(1)}`;
	for (const [key, value] of queryParams) {
		resolvedRoot.searchParams.append(key, value);
	}
	if (hash) {
		resolvedRoot.hash = hash;
	}
	return resolvedRoot.toString();
}

function resolveFetchUrl(options: APIFetchOptions): string {
	if (typeof options.url === "string" && options.url.length > 0) {
		return options.url;
	}

	if (typeof options.path === "string" && options.path.length > 0) {
		return resolveRestRouteUrl(options.path);
	}

	throw new Error("API fetch options must include either a path or a url.");
}

async function defaultFetch<T = unknown, Parse extends boolean = true>(
	options: APIFetchOptions<Parse>,
): Promise<Parse extends false ? Response : T> {
	const response = await fetch(resolveFetchUrl(options), {
		body: options.body as BodyInit | null | undefined,
		credentials: "same-origin",
		headers: options.headers as HeadersInit | undefined,
		method: options.method ?? "GET",
	});

	if (options.parse === false) {
		return response as Parse extends false ? Response : T;
	}

	if (response.status === 204) {
		return undefined as Parse extends false ? Response : T;
	}

	const text = await response.text();
	if (!text) {
		return undefined as Parse extends false ? Response : T;
	}

	try {
		return JSON.parse(text) as Parse extends false ? Response : T;
	} catch {
		return text as Parse extends false ? Response : T;
	}
}

async function parseResponsePayload(response: Response): Promise<unknown> {
	if (response.status === 204) {
		return undefined;
	}

	const text = await response.text();
	if (!text) {
		return undefined;
	}

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFormDataLike(value: unknown): value is FormData {
	return typeof FormData !== "undefined" && value instanceof FormData;
}

function normalizePath(path: unknown): string {
	return typeof path === "string" && path.length > 0 ? path : "(root)";
}

function normalizeExpected(expected: unknown): string {
	return typeof expected === "string" && expected.length > 0 ? expected : "unknown";
}

export function normalizeValidationError(error: unknown): ValidationError {
	const raw = isPlainObject(error) ? (error as RawValidationError) : {};

	return {
		description: typeof raw.description === "string" ? raw.description : undefined,
		expected: normalizeExpected(raw.expected),
		path: normalizePath(raw.path),
		value: Object.prototype.hasOwnProperty.call(raw, "value") ? raw.value : undefined,
	};
}

export function isValidationResult<T>(value: unknown): value is ValidationResult<T> {
	return isPlainObject(value) && typeof value.isValid === "boolean" && Array.isArray(value.errors);
}

export function toValidationResult<T>(result: ValidationLike<T>): ValidationResult<T> {
	const rawResult = result as {
		data?: unknown;
		errors?: unknown;
		success?: unknown;
	};
	if (isValidationResult<T>(result)) {
		return result;
	}

	if (rawResult.success === true) {
		return {
			data: rawResult.data as T | undefined,
			errors: [],
			isValid: true,
		};
	}

	return {
		data: undefined,
		errors: Array.isArray(rawResult.errors) ? rawResult.errors.map(normalizeValidationError) : [],
		isValid: false,
	};
}

function encodeGetLikeRequest(request: unknown): string {
	if (request === undefined || request === null) {
		return "";
	}

	if (request instanceof URLSearchParams) {
		return request.toString();
	}

	if (!isPlainObject(request)) {
		throw new Error("GET/DELETE endpoint requests must be plain objects or URLSearchParams.");
	}

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(request)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				params.append(key, String(item));
			}
			continue;
		}
		params.set(key, String(value));
	}

	return params.toString();
}

function joinPathWithQuery(path: string, query: string): string {
	if (!query) {
		return path;
	}

	return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

function joinUrlWithQuery(url: string, query: string): string {
	if (!query) {
		return url;
	}

	const nextUrl = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
	for (const [key, value] of new URLSearchParams(query)) {
		nextUrl.searchParams.append(key, value);
	}
	return nextUrl.toString();
}

function buildEndpointFetchOptions<Req>(
	endpoint: ApiEndpoint<Req, unknown>,
	request: Req,
): APIFetchOptions {
	const baseOptions = endpoint.buildRequestOptions?.(request) ?? {};

	if (endpoint.method === "GET" || endpoint.method === "DELETE") {
		const query = encodeGetLikeRequest(request);
		const resolvedUrl = baseOptions.url ? joinUrlWithQuery(baseOptions.url, query) : undefined;
		return {
			...baseOptions,
			method: endpoint.method,
			...(resolvedUrl ? { url: resolvedUrl, path: undefined } : {
				path: joinPathWithQuery(baseOptions.path ?? endpoint.path, query),
			}),
		};
	}

	if (isFormDataLike(request)) {
		return {
			...baseOptions,
			body: request,
			method: endpoint.method,
			...(baseOptions.url
				? {
						url: baseOptions.url,
						path: undefined,
					}
				: {
						path: baseOptions.path ?? endpoint.path,
					}),
		};
	}

	return {
		...baseOptions,
		body: typeof request === "string" ? request : JSON.stringify(request),
		headers: {
			"Content-Type": "application/json",
			...(baseOptions.headers ?? {}),
		},
		method: endpoint.method,
		...(baseOptions.url
			? {
					url: baseOptions.url,
					path: undefined,
				}
			: {
					path: baseOptions.path ?? endpoint.path,
				}),
	};
}

function mergeFetchOptions(
	baseOptions: APIFetchOptions,
	requestOptions?: Partial<APIFetchOptions>,
): APIFetchOptions {
	if (!requestOptions) {
		return baseOptions;
	}

	return {
		...baseOptions,
		...requestOptions,
		headers: {
			...(baseOptions.headers ?? {}),
			...(requestOptions.headers ?? {}),
		},
	};
}

export function createValidatedFetch<T>(
	validator: (input: unknown) => ValidationLike<T>,
	fetchFn: ApiFetch = defaultFetch as ApiFetch,
): ValidatedFetch<T> {
	return {
		async fetchWithResponse(options: APIFetchOptions<false>) {
			const response = await fetchFn<Response, false>({
				...options,
				parse: false,
			});
			const payload = await parseResponsePayload(response);
			return {
				response,
				validation: toValidationResult<T>(validator(payload)),
			};
		},
		async fetch(options: APIFetchOptions) {
			if (options.parse === false) {
				const { validation } = await this.fetchWithResponse(options as APIFetchOptions<false>);
				return validation;
			}

			const payload = await fetchFn<unknown, true>(options as APIFetchOptions<true>);
			return toValidationResult<T>(validator(payload));
		},
		async assertFetch(options: APIFetchOptions) {
			const result = await this.fetch(options);
			if (!result.isValid) {
				throw new Error(
					result.errors[0]
						? `${result.errors[0].path}: ${result.errors[0].expected}`
						: "REST response validation failed.",
				);
			}
			return result.data as T;
		},
		async isFetch(options: APIFetchOptions) {
			const result = await this.fetch(options);
			return result.isValid ? (result.data as T) : null;
		},
	};
}

export function createEndpoint<Req, Res>(config: ApiEndpoint<Req, Res>): ApiEndpoint<Req, Res> {
	return config;
}

export async function callEndpoint<Req, Res>(
	endpoint: ApiEndpoint<Req, Res>,
	request: Req,
	{ fetchFn = defaultFetch as ApiFetch, requestOptions }: EndpointCallOptions = {},
): Promise<ValidationResult<Res>> {
	const requestValidation = endpoint.validateRequest(request);
	if (!requestValidation.isValid) {
		return requestValidation as unknown as ValidationResult<Res>;
	}

	const payload = await fetchFn<unknown, true>(
		mergeFetchOptions(
			buildEndpointFetchOptions(endpoint, request),
			requestOptions,
		) as APIFetchOptions<true>,
	);
	return endpoint.validateResponse(payload);
}
