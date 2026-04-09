[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/data

# Module: examples/persistence-examples/src/blocks/like-button/data

## Table of contents

### Interfaces

- [UsePersistenceLikeStatusQueryOptions](../interfaces/examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeStatusQueryOptions.md)
- [UsePersistenceLikeBootstrapQueryOptions](../interfaces/examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md)
- [UseToggleLikeMutationOptions](../interfaces/examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md)

### Functions

- [usePersistenceLikeStatusQuery](examples_persistence_examples_src_blocks_like_button_data.md#usepersistencelikestatusquery)
- [usePersistenceLikeBootstrapQuery](examples_persistence_examples_src_blocks_like_button_data.md#usepersistencelikebootstrapquery)
- [useToggleLikeMutation](examples_persistence_examples_src_blocks_like_button_data.md#usetogglelikemutation)

## Functions

### usePersistenceLikeStatusQuery

▸ **usePersistenceLikeStatusQuery**\<`Selected`\>(`request`, `options?`): [`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md), `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeStatusQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusQuery.md) |
| `options` | [`UsePersistenceLikeStatusQueryOptions`](../interfaces/examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeStatusQueryOptions.md)\<`Selected`\> |

#### Returns

[`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceLikeStatusResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md), `Selected`\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:98](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L98)

___

### usePersistenceLikeBootstrapQuery

▸ **usePersistenceLikeBootstrapQuery**\<`Selected`\>(`request`, `options?`): [`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md), `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceLikeBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapQuery.md) |
| `options` | [`UsePersistenceLikeBootstrapQueryOptions`](../interfaces/examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md)\<`Selected`\> |

#### Returns

[`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceLikeBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md), `Selected`\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:109](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L109)

___

### useToggleLikeMutation

▸ **useToggleLikeMutation**\<`Context`\>(`options?`): [`UseEndpointMutationResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`UseToggleLikeMutationOptions`](../interfaces/examples_persistence_examples_src_blocks_like_button_data.UseToggleLikeMutationOptions.md)\<`Context`\> |

#### Returns

[`UseEndpointMutationResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)\<[`PersistenceToggleLikeRequest`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeRequest.md), [`PersistenceToggleLikeResponse`](../interfaces/examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/data.ts:120](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/data.ts#L120)
