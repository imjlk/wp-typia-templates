[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/counter/data](../modules/examples_persistence_examples_src_blocks_counter_data.md) / UseIncrementCounterMutationOptions

# Interface: UseIncrementCounterMutationOptions\<Context\>

[examples/persistence-examples/src/blocks/counter/data](../modules/examples_persistence_examples_src_blocks_counter_data.md).UseIncrementCounterMutationOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | `unknown` |

## Hierarchy

- `Omit`\<[`UseEndpointMutationOptions`](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md)\<[`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md), `CounterMutationContext`\<`Context`\>\>, ``"invalidate"`` \| ``"onError"`` \| ``"onMutate"``\>

  ↳ **`UseIncrementCounterMutationOptions`**

## Table of contents

### Properties

- [onError](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#onerror)
- [onMutate](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#onmutate)
- [client](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#client)
- [fetchFn](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#fetchfn)
- [onSettled](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#onsettled)
- [onSuccess](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#onsuccess)
- [resolveCallOptions](examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md#resolvecalloptions)

## Properties

### onError

• `Optional` **onError**: (`error`: `unknown`, `request`: [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `Context`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`error`, `request`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |
| `request` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `Context` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:37](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L37)

___

### onMutate

• `Optional` **onMutate**: (`request`: [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)) => `Context` \| `Promise`\<`Context`\>

#### Type declaration

▸ (`request`, `client`): `Context` \| `Promise`\<`Context`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |

##### Returns

`Context` \| `Promise`\<`Context`\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:43](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L43)

___

### client

• `Optional` **client**: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Inherited from

Omit.client

#### Defined in

[packages/wp-typia-rest/src/react.ts:110](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L110)

___

### fetchFn

• `Optional` **fetchFn**: `ApiFetch`

#### Inherited from

Omit.fetchFn

#### Defined in

[packages/wp-typia-rest/src/react.ts:111](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L111)

___

### onSettled

• `Optional` **onSettled**: (`result`: \{ `data`: `undefined` \| [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md) ; `error`: `unknown` ; `validation`: ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>  }, `variables`: [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `CounterMutationContext`\<`Context`\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`result`, `variables`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `Object` |
| `result.data` | `undefined` \| [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md) |
| `result.error` | `unknown` |
| `result.validation` | ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |
| `variables` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `CounterMutationContext`\<`Context`\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onSettled

#### Defined in

[packages/wp-typia-rest/src/react.ts:129](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L129)

___

### onSuccess

• `Optional` **onSuccess**: (`data`: `undefined` \| [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md), `variables`: [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `CounterMutationContext`\<`Context`\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`data`, `variables`, `validation`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `undefined` \| [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md) |
| `variables` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |
| `validation` | [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `CounterMutationContext`\<`Context`\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onSuccess

#### Defined in

[packages/wp-typia-rest/src/react.ts:139](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L139)

___

### resolveCallOptions

• `Optional` **resolveCallOptions**: (`variables`: [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)) => `undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

#### Type declaration

▸ (`variables`): `undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `variables` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |

##### Returns

`undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

#### Inherited from

Omit.resolveCallOptions

#### Defined in

[packages/wp-typia-rest/src/react.ts:146](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L146)
