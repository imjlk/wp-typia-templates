[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/validation](../modules/packages_wp_typia_block_runtime_src_validation.md) / ValidationState

# Interface: ValidationState\<T\>

[packages/wp-typia-block-runtime/src/validation](../modules/packages_wp_typia_block_runtime_src_validation.md).ValidationState

## Type parameters

| Name |
| :------ |
| `T` |

## Hierarchy

- [`ValidationResult`](../modules/packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>

  ↳ **`ValidationState`**

## Table of contents

### Properties

- [data](packages_wp_typia_block_runtime_src_validation.ValidationState.md#data)
- [errors](packages_wp_typia_block_runtime_src_validation.ValidationState.md#errors)
- [isValid](packages_wp_typia_block_runtime_src_validation.ValidationState.md#isvalid)
- [errorMessages](packages_wp_typia_block_runtime_src_validation.ValidationState.md#errormessages)

## Properties

### data

• `Optional` **data**: `T`

#### Inherited from

ValidationResult.data

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L11)

___

### errors

• **errors**: [`ValidationError`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)[]

#### Inherited from

ValidationResult.errors

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:12](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L12)

___

### isValid

• **isValid**: `boolean`

#### Inherited from

ValidationResult.isValid

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:13](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L13)

___

### errorMessages

• **errorMessages**: `string`[]

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L17)
