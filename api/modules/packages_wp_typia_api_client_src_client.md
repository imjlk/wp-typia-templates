[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-api-client/src/client

# Module: packages/wp-typia-api-client/src/client

## Table of contents

### Interfaces

- [ValidationError](../interfaces/packages_wp_typia_api_client_src_client.ValidationError.md)
- [ValidationResult](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)
- [EndpointTransportRequest](../interfaces/packages_wp_typia_api_client_src_client.EndpointTransportRequest.md)
- [ApiEndpoint](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)
- [EndpointCallOptions](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md)

### Type Aliases

- [EndpointMethod](packages_wp_typia_api_client_src_client.md#endpointmethod)
- [EndpointAuthIntent](packages_wp_typia_api_client_src_client.md#endpointauthintent)
- [ValidationLike](packages_wp_typia_api_client_src_client.md#validationlike)
- [EndpointTransport](packages_wp_typia_api_client_src_client.md#endpointtransport)

### Functions

- [normalizeValidationError](packages_wp_typia_api_client_src_client.md#normalizevalidationerror)
- [toValidationResult](packages_wp_typia_api_client_src_client.md#tovalidationresult)
- [createFetchTransport](packages_wp_typia_api_client_src_client.md#createfetchtransport)
- [withHeaders](packages_wp_typia_api_client_src_client.md#withheaders)
- [withComputedHeaders](packages_wp_typia_api_client_src_client.md#withcomputedheaders)
- [withHeaderValue](packages_wp_typia_api_client_src_client.md#withheadervalue)
- [withBearerToken](packages_wp_typia_api_client_src_client.md#withbearertoken)
- [createEndpoint](packages_wp_typia_api_client_src_client.md#createendpoint)
- [callEndpoint](packages_wp_typia_api_client_src_client.md#callendpoint)

## Type Aliases

### EndpointMethod

Ƭ **EndpointMethod**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:3](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L3)

___

### EndpointAuthIntent

Ƭ **EndpointAuthIntent**: ``"authenticated"`` \| ``"public"`` \| ``"public-write-protected"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L4)

___

### ValidationLike

Ƭ **ValidationLike**\<`T`\>: `IValidation`\<`T`\> \| \{ `data?`: `unknown` ; `errors?`: `unknown` ; `success?`: `unknown`  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/wp-typia-api-client/src/client.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L22)

___

### EndpointTransport

Ƭ **EndpointTransport**: \<T, Parse\>(`options`: [`EndpointTransportRequest`](../interfaces/packages_wp_typia_api_client_src_client.EndpointTransportRequest.md) & \{ `parse?`: `Parse`  }) => `Promise`\<`Parse` extends ``false`` ? `Response` : `T`\>

#### Type declaration

▸ \<`T`, `Parse`\>(`options`): `Promise`\<`Parse` extends ``false`` ? `Response` : `T`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |
| `Parse` | extends `boolean` = ``true`` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`EndpointTransportRequest`](../interfaces/packages_wp_typia_api_client_src_client.EndpointTransportRequest.md) & \{ `parse?`: `Parse`  } |

##### Returns

`Promise`\<`Parse` extends ``false`` ? `Response` : `T`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L39)

## Functions

### normalizeValidationError

▸ **normalizeValidationError**(`error`): [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_client.ValidationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

[`ValidationError`](../interfaces/packages_wp_typia_api_client_src_client.ValidationError.md)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:104](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L104)

___

### toValidationResult

▸ **toValidationResult**\<`T`\>(`result`): [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationLike`](packages_wp_typia_api_client_src_client.md#validationlike)\<`T`\> |

#### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<`T`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:119](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L119)

___

### createFetchTransport

▸ **createFetchTransport**(`«destructured»`): [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `FetchTransportOptions` |

#### Returns

[`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:378](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L378)

___

### withHeaders

▸ **withHeaders**(`transport`, `headers`): [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Parameters

| Name | Type |
| :------ | :------ |
| `transport` | [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport) |
| `headers` | `HeadersInit` |

#### Returns

[`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:400](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L400)

___

### withComputedHeaders

▸ **withComputedHeaders**(`transport`, `resolveHeaders`): [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Parameters

| Name | Type |
| :------ | :------ |
| `transport` | [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport) |
| `resolveHeaders` | `ComputedHeadersResolver` |

#### Returns

[`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:407](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L407)

___

### withHeaderValue

▸ **withHeaderValue**(`transport`, `headerName`, `resolveValue`): [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Parameters

| Name | Type |
| :------ | :------ |
| `transport` | [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport) |
| `headerName` | `string` |
| `resolveValue` | `HeaderValueResolver` |

#### Returns

[`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:423](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L423)

___

### withBearerToken

▸ **withBearerToken**(`transport`, `resolveToken`): [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Parameters

| Name | Type |
| :------ | :------ |
| `transport` | [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport) |
| `resolveToken` | `HeaderValueResolver` |

#### Returns

[`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:440](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L440)

___

### createEndpoint

▸ **createEndpoint**\<`Req`, `Res`\>(`config`): [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<`Req`, `Res`\>

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |

#### Returns

[`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<`Req`, `Res`\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:456](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L456)

___

### callEndpoint

▸ **callEndpoint**\<`Req`, `Res`\>(`endpoint`, `request`, `«destructured»?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Res`\>\>

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request` | `Req` |
| `«destructured»` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_client.ValidationResult.md)\<`Res`\>\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:460](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L460)
