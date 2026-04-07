[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-rest/src/client

# Module: packages/wp-typia-rest/src/client

## Table of contents

### References

- [ValidationError](packages_wp_typia_rest_src_client.md#validationerror)
- [ValidationLike](packages_wp_typia_rest_src_client.md#validationlike)
- [ValidationResult](packages_wp_typia_rest_src_client.md#validationresult)
- [isValidationResult](packages_wp_typia_rest_src_client.md#isvalidationresult)
- [normalizeValidationError](packages_wp_typia_rest_src_client.md#normalizevalidationerror)
- [toValidationResult](packages_wp_typia_rest_src_client.md#tovalidationresult)

### Interfaces

- [ValidatedFetch](../interfaces/packages_wp_typia_rest_src_client.ValidatedFetch.md)
- [ApiEndpoint](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)
- [EndpointCallOptions](../interfaces/packages_wp_typia_rest_src_client.EndpointCallOptions.md)

### Functions

- [resolveRestRouteUrl](packages_wp_typia_rest_src_client.md#resolverestrouteurl)
- [createValidatedFetch](packages_wp_typia_rest_src_client.md#createvalidatedfetch)
- [createEndpoint](packages_wp_typia_rest_src_client.md#createendpoint)
- [callEndpoint](packages_wp_typia_rest_src_client.md#callendpoint)

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

### isValidationResult

Re-exports [isValidationResult](packages_wp_typia_api_client_src_internal_runtime_primitives.md#isvalidationresult)

___

### normalizeValidationError

Re-exports [normalizeValidationError](packages_wp_typia_api_client_src_internal_runtime_primitives.md#normalizevalidationerror)

___

### toValidationResult

Re-exports [toValidationResult](packages_wp_typia_api_client_src_internal_runtime_primitives.md#tovalidationresult)

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

[packages/wp-typia-rest/src/client.ts:60](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L60)

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
| `validator` | (`input`: `unknown`) => [`ValidationLike`](packages_wp_typia_api_client_src_internal_runtime_primitives.md#validationlike)\<`T`\> |
| `fetchFn` | `ApiFetch` |

#### Returns

[`ValidatedFetch`](../interfaces/packages_wp_typia_rest_src_client.ValidatedFetch.md)\<`T`\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:286](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L286)

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

[packages/wp-typia-rest/src/client.ts:329](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L329)

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
| `endpoint` | [`ApiEndpoint`](../interfaces/packages_wp_typia_rest_src_client.ApiEndpoint.md)\<`Req`, `Res`\> |
| `request` | `Req` |
| `«destructured»` | [`EndpointCallOptions`](../interfaces/packages_wp_typia_rest_src_client.EndpointCallOptions.md) |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:333](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L333)
