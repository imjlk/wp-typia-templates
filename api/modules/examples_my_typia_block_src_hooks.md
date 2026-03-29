[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/hooks

# Module: examples/my-typia-block/src/hooks

## Table of contents

### References

- [useDebounce](examples_my_typia_block_src_hooks.md#usedebounce)
- [useLocalStorage](examples_my_typia_block_src_hooks.md#uselocalstorage)

### Interfaces

- [TypiaValidationError](../interfaces/examples_my_typia_block_src_hooks.TypiaValidationError.md)

### Functions

- [useTypiaValidation](examples_my_typia_block_src_hooks.md#usetypiavalidation)
- [useUUID](examples_my_typia_block_src_hooks.md#useuuid)
- [useAttributeLogger](examples_my_typia_block_src_hooks.md#useattributelogger)

## References

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
| `validator` | (`value`: `T`) => \{ `success`: `boolean` ; `errors?`: [`TypiaValidationError`](../interfaces/examples_my_typia_block_src_hooks.TypiaValidationError.md)[]  } | Validation function. |

#### Returns

`Object`

Validation state and current errors.

| Name | Type |
| :------ | :------ |
| `isValid` | `boolean` |
| `errors` | [`TypiaValidationError`](../interfaces/examples_my_typia_block_src_hooks.TypiaValidationError.md)[] |

#### Defined in

[examples/my-typia-block/src/hooks.ts:23](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/hooks.ts#L23)

___

### useUUID

▸ **useUUID**(): `string`

Hook for generating UUID

#### Returns

`string`

A stable UUID for the lifetime of the component.

#### Defined in

[examples/my-typia-block/src/hooks.ts:46](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/hooks.ts#L46)

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

[examples/my-typia-block/src/hooks.ts:69](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/hooks.ts#L69)
