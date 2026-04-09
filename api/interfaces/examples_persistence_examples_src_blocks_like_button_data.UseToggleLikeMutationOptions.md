[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/like-button/data](../modules/examples_persistence_examples_src_blocks_like_button_data.md) / UseToggleLikeMutationOptions

# Interface: UseToggleLikeMutationOptions\<Context\>

[examples/persistence-examples/src/blocks/like-button/data](../modules/examples_persistence_examples_src_blocks_like_button_data.md).UseToggleLikeMutationOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | `unknown` |

## Hierarchy

- `Omit`\<[`UseEndpointMutationOptions`](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md)\<[`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md), `ToggleLikeMutationContext`\<`Context`\>\>, ``"invalidate"`` \| ``"onError"`` \| ``"onMutate"`` \| ``"onSuccess"`` \| ``"resolveCallOptions"``\>

  ↳ **`UseToggleLikeMutationOptions`**

## Table of contents

### Properties

- [onError](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onerror)
- [onMutate](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onmutate)
- [onSuccess](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onsuccess)
- [restNonce](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#restnonce)
- [client](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#client)
- [fetchFn](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#fetchfn)
- [onSettled](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onsettled)

## Properties

### onError

• `Optional` **onError**: (`error`: `unknown`, `request`: [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `Context`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`error`, `request`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |
| `request` | [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `Context` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:78](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L78)

___

### onMutate

• `Optional` **onMutate**: (`request`: [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)) => `Context` \| `Promise`\<`Context`\>

#### Type declaration

▸ (`request`, `client`): `Context` \| `Promise`\<`Context`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |

##### Returns

`Context` \| `Promise`\<`Context`\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:84](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L84)

___

### onSuccess

• `Optional` **onSuccess**: (`data`: `undefined` \| [`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md), `request`: [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `Context`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`data`, `request`, `validation`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `undefined` \| [`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md) |
| `request` | [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `validation` | [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\> |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `Context` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:88](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L88)

___

### restNonce

• `Optional` **restNonce**: `string`

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:95](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L95)

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

• `Optional` **onSettled**: (`result`: \{ `data`: `undefined` \| [`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md) ; `error`: `unknown` ; `validation`: ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>  }, `variables`: [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `ToggleLikeMutationContext`\<`Context`\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`result`, `variables`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `Object` |
| `result.data` | `undefined` \| [`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md) |
| `result.error` | `unknown` |
| `result.validation` | ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\> |
| `variables` | [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `ToggleLikeMutationContext`\<`Context`\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onSettled

#### Defined in

[packages/wp-typia-rest/src/react.ts:129](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L129)
