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

- `bun run test:tui-smoke` is the committed PTY smoke for the first-party TUI surface. It covers real alternate-buffer commands for `create`, `add`, and `migrate` in a constrained viewport.
- The PTY smoke is intentionally scoped to macOS/Linux and GitHub Actions `ubuntu-latest`. Windows is out of scope for this contract today.
- `packages/wp-typia/tests/fixtures/bunli-diagnostic-cli.tsx` is the minimal Bunli baseline fixture for future triage.
  - If a regression reproduces in the first-party PTY smoke, treat it as a `wp-typia` interaction-contract issue first.
  - If a regression only reproduces in the diagnostic fixture, treat it as a likely Bunli-level issue first.
