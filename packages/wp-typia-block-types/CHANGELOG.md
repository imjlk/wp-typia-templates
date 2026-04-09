# @wp-typia/block-types

## 0.2.1 — 2026-04-09

### Patch changes

- [ab7d1c9](https://github.com/imjlk/wp-typia/commit/ab7d1c9afaf4039b5053991ca9fe88cabcd46a13) Publish shared API client utilities and runtime primitives from `@wp-typia/api-client`, reuse them across rest and runtime packages, and align active package Bun minimums with `1.3.11`. — Thanks @imjlk!

## 0.2.0 — 2026-04-05

### Minor changes

- [a8d57c8](https://github.com/imjlk/wp-typia/commit/a8d57c8b5502c1862251038384512c316bf7ec72) Broaden `@wp-typia/block-types` support and style coverage with additional
  stable Core surfaces including `dropCap`, `backgroundImage`, `enableAlpha`,
  `spacingSizes`, `units`, `duotone`, per-side border widths, layout gaps, and
  the `js` / `locking` support keys. — Thanks @imjlk!
- [1f75a3f](https://github.com/imjlk/wp-typia/commit/1f75a3f20deae1ac13afb8c4ac9d6d2008773ff9) Add experimental `__experimentalSkipSerialization` typing for selected block
  support sections in `@wp-typia/block-types`, including a reusable
  `SkipSerialization<TFeature>` helper for Gutenberg-tracking server-style
  support metadata. — Thanks @imjlk!
- [00e148e](https://github.com/imjlk/wp-typia/commit/00e148e788160dd2564faeebc7fba530c037bce8) Add first-class WordPress block support metadata types and public style-support helper types, and teach the scaffold metadata pipeline to understand indexed-access support attributes and primitive-compatible intersections from `@wp-typia/block-types`. — Thanks @imjlk!

## 0.1.3 — 2026-03-29

### Patch changes

- [c734c7e](https://github.com/imjlk/wp-typia/commit/c734c7eede2da50ebd508cde851e32144bb1ac76) Add pipeline-compatible color and min-height aliases alongside richer DX-only template literal block types, and document which aliases are safe to use inside `types.ts` with `sync-types`. — Thanks @imjlk!

## 0.1.2 — 2026-03-29

### Patch changes

- [d89441f](https://github.com/imjlk/wp-typia/commit/d89441faf32906763807aa9bde1e960cc2ecf274) Improve Typia-powered metadata and validator generation, expand shared WordPress semantic block types, and strengthen the full/interactivity templates with precompiled validators and manifest-driven default application. — Thanks @imjlk!

## 0.1.1 — 2026-03-29

### Patch changes

- [2634593](https://github.com/imjlk/wp-typia/commit/2634593c4791272f90f01b7ddb344ab09ec418fe) Tighten the repository config baseline by fixing metadata placeholders, aligning Node and npm engine requirements, simplifying root TypeScript typecheck settings, and cleaning up CI workflow defaults. — Thanks @imjlk!

