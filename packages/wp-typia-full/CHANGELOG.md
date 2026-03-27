# wp-typia-full

## 1.2.0

### Minor Changes

- 2848ebf: Upgrade the published block templates to `typia@12` and migrate scaffolded builds to `@typia/unplugin`.

  The generated projects now build `block.json` from `types.ts` through a shared TypeScript Compiler API analyzer and emit a colocated `typia.manifest.json` file as the future PHP validation contract.

  This release also ships the template files inside the npm tarballs so `npx wp-typia-*` installs include the actual scaffold assets.

## 1.1.0

### Minor Changes

- Initial release of WordPress Typia Boilerplate templates

  Features:

  - Type-safe WordPress block development with Typia
  - Automatic block.json generation from TypeScript types
  - Runtime validation with 20,000x performance
  - 4 template variants: Basic, Full, Interactivity, Advanced
  - Migration system for block versioning (Advanced)
  - WordPress Interactivity API support (Interactivity)
  - Complete testing infrastructure
  - npm template support for @wordpress/create-block
