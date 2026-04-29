---
title: 'Interactivity Guide'
---

Use the `interactivity` template when the block needs lightweight frontend behavior without moving to a larger client application architecture.

Typical fits:

- toggles and disclosure UI
- small counters and stateful reactions
- client-side filtering and view state
- simple async actions tied to WordPress markup

## Start with the right template

```bash
npx wp-typia my-interactive-block --template interactivity --package-manager npm --yes --no-install
```

## Where the behavior lives

- `src/interactivity.ts` defines the Interactivity API store runtime
- `src/interactivity-store.ts` adds optional typed directive/store helpers on top of the official API
- `block.json` wires the frontend module
- `src/types.ts` still drives `block.json`, `typia.manifest.json`, and the generated Interactivity context/state types

The helper layer does not replace `@wordpress/interactivity`. It keeps the
official `store()`, `getContext()`, and `data-wp-*` model visible while letting
generated projects opt into typed directive strings such as action, state,
callback, and context paths.

## Example

```ts
import { store } from '@wordpress/interactivity';
import { counterStore } from './interactivity-store';

const context = counterStore.createContext({
  clicks: 0,
  isAnimating: false,
  isVisible: true,
  animation: 'none',
  maxClicks: 3,
});

const directiveMap = {
  interactive: counterStore.directive.interactive,
  context: JSON.stringify(context),
  onClick: counterStore.directive.action('handleClick'),
  hidden: counterStore.directive.negate(
    counterStore.directive.state('isVisible'),
  ),
  text: counterStore.directive.state('clicks'),
};

store(counterStore.namespace, {
  actions: {
    handleClick() {},
  },
  callbacks: counterStore.callbacks,
  state: {
    get clicks() {
      return 0;
    },
  },
});
```

The generated helper also supports `directive.callback('init')` and
`directive.context('clicks')` when a project wants typed callback or context
paths without replacing direct `data-wp-*` usage.

## When to reach for the reference app instead

Use [`examples/my-typia-block`](https://github.com/imjlk/wp-typia/tree/main/examples/my-typia-block) as the richer reference when you need:

- schema snapshots for legacy attribute compatibility
- deprecated Gutenberg entries generated from versioned snapshots
- site scan and migration dashboard tooling

If you only need reactive frontend behavior, the `interactivity` template stays simpler and is the right built-in starting point.

From the repository root, the reference app is exercised through the `examples:*` namespace:

```bash
bun run examples:build
bun run examples:test:e2e
```
