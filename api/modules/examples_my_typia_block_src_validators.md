[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/validators

# Module: examples/my-typia-block/src/validators

## Table of contents

### Variables

- [validators](examples_my_typia_block_src_validators.md#validators)

### Functions

- [validateMyTypiaBlockAttributes](examples_my_typia_block_src_validators.md#validatemytypiablockattributes)
- [sanitizeMyTypiaBlockAttributes](examples_my_typia_block_src_validators.md#sanitizemytypiablockattributes)
- [createAttributeUpdater](examples_my_typia_block_src_validators.md#createattributeupdater)
- [createNestedAttributeUpdater](examples_my_typia_block_src_validators.md#createnestedattributeupdater)

## Variables

### validators

• `Const` **validators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `validate` | (`attributes`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> |
| `assert` | (`input`: `unknown`) => [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |
| `is` | (`input`: `unknown`) => input is MyTypiaBlockAttributes |
| `random` | () => [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |
| `clone` | (`input`: [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)) => [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) |
| `prune` | (`input`: [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)) => `void` |

#### Defined in

[examples/my-typia-block/src/validators.ts:34](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L34)

## Functions

### validateMyTypiaBlockAttributes

▸ **validateMyTypiaBlockAttributes**(`attributes`): [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `unknown` |

#### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\>

#### Defined in

[examples/my-typia-block/src/validators.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L26)

___

### sanitizeMyTypiaBlockAttributes

▸ **sanitizeMyTypiaBlockAttributes**(`attributes`): [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Partial`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> |

#### Returns

[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)

#### Defined in

[examples/my-typia-block/src/validators.ts:43](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L43)

___

### createAttributeUpdater

▸ **createAttributeUpdater**(`attributes`, `setAttributes`, `validator?`): \<K\>(`key`: `K`, `value`: [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)[`K`]) => `boolean`

Create safe attribute updater with validation

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `attributes` | [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) | `undefined` |
| `setAttributes` | (`attrs`: `Partial`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\>) => `void` | `undefined` |
| `validator` | (`attributes`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> | `validators.validate` |

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

[examples/my-typia-block/src/validators.ts:67](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L67)

___

### createNestedAttributeUpdater

▸ **createNestedAttributeUpdater**(`attributes`, `setAttributes`, `validator?`): (`path`: `string`, `value`: `unknown`) => `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `attributes` | [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md) | `undefined` |
| `setAttributes` | (`attrs`: `Partial`\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\>) => `void` | `undefined` |
| `validator` | (`attributes`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)\> | `validators.validate` |

#### Returns

`fn`

▸ (`path`, `value`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `value` | `unknown` |

##### Returns

`boolean`

#### Defined in

[examples/my-typia-block/src/validators.ts:87](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/validators.ts#L87)
