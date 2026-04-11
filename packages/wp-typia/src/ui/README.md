# `wp-typia` Bunli TUI Surface

This directory hosts the render-based terminal flows used by the Bunli runtime.

Current fullscreen flows:

- `wp-typia create`
- `wp-typia add`
- `wp-typia migrate`

Constraints:

- TTY mode can render fullscreen interfaces with the alternate buffer.
- Non-TTY mode must continue to use deterministic handler execution for CI and
  shell automation.
- `@wp-typia/project-tools` remains the runtime library; these screens should only
  collect input and hand the resolved command state back to `wp-typia`.

Alternate-buffer lifecycle contract:

- `LazyFlow` owns pre-mount lifecycle safety for lazy loader failures and loading-time quit.
- Mounted flows must use the shared alternate-buffer lifecycle helper instead of ad hoc exit logic.
- `create`, `add`, and `migrate` must always call `runtime.exit()` on submit success, cancel, and quit.
- Runtime execution failures use exit-on-failure: report the error, then exit immediately.

First-party form interaction contract:

- `create`, `add`, and `migrate` use a shared first-party form layer instead of relying on `SchemaForm` field traversal.
- Small viewport safety is part of the `wp-typia` contract: active fields must stay inside a scrollable viewport and footer help must not overlap the form body.
- Keyboard traversal is owned locally by `wp-typia`.
  - `Tab` / `Shift+Tab` move across the visible field order.
  - Select fields handle arrow-key movement and preserve traversal when moving back out to the next field.
  - Checkbox fields use `Space` / `Enter` to toggle without trapping focus.
  - Hidden conditional fields must never keep focus or leak stale values into submit payloads.
- `Ctrl+S` submit must stay reachable through the shared first-party field layer, not only through Bunli's form-level hotkeys.

Regression and triage contract:

- The committed regression contract is the first-party model and layout test suite under `packages/wp-typia/tests`.
- `create-flow-layout.test.ts` keeps the small-viewport scroll model and checkbox-cluster ordering pinned.
- `tui-interaction-models.test.ts` keeps visible field ordering and submit sanitization pinned for `add` and `migrate`.
- The committed tests deliberately stop short of a repo-level PTY smoke because the alternate-buffer harness cost and flake surface outweighed the regression value for this round.
- If a future regression needs terminal-level confirmation, reproduce it from the real `wp-typia` command first before classifying it as a Bunli-level issue.
