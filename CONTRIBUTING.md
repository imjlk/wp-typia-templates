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
bun run examples:test:e2e
bun run test:coverage
```

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
bun run release
```

- `bun run sampo:add` creates a new pending release note in `.sampo/changesets/`
- `bun run release` runs `sampo release` locally to inspect the version/changelog changes that the release PR workflow will generate
- `bun run publish` remains a local/manual fallback and is not the primary CI publish path
- `DRY_RUN=1 bun run publish:oidc` is the safest local way to preview the OIDC publish script behavior without pushing packages

GitHub release automation is split into two workflows:

1. Merge feature PRs into `main` with **Squash and merge**
2. `.github/workflows/release-pr.yml` updates the `release/sampo` PR from `main`
3. Review and **Squash and merge** the release PR
4. `.github/workflows/create-release.yml` creates a GitHub Release automatically from the merged release commit
5. `.github/workflows/publish.yml` publishes packages with npm OIDC from that release event

`workflow_dispatch` remains available as a manual fallback if the publish workflow ever needs to be rerun for the current commit.

## Pull requests

- Keep changes scoped and intentional.
- Add or update tests when behavior changes.
- If a template workflow changes, update the user-facing README or tutorial in the same PR.
- For `advanced` migration changes, verify at least one `migration:*` flow locally before opening the PR.
