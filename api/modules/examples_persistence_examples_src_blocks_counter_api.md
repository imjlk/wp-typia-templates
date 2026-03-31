[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/api

# Module: examples/persistence-examples/src/blocks/counter/api

## Table of contents

### Variables

- [counterEndpoint](examples_persistence_examples_src_blocks_counter_api.md#counterendpoint)
- [incrementCounterEndpoint](examples_persistence_examples_src_blocks_counter_api.md#incrementcounterendpoint)

### Functions

- [fetchCounter](examples_persistence_examples_src_blocks_counter_api.md#fetchcounter)
- [incrementCounter](examples_persistence_examples_src_blocks_counter_api.md#incrementcounter)

## Variables

### counterEndpoint

• `Const` **counterEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L13)

___

### incrementCounterEndpoint

• `Const` **incrementCounterEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L26)

## Functions

### fetchCounter

▸ **fetchCounter**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:39](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L39)

___

### incrementCounter

▸ **incrementCounter**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:43](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L43)
