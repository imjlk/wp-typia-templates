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

• `Const` **counterEndpoint**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `buildRequestOptions` | () => \{ `url`: `string`  } |
| `authIntent?` | [`EndpointAuthIntent`](packages_wp_typia_api_client_src_client.md#endpointauthintent) |
| `authMode?` | `string` |
| `method` | [`EndpointMethod`](packages_wp_typia_api_client_src_client.md#endpointmethod) |
| `operationId?` | `string` |
| `path` | `string` |
| `requestLocation?` | ``"query"`` \| ``"body"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:12](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L12)

___

### incrementCounterEndpoint

• `Const` **incrementCounterEndpoint**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `buildRequestOptions` | () => \{ `url`: `string`  } |
| `authIntent?` | [`EndpointAuthIntent`](packages_wp_typia_api_client_src_client.md#endpointauthintent) |
| `authMode?` | `string` |
| `method` | [`EndpointMethod`](packages_wp_typia_api_client_src_client.md#endpointmethod) |
| `operationId?` | `string` |
| `path` | `string` |
| `requestLocation?` | ``"query"`` \| ``"body"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:19](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L19)

## Functions

### fetchCounter

▸ **fetchCounter**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:28](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L28)

___

### incrementCounter

▸ **incrementCounter**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:32](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L32)
