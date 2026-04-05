[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-rest/src/react

# Module: packages/wp-typia-rest/src/react

## Table of contents

### Interfaces

- [EndpointDataClient](../interfaces/packages_wp_typia_rest_src_react.EndpointDataClient.md)
- [EndpointInvalidateTarget](../interfaces/packages_wp_typia_rest_src_react.EndpointInvalidateTarget.md)
- [UseEndpointQueryOptions](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md)
- [UseEndpointQueryResult](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)
- [UseEndpointMutationOptions](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md)
- [UseEndpointMutationResult](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)
- [EndpointDataProviderProps](../interfaces/packages_wp_typia_rest_src_react.EndpointDataProviderProps.md)

### Functions

- [createEndpointDataClient](packages_wp_typia_rest_src_react.md#createendpointdataclient)
- [EndpointDataProvider](packages_wp_typia_rest_src_react.md#endpointdataprovider)
- [useEndpointDataClient](packages_wp_typia_rest_src_react.md#useendpointdataclient)
- [useEndpointQuery](packages_wp_typia_rest_src_react.md#useendpointquery)
- [useEndpointMutation](packages_wp_typia_rest_src_react.md#useendpointmutation)

## Functions

### createEndpointDataClient

▸ **createEndpointDataClient**(): [`EndpointDataClient`](../interfaces/packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Returns

[`EndpointDataClient`](../interfaces/packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Defined in

[packages/wp-typia-rest/src/react.ts:315](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L315)

___

### EndpointDataProvider

▸ **EndpointDataProvider**(`«destructured»`): `ReturnType`\<typeof `createElement`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`EndpointDataProviderProps`](../interfaces/packages_wp_typia_rest_src_react.EndpointDataProviderProps.md) |

#### Returns

`ReturnType`\<typeof `createElement`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:507](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L507)

___

### useEndpointDataClient

▸ **useEndpointDataClient**(): [`EndpointDataClient`](../interfaces/packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Returns

[`EndpointDataClient`](../interfaces/packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Defined in

[packages/wp-typia-rest/src/react.ts:518](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L518)

___

### useEndpointQuery

▸ **useEndpointQuery**\<`Req`, `Res`, `Selected`\>(`endpoint`, `request`, `options?`): [`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<`Res`, `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Req` | `Req` |
| `Res` | `Res` |
| `Selected` | `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request` | `Req` |
| `options` | [`UseEndpointQueryOptions`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md)\<`Req`, `Res`, `Selected`\> |

#### Returns

[`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<`Res`, `Selected`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:522](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L522)

___

### useEndpointMutation

▸ **useEndpointMutation**\<`Req`, `Res`, `Context`\>(`endpoint`, `options?`): [`UseEndpointMutationResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)\<`Req`, `Res`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Req` | `Req` |
| `Res` | `Res` |
| `Context` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `options` | [`UseEndpointMutationOptions`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md)\<`Req`, `Res`, `Context`\> |

#### Returns

[`UseEndpointMutationResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)\<`Req`, `Res`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:726](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L726)
