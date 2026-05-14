# `@wp-typia/create-workspace-template`

The official empty workspace template for `wp-typia`.

Use it through the canonical CLI:

```bash
npx wp-typia create my-plugin --template @wp-typia/create-workspace-template
```

The generated project starts with an empty `src/blocks/*` workspace shell and is designed to grow through:

```bash
wp-typia add block my-block --template basic
wp-typia add binding-source hero-data
wp-typia add binding-source hero-data --block my-block --attribute headline
wp-typia add binding-source integration-state-source --from-post-meta integration-state --meta-path status --block my-block --attribute headline
wp-typia add hooked-block my-block --anchor core/post-content --position after
```
