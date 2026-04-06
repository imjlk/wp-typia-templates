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

Re-exports [TypiaValidationError](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)

___

### ValidationResult

Re-exports [ValidationResult](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)

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
| `validator` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `isValid` | `boolean` |
| `errors` | [`TypiaValidationError`](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)[] |
| `errorMessages` | `string`[] |

#### Defined in

[examples/persistence-examples/src/shared/hooks.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/shared/hooks.ts#L13)
