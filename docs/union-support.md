# Union Support Guide

`wp-typia-templates` supports unions in two different ways:

## Already supported

- same-primitive literal unions
  - example: `"left" | "center" | "right"`
  - projection: `block.json` `enum`
  - runtime: Typia JS validator + generated PHP validator

## Supported in manifest v2

- discriminated object unions
  - object union only
  - one shared discriminator key
  - discriminator values must be string literals
  - discriminator values must be unique per branch

Example:

```ts
type LinkTarget =
	| { kind: "post"; postId: number }
	| { kind: "url"; href: string };
```

The generated metadata keeps this as:

- `block.json`: `type: "object"`
- `typia.manifest.json`: `ts.kind = "union"` plus `ts.union`
- `typia-validator.php`: branch-aware validation using the discriminator
- migration diffing: branch-aware compatibility checks

## Not supported yet

- non-discriminated object unions
- mixed primitive/object unions
- recursive unions
- tuple/map/set/class instance unions
- custom union semantics that require branch inference without a discriminator

These fail explicitly instead of silently degrading.

## Migration expectations

Migration automation is strongest for:

- additive/defaultable branch changes
- compatible same-name branch fields
- same-primitive enum unions

Manual authoring is still expected for:

- discriminator changes
- branch removals
- branch renames
- semantic transforms across branches

Use `renameMap` and `transforms` in advanced migration rules when a union edge is not structurally compatible.
