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
- [ValidationLike](packages_wp_typia_api_client_src_client.md#validationlike)
- [EndpointTransport](packages_wp_typia_api_client_src_client.md#endpointtransport)

### Functions

- [normalizeValidationError](packages_wp_typia_api_client_src_client.md#normalizevalidationerror)
- [toValidationResult](packages_wp_typia_api_client_src_client.md#tovalidationresult)
- [createFetchTransport](packages_wp_typia_api_client_src_client.md#createfetchtransport)
- [createEndpoint](packages_wp_typia_api_client_src_client.md#createendpoint)
- [callEndpoint](packages_wp_typia_api_client_src_client.md#callendpoint)

## Type Aliases

### EndpointMethod

Ƭ **EndpointMethod**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:3](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L3)

___

### ValidationLike

Ƭ **ValidationLike**\<`T`\>: `IValidation`\<`T`\> \| \{ `data?`: `unknown` ; `errors?`: `unknown` ; `success?`: `unknown`  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/wp-typia-api-client/src/client.ts:18](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L18)

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

[packages/wp-typia-api-client/src/client.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L35)

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

[packages/wp-typia-api-client/src/client.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L87)

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

[packages/wp-typia-api-client/src/client.ts:102](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L102)

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

[packages/wp-typia-api-client/src/client.ts:302](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L302)

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

[packages/wp-typia-api-client/src/client.ts:324](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L324)

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

[packages/wp-typia-api-client/src/client.ts:328](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L328)
