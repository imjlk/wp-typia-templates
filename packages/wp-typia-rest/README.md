# `@wp-typia/rest`

Typed WordPress REST helpers for `wp-typia`.

This package focuses on:

- validated `apiFetch` wrappers
- typed endpoint helpers
- optional query/header decoder helpers that can wrap Typia-generated HTTP decoders

It does not include any WordPress PHP bridge logic. Generated PHP route code stays in `@wp-typia/create` templates.

Typical usage:

```ts
import { callEndpoint, createEndpoint } from "@wp-typia/rest";

const endpoint = createEndpoint<MyRequest, MyResponse>({
  method: "POST",
  path: "/my-namespace/v1/demo",
  validateRequest: validators.request,
  validateResponse: validators.response,
});

const result = await callEndpoint(endpoint, { title: "Hello" });
```

If you want Typia-powered HTTP decoding, compile the decoder in the consumer project and pass it in:

```ts
import typia from "typia";
import { createQueryDecoder } from "@wp-typia/rest";

const decodeQuery = createQueryDecoder(
  typia.http.createValidateQuery<MyQuery>()
);
```
