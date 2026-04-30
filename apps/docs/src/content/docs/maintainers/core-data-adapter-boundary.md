---
title: 'Core Data Adapter Boundary'
---

This note records the current maintainer decision for optional
`@wordpress/core-data` support in `wp-typia`.

`#622` is intentionally investigation-first. The goal is to define where a
future core-data adapter fits without blurring the existing `@wp-typia/rest`
and `@wp-typia/dataviews` boundaries.

## Current platform facts

According to the official WordPress package references:

- `@wordpress/core-data` is a separate installable package
- it registers its own data store and resolves entity data through the WordPress
  REST API automatically
- its primary entity-facing hooks include `useEntityRecord`,
  `useEntityRecords`, and `useEntityProp`
- `@wordpress/data` is also a separate installable package and owns the generic
  store registration and selector/dispatch primitives underneath that model

That means generated code should treat `@wordpress/core-data` and
`@wordpress/data` as explicit dependencies whenever a scaffold wants them.
Generated projects must not rely on transitive availability through
`@wordpress/editor` or any other package.

## When core-data is the better fit

Prefer `@wordpress/core-data` when all of the following are true:

- the resource is already a WordPress entity with stable `kind`, `name`, and
  record-id semantics
- the UI is primarily an editor/admin surface that already benefits from
  WordPress entity caching, permissions, and edit state
- the generated code only needs thin typed wrappers around existing entity
  hooks such as `useEntityRecord`, `useEntityRecords`, or `useEntityProp`
- the resource is conceptually “WordPress-owned data”, not a plugin-specific
  transport contract

Typical examples:

- posts and pages exposed through the `postType` entity family
- taxonomies or media where the project is consuming existing WordPress entity
  behavior
- admin/DataViews screens that are browsing an entity collection WordPress
  already models

## When `@wp-typia/rest` stays the right boundary

Prefer `@wp-typia/rest` when any of the following are true:

- the resource is a plugin-level REST contract that `wp-typia` generates and
  owns
- the project needs endpoint-level request/response validation, manifest/openapi
  generation, or typed client/resource facades
- the data source is a custom table, persistence block workflow, or bespoke
  plugin endpoint
- the resource does not already map cleanly to a WordPress entity model

In short:

- use core-data for existing WordPress entity behavior
- use `@wp-typia/rest` for plugin-owned transport contracts

The two boundaries are complementary. A future core-data adapter must not
replace `@wp-typia/rest` for custom REST resources.

## First adapter target

The first adapter target should stay narrow:

- only support entities that WordPress already exposes cleanly through the
  existing core-data entity model
- do not start with arbitrary plugin resources or client-side entity
  registration scaffolds

Practically, this means the first shipped adapter can target entity-backed admin
screens such as `postType` or other existing core-data-visible entities, but it
should not attempt to turn `wp-typia add rest-resource` outputs into core-data
entities.

This is intentionally closer to “core entities first” than to “arbitrary
registered custom entities”. If a future project wants broader support, it
should prove that boundary in a separate follow-up issue instead of widening the
first implementation by default.

## Dependency policy

If a future scaffold explicitly opts into core-data:

- add `@wordpress/core-data` as a direct dependency
- add `@wordpress/data` as a direct dependency
- do not add either package to every generated project by default
- do not rely on `@wordpress/editor` or other packages to provide them
  transitively

If the same scaffold also renders a DataViews UI:

- keep `@wp-typia/dataviews` and `@wordpress/dataviews` opt-in as they are
  today
- do not add `@wp-typia/rest` unless the generated project also needs
  plugin-owned REST contracts for a separate resource

## DataViews admin-view source policy

The first shipped admin-view implementation accepts:

- `core-data:postType/<post-type>`
- `core-data:taxonomy/<taxonomy>`

That source shape makes the entity boundary explicit at the CLI layer and keeps
it distinct from:

- `rest-resource:<slug>`

The first wave stays deliberately narrow. It does not treat every core-data
entity as automatically in-scope, and it does not change the plugin-owned REST
path.

## Validation and ownership boundary

For future core-data adapters:

- `wp-typia` should generate typed wrapper code and clear locator/configuration
  boundaries
- WordPress/core-data should remain the owner of entity fetch/edit semantics
- `wp-typia` should not duplicate `@wp-typia/rest` request/response validation,
  endpoint manifests, or OpenAPI generation for those entity flows

This keeps the distinction understandable:

- core-data adapters are entity consumers
- rest adapters are transport-contract owners

## Explicit non-goals for the first implementation

- no default `@wordpress/core-data` dependency in every scaffold
- no conversion of custom REST resources into core-data entities
- no custom `@wordpress/data` store scaffolds
- no client-side `addEntities`-driven expansion of arbitrary plugin resources in
  the first wave

## Current implementation status

The current implementation keeps the first adapter intentionally small:

- opt-in only through `wp-typia add admin-view --source core-data:<kind>/<name>`
- bounded to the `postType` and `taxonomy` entity families
- based on thin typed wrappers over the existing core-data hooks
- still separate from `rest-resource:<slug>` and `@wp-typia/rest`
