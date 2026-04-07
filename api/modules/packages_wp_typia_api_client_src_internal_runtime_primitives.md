[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-api-client/src/internal/runtime-primitives

# Module: packages/wp-typia-api-client/src/internal/runtime-primitives

## Table of contents

### Interfaces

- [ValidationError](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)
- [ValidationResult](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)
- [RawValidationError](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.RawValidationError.md)

### Type Aliases

- [ValidationLike](packages_wp_typia_api_client_src_internal_runtime_primitives.md#validationlike)

### Functions

- [isPlainObject](packages_wp_typia_api_client_src_internal_runtime_primitives.md#isplainobject)
- [isFormDataLike](packages_wp_typia_api_client_src_internal_runtime_primitives.md#isformdatalike)
- [normalizePath](packages_wp_typia_api_client_src_internal_runtime_primitives.md#normalizepath)
- [normalizeExpected](packages_wp_typia_api_client_src_internal_runtime_primitives.md#normalizeexpected)
- [normalizeValidationError](packages_wp_typia_api_client_src_internal_runtime_primitives.md#normalizevalidationerror)
- [isValidationResult](packages_wp_typia_api_client_src_internal_runtime_primitives.md#isvalidationresult)
- [toValidationResult](packages_wp_typia_api_client_src_internal_runtime_primitives.md#tovalidationresult)

## Type Aliases

### ValidationLike

Ƭ **ValidationLike**\<`T`\>: `IValidation`\<`T`\> \| \{ `data?`: `unknown` ; `errors?`: `unknown` ; `success?`: `unknown`  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:16](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L16)

## Functions

### isPlainObject

▸ **isPlainObject**(`value`): value is Record\<string, unknown\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

value is Record\<string, unknown\>

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L31)

___

### isFormDataLike

▸ **isFormDataLike**(`value`): value is FormData

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

value is FormData

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L40)

___

### normalizePath

▸ **normalizePath**(`path`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `unknown` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L44)

___

### normalizeExpected

▸ **normalizeExpected**(`expected`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `expected` | `unknown` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L48)

___

### normalizeValidationError

▸ **normalizeValidationError**(`error`): [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

[`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L54)

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

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:68](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L68)

___

### toValidationResult

▸ **toValidationResult**\<`T`\>(`result`): [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationLike`](packages_wp_typia_api_client_src_internal_runtime_primitives.md#validationlike)\<`T`\> |

#### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>

#### Defined in

[packages/wp-typia-api-client/src/internal/runtime-primitives.ts:78](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/internal/runtime-primitives.ts#L78)
