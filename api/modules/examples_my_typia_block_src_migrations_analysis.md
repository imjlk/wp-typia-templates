[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/migrations/analysis

# Module: examples/my-typia-block/src/migrations/analysis

## Table of contents

### Functions

- [detectBlockMigration](examples_my_typia_block_src_migrations_analysis.md#detectblockmigration)
- [autoMigrate](examples_my_typia_block_src_migrations_analysis.md#automigrate)
- [resolveMigrationState](examples_my_typia_block_src_migrations_analysis.md#resolvemigrationstate)

## Functions

### detectBlockMigration

▸ **detectBlockMigration**(`attributes`): [`MigrationAnalysis`](../interfaces/examples_my_typia_block_src_migrations_types.MigrationAnalysis.md)

Returns the migration analysis for one block attribute payload.

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, `unknown`\> |

#### Returns

[`MigrationAnalysis`](../interfaces/examples_my_typia_block_src_migrations_types.MigrationAnalysis.md)

#### Defined in

[examples/my-typia-block/src/migrations/analysis.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/analysis.ts#L26)

___

### autoMigrate

▸ **autoMigrate**(`attributes`): `Record`\<`string`, `unknown`\>

Applies the matching migration rule and returns the migrated attributes.

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, `unknown`\> |

#### Returns

`Record`\<`string`, `unknown`\>

#### Defined in

[examples/my-typia-block/src/migrations/analysis.ts:36](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/analysis.ts#L36)

___

### resolveMigrationState

▸ **resolveMigrationState**(`attributes`): `MigrationResolution`

Resolves the current migration state, preview, and risk metadata for one block.

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, `unknown`\> |

#### Returns

`MigrationResolution`

#### Defined in

[examples/my-typia-block/src/migrations/analysis.ts:53](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/analysis.ts#L53)
