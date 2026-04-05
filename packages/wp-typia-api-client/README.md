# `@wp-typia/api-client`

Transport-neutral REST client helpers for `wp-typia`.

This package focuses on:

- typed endpoint helpers
- transport-neutral request execution
- explicit fetch transport creation with a caller-provided base URL
- Typia-compatible request and response validation hooks

It does not include:

- WordPress REST root discovery
- `wpApiSettings`
- `@wordpress/api-fetch`
- automatic nonce or signed-token handling

Typical usage:

```ts
import {
	callEndpoint,
	createEndpoint,
	createFetchTransport,
	withBearerToken,
} from "@wp-typia/api-client";

const transport = withBearerToken(
	createFetchTransport({
		baseUrl: "http://127.0.0.1:8787",
	}),
	() => localStorage.getItem("access_token"),
);

const endpoint = createEndpoint<MyRequest, MyResponse>({
	method: "POST",
	path: "/my-namespace/v1/demo",
	validateRequest: validators.request,
	validateResponse: validators.response,
});

const result = await callEndpoint(endpoint, { title: "Hello" }, { transport });
```

Adapter-level decorators can enrich requests without making auth policy part of
the endpoint contract itself:

```ts
import {
	createFetchTransport,
	withComputedHeaders,
	withHeaderValue,
	withHeaders,
} from "@wp-typia/api-client";

const transport = withComputedHeaders(
	withHeaders(
		createFetchTransport({ baseUrl: "https://api.example.test/" }),
		{ "X-Client": "portable-demo" },
	),
	async (request) => ({
		"X-Request-Method": String(request.method ?? "GET"),
	}),
);

const wpTransport = withHeaderValue(
	transport,
	"X-WP-Nonce",
	() => window.wpApiSettings?.nonce,
);
```

When an endpoint needs both query parameters and a request body, use
`requestLocation: "query-and-body"` and pass a `{ query, body }` envelope:

```ts
const mixedEndpoint = createEndpoint<
	{ query: { draft: boolean }; body: { title: string } },
	{ ok: boolean }
>({
	method: "POST",
	path: "/my-namespace/v1/demo",
	requestLocation: "query-and-body",
	validateRequest: validators.mixedRequest,
	validateResponse: validators.response,
});

const result = await callEndpoint(
	mixedEndpoint,
	{
		query: { draft: true },
		body: { title: "Hello" },
	},
	{ transport },
);
```

Use `@wp-typia/rest` when you want WordPress-specific helpers such as canonical
REST route URL resolution and `@wordpress/api-fetch` integration. Manifest
`authMode` remains metadata only; adapter-level decorators such as
`withHeaders(...)`, `withHeaderValue(...)`, and `withBearerToken(...)` are the
portable runtime layer for attaching headers or tokens when a consumer needs
them.
