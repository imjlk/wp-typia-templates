# Bunli UI Staging Area

This directory is intentionally empty in the current release.

The next `wp-typia` CLI migration round should move the interactive TUI work
for these flows into this directory:

- `wp-typia create`
- `wp-typia add`
- `wp-typia migrations`

The published `npx wp-typia` and `bunx wp-typia` paths must stay scriptable in
non-TTY mode even after the full TUI cutover lands.
