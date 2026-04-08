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
