# `@wp-typia/create-workspace-template`

The official empty workspace template for `wp-typia`.

Use it through the canonical CLI:

```bash
npx wp-typia create my-plugin --template @wp-typia/create-workspace-template
```

The generated project starts with an empty `src/blocks/*` workspace shell and is designed to grow through:

```bash
wp-typia add block my-block --template basic
wp-typia add integration-env local-smoke --wp-env --service docker-compose
wp-typia add style callout-emphasis --block my-block
wp-typia add transform quote-to-block --from core/quote --to my-block
wp-typia add binding-source hero-data
wp-typia add binding-source hero-data --block my-block --attribute headline
wp-typia add contract external-retrieve-response --type ExternalRetrieveResponse
wp-typia add editor-plugin review-workflow --slot sidebar
wp-typia add editor-plugin seo-notes --slot document-setting-panel
wp-typia add hooked-block my-block --anchor core/post-content --position after
```
