import {
	isFormDataLike,
	isPlainObject,
	type ValidationResult,
} from "./runtime-primitives.js";
import {
	encodeGetLikeRequest,
	joinPathWithQuery,
	joinUrlWithQuery,
	mergeHeaderInputs,
	parseResponsePayload,
} from "./client-utils.js";

export type EndpointMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export type EndpointAuthIntent =
	| "authenticated"
	| "public"
	| "public-write-protected";

export type { ValidationError, ValidationLike, ValidationResult } from "./runtime-primitives.js";

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
	authIntent?: EndpointAuthIntent;
	authMode?: string;
	buildRequestOptions?: (request: Req) => Partial<EndpointTransportRequest>;
	method: EndpointMethod;
	operationId?: string;
	path: string;
	requestLocation?: "body" | "query" | "query-and-body";
	validateRequest: (input: unknown) => ValidationResult<Req>;
	validateResponse: (input: unknown) => ValidationResult<Res>;
}

export interface EndpointCallOptions {
	requestOptions?: Partial<Omit<EndpointTransportRequest, "parse">>;
	transport?: EndpointTransport;
}

type ComputedHeadersResolver = (
	request: Readonly<EndpointTransportRequest>,
) => HeadersInit | undefined | Promise<HeadersInit | undefined>;

type HeaderValueResolver =
	| string
	| null
	| undefined
	| ((
			request: Readonly<EndpointTransportRequest>,
	  ) => string | null | undefined | Promise<string | null | undefined>);

interface FetchTransportOptions {
	baseUrl: string;
	defaultHeaders?: HeadersInit;
	fetchFn?: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>;
}
export { normalizeValidationError, toValidationResult } from "./runtime-primitives.js";

function resolveRequestUrl(options: EndpointTransportRequest, baseUrl: string): string {
	if (typeof options.url === "string" && options.url.length > 0) {
		return new URL(options.url, baseUrl).toString();
	}

	if (typeof options.path === "string" && options.path.length > 0) {
		return new URL(options.path.replace(/^\/+/, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
	}

	throw new Error("Transport requests must include either a path or a url.");
}

function createReadonlyTransportRequest(
	request: EndpointTransportRequest,
): Readonly<EndpointTransportRequest> {
	return { ...request };
}

function buildQueryRequestOptions<Req>(
	endpoint: ApiEndpoint<Req, unknown>,
	baseOptions: Partial<EndpointTransportRequest>,
	request: unknown,
): EndpointTransportRequest {
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

function buildBodyRequestOptions<Req>(
	endpoint: ApiEndpoint<Req, unknown>,
	baseOptions: Partial<EndpointTransportRequest>,
	request: unknown,
): EndpointTransportRequest {
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

function resolveCombinedRequest(
	request: unknown,
): { body: unknown; query: unknown } {
	if (
		!isPlainObject(request) ||
		!Object.prototype.hasOwnProperty.call(request, "body") ||
		!Object.prototype.hasOwnProperty.call(request, "query")
	) {
		throw new Error(
			`Endpoints with requestLocation "query-and-body" require requests shaped like { query, body }.`,
		);
	}

	return {
		body: request.body,
		query: request.query,
	};
}

function buildEndpointRequestOptions<Req>(
	endpoint: ApiEndpoint<Req, unknown>,
	request: Req,
): EndpointTransportRequest {
	const requestLocation =
		endpoint.requestLocation ?? (endpoint.method === "GET" ? "query" : "body");

	if (requestLocation === "query") {
		const baseOptions = endpoint.buildRequestOptions?.(request) ?? {};
		return buildQueryRequestOptions(endpoint, baseOptions, request);
	}

	if (requestLocation === "query-and-body") {
		if (endpoint.method === "GET") {
			throw new Error(
				'requestLocation "query-and-body" is not supported for GET endpoints.',
			);
		}

		const combinedRequest = resolveCombinedRequest(request);
		const baseOptions = endpoint.buildRequestOptions?.(request) ?? {};
		const bodyOptions = buildBodyRequestOptions(
			endpoint,
			baseOptions,
			combinedRequest.body,
		);
		return buildQueryRequestOptions(endpoint, bodyOptions, combinedRequest.query);
	}

	const baseOptions = endpoint.buildRequestOptions?.(request) ?? {};
	return buildBodyRequestOptions(endpoint, baseOptions, request);
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

export function withHeaders(
	transport: EndpointTransport,
	headers: HeadersInit,
): EndpointTransport {
	return withComputedHeaders(transport, () => headers);
}

export function withComputedHeaders(
	transport: EndpointTransport,
	resolveHeaders: ComputedHeadersResolver,
): EndpointTransport {
	return async <T = unknown, Parse extends boolean = true>(
		options: EndpointTransportRequest & { parse?: Parse },
	): Promise<Parse extends false ? Response : T> => {
		const computedHeaders = await resolveHeaders(createReadonlyTransportRequest(options));

		return transport<T, Parse>({
			...options,
			headers: mergeHeaderInputs(computedHeaders, options.headers),
		});
	};
}

export function withHeaderValue(
	transport: EndpointTransport,
	headerName: string,
	resolveValue: HeaderValueResolver,
): EndpointTransport {
	return withComputedHeaders(transport, async (request) => {
		const value =
			typeof resolveValue === "function"
				? await resolveValue(request)
				: resolveValue;

		return value === undefined || value === null
			? undefined
			: { [headerName]: value };
	});
}

export function withBearerToken(
	transport: EndpointTransport,
	resolveToken: HeaderValueResolver,
): EndpointTransport {
	return withHeaderValue(transport, "Authorization", async (request) => {
		const token =
			typeof resolveToken === "function"
				? await resolveToken(request)
				: resolveToken;

		return token === undefined || token === null || token === ""
			? undefined
			: `Bearer ${token}`;
	});
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
		{
			...mergeTransportOptions(buildEndpointRequestOptions(endpoint, request), requestOptions),
			parse: true,
		},
	);
	return endpoint.validateResponse(payload);
}
