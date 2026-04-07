[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-api-client/src/client

# Module: packages/wp-typia-api-client/src/client

## Table of contents

### References

- [ValidationError](packages_wp_typia_api_client_src_client.md#validationerror)
- [ValidationLike](packages_wp_typia_api_client_src_client.md#validationlike)
- [ValidationResult](packages_wp_typia_api_client_src_client.md#validationresult)
- [normalizeValidationError](packages_wp_typia_api_client_src_client.md#normalizevalidationerror)
- [toValidationResult](packages_wp_typia_api_client_src_client.md#tovalidationresult)

### Interfaces

- [EndpointTransportRequest](../interfaces/packages_wp_typia_api_client_src_client.EndpointTransportRequest.md)
- [ApiEndpoint](../interfaces/packages_wp_typia_api_client_src_client.ApiEndpoint.md)
- [EndpointCallOptions](../interfaces/packages_wp_typia_api_client_src_client.EndpointCallOptions.md)

### Type Aliases

- [EndpointMethod](packages_wp_typia_api_client_src_client.md#endpointmethod)
- [EndpointAuthIntent](packages_wp_typia_api_client_src_client.md#endpointauthintent)
- [EndpointTransport](packages_wp_typia_api_client_src_client.md#endpointtransport)

### Functions

- [createFetchTransport](packages_wp_typia_api_client_src_client.md#createfetchtransport)
- [withHeaders](packages_wp_typia_api_client_src_client.md#withheaders)
- [withComputedHeaders](packages_wp_typia_api_client_src_client.md#withcomputedheaders)
- [withHeaderValue](packages_wp_typia_api_client_src_client.md#withheadervalue)
- [withBearerToken](packages_wp_typia_api_client_src_client.md#withbearertoken)
- [createEndpoint](packages_wp_typia_api_client_src_client.md#createendpoint)
- [callEndpoint](packages_wp_typia_api_client_src_client.md#callendpoint)

## References

### ValidationError

Re-exports [ValidationError](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)

___

### ValidationLike

Re-exports [ValidationLike](packages_wp_typia_api_client_src_internal_runtime_primitives.md#validationlike)

___

### ValidationResult

Re-exports [ValidationResult](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)

___

### normalizeValidationError

Re-exports [normalizeValidationError](packages_wp_typia_api_client_src_internal_runtime_primitives.md#normalizevalidationerror)

___

### toValidationResult

Re-exports [toValidationResult](packages_wp_typia_api_client_src_internal_runtime_primitives.md#tovalidationresult)

## Type Aliases

### EndpointMethod

Ƭ **EndpointMethod**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:7](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L7)

___

### EndpointAuthIntent

Ƭ **EndpointAuthIntent**: ``"authenticated"`` \| ``"public"`` \| ``"public-write-protected"``

#### Defined in

[packages/wp-typia-api-client/src/client.ts:8](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L8)

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

[packages/wp-typia-api-client/src/client.ts:24](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L24)

## Functions

### createFetchTransport

▸ **createFetchTransport**(`«destructured»`): [`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `FetchTransportOptions` |

#### Returns

[`EndpointTransport`](packages_wp_typia_api_client_src_client.md#endpointtransport)

#### Defined in

[packages/wp-typia-api-client/src/client.ts:301](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L301)

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

[packages/wp-typia-api-client/src/client.ts:323](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L323)

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

[packages/wp-typia-api-client/src/client.ts:330](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L330)

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

[packages/wp-typia-api-client/src/client.ts:346](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L346)

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

[packages/wp-typia-api-client/src/client.ts:363](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L363)

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

[packages/wp-typia-api-client/src/client.ts:379](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L379)

___

### callEndpoint

▸ **callEndpoint**\<`Req`, `Res`\>(`endpoint`, `request`, `«destructured»?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>\>

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

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>\>

#### Defined in

[packages/wp-typia-api-client/src/client.ts:383](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client.ts#L383)
