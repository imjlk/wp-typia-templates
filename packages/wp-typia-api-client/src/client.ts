import type { IValidation } from "@typia/interface";

export type EndpointMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

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

export interface EndpointTransportRequest {
	body?: BodyInit | null;
	headers?: HeadersInit;
	method?: EndpointMethod;
	parse?: boolean;
	path?: string;
	url?: string;
}

export type EndpointTransport = <T = unknown, Parse extends boolean = true>(
	options: EndpointTransportRequest & { parse?: Parse },
) => Promise<Parse extends false ? Response : T>;

export interface ApiEndpoint<Req, Res> {
	authMode?: string;
	buildRequestOptions?: (request: Req) => Partial<EndpointTransportRequest>;
	method: EndpointMethod;
	operationId?: string;
	path: string;
	validateRequest: (input: unknown) => ValidationResult<Req>;
	validateResponse: (input: unknown) => ValidationResult<Res>;
}

export interface EndpointCallOptions {
	requestOptions?: Partial<EndpointTransportRequest>;
	transport?: EndpointTransport;
}

interface FetchTransportOptions {
	baseUrl: string;
	defaultHeaders?: HeadersInit;
	fetchFn?: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>;
}

interface RawValidationError {
	description?: string;
	expected?: string;
	path?: string;
	value?: unknown;
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

function isValidationResult<T>(value: unknown): value is ValidationResult<T> {
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

function resolveRequestUrl(options: EndpointTransportRequest, baseUrl: string): string {
	if (typeof options.url === "string" && options.url.length > 0) {
		return new URL(options.url, baseUrl).toString();
	}

	if (typeof options.path === "string" && options.path.length > 0) {
		return new URL(options.path.replace(/^\/+/, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
	}

	throw new Error("Transport requests must include either a path or a url.");
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

	const [urlWithoutHash, hash = ""] = url.split("#", 2);
	const nextUrl = urlWithoutHash.includes("?")
		? `${urlWithoutHash}&${query}`
		: `${urlWithoutHash}?${query}`;

	return hash ? `${nextUrl}#${hash}` : nextUrl;
}

function mergeHeaderInputs(
	baseHeaders?: HeadersInit,
	requestHeaders?: HeadersInit,
): Record<string, string> | undefined {
	if (!baseHeaders && !requestHeaders) {
		return undefined;
	}

	const mergedHeaders = new Headers(baseHeaders);
	const nextHeaders = new Headers(requestHeaders);

	for (const [key, value] of nextHeaders.entries()) {
		mergedHeaders.set(key, value);
	}

	return Object.fromEntries(mergedHeaders.entries());
}

function buildEndpointRequestOptions<Req>(
	endpoint: ApiEndpoint<Req, unknown>,
	request: Req,
): EndpointTransportRequest {
	const baseOptions = endpoint.buildRequestOptions?.(request) ?? {};

	if (endpoint.method === "GET" || endpoint.method === "DELETE") {
		const query = encodeGetLikeRequest(request);
		const resolvedUrl = baseOptions.url ? joinUrlWithQuery(baseOptions.url, query) : undefined;
		return {
			...baseOptions,
			method: endpoint.method,
			...(resolvedUrl
				? { path: undefined, url: resolvedUrl }
				: { path: joinPathWithQuery(baseOptions.path ?? endpoint.path, query) }),
		};
	}

	if (isFormDataLike(request)) {
		return {
			...baseOptions,
			body: request,
			method: endpoint.method,
			...(baseOptions.url
				? { path: undefined, url: baseOptions.url }
				: { path: baseOptions.path ?? endpoint.path }),
		};
	}

	return {
		...baseOptions,
		body: typeof request === "string" ? request : JSON.stringify(request),
		headers: mergeHeaderInputs({ "Content-Type": "application/json" }, baseOptions.headers),
		method: endpoint.method,
		...(baseOptions.url
			? { path: undefined, url: baseOptions.url }
			: { path: baseOptions.path ?? endpoint.path }),
	};
}

function mergeTransportOptions(
	baseOptions: EndpointTransportRequest,
	requestOptions?: Partial<EndpointTransportRequest>,
): EndpointTransportRequest {
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

export function createFetchTransport({
	baseUrl,
	defaultHeaders,
	fetchFn = fetch,
}: FetchTransportOptions): EndpointTransport {
	return async <T = unknown, Parse extends boolean = true>(
		options: EndpointTransportRequest & { parse?: Parse },
	): Promise<Parse extends false ? Response : T> => {
		const response = await fetchFn(resolveRequestUrl(options, baseUrl), {
			body: options.body,
			headers: mergeHeaderInputs(defaultHeaders, options.headers),
			method: options.method ?? "GET",
		});

		if (options.parse === false) {
			return response as Parse extends false ? Response : T;
		}

		return (await parseResponsePayload(response)) as Parse extends false ? Response : T;
	};
}

export function createEndpoint<Req, Res>(config: ApiEndpoint<Req, Res>): ApiEndpoint<Req, Res> {
	return config;
}

export async function callEndpoint<Req, Res>(
	endpoint: ApiEndpoint<Req, Res>,
	request: Req,
	{ requestOptions, transport }: EndpointCallOptions = {},
): Promise<ValidationResult<Res>> {
	const requestValidation = endpoint.validateRequest(request);
	if (!requestValidation.isValid) {
		return requestValidation as unknown as ValidationResult<Res>;
	}

	if (!transport) {
		throw new Error(
			"A transport is required. Create one with createFetchTransport({ baseUrl }) or supply a custom EndpointTransport.",
		);
	}

	const payload = await transport<unknown, true>(
		mergeTransportOptions(buildEndpointRequestOptions(endpoint, request), requestOptions) as EndpointTransportRequest & {
			parse?: true;
		},
	);
	return endpoint.validateResponse(payload);
}
