[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/api

# Module: examples/persistence-examples/src/blocks/like-button/api

## Table of contents

### Variables

- [likeStatusEndpoint](examples_persistence_examples_src_blocks_like_button_api.md#likestatusendpoint)
- [likeBootstrapEndpoint](examples_persistence_examples_src_blocks_like_button_api.md#likebootstrapendpoint)
- [toggleLikeEndpoint](examples_persistence_examples_src_blocks_like_button_api.md#togglelikeendpoint)

### Functions

- [fetchLikeStatus](examples_persistence_examples_src_blocks_like_button_api.md#fetchlikestatus)
- [fetchLikeBootstrap](examples_persistence_examples_src_blocks_like_button_api.md#fetchlikebootstrap)
- [toggleLike](examples_persistence_examples_src_blocks_like_button_api.md#togglelike)

## Variables

### likeStatusEndpoint

• `Const` **likeStatusEndpoint**: `Object`

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
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:15](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L15)

___

### likeBootstrapEndpoint

• `Const` **likeBootstrapEndpoint**: `Object`

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
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapQuery.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:22](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L22)

___

### toggleLikeEndpoint

• `Const` **toggleLikeEndpoint**: `Object`

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
| `validateRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md)\> |
| `validateResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:29](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L29)

## Functions

### fetchLikeStatus

▸ **fetchLikeStatus**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:36](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L36)

___

### fetchLikeBootstrap

▸ **fetchLikeBootstrap**(`request`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapQuery.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:40](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L40)

___

### toggleLike

▸ **toggleLike**(`request`, `restNonce?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `restNonce?` | `string` |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:44](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L44)
