---
title: 'Package Manifest Policy'
---

`wp-typia` keeps two different manifest concerns separate:

- source manifests should make local monorepo development predictable
- published manifests must stay npm-safe and describe the intended runtime coupling

## Engine Baseline

The repository baseline is:

- `engines.node`: `>=20.0.0`
- `engines.npm`: `>=10.0.0`
- `engines.bun`: `>=1.3.11`

If a manifest already declares `packageManager`, it must use `bun@1.3.11`.

Intentional engine divergence should be treated as an exception and documented in the same PR that introduces it.

## Internal Dependency Policy

For publishable runtime packages, source manifests follow one coupling policy:

- `wp-typia -> @wp-typia/project-tools`: exact version
- every other runtime package edge: caret version

Current runtime coupling edges are validated in CI:

- `@wp-typia/rest -> @wp-typia/api-client`
- `@wp-typia/block-runtime -> @wp-typia/api-client`
- `@wp-typia/project-tools -> @wp-typia/api-client`
- `@wp-typia/project-tools -> @wp-typia/block-runtime`
- `@wp-typia/project-tools -> @wp-typia/rest`
- `@wp-typia/project-tools -> @wp-typia/block-types`
- `wp-typia -> @wp-typia/api-client`
- `wp-typia -> @wp-typia/project-tools`

## Sanctioned `workspace:*` Exceptions

Two source-manifest edges intentionally use `workspace:*`:

- `@wp-typia/rest -> @wp-typia/api-client`
- `@wp-typia/project-tools -> @wp-typia/block-runtime`

These are local-development exceptions for cases where the dependent package needs unreleased sibling changes before versioning runs. Their package-local `prepack` step rewrites `workspace:*` to publish-safe semver ranges, and `postpack` restores the source manifest afterward.

No other publishable runtime package should use `workspace:` protocol dependencies.

## Private Workspace Manifests

Private manifests, including the repo root, may still use `workspace:*` where that improves monorepo ergonomics. The publish-time coupling rules above apply only to publishable workspace packages.

## When Touching Package Metadata

When a PR edits package manifests:

- keep internal package specs aligned with the runtime coupling policy
- remove clearly unused devDependencies from touched manifests
- keep engine fields aligned with the repository baseline unless the PR also documents an intentional exception
