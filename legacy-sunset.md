# Legacy Sunset Ops

This note captures the post-release cleanup for the old `wp-typia-*` package names.

## Release sequence

1. Publish `create-wp-typia@1.0.0`
2. Confirm `npx create-wp-typia@latest` and `bunx create-wp-typia@latest` both work
3. Apply npm deprecations to the legacy package names

## npm deprecate commands

Use the same tone for every package and point people to `create-wp-typia`.

```bash
npm deprecate wp-typia-basic@"*" "wp-typia-basic is no longer maintained from this repository. Use create-wp-typia instead: npx create-wp-typia --template basic"
npm deprecate wp-typia-full@"*" "wp-typia-full is no longer maintained from this repository. Use create-wp-typia instead: npx create-wp-typia --template full"
npm deprecate wp-typia-interactivity@"*" "wp-typia-interactivity is no longer maintained from this repository. Use create-wp-typia instead: npx create-wp-typia --template interactivity"
npm deprecate wp-typia-advanced@"*" "wp-typia-advanced is no longer maintained from this repository. Use create-wp-typia instead: npx create-wp-typia --template advanced"
```

## Release note checklist

- `create-wp-typia` is the only maintained scaffolding entrypoint
- Canonical templates now live only under `packages/create-wp-typia/templates`
- Manifest v2, `typia-validator.php`, and advanced snapshot migrations remain supported
- `wp-typia-*` packages remain on npm for historical installs but receive no further releases
