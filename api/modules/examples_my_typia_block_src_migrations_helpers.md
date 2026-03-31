[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/migrations/helpers

# Module: examples/my-typia-block/src/migrations/helpers

## Table of contents

### Interfaces

- [ManifestUnion](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestUnion.md)
- [ManifestAttribute](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md)
- [ManifestDocument](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestDocument.md)
- [MigrationRiskBucket](../interfaces/examples_my_typia_block_src_migrations_helpers.MigrationRiskBucket.md)
- [MigrationRiskSummary](../interfaces/examples_my_typia_block_src_migrations_helpers.MigrationRiskSummary.md)

### Type Aliases

- [RenameMap](examples_my_typia_block_src_migrations_helpers.md#renamemap)
- [TransformMap](examples_my_typia_block_src_migrations_helpers.md#transformmap)

### Functions

- [createDefaultValue](examples_my_typia_block_src_migrations_helpers.md#createdefaultvalue)
- [getValueAtPath](examples_my_typia_block_src_migrations_helpers.md#getvalueatpath)
- [resolveMigrationValue](examples_my_typia_block_src_migrations_helpers.md#resolvemigrationvalue)
- [resolveMigrationAttribute](examples_my_typia_block_src_migrations_helpers.md#resolvemigrationattribute)
- [coerceValueFromManifest](examples_my_typia_block_src_migrations_helpers.md#coercevaluefrommanifest)
- [manifestMatchesDocument](examples_my_typia_block_src_migrations_helpers.md#manifestmatchesdocument)
- [summarizeVersionDelta](examples_my_typia_block_src_migrations_helpers.md#summarizeversiondelta)

## Type Aliases

### RenameMap

Ƭ **RenameMap**: `Record`\<`string`, `string`\>

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:53](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L53)

___

### TransformMap

Ƭ **TransformMap**: `Record`\<`string`, (`legacyValue`: `unknown`, `legacyInput`: `Record`\<`string`, `unknown`\>) => `unknown`\>

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:54](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L54)

## Functions

### createDefaultValue

▸ **createDefaultValue**(`attribute`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md) |

#### Returns

`unknown`

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:71](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L71)

___

### getValueAtPath

▸ **getValueAtPath**(`input`, `path`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Record`\<`string`, `unknown`\> |
| `path` | `string` |

#### Returns

`unknown`

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:111](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L111)

___

### resolveMigrationValue

▸ **resolveMigrationValue**(`attribute`, `currentKey`, `fallbackPath`, `input`, `renameMap`, `transforms`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md) |
| `currentKey` | `string` |
| `fallbackPath` | `string` |
| `input` | `Record`\<`string`, `unknown`\> |
| `renameMap` | [`RenameMap`](examples_my_typia_block_src_migrations_helpers.md#renamemap) |
| `transforms` | [`TransformMap`](examples_my_typia_block_src_migrations_helpers.md#transformmap) |

#### Returns

`unknown`

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:131](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L131)

___

### resolveMigrationAttribute

▸ **resolveMigrationAttribute**(`attribute`, `currentPath`, `fallbackPath`, `input`, `renameMap`, `transforms`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md) |
| `currentPath` | `string` |
| `fallbackPath` | `string` |
| `input` | `Record`\<`string`, `unknown`\> |
| `renameMap` | [`RenameMap`](examples_my_typia_block_src_migrations_helpers.md#renamemap) |
| `transforms` | [`TransformMap`](examples_my_typia_block_src_migrations_helpers.md#transformmap) |

#### Returns

`unknown`

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:148](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L148)

___

### coerceValueFromManifest

▸ **coerceValueFromManifest**(`attribute`, `value`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md) |
| `value` | `unknown` |

#### Returns

`unknown`

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:228](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L228)

___

### manifestMatchesDocument

▸ **manifestMatchesDocument**(`manifest`, `attributes`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestDocument.md) |
| `attributes` | `Record`\<`string`, `unknown`\> |

#### Returns

`boolean`

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:281](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L281)

___

### summarizeVersionDelta

▸ **summarizeVersionDelta**(`legacyManifest`, `currentManifest`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `legacyManifest` | [`ManifestDocument`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestDocument.md) |
| `currentManifest` | [`ManifestDocument`](../interfaces/examples_my_typia_block_src_migrations_helpers.ManifestDocument.md) |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `added` | `string`[] |
| `removed` | `string`[] |
| `changed` | `string`[] |

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:303](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L303)
