[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/validation](../modules/packages_create_src_runtime_validation.md) / ScaffoldValidatorToolkitOptions

# Interface: ScaffoldValidatorToolkitOptions\<T\>

[packages/create/src/runtime/validation](../modules/packages_create_src_runtime_validation.md).ScaffoldValidatorToolkitOptions

Shared inputs for scaffold validator toolkits that wrap Typia validators,
default application, and validation-aware attribute updates.

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

## Table of contents

### Properties

- [assert](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#assert)
- [clone](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#clone)
- [finalize](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#finalize)
- [is](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#is)
- [manifest](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#manifest)
- [onValidationError](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#onvalidationerror)
- [prune](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#prune)
- [random](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#random)
- [validate](packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md#validate)

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

[packages/create/src/runtime/validation.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L34)

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

[packages/create/src/runtime/validation.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L35)

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

[packages/create/src/runtime/validation.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L36)

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

[packages/create/src/runtime/validation.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L37)

___

### manifest

• **manifest**: [`ManifestDefaultsDocument`](packages_create_src_runtime_defaults.ManifestDefaultsDocument.md)

#### Defined in

[packages/create/src/runtime/validation.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L38)

___

### onValidationError

• `Optional` **onValidationError**: (`result`: [`ValidationResult`](packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>, `key`: keyof `T`) => `void`

#### Type declaration

▸ (`result`, `key`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationResult`](packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |
| `key` | keyof `T` |

##### Returns

`void`

#### Defined in

[packages/create/src/runtime/validation.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L39)

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

[packages/create/src/runtime/validation.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L40)

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

[packages/create/src/runtime/validation.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L41)

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

[packages/create/src/runtime/validation.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L42)
