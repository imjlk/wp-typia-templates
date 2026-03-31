[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/my-typia-block/src/migrations](../modules/examples_my_typia_block_src_migrations.md) / MigrationAnalysis

# Interface: MigrationAnalysis

[examples/my-typia-block/src/migrations](../modules/examples_my_typia_block_src_migrations.md).MigrationAnalysis

## Table of contents

### Properties

- [needsMigration](examples_my_typia_block_src_migrations.MigrationAnalysis.md#needsmigration)
- [currentVersion](examples_my_typia_block_src_migrations.MigrationAnalysis.md#currentversion)
- [targetVersion](examples_my_typia_block_src_migrations.MigrationAnalysis.md#targetversion)
- [confidence](examples_my_typia_block_src_migrations.MigrationAnalysis.md#confidence)
- [reasons](examples_my_typia_block_src_migrations.MigrationAnalysis.md#reasons)
- [riskSummary](examples_my_typia_block_src_migrations.MigrationAnalysis.md#risksummary)
- [warnings](examples_my_typia_block_src_migrations.MigrationAnalysis.md#warnings)
- [affectedFields](examples_my_typia_block_src_migrations.MigrationAnalysis.md#affectedfields)

## Properties

### needsMigration

• **needsMigration**: `boolean`

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:23](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L23)

___

### currentVersion

• **currentVersion**: `string`

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:24](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L24)

___

### targetVersion

• **targetVersion**: `string`

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:25](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L25)

___

### confidence

• **confidence**: `number`

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L26)

___

### reasons

• **reasons**: `string`[]

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:27](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L27)

___

### riskSummary

• **riskSummary**: [`MigrationRiskSummary`](examples_my_typia_block_src_migrations_helpers.MigrationRiskSummary.md)

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:28](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L28)

___

### warnings

• **warnings**: `string`[]

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:29](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L29)

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

[examples/my-typia-block/src/migrations/index.ts:30](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L30)
