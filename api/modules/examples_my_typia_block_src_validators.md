[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/validators

# Module: examples/my-typia-block/src/validators

## Table of contents

### Variables

- [validators](examples_my_typia_block_src_validators.md#validators)

### Functions

- [sanitizeMyTypiaBlockAttributes](examples_my_typia_block_src_validators.md#sanitizemytypiablockattributes)
- [createAttributeUpdater](examples_my_typia_block_src_validators.md#createattributeupdater)

## Variables

### validators

• `Const` **validators**: `Object`

Typia validators for the block attributes

#### Type declaration

| Name | Type |
| :------ | :------ |
| `validate` | (`input`: `unknown`) => `IValidation`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> & `StandardSchemaV1`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md), [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> |
| `assert` | (`input`: `unknown`) => [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |
| `is` | (`input`: `unknown`) => input is MyTypiaBlockAttributes |
| `random` | () => [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |
| `clone` | (`input`: [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)) => [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |
| `prune` | (`input`: [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)) => `void` |

#### Defined in

[examples/my-typia-block/src/validators.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L13)

## Functions

### sanitizeMyTypiaBlockAttributes

▸ **sanitizeMyTypiaBlockAttributes**(`attributes`): [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Partial`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> |

#### Returns

[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)

#### Defined in

[examples/my-typia-block/src/validators.ts:22](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L22)

___

### createAttributeUpdater

▸ **createAttributeUpdater**(`attributes`, `setAttributes`, `validator?`): \<K\>(`key`: `K`, `value`: [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)[`K`]) => `boolean`

Create safe attribute updater with validation

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `attributes` | [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) | `undefined` |
| `setAttributes` | (`attrs`: `Partial`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\>) => `void` | `undefined` |
| `validator` | (`input`: `unknown`) => `IValidation`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> & `StandardSchemaV1`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md), [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> | `validators.validate` |

#### Returns

`fn`

▸ \<`K`\>(`key`, `value`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends keyof [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |

##### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)[`K`] |

##### Returns

`boolean`

#### Defined in

[examples/my-typia-block/src/validators.ts:37](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L37)
