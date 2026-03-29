[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/utils/debounce

# Module: examples/my-typia-block/src/utils/debounce

## Table of contents

### Functions

- [debounce](examples_my_typia_block_src_utils_debounce.md#debounce)
- [throttle](examples_my_typia_block_src_utils_debounce.md#throttle)

## Functions

### debounce

▸ **debounce**\<`T`\>(`func`, `wait`): (...`args`: `Parameters`\<`T`\>) => `void`

Debounce function

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends (...`args`: `any`[]) => `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `func` | `T` |
| `wait` | `number` |

#### Returns

`fn`

▸ (`...args`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `Parameters`\<`T`\> |

##### Returns

`void`

#### Defined in

[examples/my-typia-block/src/utils/debounce.ts:6](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/utils/debounce.ts#L6)

___

### throttle

▸ **throttle**\<`T`\>(`func`, `limit`): (...`args`: `Parameters`\<`T`\>) => `void`

Throttle function

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends (...`args`: `any`[]) => `void` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `func` | `T` |
| `limit` | `number` |

#### Returns

`fn`

▸ (`...args`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `Parameters`\<`T`\> |

##### Returns

`void`

#### Defined in

[examples/my-typia-block/src/utils/debounce.ts:28](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/utils/debounce.ts#L28)
