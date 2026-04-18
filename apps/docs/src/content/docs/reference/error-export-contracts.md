---
title: 'Error and Export Contracts'
---

This document is the normative contract for two repository-wide areas that need
stable downstream expectations:

- public runtime error semantics
- package export-surface semantics where overlapping subpaths can imply
  misleading meaning

## Error contract

### 1. Validation failures stay in result unions

When a public runtime API already exposes a validation result type, invalid
request or response payloads should remain in that value contract instead of
throwing generic exceptions.

Current canonical examples:

- `ValidationResult<T>`
- `EndpointValidationResult<Req, Res>`

That means:

- `callEndpoint(...)` should return request/response validation failures
- `createValidatedFetch(...).fetch(...)` should return validation failures
- validation failure is not itself a reason to introduce a new thrown error path

### 2. Public runtime misconfiguration uses named error classes

When a public runtime API must throw because the caller violated a usage or
configuration contract, it should prefer a named domain-specific error class
over a generic `Error`.

Current baseline:

- `WpTypiaContractError`
  Shared base for catch-worthy public runtime contract failures.
- `ApiClientConfigurationError`
  Transport-neutral client misuse or missing transport configuration.
- `RestConfigurationError`
  WordPress REST helper misconfiguration.
- `RestRootResolutionError`
  Automatic REST root discovery failed.
- `RestQueryHookUsageError`
  React hook misuse such as calling `useEndpointQuery(...)` on a non-GET
  endpoint.

### 3. Assertion helpers may throw typed validation assertion errors

Some helper APIs intentionally convert validation failures into thrown
exceptions because the caller explicitly opted into an assertion path.

Current baseline:

- `WpTypiaValidationAssertionError`
- `RestValidationAssertionError`

Those errors should carry the normalized validation payload so callers can
inspect the failure programmatically.

### 4. Internal authoring and invariant failures may stay generic

The repository still contains many internal parser, generator, migration,
metadata, and test-helper paths that throw generic `Error`.

That is acceptable when the throw site is:

- an internal invariant breach
- authoring/build-time drift
- generator/template failure
- a repo-local test helper or fixture failure

In other words, the repo is not adopting domain-specific classes for every
throw site immediately. The current contract is narrower:

- public runtime boundaries should be typed
- internal authoring/invariant paths may remain generic until there is a real
  downstream need to catch them programmatically

## Export-surface contract

### `@wp-typia/api-client`

- `@wp-typia/api-client`
  Canonical transport-neutral runtime surface.
- `@wp-typia/api-client/client-utils`
  Distinct low-level request/response helpers.
- `@wp-typia/api-client/runtime-primitives`
  Distinct validation/runtime primitive helpers.

These subpaths are semantically distinct and should remain documented that way.

### `@wp-typia/rest`

- `@wp-typia/rest`
  Canonical convenience surface. It intentionally combines the transport helper
  layer and the HTTP decoder helpers.
- `@wp-typia/rest/client`
  Focused transport/runtime surface for endpoint creation, validated fetch
  helpers, route resolution, validation helpers, and named runtime errors.
- `@wp-typia/rest/http`
  Focused decoder surface for query/header/parameter decoders plus the shared
  validation helper utilities they return.
- `@wp-typia/rest/react`
  React cache and hook surface.

Implications:

- prefer `@wp-typia/rest` when convenience matters more than import granularity
- prefer `@wp-typia/rest/client` when you want the transport boundary to stay
  explicit
- prefer `@wp-typia/rest/http` for decoder-only imports
- prefer `@wp-typia/rest/react` for hook imports

## Future direction

Future work may:

- expand named public runtime error classes into more subsystems
- keep tightening docs/tests so export semantics and catch-worthy error
  contracts remain explicit instead of ad hoc
