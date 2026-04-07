[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/my-typia-block/src/migrations/types](../modules/examples_my_typia_block_src_migrations_types.md) / MigrationAnalysis

# Interface: MigrationAnalysis

[examples/my-typia-block/src/migrations/types](../modules/examples_my_typia_block_src_migrations_types.md).MigrationAnalysis

## Table of contents

### Properties

- [needsMigration](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#needsmigration)
- [currentMigrationVersion](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#currentmigrationversion)
- [targetMigrationVersion](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#targetmigrationversion)
- [confidence](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#confidence)
- [reasons](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#reasons)
- [riskSummary](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#risksummary)
- [warnings](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#warnings)
- [affectedFields](examples_my_typia_block_src_migrations_types.MigrationAnalysis.md#affectedfields)

## Properties

### needsMigration

• **needsMigration**: `boolean`

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:4](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L4)

___

### currentMigrationVersion

• **currentMigrationVersion**: `string`

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:5](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L5)

___

### targetMigrationVersion

• **targetMigrationVersion**: `string`

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:6](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L6)

___

### confidence

• **confidence**: `number`

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:7](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L7)

___

### reasons

• **reasons**: `string`[]

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:8](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L8)

___

### riskSummary

• **riskSummary**: [`MigrationRiskSummary`](examples_my_typia_block_src_migrations_helpers.MigrationRiskSummary.md)

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:9](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L9)

___

### warnings

• **warnings**: `string`[]

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:10](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L10)

___

### affectedFields

• **affectedFields**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `added` | `string`[] |
| `changed` | `string`[] |
| `removed` | `string`[] |

#### Defined in

[examples/my-typia-block/src/migrations/types.ts:11](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/types.ts#L11)
