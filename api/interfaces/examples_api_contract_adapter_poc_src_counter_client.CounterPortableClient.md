[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/api-contract-adapter-poc/src/counter-client](../modules/examples_api_contract_adapter_poc_src_counter_client.md) / CounterPortableClient

# Interface: CounterPortableClient

[examples/api-contract-adapter-poc/src/counter-client](../modules/examples_api_contract_adapter_poc_src_counter_client.md).CounterPortableClient

## Table of contents

### Properties

- [getCounterState](examples_api_contract_adapter_poc_src_counter_client.CounterPortableClient.md#getcounterstate)
- [incrementCounterState](examples_api_contract_adapter_poc_src_counter_client.CounterPortableClient.md#incrementcounterstate)

## Properties

### getCounterState

• **getCounterState**: (`request`: [`PersistenceCounterQuery`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md)) => `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Type declaration

▸ (`request`): `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterQuery`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |

##### Returns

`Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/api-contract-adapter-poc/src/counter-client.ts:14](https://github.com/imjlk/wp-typia/blob/main/examples/api-contract-adapter-poc/src/counter-client.ts#L14)

___

### incrementCounterState

• **incrementCounterState**: (`request`: [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)) => `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Type declaration

▸ (`request`): `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |

##### Returns

`Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/api-contract-adapter-poc/src/counter-client.ts:17](https://github.com/imjlk/wp-typia/blob/main/examples/api-contract-adapter-poc/src/counter-client.ts#L17)
