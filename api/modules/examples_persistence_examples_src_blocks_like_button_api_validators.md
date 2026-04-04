[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/api-validators

# Module: examples/persistence-examples/src/blocks/like-button/api-validators

## Table of contents

### Variables

- [apiValidators](examples_persistence_examples_src_blocks_like_button_api_validators.md#apivalidators)

## Variables

### apiValidators

• `Const` **apiValidators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `likeStatusQuery` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md)\> |
| `likeStatusResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md)\> |
| `toggleLikeRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-validators.ts:20](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-validators.ts#L20)
