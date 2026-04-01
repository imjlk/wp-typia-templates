# Compound Block Tutorial: Scaffolding Parent/Child `InnerBlocks` Patterns with `@wp-typia/create`

This tutorial walks through the `compound` built-in template. It is the starting point for blocks that need one user-facing parent block plus hidden implementation child blocks managed through `InnerBlocks`.

## Prerequisites

- Node.js 24+ installed
- WordPress development environment (wp-env or local server)
- Familiarity with the [Basic Block Tutorial](./basic-block-tutorial.md)

## What is the Compound Template?

The `compound` template scaffolds:

- a top-level parent block
- a hidden child block constrained by `parent`
- a multi-block plugin layout under `src/blocks/*`
- `InnerBlocks` wiring with two default child items

By default it is a pure static compound block. If you also pass `--data-storage` or `--persistence-policy`, the parent block gains the same count-like persistence wiring used by the `persistence` template.

## Step 1: Create a Compound Block

Pure compound scaffold:

```bash
npx @wp-typia/create compound-demo --template compound --package-manager npm --yes --no-install
cd compound-demo
npm install
```

Compound scaffold with parent-only persistence:

```bash
npx @wp-typia/create compound-demo \
  --template compound \
  --persistence-policy authenticated \
  --package-manager npm \
  --yes \
  --no-install
```

## Step 2: Understand the Generated Structure

The compound template creates a multi-block plugin layout instead of a single `src/` block root:

```text
compound-demo/
├── src/
│   └── blocks/
│       ├── compound-demo/
│       │   ├── block.json
│       │   ├── edit.tsx
│       │   ├── index.tsx
│       │   ├── save.tsx
│       │   ├── style.scss
│       │   └── types.ts
│       └── compound-demo-item/
│           ├── block.json
│           ├── edit.tsx
│           ├── index.tsx
│           ├── save.tsx
│           └── types.ts
├── scripts/
│   ├── block-config.ts
│   └── sync-types-to-block-json.ts
├── compound-demo.php
├── package.json
└── webpack.config.js
```

After you run `npm run sync-types`, each block directory also gains:

- `typia.manifest.json`
- `typia.schema.json`
- `typia.openapi.json`
- `typia-validator.php`

If persistence is enabled for the parent block, it additionally gains:

- `api-types.ts`
- `api-validators.ts`
- `api.ts`
- `interactivity.ts`
- `render.php`
- `api-schemas/*.schema.json`
- `api-schemas/*.openapi.json`

## Step 3: Parent and Child Roles

The parent block is the only block users insert directly.

- block name: `create-block/compound-demo`
- editor UI: heading, intro text, and an `InnerBlocks` area
- save behavior: stores the composed child markup

The child block is an internal implementation detail.

- block name: `create-block/compound-demo-item`
- `supports.inserter: false`
- `parent: ['create-block/compound-demo']`
- minimal title/body editing UI

## Step 4: How the Parent Seeds Child Blocks

The parent edit component includes an `InnerBlocks` template with two default child items:

```tsx
const DEFAULT_TEMPLATE = [
  [
    'create-block/compound-demo-item',
    { title: 'First Item', body: 'Add supporting details for the first internal item.' },
  ],
  [
    'create-block/compound-demo-item',
    { title: 'Second Item', body: 'Add supporting details for the second internal item.' },
  ],
];
```

That template is paired with:

- `allowedBlocks` so only the child block can be inserted inside the parent
- `templateLock={ false }` so users can reorder and add more internal items
- `InnerBlocks.ButtonBlockAppender` so the parent owns the insertion affordance

## Step 5: How the Child Stays Internal

The child `block.json` keeps the block out of the global inserter:

```json
{
  "name": "create-block/compound-demo-item",
  "parent": ["create-block/compound-demo"],
  "supports": {
    "html": false,
    "inserter": false,
    "reusable": false
  }
}
```

This pattern is useful when the child block exists only to structure the parent implementation, not as a reusable standalone block.

## Step 6: Optional Persistence on the Parent

When you pass `--data-storage` or `--persistence-policy`, only the parent block gets persistence wiring.

That means:

- the parent becomes a dynamic block with `render.php`
- the parent gets typed REST contracts and an Interactivity API store
- the child block remains a pure static content container

This is a good fit for patterns like:

- tab sets with a persisted counter or status
- step lists with aggregate interaction tracking
- experiment containers where the top-level block owns state and children own content

## Step 7: Build and Test

Run the normal scaffold lifecycle:

```bash
npm run sync-types
npm run build
```

If you enabled persistence on the parent block:

```bash
npm run sync-rest
```

Run those sync commands manually only when you want generated metadata or REST schemas committed before the first `npm run start` or `npm run build`. The generated `start`/`build` scripts already run the relevant sync steps, and they do not create migration history.

Then load the plugin in your WordPress environment and verify:

- the parent block appears in the inserter
- the child block does not appear in the global inserter
- inserting the parent seeds two child items
- save and reopen keeps the block valid
- the frontend renders the parent plus child content

## What's Next?

1. Add custom inspector controls to the parent block
2. Extend the child block with richer layout or media fields
3. Enable persistence on the parent when you need count-like behavior
4. Adapt the pattern for tabs, steps, carousels, or experiment containers

## Additional Resources

- [Basic Block Tutorial](./basic-block-tutorial.md)
- [Persistence Block Tutorial](./persistence-block-tutorial.md)
- [API Reference](../API.md)
- [WordPress Inner Blocks Handbook](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/)
