# Legacy Sunset Ops

This note captures the post-release cleanup for the old `wp-typia-*` package names.

## Release sequence

1. Merge feature PRs into `main` with squash merge
2. Let `release-pr.yml` update the `release/sampo` release PR
3. Squash merge the release PR so version/changelog changes land on `main` as one release commit
4. Create a GitHub Release from that merged commit
5. Let `publish.yml` publish `@wp-typia/create`, `@wp-typia/block-types`, and `create-wp-typia` with npm OIDC
6. Confirm `npx @wp-typia/create@latest`, `bunx @wp-typia/create@latest`, and `bun create wp-typia` all work
7. Apply npm deprecations to the legacy package names

## npm deprecate commands

Use the same tone for every package and point people to `@wp-typia/create`.

```bash
npm deprecate wp-typia-basic@"*" "wp-typia-basic is no longer maintained from this repository. Use @wp-typia/create instead: npx @wp-typia/create --template basic"
npm deprecate wp-typia-full@"*" "wp-typia-full is no longer maintained from this repository. Use @wp-typia/create instead: npx @wp-typia/create --template full"
npm deprecate wp-typia-interactivity@"*" "wp-typia-interactivity is no longer maintained from this repository. Use @wp-typia/create instead: npx @wp-typia/create --template interactivity"
npm deprecate wp-typia-advanced@"*" "wp-typia-advanced is no longer maintained from this repository. Use @wp-typia/create instead: npx @wp-typia/create --template advanced"
```

## Release note checklist

- `@wp-typia/create` is the canonical scaffolding package
- `create-wp-typia` remains only as the compatibility shim for `bun create wp-typia`
- Canonical templates now live only under `packages/create/templates`
- `@wp-typia/block-types` provides the shared semantic unions used by generated `types.ts`
- Manifest v2, `typia-validator.php`, and advanced snapshot migrations remain supported
- `wp-typia-*` packages remain on npm for historical installs but receive no further releases
- GitHub Release creation is the explicit trigger for npm OIDC publish
