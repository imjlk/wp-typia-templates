[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/shared/hooks

# Module: examples/persistence-examples/src/shared/hooks

## Table of contents

### References

- [TypiaValidationError](examples_persistence_examples_src_shared_hooks.md#typiavalidationerror)
- [ValidationResult](examples_persistence_examples_src_shared_hooks.md#validationresult)

### Functions

- [useTypiaValidation](examples_persistence_examples_src_shared_hooks.md#usetypiavalidation)

## References

### TypiaValidationError

Re-exports [TypiaValidationError](packages_wp_typia_block_runtime_src_validation.md#typiavalidationerror)

___

### ValidationResult

Re-exports [ValidationResult](packages_wp_typia_block_runtime_src_validation.md#validationresult)

## Functions

### useTypiaValidation

▸ **useTypiaValidation**\<`T`\>(`data`, `validator`): `Object`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `T` |
| `validator` | (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `isValid` | `boolean` |
| `errors` | [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)[] |
| `errorMessages` | `string`[] |

#### Defined in

[examples/persistence-examples/src/shared/hooks.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/shared/hooks.ts#L13)
