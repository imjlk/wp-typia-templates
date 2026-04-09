[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/hooks

# Module: examples/my-typia-block/src/hooks

## Table of contents

### References

- [formatValidationError](examples_my_typia_block_src_hooks.md#formatvalidationerror)
- [formatValidationErrors](examples_my_typia_block_src_hooks.md#formatvalidationerrors)
- [toValidationState](examples_my_typia_block_src_hooks.md#tovalidationstate)
- [TypiaValidationError](examples_my_typia_block_src_hooks.md#typiavalidationerror)
- [ValidationResult](examples_my_typia_block_src_hooks.md#validationresult)
- [useDebounce](examples_my_typia_block_src_hooks.md#usedebounce)
- [useLocalStorage](examples_my_typia_block_src_hooks.md#uselocalstorage)

### Functions

- [useTypiaValidation](examples_my_typia_block_src_hooks.md#usetypiavalidation)
- [useUUID](examples_my_typia_block_src_hooks.md#useuuid)
- [useAttributeLogger](examples_my_typia_block_src_hooks.md#useattributelogger)

## References

### formatValidationError

Re-exports [formatValidationError](packages_wp_typia_block_runtime_src_validation.md#formatvalidationerror)

___

### formatValidationErrors

Re-exports [formatValidationErrors](packages_wp_typia_block_runtime_src_validation.md#formatvalidationerrors)

___

### toValidationState

Re-exports [toValidationState](packages_wp_typia_block_runtime_src_validation.md#tovalidationstate)

___

### TypiaValidationError

Re-exports [TypiaValidationError](packages_wp_typia_block_runtime_src_validation.md#typiavalidationerror)

___

### ValidationResult

Re-exports [ValidationResult](packages_wp_typia_block_runtime_src_validation.md#validationresult)

___

### useDebounce

Re-exports [useDebounce](examples_my_typia_block_src_hooks_useDebounce.md#usedebounce)

___

### useLocalStorage

Re-exports [useLocalStorage](examples_my_typia_block_src_hooks_useLocalStorage.md#uselocalstorage)

## Functions

### useTypiaValidation

▸ **useTypiaValidation**\<`T`\>(`data`, `validator`): `Object`

Hook for Typia validation with real-time feedback

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `T` | Value to validate. |
| `validator` | (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> | Validation function. |

#### Returns

`Object`

Validation state and current errors.

| Name | Type |
| :------ | :------ |
| `isValid` | `boolean` |
| `errors` | [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)[] |
| `errorMessages` | `string`[] |

#### Defined in

[examples/my-typia-block/src/hooks.ts:32](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/hooks.ts#L32)

___

### useUUID

▸ **useUUID**(): `string`

Hook for generating UUID

#### Returns

`string`

A stable UUID for the lifetime of the component.

#### Defined in

[examples/my-typia-block/src/hooks.ts:54](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/hooks.ts#L54)

___

### useAttributeLogger

▸ **useAttributeLogger**(`attributes`): `void`

Hook for logging attribute changes in development

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `attributes` | `Record`\<`string`, `unknown`\> | Current block attributes. |

#### Returns

`void`

#### Defined in

[examples/my-typia-block/src/hooks.ts:64](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/hooks.ts#L64)
