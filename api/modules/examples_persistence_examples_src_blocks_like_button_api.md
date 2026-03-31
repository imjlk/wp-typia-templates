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

• `Const` **likeStatusEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<[`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md), [`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:17](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L17)

___

### toggleLikeEndpoint

• `Const` **toggleLikeEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api.ts:30](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L30)

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

[examples/persistence-examples/src/blocks/like-button/api.ts:43](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L43)

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

[examples/persistence-examples/src/blocks/like-button/api.ts:60](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api.ts#L60)
