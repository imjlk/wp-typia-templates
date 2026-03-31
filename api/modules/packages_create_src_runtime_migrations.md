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

## References

### formatDiffReport

Re-exports [formatDiffReport](packages_create_src_runtime_migration_render.md#formatdiffreport)

## Functions

### formatMigrationHelpText

▸ **formatMigrationHelpText**(): `string`

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migrations.ts:90](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L90)

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

[packages/create/src/runtime/migrations.ts:102](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L102)

___

### runMigrationCommand

▸ **runMigrationCommand**(`command`, `cwd`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `verifiedVersions`: `string`[] = targetVersions } \| \{ `checkedVersions`: `string`[] = targetVersions; `checks`: \{ `detail`: `string` ; `label`: `string` ; `status`: ``"pass"`` \| ``"fail"``  }[]  } \| \{ `generatedVersions`: `string`[] ; `skippedVersions`: `string`[]  } \| \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `command` | [`ParsedMigrationArgs`](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md) |
| `cwd` | `string` |
| `«destructured»` | `CommandRenderOptions` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) \| \{ `diff`: [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `verifiedVersions`: `string`[] = targetVersions } \| \{ `checkedVersions`: `string`[] = targetVersions; `checks`: \{ `detail`: `string` ; `label`: `string` ; `status`: ``"pass"`` \| ``"fail"``  }[]  } \| \{ `generatedVersions`: `string`[] ; `skippedVersions`: `string`[]  } \| \{ `fuzzedVersions`: `never`[] = []; `seed`: `undefined`  } \| \{ `fuzzedVersions`: `string`[] = targetVersions; `seed`: `undefined` \| `number`  }

#### Defined in

[packages/create/src/runtime/migrations.ts:199](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L199)

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

[packages/create/src/runtime/migrations.ts:266](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L266)

___

### snapshotProjectVersion

▸ **snapshotProjectVersion**(`projectDir`, `version`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `version` | `string` |
| `«destructured»` | `CommandRenderOptions` & \{ `skipConfigUpdate?`: `boolean`  } |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create/src/runtime/migrations.ts:292](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L292)

___

### diffProjectMigrations

▸ **diffProjectMigrations**(`projectDir`, `«destructured»?`): [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `«destructured»` | `DiffLikeOptions` |

#### Returns

[`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)

#### Defined in

[packages/create/src/runtime/migrations.ts:338](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L338)

___

### scaffoldProjectMigrations

▸ **scaffoldProjectMigrations**(`projectDir`, `«destructured»?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `«destructured»` | `DiffLikeOptions` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `diff` | [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) |
| `rulePath` | `string` |

#### Defined in

[packages/create/src/runtime/migrations.ts:352](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L352)

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

[packages/create/src/runtime/migrations.ts:396](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L396)

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

[packages/create/src/runtime/migrations.ts:441](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L441)

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

[packages/create/src/runtime/migrations.ts:631](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L631)

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

[packages/create/src/runtime/migrations.ts:679](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migrations.ts#L679)
