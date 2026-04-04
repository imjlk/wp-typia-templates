[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/api-client

# Module: examples/persistence-examples/src/blocks/counter/api-client

## Table of contents

### Variables

- [getPersistenceCounterStateEndpoint](examples_persistence_examples_src_blocks_counter_api_client.md#getpersistencecounterstateendpoint)
- [incrementPersistenceCounterStateEndpoint](examples_persistence_examples_src_blocks_counter_api_client.md#incrementpersistencecounterstateendpoint)

### Functions

- [getPersistenceCounterState](examples_persistence_examples_src_blocks_counter_api_client.md#getpersistencecounterstate)
- [incrementPersistenceCounterState](examples_persistence_examples_src_blocks_counter_api_client.md#incrementpersistencecounterstate)

## Variables

### getPersistenceCounterStateEndpoint

• `Const` **getPersistenceCounterStateEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L13)

___

### incrementPersistenceCounterStateEndpoint

• `Const` **incrementPersistenceCounterStateEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:33](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L33)

## Functions

### getPersistenceCounterState

▸ **getPersistenceCounterState**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L26)

___

### incrementPersistenceCounterState

▸ **incrementPersistenceCounterState**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:46](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L46)
