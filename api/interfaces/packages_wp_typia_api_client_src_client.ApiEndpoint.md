[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-api-client/src/client](../modules/packages_wp_typia_api_client_src_client.md) / ApiEndpoint

# Interface: ApiEndpoint\<Req, Res\>

[packages/wp-typia-api-client/src/client](../modules/packages_wp_typia_api_client_src_client.md).ApiEndpoint

## Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

## Table of contents

### Properties

- [authIntent](packages_wp_typia_api_client_src_client.ApiEndpoint.md#authintent)
- [authMode](packages_wp_typia_api_client_src_client.ApiEndpoint.md#authmode)
- [buildRequestOptions](packages_wp_typia_api_client_src_client.ApiEndpoint.md#buildrequestoptions)
- [method](packages_wp_typia_api_client_src_client.ApiEndpoint.md#method)
- [operationId](packages_wp_typia_api_client_src_client.ApiEndpoint.md#operationid)
- [path](packages_wp_typia_api_client_src_client.ApiEndpoint.md#path)
- [requestLocation](packages_wp_typia_api_client_src_client.ApiEndpoint.md#requestlocation)
- [validateRequest](packages_wp_typia_api_client_src_client.ApiEndpoint.md#validaterequest)
- [validateResponse](packages_wp_typia_api_client_src_client.ApiEndpoint.md#validateresponse)

## Properties

### authIntent

• `Optional` **authIntent**: [`EndpointAuthIntent`](../modules/packages_wp_typia_api_client_src_client.md#endpointauthintent)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L44)

___

### authMode

• `Optional` **authMode**: `string`

#### Defined in

[packages/wp-typia-api-client/src/client.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L45)

___

### buildRequestOptions

• `Optional` **buildRequestOptions**: (`request`: `Req`) => `Partial`\<[`EndpointTransportRequest`](packages_wp_typia_api_client_src_client.EndpointTransportRequest.md)\>

#### Type declaration

▸ (`request`): `Partial`\<[`EndpointTransportRequest`](packages_wp_typia_api_client_src_client.EndpointTransportRequest.md)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `Req` |

##### Returns

`Partial`\<[`EndpointTransportRequest`](packages_wp_typia_api_client_src_client.EndpointTransportRequest.md)\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L46)

___

### method

• **method**: [`EndpointMethod`](../modules/packages_wp_typia_api_client_src_client.md#endpointmethod)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:47](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L47)

___

### operationId

• `Optional` **operationId**: `string`

#### Defined in

[packages/wp-typia-api-client/src/client.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L48)

___

### path

• **path**: `string`

#### Defined in

[packages/wp-typia-api-client/src/client.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L49)

___

### requestLocation

• `Optional` **requestLocation**: ``"body"`` \| ``"query"`` \| ``"query-and-body"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L50)

___

### validateRequest

• **validateRequest**: (`input`: `unknown`) => [`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Req`\>

#### Type declaration

▸ (`input`): [`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Req`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown` |

##### Returns

[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Req`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L51)

___

### validateResponse

• **validateResponse**: (`input`: `unknown`) => [`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Res`\>

#### Type declaration

▸ (`input`): [`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Res`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown` |

##### Returns

[`ValidationResult`](packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Res`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L52)
