[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/api

# Module: examples/persistence-examples/src/blocks/counter/api

## Table of contents

### Variables

- [counterBootstrapEndpoint](examples_persistence_examples_src_blocks_counter_api.md#counterbootstrapendpoint)
- [counterEndpoint](examples_persistence_examples_src_blocks_counter_api.md#counterendpoint)
- [incrementCounterEndpoint](examples_persistence_examples_src_blocks_counter_api.md#incrementcounterendpoint)

### Functions

- [fetchCounter](examples_persistence_examples_src_blocks_counter_api.md#fetchcounter)
- [fetchCounterBootstrap](examples_persistence_examples_src_blocks_counter_api.md#fetchcounterbootstrap)
- [incrementCounter](examples_persistence_examples_src_blocks_counter_api.md#incrementcounter)

## Variables

### counterBootstrapEndpoint

• `Const` **counterBootstrapEndpoint**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `buildRequestOptions` | () => \{ `url`: `string`  } |
| `authIntent?` | [`EndpointAuthIntent`](packages_wp_typia_api_client_src_client.md#endpointauthintent) |
| `authMode?` | `string` |
| `method` | [`EndpointMethod`](packages_wp_typia_api_client_src_client.md#endpointmethod) |
| `operationId?` | `string` |
| `path` | `string` |
| `requestLocation?` | ``"body"`` \| ``"query"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapQuery.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:14](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L14)

___

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
| `requestLocation?` | ``"body"`` \| ``"query"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:21](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L21)

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
| `requestLocation?` | ``"body"`` \| ``"query"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:28](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L28)

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

[examples/persistence-examples/src/blocks/counter/api.ts:37](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L37)

___

### fetchCounterBootstrap

▸ **fetchCounterBootstrap**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapQuery.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api.ts:41](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L41)

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

[examples/persistence-examples/src/blocks/counter/api.ts:47](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api.ts#L47)
