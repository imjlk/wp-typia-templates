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
} from "@wp-typia/api-client";

const transport = createFetchTransport({
	baseUrl: "http://127.0.0.1:8787",
});

const endpoint = createEndpoint<MyRequest, MyResponse>({
	method: "POST",
	path: "/my-namespace/v1/demo",
	validateRequest: validators.request,
	validateResponse: validators.response,
});

const result = await callEndpoint(endpoint, { title: "Hello" }, { transport });
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
REST route URL resolution and `@wordpress/api-fetch` integration.
