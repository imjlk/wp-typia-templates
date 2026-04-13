# Maintenance Automation Policy

`wp-typia` now treats dependency maintenance as an explicit repository policy instead of a purely manual chore.

## Update automation strategy

The current baseline uses GitHub-native Dependabot updates for the ecosystems that fit the repository's current release model cleanly:

- `github-actions` updates at the repo root
- `composer` updates at the repo root

These PRs target `main` directly and should be reviewed like any other normal issue PR.

## Why the baseline is intentionally narrow

The JavaScript side of the repository is a Bun-first workspace with published package coupling, release PR automation, and changeset expectations. That means a broad monorepo-wide npm bot can create noisy or half-valid update PRs unless it also understands:

- release PR generation through `release/sampo`
- exact and caret package coupling rules
- changeset requirements for publishable package version lanes

Until we adopt a release-aware dependency bot for the Bun/npm workspace, JavaScript dependency bumps stay intentionally human-led. The audit workflow below still gives PR and scheduled visibility into JS security drift.

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

- `bun audit --audit-level high`
- `composer audit --locked`

This is the fast dependency/security gate that should catch actionable registry advisories before or immediately after merge.

### Scheduled deeper coverage

`.github/workflows/test-matrix.yml` keeps the scheduled/manual longer-running baseline:

- matrix build and E2E coverage
- CodeQL analysis

That workflow remains the place for slower repository-health checks that are not appropriate to gate every PR.

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
