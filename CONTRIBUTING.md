# Contributing

Thanks for helping improve `wp-typia`.

## Local setup

This repository is Bun-first:

```bash
bun install
```

## Common checks

```bash
bun run lint:repo
bun run format:check
bun run lint:all
bun run typecheck
bun run test:all
bun run build
bun run ci:local
bun run examples:lint
bun run examples:wp-env:start:test
bun run examples:test:e2e
bun run examples:wp-env:stop
bun run test:coverage
```

Quick command map:

- `bun run lint:repo` = root ESLint for repo infrastructure code
- `bun run lint:all` = root ESLint + example lint + PHP checks
- `bun run format:check` = non-mutating Prettier check for repo-owned files
- `bun run test:all` = root unit + CLI test aggregation
- `bun run ci:local` = fast maintainer preflight mirroring the non-E2E CI path
- `bun run build` = product packages + reference app
- `bun run examples:build` = reference app only
- `bun run --filter @wp-typia/project-tools test` = project orchestration/runtime only
- `bun run examples:test:e2e` = Playwright against the reference app
- `bun run examples:test:e2e` expects `bun run examples:wp-env:start:test` to already be running

Linting ownership is intentionally split:

- root ESLint covers repo infrastructure code such as `scripts/**`, `tests/**`, root config files, and package-side non-example sources
- example app source continues to live under `examples:lint` and `@wordpress/scripts`
- `@wp-typia/api-client/internal/runtime-primitives` is the single maintained home for shared client-runtime validation/object helpers consumed by `@wp-typia/rest`; avoid reintroducing local helper copies in either package

`bun run ci:local` is the recommended maintainer pre-PR command. It deliberately
stops short of `wp-env` startup and Playwright E2E so everyday local checks stay
fast.

For generated project smoke checks:

```bash
node scripts/run-generated-project-smoke.mjs --runtime node --template basic --package-manager npm --project-name smoke-basic
```

## Documentation

```bash
bun run docs:build
```

## Project meta docs

- [`README.md`](./README.md) is the main product/audience entry point
- [`UPGRADE.md`](./UPGRADE.md) collects high-signal maintainer upgrade notes
- [`SECURITY.md`](./SECURITY.md) explains private vulnerability reporting

If you change user-facing workflows, keep the relevant meta docs in sync in the
same PR.

## Generated project toolchain matrix

Generated project Webpack defaults are currently regression-covered against:

- `typia` 12.x
- `@typia/unplugin` 12.x
- `@wordpress/scripts` 30.x with Webpack 5

The generated Webpack helpers now fail fast outside that matrix so broken
version tuples surface as a clear compatibility error instead of a cryptic
transform crash. If you intentionally expand the supported matrix, add or update
generated-project build smoke coverage in the same PR before relaxing the guard.

## Releases

Release management now uses Sampo for release metadata and GitHub Actions for publish:

```bash
bun run sampo:add
bun run changesets:validate
bun run release
```

- `bun run sampo:add` creates a new pending release note in `.sampo/changesets/`
- pending changesets must use canonical package ids like `npm/@wp-typia/project-tools`
- `bun run changesets:validate` is the quickest preflight check before you push or update the release PR
- `bun run runtime-coupling:validate` enforces the runtime-family dependency policy before CI or the release PR can proceed
- `bun run release` runs `sampo release` locally to inspect the version/changelog changes that the release PR workflow will generate
- `bun run publish` remains a local/manual fallback and is not the primary CI publish path
- `DRY_RUN=1 bun run publish:oidc` is the safest local way to preview the OIDC publish script behavior without pushing packages
- `bun run publish:validate` checks that every publishable workspace package under `packages/` is covered by `scripts/publish-oidc.sh` and already has an initial npm seed publish

GitHub release automation is split into two workflows:

1. Merge feature PRs into `main` with **Squash and merge**
2. `.github/workflows/release-pr.yml` updates the `release/sampo` PR from `main`
3. Review and **Squash and merge** the release PR
4. `.github/workflows/create-release.yml` creates a GitHub Release automatically from the merged release commit
5. `.github/workflows/publish.yml` publishes packages with npm OIDC from that GitHub Release event

`workflow_dispatch` remains available as a manual fallback if the publish workflow ever needs to be rerun for the current commit.

### First release of a new npm package

When you add a brand-new publishable workspace package under `packages/`, do all
of the following before you rely on the normal release PR flow:

1. Add the package directory to `scripts/publish-oidc.sh`.
2. Seed the package name on npm with a manual first publish, typically `0.1.0`.
3. Wait until `npm view <package-name> version` succeeds from a normal registry read.
4. Run `bun run publish:validate` and make sure CI stays green.
5. Only then merge PRs that make other released packages or generated-project smoke jobs depend on that package.
6. After the bootstrap release exists, let the normal Sampo release PR automation publish subsequent versions.

This matters because generated-project smoke jobs install released package
versions from npm. If a newly referenced package has not been published yet,
those jobs can fail even when the source tree and release PR look correct.

## Runtime package dependency policy

The runtime-oriented package family is intentionally coupled:

- `@wp-typia/rest` depends on `@wp-typia/api-client` with a caret range
- `@wp-typia/block-runtime` depends on `@wp-typia/api-client` with a caret range
- `@wp-typia/project-tools` depends on `@wp-typia/api-client`, `@wp-typia/block-runtime`, `@wp-typia/rest`, and `@wp-typia/block-types` with caret ranges
- `wp-typia` pins `@wp-typia/project-tools` exactly and depends on `@wp-typia/api-client` with a caret range

Why this split exists:

- runtime helpers that shipped/generated projects need at install time stay in `dependencies`
- host-provided integrations such as `react` or `@wordpress/element` stay in `peerDependencies`
- `wp-typia -> @wp-typia/project-tools` stays exact because the published CLI and orchestration package are tested and released as a locked pair

Validation uses planned publish truth, not just source truth:

- `@wp-typia/rest` keeps `workspace:*` in source so local development stays ergonomic
- the coupling validator materializes workspace-protocol runtime dependencies against the planned next versions before checking the release lane
- if an upstream runtime package change falls outside the current policy lane, the dependent package must carry both a manifest update and a pending changeset in the same PR

## Pull requests

- Keep changes scoped and intentional.
- Add or update tests when behavior changes.
- If a template workflow changes, update the user-facing README or tutorial in the same PR.
- If migration behavior or snapshot tooling changes, verify at least one `migration:*` flow in `examples/my-typia-block` before opening the PR.
- Do not file security issues publicly; use the private reporting flow described in [`SECURITY.md`](./SECURITY.md).
