import type { APIFetchOptions, ApiFetch } from "@wordpress/api-fetch";
import {
	encodeGetLikeRequest,
	joinPathWithQuery,
	joinUrlWithQuery,
	mergeHeaderInputs,
	parseResponsePayload,
} from "@wp-typia/api-client/client-utils";
import {
	isFormDataLike,
	toValidationResult,
	type ValidationLike,
	type ValidationResult,
} from "./internal/runtime-primitives.js";

export type { ValidationError, ValidationLike, ValidationResult } from "./internal/runtime-primitives.js";
export { isValidationResult, normalizeValidationError, toValidationResult } from "./internal/runtime-primitives.js";

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
				return new URL(href, window.location.origin).toString();
			}
		}
	}

	throw new Error(
		"Unable to resolve the WordPress REST root automatically. Provide wpApiSettings.root, an api.w.org discovery link, or an explicit url.",
	);
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
			body: request as FormData,
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
		headers: mergeHeaderInputs(
			{ "Content-Type": "application/json" },
			baseOptions.headers as HeadersInit | undefined,
		),
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

	const { headers: requestHeaders, ...transportOptions } = requestOptions;

	return {
		...baseOptions,
		...transportOptions,
		headers: mergeHeaderInputs(baseOptions.headers, requestHeaders),
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
			const payload = await parseResponsePayload(response.clone());
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
