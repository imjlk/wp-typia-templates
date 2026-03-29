# Interactivity Guide

Use the `interactivity` template when the block needs lightweight frontend behavior without moving to a larger client application architecture.

Typical fits:

- toggles and disclosure UI
- small counters and stateful reactions
- client-side filtering and view state
- simple async actions tied to WordPress markup

## Start with the right template

```bash
npx @wp-typia/create my-interactive-block --template interactivity --package-manager npm --yes --no-install
```

## Where the behavior lives

- `src/view.ts` defines the Interactivity API store
- `block.json` wires the frontend module
- `src/types.ts` still drives `block.json` and `typia.manifest.json`

## Example

```ts
import { store } from "@wordpress/interactivity";

const { state, actions } = store("my-plugin/my-block", {
	state: {
		isOpen: false,
	},
	actions: {
		toggle() {
			state.isOpen = !state.isOpen;
		},
	},
});
```

## When to reach for the showcase instead

Use [`examples/my-typia-block`](../examples/my-typia-block) as the richer reference when you need:

- schema snapshots for legacy attribute compatibility
- deprecated Gutenberg entries generated from versioned snapshots
- site scan and migration dashboard tooling

If you only need reactive frontend behavior, the `interactivity` template stays simpler and is the right built-in starting point.
