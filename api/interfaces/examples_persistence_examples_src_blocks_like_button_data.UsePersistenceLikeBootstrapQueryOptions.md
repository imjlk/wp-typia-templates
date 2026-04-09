[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/like-button/data](../modules/examples_persistence_examples_src_blocks_like_button_data.md) / UsePersistenceLikeBootstrapQueryOptions

# Interface: UsePersistenceLikeBootstrapQueryOptions\<Selected\>

[examples/persistence-examples/src/blocks/like-button/data](../modules/examples_persistence_examples_src_blocks_like_button_data.md).UsePersistenceLikeBootstrapQueryOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md) |

## Hierarchy

- `Omit`\<[`UseEndpointQueryOptions`](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md)\<[`PersistenceLikeBootstrapQuery`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapQuery.md), [`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md), `Selected`\>, ``"resolveCallOptions"``\>

  ↳ **`UsePersistenceLikeBootstrapQueryOptions`**

## Table of contents

### Properties

- [client](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#client)
- [enabled](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#enabled)
- [fetchFn](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#fetchfn)
- [initialData](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#initialdata)
- [onError](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#onerror)
- [onSuccess](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#onsuccess)
- [select](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#select)
- [staleTime](examples_persistence_examples_src_blocks_like_button_data.UsePersistenceLikeBootstrapQueryOptions.md#staletime)

## Properties

### client

• `Optional` **client**: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Inherited from

Omit.client

#### Defined in

[packages/wp-typia-rest/src/react.ts:86](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L86)

___

### enabled

• `Optional` **enabled**: `boolean`

#### Inherited from

Omit.enabled

#### Defined in

[packages/wp-typia-rest/src/react.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L87)

___

### fetchFn

• `Optional` **fetchFn**: `ApiFetch`

#### Inherited from

Omit.fetchFn

#### Defined in

[packages/wp-typia-rest/src/react.ts:88](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L88)

___

### initialData

• `Optional` **initialData**: [`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)

#### Inherited from

Omit.initialData

#### Defined in

[packages/wp-typia-rest/src/react.ts:89](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L89)

___

### onError

• `Optional` **onError**: (`error`: `unknown`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`error`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onError

#### Defined in

[packages/wp-typia-rest/src/react.ts:90](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L90)

___

### onSuccess

• `Optional` **onSuccess**: (`data`: `Selected`, `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`data`, `validation`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `Selected` |
| `validation` | [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

Omit.onSuccess

#### Defined in

[packages/wp-typia-rest/src/react.ts:91](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L91)

___

### select

• `Optional` **select**: (`data`: [`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md)) => `Selected`

#### Type declaration

▸ (`data`): `Selected`

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`PersistenceLikeBootstrapResponse`](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeBootstrapResponse.md) |

##### Returns

`Selected`

#### Inherited from

Omit.select

#### Defined in

[packages/wp-typia-rest/src/react.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L96)

___

### staleTime

• `Optional` **staleTime**: `number`

#### Inherited from

Omit.staleTime

#### Defined in

[packages/wp-typia-rest/src/react.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L97)
