[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/client](../modules/packages_wp_typia_rest_src_client.md) / ValidatedFetch

# Interface: ValidatedFetch\<T\>

[packages/wp-typia-rest/src/client](../modules/packages_wp_typia_rest_src_client.md).ValidatedFetch

## Type parameters

| Name |
| :------ |
| `T` |

## Table of contents

### Methods

- [assertFetch](packages_wp_typia_rest_src_client.ValidatedFetch.md#assertfetch)
- [fetch](packages_wp_typia_rest_src_client.ValidatedFetch.md#fetch)
- [fetchWithResponse](packages_wp_typia_rest_src_client.ValidatedFetch.md#fetchwithresponse)
- [isFetch](packages_wp_typia_rest_src_client.ValidatedFetch.md#isfetch)

## Methods

### assertFetch

▸ **assertFetch**(`options`): `Promise`\<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `APIFetchOptions`\<`boolean`\> |

#### Returns

`Promise`\<`T`\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:20](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L20)

___

### fetch

▸ **fetch**(`options`): `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `APIFetchOptions`\<`boolean`\> |

#### Returns

`Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:21](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L21)

___

### fetchWithResponse

▸ **fetchWithResponse**(`options`): `Promise`\<\{ `response`: `Response` ; `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `APIFetchOptions`\<``false``\> |

#### Returns

`Promise`\<\{ `response`: `Response` ; `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>  }\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L22)

___

### isFetch

▸ **isFetch**(`options`): `Promise`\<``null`` \| `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `APIFetchOptions`\<`boolean`\> |

#### Returns

`Promise`\<``null`` \| `T`\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L25)
