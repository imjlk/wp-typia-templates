[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/api

# Module: examples/my-typia-block/src/api

## Table of contents

### Functions

- [getCounter](examples_my_typia_block_src_api.md#getcounter)
- [incrementCounter](examples_my_typia_block_src_api.md#incrementcounter)

## Functions

### getCounter

▸ **getCounter**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockCounterResponse`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`MyTypiaBlockCounterQuery`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterQuery.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockCounterResponse`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterResponse.md)\>\>

#### Defined in

[examples/my-typia-block/src/api.ts:59](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/api.ts#L59)

___

### incrementCounter

▸ **incrementCounter**(`request`, `restNonce?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockCounterResponse`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`MyTypiaBlockIncrementRequest`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockIncrementRequest.md) |
| `restNonce?` | `string` |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockCounterResponse`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterResponse.md)\>\>

#### Defined in

[examples/my-typia-block/src/api.ts:63](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/api.ts#L63)
