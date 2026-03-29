[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create-wp-typia/src/runtime/migrations

# Module: packages/create-wp-typia/src/runtime/migrations

## Table of contents

### References

- [formatDiffReport](packages_create_wp_typia_src_runtime_migrations.md#formatdiffreport)

### Functions

- [formatMigrationHelpText](packages_create_wp_typia_src_runtime_migrations.md#formatmigrationhelptext)
- [parseMigrationArgs](packages_create_wp_typia_src_runtime_migrations.md#parsemigrationargs)
- [runMigrationCommand](packages_create_wp_typia_src_runtime_migrations.md#runmigrationcommand)
- [initProjectMigrations](packages_create_wp_typia_src_runtime_migrations.md#initprojectmigrations)
- [snapshotProjectVersion](packages_create_wp_typia_src_runtime_migrations.md#snapshotprojectversion)
- [diffProjectMigrations](packages_create_wp_typia_src_runtime_migrations.md#diffprojectmigrations)
- [scaffoldProjectMigrations](packages_create_wp_typia_src_runtime_migrations.md#scaffoldprojectmigrations)
- [verifyProjectMigrations](packages_create_wp_typia_src_runtime_migrations.md#verifyprojectmigrations)

## References

### formatDiffReport

Re-exports [formatDiffReport](packages_create_wp_typia_src_runtime_migration_render.md#formatdiffreport)

## Functions

### formatMigrationHelpText

▸ **formatMigrationHelpText**(): `string`

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:69](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L69)

___

### parseMigrationArgs

▸ **parseMigrationArgs**(`argv`): [`ParsedMigrationArgs`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.ParsedMigrationArgs.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `argv` | `string`[] |

#### Returns

[`ParsedMigrationArgs`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.ParsedMigrationArgs.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:78](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L78)

___

### runMigrationCommand

▸ **runMigrationCommand**(`command`, `cwd`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md) \| \{ `diff`: [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `verifiedVersions`: `string`[] = targetVersions }

#### Parameters

| Name | Type |
| :------ | :------ |
| `command` | [`ParsedMigrationArgs`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.ParsedMigrationArgs.md) |
| `cwd` | `string` |
| `«destructured»` | `CommandRenderOptions` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md) \| [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md) \| \{ `diff`: [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md) ; `rulePath`: `string`  } \| \{ `verifiedVersions`: `string`[] = targetVersions }

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:150](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L150)

___

### initProjectMigrations

▸ **initProjectMigrations**(`projectDir`, `currentVersion`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentVersion` | `string` |
| `«destructured»` | `CommandRenderOptions` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:195](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L195)

___

### snapshotProjectVersion

▸ **snapshotProjectVersion**(`projectDir`, `version`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `version` | `string` |
| `«destructured»` | `CommandRenderOptions` & \{ `skipConfigUpdate?`: `boolean`  } |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:221](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L221)

___

### diffProjectMigrations

▸ **diffProjectMigrations**(`projectDir`, `«destructured»?`): [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `«destructured»` | `DiffLikeOptions` |

#### Returns

[`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:267](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L267)

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
| `diff` | [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md) |
| `rulePath` | `string` |

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:281](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L281)

___

### verifyProjectMigrations

▸ **verifyProjectMigrations**(`projectDir`, `«destructured»?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `«destructured»` | `VerifyOptions` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `verifiedVersions` | `string`[] |

#### Defined in

[packages/create-wp-typia/src/runtime/migrations.ts:318](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migrations.ts#L318)
