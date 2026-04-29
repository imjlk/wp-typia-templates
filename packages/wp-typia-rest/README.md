# `@wp-typia/rest`

Typed WordPress REST helpers for `wp-typia`.

This package focuses on:

- validated `apiFetch` wrappers
- typed endpoint helpers
- optional resource-level facades that group endpoint contracts
- canonical WordPress REST route URL resolution
- a React/data convenience layer at `@wp-typia/rest/react`
- optional query/header decoder helpers that can wrap Typia-generated HTTP decoders

It does not include any WordPress PHP bridge logic. Generated PHP route code stays in `@wp-typia/project-tools` templates.

If you need a backend-neutral consumer instead of WordPress-specific route
resolution, use `@wp-typia/api-client`.

## Export contract

- `@wp-typia/rest`
  Canonical convenience surface. It intentionally combines the transport helper
  layer and the HTTP decoder helpers.
- `@wp-typia/rest/client`
  Focused transport surface for endpoint creation, validated fetch helpers,
  WordPress REST route resolution, validation utilities, and named runtime
  errors.
- `@wp-typia/rest/http`
  Focused decoder surface for query/header/parameter decoders plus the shared
  validation helper utilities they return.
- `@wp-typia/rest/react`
  React-only cache and hook layer.

Prefer the root entry when you want the shortest import path. Reach for
`./client` or `./http` when a narrower surface makes the consumer boundary
clearer. Query and mutation hooks still live on the React-only subpath:

```ts
import { useEndpointMutation, useEndpointQuery } from '@wp-typia/rest/react';
```

Typical usage:

```ts
import { callEndpoint, createEndpoint } from '@wp-typia/rest';

const endpoint = createEndpoint<MyRequest, MyResponse>({
  method: 'POST',
  path: '/my-namespace/v1/demo',
  validateRequest: validators.request,
  validateResponse: validators.response,
});

const result = await callEndpoint(endpoint, { title: 'Hello' });
```

`callEndpoint(...)` returns `EndpointValidationResult<Req, Res>`. If request
validation fails before transport execution, the result keeps
`validationTarget: "request"`. Response validation runs after transport and uses
`validationTarget: "response"`.

When a feature or screen should consume a REST collection as a resource instead
of a loose set of endpoint functions, you can group the existing contracts with
`defineRestResource(...)`:

```ts
import {
  createEndpoint,
  defineRestResource,
  defineRestResourceListQuery,
  toRestResourceListRequest,
} from '@wp-typia/rest';

const products = defineRestResource({
  endpoints: {
    list: createEndpoint<ProductListQuery, ProductListResponse>({
      method: 'GET',
      path: '/my-plugin/v1/products',
      validateRequest: validators.listRequest,
      validateResponse: validators.listResponse,
    }),
  },
  idField: 'id',
  listQuery: defineRestResourceListQuery(
    (view: { page: number; term?: string }) => ({
      page: view.page,
      ...(view.term ? { search: view.term } : {}),
    }),
  ),
  namespace: 'my-plugin/v1',
  path: '/products',
});

const request = toRestResourceListRequest(products, {
  page: 1,
  term: 'hero',
});
const result = await products.list(request);
```

The facade is additive: it does not replace `createEndpoint(...)`,
`callEndpoint(...)`, or hand-authored endpoint exports. Generated
`wp-typia add rest-resource` sources can keep exporting individual endpoints and
optionally layer a resource facade on top for DataViews screens or other
resource-oriented consumers.

Invalid request/response payloads stay in that result union. Thrown exceptions
are reserved for public runtime misconfiguration or assertion APIs:

- `RestConfigurationError`
- `RestRootResolutionError`
- `RestQueryHookUsageError`
- `RestValidationAssertionError`
- shared base classes re-exported from `@wp-typia/api-client`:
  `WpTypiaContractError` and `WpTypiaValidationAssertionError`

If you need a canonical REST URL for a route path, use:

```ts
import { resolveRestRouteUrl } from '@wp-typia/rest/client';

const url = resolveRestRouteUrl('/my-namespace/v1/demo');
```

If you want Typia-powered HTTP decoding, compile the decoder in the consumer project and pass it in:

```ts
import typia from 'typia';
import { createQueryDecoder } from '@wp-typia/rest/http';

const decodeQuery = createQueryDecoder(
  typia.http.createValidateQuery<MyQuery>(),
);
```

## `@wp-typia/rest/react`

The `./react` subpath adds a small cache client and React hook layer on top of
`callEndpoint(...)`:

- `createEndpointDataClient()`
- `EndpointDataProvider`
- `useEndpointDataClient()`
- `useEndpointQuery(endpoint, request, options?)`
- `useEndpointMutation(endpoint, options?)`
- `useRestResourceListQuery(resource, request, options?)`
- `useRestResourceReadQuery(resource, request, options?)`
- `useRestResourceCreateMutation(resource, options?)`
- `useRestResourceUpdateMutation(resource, options?)`
- `useRestResourceDeleteMutation(resource, options?)`

`useEndpointQuery(...)` is GET-only in this first pass. Mutations and explicit
non-query calls go through `useEndpointMutation(...)`.

```tsx
import { useEndpointMutation, useEndpointQuery } from '@wp-typia/rest/react';

const query = useEndpointQuery(stateEndpoint, request, {
  staleTime: 30_000,
  resolveCallOptions: () => ({
    requestOptions: {
      headers: {
        'X-WP-Nonce': resolveRestNonce(),
      },
    },
  }),
});

const mutation = useEndpointMutation(writeStateEndpoint, {
  invalidate: { endpoint: stateEndpoint, request },
  resolveCallOptions: () => ({
    requestOptions: {
      headers: {
        'X-WP-Nonce': resolveRestNonce(),
      },
    },
  }),
});
```

Those resource-aware hooks stay thin wrappers over the existing endpoint hooks,
so they inherit the same validation result behavior and cache client model.
Reach for them when you already grouped contracts with `defineRestResource(...)`
and want React/DataViews code to consume the same resource facade.

The refresh model is explicit:

- query hooks re-evaluate the latest `request` and `resolveCallOptions()` on
  each execution
- mutation hooks use the latest variables passed to `mutate(...)` and the latest
  `resolveCallOptions(variables)`
- stale nonces or public tokens do not trigger automatic retries; callers should
  refresh auth state and then call `refetch()` or `mutate()` again

For persistence scaffolds generated by `wp-typia create`, `src/api.ts` remains
the WordPress call helper layer and `src/data.ts` adds block-specific wrappers
around `@wp-typia/rest/react`.
