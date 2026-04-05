[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/api-client

# Module: examples/persistence-examples/src/blocks/like-button/api-client

## Table of contents

### Variables

- [getPersistenceLikeStatusEndpoint](examples_persistence_examples_src_blocks_like_button_api_client.md#getpersistencelikestatusendpoint)
- [togglePersistenceLikeStatusEndpoint](examples_persistence_examples_src_blocks_like_button_api_client.md#togglepersistencelikestatusendpoint)

### Functions

- [getPersistenceLikeStatus](examples_persistence_examples_src_blocks_like_button_api_client.md#getpersistencelikestatus)
- [togglePersistenceLikeStatus](examples_persistence_examples_src_blocks_like_button_api_client.md#togglepersistencelikestatus)

## Variables

### getPersistenceLikeStatusEndpoint

• `Const` **getPersistenceLikeStatusEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md), [`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L13)

___

### togglePersistenceLikeStatusEndpoint

• `Const` **togglePersistenceLikeStatusEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:34](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L34)

## Functions

### getPersistenceLikeStatus

▸ **getPersistenceLikeStatus**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:27](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L27)

___

### togglePersistenceLikeStatus

▸ **togglePersistenceLikeStatus**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:48](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L48)
