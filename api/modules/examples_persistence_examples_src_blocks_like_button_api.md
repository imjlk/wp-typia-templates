[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/api

# Module: examples/persistence-examples/src/blocks/like-button/api

## Table of contents

### Variables

- [likeStatusEndpoint](examples_persistence_examples_src_blocks_like_button_api.md#likestatusendpoint)
- [toggleLikeEndpoint](examples_persistence_examples_src_blocks_like_button_api.md#togglelikeendpoint)

### Functions

- [fetchLikeStatus](examples_persistence_examples_src_blocks_like_button_api.md#fetchlikestatus)
- [toggleLike](examples_persistence_examples_src_blocks_like_button_api.md#togglelike)

## Variables

### likeStatusEndpoint

• `Const` **likeStatusEndpoint**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `buildRequestOptions` | () => \{ `url`: `string`  } |
| `authMode?` | `string` |
| `method` | [`EndpointMethod`](packages_wp_typia_api_client_src_client.md#endpointmethod) |
| `operationId?` | `string` |
| `path` | `string` |
| `requestLocation?` | ``"body"`` \| ``"query"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L13)

___

### toggleLikeEndpoint

• `Const` **toggleLikeEndpoint**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `buildRequestOptions` | () => \{ `url`: `string`  } |
| `authMode?` | `string` |
| `method` | [`EndpointMethod`](packages_wp_typia_api_client_src_client.md#endpointmethod) |
| `operationId?` | `string` |
| `path` | `string` |
| `requestLocation?` | ``"body"`` \| ``"query"`` \| ``"query-and-body"`` |
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:20](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L20)

## Functions

### fetchLikeStatus

▸ **fetchLikeStatus**(`request`, `restNonce?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md) |
| `restNonce?` | `string` |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:27](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L27)

___

### toggleLike

▸ **toggleLike**(`request`, `restNonce?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `restNonce?` | `string` |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:44](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L44)
