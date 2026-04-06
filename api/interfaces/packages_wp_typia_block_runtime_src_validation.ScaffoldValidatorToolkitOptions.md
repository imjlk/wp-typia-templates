[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/validation](../modules/packages_wp_typia_block_runtime_src_validation.md) / ScaffoldValidatorToolkitOptions

# Interface: ScaffoldValidatorToolkitOptions\<T\>

[packages/wp-typia-block-runtime/src/validation](../modules/packages_wp_typia_block_runtime_src_validation.md).ScaffoldValidatorToolkitOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

## Table of contents

### Properties

- [assert](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#assert)
- [clone](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#clone)
- [finalize](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#finalize)
- [is](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#is)
- [manifest](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#manifest)
- [onValidationError](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#onvalidationerror)
- [prune](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#prune)
- [random](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#random)
- [validate](packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md#validate)

## Properties

### assert

• **assert**: (`value`: `unknown`) => `T`

#### Type declaration

▸ (`value`): `T`

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

##### Returns

`T`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L27)

___

### clone

• **clone**: (`value`: `T`) => `T`

#### Type declaration

▸ (`value`): `T`

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

##### Returns

`T`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:28](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L28)

___

### finalize

• `Optional` **finalize**: (`value`: `Partial`\<`T`\>) => `unknown`

#### Type declaration

▸ (`value`): `unknown`

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `Partial`\<`T`\> |

##### Returns

`unknown`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:29](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L29)

___

### is

• **is**: (`value`: `unknown`) => value is T

#### Type declaration

▸ (`value`): value is T

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

##### Returns

value is T

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L30)

___

### manifest

• **manifest**: [`ManifestDefaultsDocument`](packages_wp_typia_block_runtime_src_defaults.ManifestDefaultsDocument.md)

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L31)

___

### onValidationError

• `Optional` **onValidationError**: (`result`: [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>, `key`: keyof `T`) => `void`

#### Type declaration

▸ (`result`, `key`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |
| `key` | keyof `T` |

##### Returns

`void`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L32)

___

### prune

• **prune**: (`value`: `T`) => `unknown`

#### Type declaration

▸ (`value`): `unknown`

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

##### Returns

`unknown`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L33)

___

### random

• **random**: (...`args`: `unknown`[]) => `T`

#### Type declaration

▸ (`...args`): `T`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `unknown`[] |

##### Returns

`T`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L34)

___

### validate

• **validate**: (`value`: `unknown`) => `unknown`

#### Type declaration

▸ (`value`): `unknown`

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

##### Returns

`unknown`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L35)
