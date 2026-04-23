# Retrofit and Init Direction

`wp-typia` still needs a broader project-level retrofit path for existing
WordPress plugins and block repos.

This note is the stable place to accumulate that direction before a full
`wp-typia init` workflow exists.

## Current State

Today the supported entrypoints are intentionally split:

- `wp-typia create` scaffolds a new project or workspace from a known template.
- `wp-typia init` now previews the minimum retrofit adoption layer for the
  current project directory, but it still stops short of writing files.
- `wp-typia add ...` extends an official `wp-typia` workspace after it already
  exists.
- `wp-typia migrate init` retrofits **migration support only** into projects that
  already match supported first-party `wp-typia` block layouts.

That means there is still no general-purpose command that takes an arbitrary
existing WordPress project and adopts the minimum `wp-typia` infrastructure in a
single supported write flow. The current `init` command is the read-only
planning entrypoint for that future direction.

## Direction

Any future `wp-typia init` or equivalent retrofit workflow should stay narrower
than `create`.

The intended shape is:

1. Detect whether the target already looks like a supported single-block,
   multi-block, or plugin/workspace project.
2. Show a preview of the minimum dependencies, scripts, generated files, and
   config changes that `wp-typia` would add.
3. Apply only the requested adoption layer, instead of silently converting the
   project into a full scaffolded template.
4. Leave higher-level systems such as migration UI, workspace inventory, and
   richer persistence flows as explicit follow-up opt-ins when possible.

## Minimum Adoption Scope

The first production-ready retrofit lane should focus on the smallest useful
package of changes:

- add the canonical `wp-typia` and supporting package dependencies
- add the minimum sync scripts and package metadata needed for typed artifacts
- add missing generated helper files only where they are required by that sync
  surface
- keep existing block/plugin source files in place whenever possible
- provide explicit guidance for the next optional step, such as migration setup
  or workspace expansion

## Non-Goals

The retrofit flow should **not** try to do these by default:

- rewrite arbitrary project structures into the official scaffold layout
- move files across directories without an explicit opt-in
- infer product-specific persistence, REST, or editor-plugin architecture
- auto-enable migration UI for projects that have not explicitly chosen schema
  lineage tracking
- replace `create` as the preferred entrypoint for greenfield projects

## Guardrails

To keep retrofit predictable, the workflow should prefer:

- read-only preview or dry-run output before writes
- explicit messages when the project falls outside supported shapes
- narrow, composable adoption steps instead of one-shot project rewrites
- preserving the user's package manager, repo layout, and existing source of
  truth unless the user asks for a deeper conversion

## Relationship To Existing Commands

- `wp-typia create` remains the recommended path for new projects.
- `wp-typia init` is the current preview-only retrofit planner. A future write
  mode should grow out of that surface instead of bypassing it.
- `wp-typia migrate init` remains the migration-only retrofit command for
  supported `wp-typia`-style layouts.
- a future `wp-typia init` should cover broader typed-artifact adoption, not
  merely alias `migrate init`.

## Open Questions

- Which existing project layouts should be considered first-class for retrofit?
- Should the first retrofit workflow target single-block projects before plugin
  workspaces?
- How much generated source should be seeded up front versus deferred until the
  first `sync` run?
- Should migration setup remain a separate explicit step even after a broader
  retrofit command exists?
