[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-rest/src/client

# Module: packages/wp-typia-rest/src/client

## Table of contents

### Interfaces

- [ValidationError](../interfaces/packages_wp_typia_rest_src_client.ValidationError.md)
- [ValidationResult](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)
- [ValidatedFetch](../interfaces/packages_wp_typia_rest_src_client.ValidatedFetch.md)
- [ApiEndpoint](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)
- [EndpointCallOptions](../interfaces/packages_wp_typia_rest_src_client.EndpointCallOptions.md)

### Type Aliases

- [ValidationLike](packages_wp_typia_rest_src_client.md#validationlike)

### Functions

- [resolveRestRouteUrl](packages_wp_typia_rest_src_client.md#resolverestrouteurl)
- [normalizeValidationError](packages_wp_typia_rest_src_client.md#normalizevalidationerror)
- [isValidationResult](packages_wp_typia_rest_src_client.md#isvalidationresult)
- [toValidationResult](packages_wp_typia_rest_src_client.md#tovalidationresult)
- [createValidatedFetch](packages_wp_typia_rest_src_client.md#createvalidatedfetch)
- [createEndpoint](packages_wp_typia_rest_src_client.md#createendpoint)
- [callEndpoint](packages_wp_typia_rest_src_client.md#callendpoint)

## Type Aliases

### ValidationLike

Ƭ **ValidationLike**\<`T`\>: `IValidation`\<`T`\> \| \{ `data?`: `unknown` ; `errors?`: `unknown` ; `success?`: `unknown`  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/wp-typia-rest/src/client.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L17)

## Functions

### resolveRestRouteUrl

▸ **resolveRestRouteUrl**(`routePath`, `root?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `routePath` | `string` |
| `root` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-rest/src/client.ts:79](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L79)

___

### normalizeValidationError

▸ **normalizeValidationError**(`error`): [`ValidationError`](../interfaces/packages_wp_typia_rest_src_client.ValidationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

[`ValidationError`](../interfaces/packages_wp_typia_rest_src_client.ValidationError.md)

#### Defined in

[packages/wp-typia-rest/src/client.ts:183](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L183)

___

### isValidationResult

▸ **isValidationResult**\<`T`\>(`value`): value is ValidationResult\<T\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

value is ValidationResult\<T\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:194](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L194)

___

### toValidationResult

▸ **toValidationResult**\<`T`\>(`result`): [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationLike`](packages_wp_typia_rest_src_client.md#validationlike)\<`T`\> |

#### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:198](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L198)

___

### createValidatedFetch

▸ **createValidatedFetch**\<`T`\>(`validator`, `fetchFn?`): [`ValidatedFetch`](../interfaces/packages_wp_typia_rest_src_client.ValidatedFetch.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `validator` | (`input`: `unknown`) => [`ValidationLike`](packages_wp_typia_rest_src_client.md#validationlike)\<`T`\> |
| `fetchFn` | `ApiFetch` |

#### Returns

[`ValidatedFetch`](../interfaces/packages_wp_typia_rest_src_client.ValidatedFetch.md)\<`T`\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:361](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L361)

___

### createEndpoint

▸ **createEndpoint**\<`Req`, `Res`\>(`config`): [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\>

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |

#### Returns

[`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:404](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L404)

___

### callEndpoint

▸ **callEndpoint**\<`Req`, `Res`\>(`endpoint`, `request`, `«destructured»?`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>\>

#### Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request` | `Req` |
| `«destructured»` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_rest_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:408](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L408)
