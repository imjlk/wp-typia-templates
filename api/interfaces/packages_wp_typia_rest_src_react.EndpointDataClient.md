[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md) / EndpointDataClient

# Interface: EndpointDataClient

[packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md).EndpointDataClient

## Table of contents

### Methods

- [invalidate](packages_wp_typia_rest_src_react.EndpointDataClient.md#invalidate)
- [refetch](packages_wp_typia_rest_src_react.EndpointDataClient.md#refetch)
- [getData](packages_wp_typia_rest_src_react.EndpointDataClient.md#getdata)
- [setData](packages_wp_typia_rest_src_react.EndpointDataClient.md#setdata)

## Methods

### invalidate

▸ **invalidate**\<`Req`, `Res`\>(`endpoint`, `request?`): `void`

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request?` | `Req` |

#### Returns

`void`

#### Defined in

[packages/wp-typia-rest/src/react.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L49)

___

### refetch

▸ **refetch**\<`Req`, `Res`\>(`endpoint`, `request?`): `Promise`\<`void`\>

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request?` | `Req` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L50)

___

### getData

▸ **getData**\<`Req`, `Res`\>(`endpoint`, `request`): `undefined` \| `Res`

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request` | `Req` |

#### Returns

`undefined` \| `Res`

#### Defined in

[packages/wp-typia-rest/src/react.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L51)

___

### setData

▸ **setData**\<`Req`, `Res`\>(`endpoint`, `request`, `next`): `void`

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request` | `Req` |
| `next` | `EndpointDataUpdater`\<`Res`\> |

#### Returns

`void`

#### Defined in

[packages/wp-typia-rest/src/react.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L52)
