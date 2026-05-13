# `@wp-typia/create-workspace-template`

The official empty workspace template for `wp-typia`.

Use it through the canonical CLI:

```bash
npx wp-typia create my-plugin --template @wp-typia/create-workspace-template
```

The generated project starts with an empty `src/blocks/*` workspace shell and is designed to grow through:

```bash
npm run wp-typia:add -- block my-block --template basic
npm run wp-typia:add -- integration-env local-smoke --wp-env --service docker-compose
npm run wp-typia:add -- style callout-emphasis --block my-block
npm run wp-typia:add -- transform quote-to-block --from core/quote --to my-block
npm run wp-typia:add -- binding-source hero-data
npm run wp-typia:add -- binding-source hero-data --block my-block --attribute headline
npm run wp-typia:add -- contract external-retrieve-response --type ExternalRetrieveResponse
npm run wp-typia:add -- post-meta integration-state --post-type post --type IntegrationStateMeta
npm run wp-typia:add -- editor-plugin review-workflow --slot sidebar
npm run wp-typia:add -- editor-plugin seo-notes --slot document-setting-panel
npm run wp-typia:add -- hooked-block my-block --anchor core/post-content --position after
```

## CLI binary policy

Official workspace projects install `wp-typia` as a local devDependency and
expose package scripts for the common CLI entrypoints:

```json
{
  "scripts": {
    "sync-rest:package": "tsx scripts/sync-rest-contracts.ts --package",
    "sync-rest:package:check": "tsx scripts/sync-rest-contracts.ts --package --check",
    "wp-typia:sync": "wp-typia sync",
    "wp-typia:doctor": "wp-typia doctor",
    "wp-typia:doctor:workspace": "wp-typia doctor --workspace-only",
    "wp-typia:add": "wp-typia add"
  },
  "devDependencies": {
    "wp-typia": "<version>"
  }
}
```

Use the script form from generated workspaces so the executable CLI package is
clearly separated from support packages such as `@wp-typia/project-tools`.

Workspaces that ship REST resources can run `sync-rest:package` before release
builds to copy generated runtime schemas into `inc/rest-schemas`. Add
`sync-rest:package:check` to release CI so stale or missing packaged schemas are
caught before a zip is built without TypeScript source files.

| Package manager | Doctor                     | Sync check                         | Add a block                                               |
| --------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------- |
| npm             | `npm run wp-typia:doctor`  | `npm run wp-typia:sync -- --check` | `npm run wp-typia:add -- block my-block --template basic` |
| pnpm            | `pnpm run wp-typia:doctor` | `pnpm run wp-typia:sync --check`   | `pnpm run wp-typia:add block my-block --template basic`   |
| bun             | `bun run wp-typia:doctor`  | `bun run wp-typia:sync --check`    | `bun run wp-typia:add block my-block --template basic`    |
| yarn            | `yarn run wp-typia:doctor` | `yarn run wp-typia:sync --check`   | `yarn run wp-typia:add block my-block --template basic`   |

Existing workspaces can adopt the same scripts without regenerating. Pin
`wp-typia` to the project version you want CI to run, then use
`wp-typia:doctor:workspace` when optional local runtimes should be advisory.
