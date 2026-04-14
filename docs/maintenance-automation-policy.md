# Maintenance Automation Policy

`wp-typia` now treats dependency maintenance as an explicit repository policy instead of a purely manual chore.

## Update automation strategy

The current baseline uses GitHub-native Dependabot updates for the ecosystems that fit the repository's current release model cleanly:

- `github-actions` updates at the repo root
- `composer` updates at the repo root

These PRs target `main` directly and should be reviewed like any other normal issue PR.

The maintenance baseline also includes a read-only upstream watch for Gutenberg TypeScript changes:

- `.github/workflows/gutenberg-upstream-watch.yml`
- weekly schedule plus manual dispatch
- current durable log stored on issue `#283`

## Why the baseline is intentionally narrow

The JavaScript side of the repository is a Bun-first workspace with published package coupling, release PR automation, and changeset expectations. That means a broad monorepo-wide npm bot can create noisy or half-valid update PRs unless it also understands:

- release PR generation through `release/sampo`
- exact and caret package coupling rules
- changeset requirements for publishable package version lanes

Until we adopt a release-aware dependency bot for the Bun/npm workspace, JavaScript dependency bumps stay intentionally human-led. The audit workflow below still gives scheduled/manual visibility into JS security drift without turning every PR into upstream toolchain triage.

## Release flow expectations

Automated dependency PRs must not bypass the normal release lane.

- merge dependency PRs into `main`
- let `.github/workflows/release-pr.yml` regenerate the `release/sampo` PR
- merge the release PR separately with **Squash and merge**
- let the existing GitHub Release + npm OIDC publish flow handle publication

Do not push dependency fixes directly to `release/sampo`.

## Audit coverage posture

Audit coverage is split by cost and actionability.

### PR and `main` push coverage

`.github/workflows/dependency-audit.yml` runs on:

- pull requests to `main`
- pushes to `main`
- weekly schedule
- manual dispatch

It currently enforces:

- `composer audit --locked`

This is the fast dependency/security gate for the maintainer-owned lockfile that should catch actionable PHP ecosystem advisories before or immediately after merge.

### Scheduled/manual JavaScript coverage

The same `.github/workflows/dependency-audit.yml` workflow keeps Bun audit available for:

- the weekly scheduled run
- manual `workflow_dispatch`

That lane runs:

- `bun audit --audit-level high`

Today the Bun/npm side of the repository still pulls in known transitive advisories through upstream WordPress/example toolchains. Keeping full `bun audit` out of the PR gate avoids noisy failures while still giving maintainers a consistent scheduled/manual baseline to review and act on intentionally.

### Scheduled deeper coverage

`.github/workflows/test-matrix.yml` keeps the scheduled/manual longer-running baseline:

- matrix build and E2E coverage
- CodeQL analysis

That workflow remains the place for slower repository-health checks that are not appropriate to gate every PR.

### Scheduled Gutenberg upstream TypeScript watch

`.github/workflows/gutenberg-upstream-watch.yml` runs on:

- a weekly schedule
- manual `workflow_dispatch`

It is intentionally read-only and triage-oriented. Each run:

- queries recent `WordPress/gutenberg` PRs and issues touching
  - block registration types (`@wordpress/blocks`)
  - block editor component types (`@wordpress/block-editor`)
  - data store types (`@wordpress/data`)
- reads current upstream package versions for:
  - `@wordpress/blocks`
  - `@wordpress/block-editor`
  - `@wordpress/data`
- compares the upstream `@wordpress/blocks` version against the locally owned generated-project baseline
- publishes a workflow summary + artifact
- refreshes the durable tracking comment on issue `#283`

The expected follow-up path is:

- review the refreshed issue comment and workflow artifact
- if local type facades, helper boundaries, or generated-project dependency compatibility need attention, open or refresh a normal follow-up issue/PR on `main`
- do not patch `release/sampo` directly from the watch lane

## Review posture

For dependency automation PRs:

- prefer small, intentional PRs over broad churn
- keep bot PRs on `main`, never `release/sampo`
- treat workflow and PHP tooling bumps as normal reviewed infrastructure changes
- if a dependency bump changes publishable package behavior or requires coordinated package versioning, convert it into a normal maintainer-led PR with the appropriate changeset instead of forcing the bot PR through unchanged

## Validation hooks

The repository keeps this baseline locked through:

- `bun run maintenance-automation:validate`
- `bun run ci:local`
- the `Lint and Type Check` job in `.github/workflows/ci.yml`

If we widen or narrow the maintenance baseline later, update this document, the validator, and the workflow config in the same PR.
