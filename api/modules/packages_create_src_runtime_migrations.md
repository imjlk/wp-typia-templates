[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migrations

# Module: packages/create/src/runtime/migrations

## Table of contents

### References

- [formatDiffReport](packages_create_src_runtime_migrations.md#formatdiffreport)

### Functions

- [formatMigrationHelpText](packages_create_src_runtime_migrations.md#formatmigrationhelptext)
- [parseMigrationArgs](packages_create_src_runtime_migrations.md#parsemigrationargs)
- [runMigrationCommand](packages_create_src_runtime_migrations.md#runmigrationcommand)
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

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migrations.ts:98](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L98)

___

### parseMigrationArgs

▸ **parseMigrationArgs**(`argv`): [`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `argv` | `string`[] |

#### Returns

[`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md)

#### Defined in

[packages/create/src/runtime/migrations.ts:115](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L115)

___

### runMigrationCommand

▸ **runMigrationCommand**(`command`, `cwd`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[] \| \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  } \| \{ `verifiedVersions`: `string`[] = targetVersions } \| \{ `checkedVersions`: `string`[] = targetVersions; `checks`: \{ `detail`: `string` ; `label`: `string` ; `status`: ``"fail"`` \| ``"pass"``  }[]  } \| \{ `generatedVersions`: `string`[] ; `skippedVersions`: `string`[]  } \| \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `command` | [`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md) |
| `cwd` | `string` |
| `«destructured»` | `CommandRenderOptions` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[] \| \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  } \| \{ `verifiedVersions`: `string`[] = targetVersions } \| \{ `checkedVersions`: `string`[] = targetVersions; `checks`: \{ `detail`: `string` ; `label`: `string` ; `status`: ``"fail"`` \| ``"pass"``  }[]  } \| \{ `generatedVersions`: `string`[] ; `skippedVersions`: `string`[]  } \| \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

#### Defined in

[packages/create/src/runtime/migrations.ts:212](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L212)

___

### initProjectMigrations

▸ **initProjectMigrations**(`projectDir`, `currentVersion`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentVersion` | `string` |
| `«destructured»` | `CommandRenderOptions` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create/src/runtime/migrations.ts:279](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L279)

___

### snapshotProjectVersion

▸ **snapshotProjectVersion**(`projectDir`, `version`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `version` | `string` |
| `«destructured»` | `CommandRenderOptions` & \{ `skipConfigUpdate?`: `boolean` ; `skipSyncTypes?`: `boolean`  } |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create/src/runtime/migrations.ts:304](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L304)

___

### diffProjectMigrations

▸ **diffProjectMigrations**(`projectDir`, `«destructured»?`): [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `«destructured»` | `DiffLikeOptions` |

#### Returns

[`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `block`: [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)  }[]

#### Defined in

[packages/create/src/runtime/migrations.ts:369](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L369)

___

### scaffoldProjectMigrations

▸ **scaffoldProjectMigrations**(`projectDir`, `«destructured»?`): \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `«destructured»` | `DiffLikeOptions` |

#### Returns

\{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `scaffolded`: \{ `blockName`: `string` ; `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  }[]  }

#### Defined in

[packages/create/src/runtime/migrations.ts:398](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L398)

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

[packages/create/src/runtime/migrations.ts:467](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L467)

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
| `checks` | \{ `detail`: `string` ; `label`: `string` ; `status`: ``"fail"`` \| ``"pass"``  }[] |

#### Defined in

[packages/create/src/runtime/migrations.ts:525](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L525)

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

[packages/create/src/runtime/migrations.ts:784](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L784)

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

[packages/create/src/runtime/migrations.ts:857](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L857)

___

### seedProjectMigrations

▸ **seedProjectMigrations**(`projectDir`, `currentVersion`, `blocks`, `options?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

Initialize migration scaffolding for one or more block targets.

Writes the migration config, creates the initial scaffold files, snapshots
the current project state, and regenerates generated migration artifacts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |
| `currentVersion` | `string` | Initial semantic version to seed into the migration config. |
| `blocks` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)[] | Block targets to register for migration-aware scaffolding. |
| `options` | `CommandRenderOptions` | Console rendering options for initialization output. |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

The loaded migration project state after initialization completes.

#### Defined in

[packages/create/src/runtime/migrations.ts:1052](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L1052)
