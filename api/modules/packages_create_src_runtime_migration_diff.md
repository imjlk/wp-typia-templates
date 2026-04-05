[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-diff

# Module: packages/create/src/runtime/migration-diff

## Table of contents

### Functions

- [createMigrationDiff](packages_create_src_runtime_migration_diff.md#createmigrationdiff)

## Functions

### createMigrationDiff

▸ **createMigrationDiff**(`state`, `blockOrFromVersion`, `fromVersionOrToVersion`, `maybeToVersion?`): [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `blockOrFromVersion` | `string` \| [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromVersionOrToVersion` | `string` |
| `maybeToVersion?` | `string` |

#### Returns

[`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)

#### Defined in

[packages/create/src/runtime/migration-diff.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-diff.ts#L38)
