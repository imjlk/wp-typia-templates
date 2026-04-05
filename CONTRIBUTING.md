# Contributing

Thanks for helping improve `wp-typia`.

## Local setup

This repository is Bun-first:

```bash
bun install
```

## Common checks

```bash
bun run typecheck
bun run test
bun run build
bun run examples:lint
bun run examples:wp-env:start:test
bun run examples:test:e2e
bun run examples:wp-env:stop
bun run test:coverage
```

Quick command map:

- `bun run build` = product packages + reference app
- `bun run examples:build` = reference app only
- `bun run --filter @wp-typia/create test` = CLI/runtime only
- `bun run examples:test:e2e` = Playwright against the reference app
- `bun run examples:test:e2e` expects `bun run examples:wp-env:start:test` to already be running

For generated project smoke checks:

```bash
node scripts/run-generated-project-smoke.mjs --runtime node --template basic --package-manager npm --project-name smoke-basic
```

## Documentation

```bash
bun run docs:build
```

## Releases

Release management now uses Sampo for release metadata and GitHub Actions for publish:

```bash
bun run sampo:add
bun run changesets:validate
bun run release
```

- `bun run sampo:add` creates a new pending release note in `.sampo/changesets/`
- pending changesets must use canonical package ids like `npm/@wp-typia/create`
- `bun run changesets:validate` is the quickest preflight check before you push or update the release PR
- `bun run release` runs `sampo release` locally to inspect the version/changelog changes that the release PR workflow will generate
- `bun run publish` remains a local/manual fallback and is not the primary CI publish path
- `DRY_RUN=1 bun run publish:oidc` is the safest local way to preview the OIDC publish script behavior without pushing packages
- `bun run publish:validate` checks that every publishable workspace package under `packages/` is covered by `scripts/publish-oidc.sh`

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
2. Run `bun run publish:validate` and make sure CI stays green.
3. Seed the package name on npm with a manual first publish, typically `0.1.0`.
4. Verify the bootstrap publish with `npm view <package-name> versions --json`.
5. Only then merge PRs that make other released packages or generated-project smoke jobs depend on that package.
6. After the bootstrap release exists, let the normal Sampo release PR automation publish subsequent versions.

This matters because generated-project smoke jobs install released package
versions from npm. If a newly referenced package has not been published yet,
those jobs can fail even when the source tree and release PR look correct.

## Pull requests

- Keep changes scoped and intentional.
- Add or update tests when behavior changes.
- If a template workflow changes, update the user-facing README or tutorial in the same PR.
- If migration behavior or snapshot tooling changes, verify at least one `migration:*` flow in `examples/my-typia-block` before opening the PR.
