---
title: 'Nesting Contracts Guide'
---

Typed nesting contracts let a workspace describe a reusable block family once and
then use the same source of truth for generated `block.json` metadata, editor
`InnerBlocks` templates, and pattern validation.

Use this guide when a plugin owns a small block system such as:

- `example/container`: the top-level parent users insert
- `example/section`: a repeatable section inside the container
- `example/title`, `example/body`, and `example/media`: leaf blocks inside a section

The same generic shape is also available as a checked fixture in
`tests/fixtures/nested-block-family.ts`.

## Define the contract

Author nesting rules in `scripts/block-config.ts`:

```ts
import {
  defineBlockNesting,
  defineInnerBlocksTemplates,
} from '@wp-typia/block-runtime/metadata-core';

export const BLOCK_NESTING = defineBlockNesting({
  'example/container': {
    allowedBlocks: ['example/section'],
    template: [
      [
        'example/section',
        { role: 'intro' },
        [
          ['example/title', { placeholder: 'Add a title' }],
          ['example/body', { placeholder: 'Add supporting copy' }],
          ['example/media', { aspectRatio: '16:9' }],
        ],
      ],
    ],
  },
  'example/section': {
    parent: ['example/container'],
    allowedBlocks: ['example/title', 'example/body', 'example/media'],
  },
  'example/title': {
    parent: ['example/section'],
  },
  'example/body': {
    ancestor: ['example/container'],
  },
  'example/media': {
    parent: ['example/section'],
  },
} as const);

export const BLOCK_TEMPLATES = defineInnerBlocksTemplates({
  'example/container': BLOCK_NESTING['example/container'].template,
} as const);
```

Use `allowedBlocks` for direct child allow-lists, `parent` when a child must sit
directly inside a specific block, and `ancestor` when a block may appear deeper
inside a family but still requires a containing ancestor.

## Sync generated metadata

Generated workspace sync scripts pass `BLOCK_NESTING` into `syncBlockMetadata`.
Each owned block keeps its WordPress metadata aligned with the contract:

```json
{
  "name": "example/section",
  "parent": ["example/container"],
  "allowedBlocks": ["example/title", "example/body", "example/media"]
}
```

Run sync in check mode before committing:

```bash
npm run wp-typia:sync -- --check
```

Workspace-local unknown names fail with actionable diagnostics. External blocks
such as `core/group` remain valid when the generated script enables
`allowExternalBlockNames`.

## Use generated templates

`wp-typia sync` also writes `src/inner-blocks-templates.ts` from
`BLOCK_TEMPLATES` or from the optional `template` field embedded in
`BLOCK_NESTING`:

```ts
import { INNER_BLOCKS_TEMPLATES } from '../../inner-blocks-templates';

const template = INNER_BLOCKS_TEMPLATES['example/container'];
```

Pass the template to `useInnerBlocksProps()` or `InnerBlocks` in the parent edit
component:

```tsx
<InnerBlocks
  allowedBlocks={['example/section']}
  template={template}
  templateLock={false}
/>
```

Template tuples are validated against the same `allowedBlocks`, `parent`, and
`ancestor` rules, so the editor starter state cannot drift from block metadata.

## Validate pattern content

Patterns listed in `PATTERNS` are parsed during `wp-typia sync --check`. The
validator reads serialized `<!-- wp:* -->` block comments conservatively and
does not execute dynamic PHP.

This valid pattern follows the same family contract:

```html
<!-- wp:example/container -->
<div class="wp-block-example-container">
  <!-- wp:example/section {"role":"intro"} -->
  <section class="wp-block-example-section">
    <!-- wp:example/title {"text":"Nested family title"} /-->
    <!-- wp:example/body {"content":"Reusable supporting copy."} /-->
    <!-- wp:example/media {"aspectRatio":"16:9"} /-->
  </section>
  <!-- /wp:example/section -->
</div>
<!-- /wp:example/container -->
```

Relationship violations fail sync with the pattern file and serialized block
path, for example when `example/body` appears directly under
`example/container`. Unknown blocks, unbalanced comments, and unparseable
attributes are warnings so teams can adopt validation without rewriting pattern
files automatically.

Pattern catalogs can also validate section role markers against the typed
manifest. By default, section-scoped patterns use `core/group` wrappers with
`section section--{role}` class tokens or a `metadata.sectionRole` attribute:

```html
<!-- wp:group {"className":"section section--hero"} -->
<div class="wp-block-group section section--hero">
  <!-- wp:heading {"content":"Hero"} /-->
</div>
<!-- /wp:group -->
```

Projects with a different convention can call `validatePatternCatalog()` with a
custom `sectionRoleConvention`, including another wrapper block name, class
pattern, metadata path, or duplicate-role policy for full-page patterns.

## Fixture checklist

For reusable nested block families, keep these pieces together:

- A `BLOCK_NESTING` entry for every owned block in the family.
- A default `BLOCK_TEMPLATES` entry for the top-level container.
- Pattern files registered in `PATTERNS` so sync can validate shipped markup.
- A `sync --check` CI step to catch stale `block.json`, template, or pattern
  drift before release.
