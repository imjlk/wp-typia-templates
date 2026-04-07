[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migrations

# Module: packages/create/src/runtime/migrations

## Table of contents

### References

- [formatDiffReport](packages_create_src_runtime_migrations.md#formatdiffreport)

### Functions

- [formatMigrationHelpText](packages_create_src_runtime_migrations.md#formatmigrationhelptext)
- [parseMigrationArgs](packages_create_src_runtime_migrations.md#parsemigrationargs)
- [runMigrationCommand](packages_create_src_runtime_migrations.md#runmigrationcommand)
- [planProjectMigrations](packages_create_src_runtime_migrations.md#planprojectmigrations)
- [wizardProjectMigrations](packages_create_src_runtime_migrations.md#wizardprojectmigrations)
- [initProjectMigrations](packages_create_src_runtime_migrations.md#initprojectmigrations)
- [snapshotProjectVersion](packages_create_src_runtime_migrations.md#snapshotprojectversion)
- [diffProjectMigrations](packages_create_src_runtime_migrations.md#diffprojectmigrations)
- [scaffoldProjectMigrations](packages_create_src_runtime_migrations.md#scaffoldprojectmigrations)
- [verifyProjectMigrations](packages_create_src_runtime_migrations.md#verifyprojectmigrations)
- [doctorProjectMigrations](packages_create_src_runtime_migrations.md#doctorprojectmigrations)
- [fixturesProjectMigrations](packages_create_src_runtime_migrations.md#fixturesprojectmigrations)
- [fuzzProjectMigrations](packages_create_src_runtime_migrations.md#fuzzprojectmigrations)
- [seedProjectMigrations](packages_create_src_runtime_migrations.md#seedprojectmigrations)

## References

### formatDiffReport

Re-exports [formatDiffReport](packages_create_src_runtime_migration_render.md#formatdiffreport)

## Functions

### formatMigrationHelpText

▸ **formatMigrationHelpText**(): `string`

Returns the formatted help text for migration CLI commands and flags.

#### Returns

`string`

Multi-line usage text for the `wp-typia migrations` command surface.

#### Defined in

[packages/create/src/runtime/migrations.ts:131](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L131)

___

### parseMigrationArgs

▸ **parseMigrationArgs**(`argv`): [`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md)

Parses migration CLI arguments into a structured command payload.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `argv` | `string`[] | Command-line arguments that follow the `migrations` subcommand. |

#### Returns

[`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md)

Parsed migration command and normalized flags for runtime dispatch.

**`Throws`**

Error When no arguments are provided, an unknown flag is encountered, or legacy semver flags are used.

#### Defined in

[packages/create/src/runtime/migrations.ts:163](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L163)

___

### runMigrationCommand

▸ **runMigrationCommand**(`command`, `cwd`, `options?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| `MigrationPlanSummary` \| `Promise`\<`MigrationPlanSummary` \| \{ `cancelled`: ``true``  }\> \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[] \| \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  } \| \{ `verifiedVersions`: `string`[] = targetVersions } \| \{ `checkedVersions`: `string`[] = targetVersions; `checks`: \{ `detail`: `string` ; `label`: `string` ; `status`: ``"pass"`` \| ``"fail"``  }[]  } \| \{ `generatedVersions`: `string`[] ; `skippedVersions`: `string`[]  } \| \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

Dispatch a parsed migrations command to the matching runtime workflow.

Most commands execute synchronously and preserve direct throw semantics for
existing callers. The interactive `wizard` command returns a promise because
it waits for prompt selection before running the shared read-only planner.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `command` | [`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md) | Parsed migration command and flags. |
| `cwd` | `string` | Project directory to operate on. |
| `options` | `CommandRenderOptions` | Optional prompt/render hooks for testable and interactive execution. |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| `MigrationPlanSummary` \| `Promise`\<`MigrationPlanSummary` \| \{ `cancelled`: ``true``  }\> \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[] \| \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  } \| \{ `verifiedVersions`: `string`[] = targetVersions } \| \{ `checkedVersions`: `string`[] = targetVersions; `checks`: \{ `detail`: `string` ; `label`: `string` ; `status`: ``"pass"`` \| ``"fail"``  }[]  } \| \{ `generatedVersions`: `string`[] ; `skippedVersions`: `string`[]  } \| \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

The command result, or a promise when the selected command is interactive.

#### Defined in

[packages/create/src/runtime/migrations.ts:285](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L285)

___

### planProjectMigrations

▸ **planProjectMigrations**(`projectDir`, `options?`): `MigrationPlanSummary`

Preview one migration edge without scaffolding rules, fixtures, or generated files.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `DiffLikeOptions` | Selected source/target versions plus optional line rendering overrides. |

#### Returns

`MigrationPlanSummary`

A structured summary of the selected edge, included/skipped block targets, and next steps.

#### Defined in

[packages/create/src/runtime/migrations.ts:373](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L373)

___

### wizardProjectMigrations

▸ **wizardProjectMigrations**(`projectDir`, `options?`): `Promise`\<`MigrationPlanSummary` \| \{ `cancelled`: ``true``  }\>

Interactively choose one legacy version to preview, then run the same read-only planner.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `WizardOptions` | Interactive prompt and rendering settings. Throws when no TTY is available. |

#### Returns

`Promise`\<`MigrationPlanSummary` \| \{ `cancelled`: ``true``  }\>

The planned migration summary, or `{ cancelled: true }` when the user exits the wizard.

#### Defined in

[packages/create/src/runtime/migrations.ts:457](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L457)

___

### initProjectMigrations

▸ **initProjectMigrations**(`projectDir`, `currentMigrationVersion`, `options?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

Initializes migration scaffolding for a detected single-block or multi-block project layout.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `currentMigrationVersion` | `string` | Initial migration version label to seed, such as `v1`. |
| `options` | `CommandRenderOptions` | Console rendering options used to report retrofit detection and initialization output. |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

The loaded migration project state after the config, snapshots, and generated files are written.

**`Throws`**

Error When the project layout is unsupported or the migration version label is invalid.

#### Defined in

[packages/create/src/runtime/migrations.ts:526](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L526)

___

### snapshotProjectVersion

▸ **snapshotProjectVersion**(`projectDir`, `migrationVersion`, `options?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

Captures the current project state as a named migration snapshot and refreshes generated artifacts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `migrationVersion` | `string` | Migration version label to snapshot, such as `v2`. |
| `options` | `CommandRenderOptions` & \{ `skipConfigUpdate?`: `boolean` ; `skipSyncTypes?`: `boolean`  } | Console rendering options and snapshot side-effect flags. |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

The loaded migration project state after the snapshot files and registry outputs are refreshed.

**`Throws`**

Error When the label is invalid, the project is not migration-capable, or `sync-types` fails.

#### Defined in

[packages/create/src/runtime/migrations.ts:579](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L579)

___

### diffProjectMigrations

▸ **diffProjectMigrations**(`projectDir`, `options?`): [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[]

Computes and renders migration diffs for a selected legacy-to-target edge.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `DiffLikeOptions` | Selected source and target migration versions plus optional line rendering overrides. |

#### Returns

[`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[]

A single diff for single-block workspaces, or an array of per-block diffs for multi-block workspaces.

**`Throws`**

Error When `fromMigrationVersion` is missing or no eligible snapshots exist for the selected edge.

#### Defined in

[packages/create/src/runtime/migrations.ts:654](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L654)

___

### scaffoldProjectMigrations

▸ **scaffoldProjectMigrations**(`projectDir`, `options?`): \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  }

Scaffolds migration rule and fixture files for a selected legacy-to-target edge.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `DiffLikeOptions` | Selected source and target migration versions plus optional line rendering overrides. |

#### Returns

\{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  }

A single scaffold result for single-block workspaces, or a grouped result for multi-block workspaces.

**`Throws`**

Error When `fromMigrationVersion` is missing or no eligible snapshots exist for the selected edge.

#### Defined in

[packages/create/src/runtime/migrations.ts:698](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L698)

___

### verifyProjectMigrations

▸ **verifyProjectMigrations**(`projectDir`, `options?`): `Object`

Run deterministic migration verification against generated fixtures.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `VerifyOptions` | Verification scope and console rendering options. |

#### Returns

`Object`

Verified legacy versions.

| Name | Type |
| :------ | :------ |
| `verifiedVersions` | `string`[] |

#### Defined in

[packages/create/src/runtime/migrations.ts:774](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L774)

___

### doctorProjectMigrations

▸ **doctorProjectMigrations**(`projectDir`, `options?`): `Object`

Validate the migration workspace without mutating files.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `VerifyOptions` | Doctor scope and console rendering options. |

#### Returns

`Object`

Structured doctor check results for the selected legacy versions.

| Name | Type |
| :------ | :------ |
| `checkedVersions` | `string`[] |
| `checks` | \{ `detail`: `string` ; `label`: `string` ; `status`: ``"pass"`` \| ``"fail"``  }[] |

#### Defined in

[packages/create/src/runtime/migrations.ts:832](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L832)

___

### fixturesProjectMigrations

▸ **fixturesProjectMigrations**(`projectDir`, `options?`): `Object`

Generate or refresh migration fixtures for one or more legacy edges.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `FixturesOptions` | Fixture generation scope and refresh options. |

#### Returns

`Object`

Generated and skipped legacy versions.

| Name | Type |
| :------ | :------ |
| `generatedVersions` | `string`[] |
| `skippedVersions` | `string`[] |

#### Defined in

[packages/create/src/runtime/migrations.ts:1093](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L1093)

___

### fuzzProjectMigrations

▸ **fuzzProjectMigrations**(`projectDir`, `options?`): \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

Run seeded migration fuzz verification against generated fuzz artifacts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `options` | `FuzzOptions` | Fuzz scope, iteration count, seed, and console rendering options. |

#### Returns

\{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

Fuzzed legacy versions and the effective seed.

#### Defined in

[packages/create/src/runtime/migrations.ts:1174](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L1174)

___

### seedProjectMigrations

▸ **seedProjectMigrations**(`projectDir`, `currentMigrationVersion`, `blocks`, `options?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

Initialize migration scaffolding for one or more block targets.

Writes the migration config, creates the initial scaffold files, snapshots
the current project state, and regenerates generated migration artifacts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `currentMigrationVersion` | `string` | Initial migration version label to seed into the migration config. |
| `blocks` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)[] | Block targets to register for migration-aware scaffolding. |
| `options` | `CommandRenderOptions` | Console rendering options for initialization output. |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

The loaded migration project state after initialization completes.

#### Defined in

[packages/create/src/runtime/migrations.ts:1399](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L1399)
