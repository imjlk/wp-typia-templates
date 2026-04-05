[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/like-button/data](../modules/examples_persistence_examples_src_blocks_like_button_data.md) / UseToggleLikeMutationOptions

# Interface: UseToggleLikeMutationOptions\<Context\>

[examples/persistence-examples/src/blocks/like-button/data](../modules/examples_persistence_examples_src_blocks_like_button_data.md).UseToggleLikeMutationOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | `unknown` |

## Hierarchy

- `Omit`\<[`UseEndpointMutationOptions`](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md)\<[`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md), `ToggleLikeMutationContext`\<`Context`\>\>, ``"invalidate"`` \| ``"onError"`` \| ``"onMutate"`` \| ``"resolveCallOptions"``\>

  ↳ **`UseToggleLikeMutationOptions`**

## Table of contents

### Properties

- [onError](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onerror)
- [onMutate](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onmutate)
- [restNonce](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#restnonce)
- [client](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#client)
- [fetchFn](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#fetchfn)
- [onSettled](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onsettled)
- [onSuccess](examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md#onsuccess)

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

[examples/persistence-examples/src/blocks/like-button/data.ts:57](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L57)

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

[examples/persistence-examples/src/blocks/like-button/data.ts:63](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L63)

___

### restNonce

• `Optional` **restNonce**: `string`

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:67](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L67)

___

### client

• `Optional` **client**: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Inherited from

Omit.client

#### Defined in

[packages/wp-typia-rest/src/react.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L109)

___

### fetchFn

• `Optional` **fetchFn**: `ApiFetch`

#### Inherited from

Omit.fetchFn

#### Defined in

[packages/wp-typia-rest/src/react.ts:110](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L110)

___

### onSettled

• `Optional` **onSettled**: (`result`: \{ `data`: `undefined` \| [`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md) ; `error`: `unknown` ; `validation`: ``null`` \| [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>  }, `variables`: [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `ToggleLikeMutationContext`\<`Context`\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`result`, `variables`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `Object` |
| `result.data` | `undefined` \| [`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md) |
| `result.error` | `unknown` |
| `result.validation` | ``null`` \| [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\> |
| `variables` | [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `ToggleLikeMutationContext`\<`Context`\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onSettled

#### Defined in

[packages/wp-typia-rest/src/react.ts:128](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L128)

___

### onSuccess

• `Optional` **onSuccess**: (`data`: `undefined` \| [`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md), `variables`: [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), `validation`: [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `ToggleLikeMutationContext`\<`Context`\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`data`, `variables`, `validation`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `undefined` \| [`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md) |
| `variables` | [`PersistenceToggleLikeRequest`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `validation` | [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\> |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `ToggleLikeMutationContext`\<`Context`\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onSuccess

#### Defined in

[packages/wp-typia-rest/src/react.ts:138](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L138)
