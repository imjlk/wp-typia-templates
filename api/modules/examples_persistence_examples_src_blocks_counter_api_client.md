[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/api-client

# Module: examples/persistence-examples/src/blocks/counter/api-client

## Table of contents

### Variables

- [getPersistenceCounterStateEndpoint](examples_persistence_examples_src_blocks_counter_api_client.md#getpersistencecounterstateendpoint)
- [incrementPersistenceCounterStateEndpoint](examples_persistence_examples_src_blocks_counter_api_client.md#incrementpersistencecounterstateendpoint)
- [getPersistenceCounterBootstrapEndpoint](examples_persistence_examples_src_blocks_counter_api_client.md#getpersistencecounterbootstrapendpoint)

### Functions

- [getPersistenceCounterState](examples_persistence_examples_src_blocks_counter_api_client.md#getpersistencecounterstate)
- [incrementPersistenceCounterState](examples_persistence_examples_src_blocks_counter_api_client.md#incrementpersistencecounterstate)
- [getPersistenceCounterBootstrap](examples_persistence_examples_src_blocks_counter_api_client.md#getpersistencecounterbootstrap)

## Variables

### getPersistenceCounterStateEndpoint

• `Const` **getPersistenceCounterStateEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:15](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L15)

___

### incrementPersistenceCounterStateEndpoint

• `Const` **incrementPersistenceCounterStateEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:36](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L36)

___

### getPersistenceCounterBootstrapEndpoint

• `Const` **getPersistenceCounterBootstrapEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceCounterBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapQuery.md), [`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:61](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L61)

## Functions

### getPersistenceCounterState

▸ **getPersistenceCounterState**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:29](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L29)

___

### incrementPersistenceCounterState

▸ **incrementPersistenceCounterState**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:50](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L50)

___

### getPersistenceCounterBootstrap

▸ **getPersistenceCounterBootstrap**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapQuery.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-client.ts:75](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-client.ts#L75)
