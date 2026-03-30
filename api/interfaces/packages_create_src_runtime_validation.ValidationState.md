[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/validation](../modules/packages_create_src_runtime_validation.md) / ValidationState

# Interface: ValidationState\<T\>

[packages/create/src/runtime/validation](../modules/packages_create_src_runtime_validation.md).ValidationState

## Type parameters

| Name |
| :------ |
| `T` |

## Hierarchy

- [`ValidationResult`](packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>

  ↳ **`ValidationState`**

## Table of contents

### Properties

- [data](packages_create_src_runtime_validation.ValidationState.md#data)
- [errors](packages_create_src_runtime_validation.ValidationState.md#errors)
- [isValid](packages_create_src_runtime_validation.ValidationState.md#isvalid)
- [errorMessages](packages_create_src_runtime_validation.ValidationState.md#errormessages)

## Properties

### data

• `Optional` **data**: `T`

#### Inherited from

[ValidationResult](packages_create_src_runtime_validation.ValidationResult.md).[data](packages_create_src_runtime_validation.ValidationResult.md#data)

#### Defined in

[packages/create/src/runtime/validation.ts:9](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L9)

___

### errors

• **errors**: [`TypiaValidationError`](packages_create_src_runtime_validation.TypiaValidationError.md)[]

#### Inherited from

[ValidationResult](packages_create_src_runtime_validation.ValidationResult.md).[errors](packages_create_src_runtime_validation.ValidationResult.md#errors)

#### Defined in

[packages/create/src/runtime/validation.ts:10](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L10)

___

### isValid

• **isValid**: `boolean`

#### Inherited from

[ValidationResult](packages_create_src_runtime_validation.ValidationResult.md).[isValid](packages_create_src_runtime_validation.ValidationResult.md#isvalid)

#### Defined in

[packages/create/src/runtime/validation.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L11)

___

### errorMessages

• **errorMessages**: `string`[]

#### Defined in

[packages/create/src/runtime/validation.ts:15](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L15)
