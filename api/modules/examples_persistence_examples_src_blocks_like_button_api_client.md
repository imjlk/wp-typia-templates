[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/api-client

# Module: examples/persistence-examples/src/blocks/like-button/api-client

## Table of contents

### Variables

- [getPersistenceLikeStatusEndpoint](examples_persistence_examples_src_blocks_like_button_api_client.md#getpersistencelikestatusendpoint)
- [togglePersistenceLikeStatusEndpoint](examples_persistence_examples_src_blocks_like_button_api_client.md#togglepersistencelikestatusendpoint)
- [getPersistenceLikeBootstrapEndpoint](examples_persistence_examples_src_blocks_like_button_api_client.md#getpersistencelikebootstrapendpoint)

### Functions

- [getPersistenceLikeStatus](examples_persistence_examples_src_blocks_like_button_api_client.md#getpersistencelikestatus)
- [togglePersistenceLikeStatus](examples_persistence_examples_src_blocks_like_button_api_client.md#togglepersistencelikestatus)
- [getPersistenceLikeBootstrap](examples_persistence_examples_src_blocks_like_button_api_client.md#getpersistencelikebootstrap)

## Variables

### getPersistenceLikeStatusEndpoint

• `Const` **getPersistenceLikeStatusEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md), [`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:16](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L16)

___

### togglePersistenceLikeStatusEndpoint

• `Const` **togglePersistenceLikeStatusEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:37](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L37)

___

### getPersistenceLikeBootstrapEndpoint

• `Const` **getPersistenceLikeBootstrapEndpoint**: [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<[`PersistenceLikeBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapQuery.md), [`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:62](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L62)

## Functions

### getPersistenceLikeStatus

▸ **getPersistenceLikeStatus**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:30](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L30)

___

### togglePersistenceLikeStatus

▸ **togglePersistenceLikeStatus**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:51](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L51)

___

### getPersistenceLikeBootstrap

▸ **getPersistenceLikeBootstrap**(`request`, `options`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapQuery.md) |
| `options` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\>\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-client.ts:76](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-client.ts#L76)
