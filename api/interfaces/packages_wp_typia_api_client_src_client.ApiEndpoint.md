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

[packages/wp-typia-api-client/src/client.ts:29](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L29)

___

### authMode

• `Optional` **authMode**: `string`

#### Defined in

[packages/wp-typia-api-client/src/client.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L30)

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

[packages/wp-typia-api-client/src/client.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L31)

___

### method

• **method**: [`EndpointMethod`](../modules/packages_wp_typia_api_client_src_client.md#endpointmethod)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L32)

___

### operationId

• `Optional` **operationId**: `string`

#### Defined in

[packages/wp-typia-api-client/src/client.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L33)

___

### path

• **path**: `string`

#### Defined in

[packages/wp-typia-api-client/src/client.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L34)

___

### requestLocation

• `Optional` **requestLocation**: ``"body"`` \| ``"query"`` \| ``"query-and-body"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L35)

___

### validateRequest

• **validateRequest**: (`input`: `unknown`) => [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Req`\>

#### Type declaration

▸ (`input`): [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Req`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown` |

##### Returns

[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Req`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L36)

___

### validateResponse

• **validateResponse**: (`input`: `unknown`) => [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>

#### Type declaration

▸ (`input`): [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown` |

##### Returns

[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L37)
