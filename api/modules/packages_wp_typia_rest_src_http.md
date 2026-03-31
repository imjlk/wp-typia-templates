[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-rest/src/http

# Module: packages/wp-typia-rest/src/http

## Table of contents

### Functions

- [createQueryDecoder](packages_wp_typia_rest_src_http.md#createquerydecoder)
- [createHeadersDecoder](packages_wp_typia_rest_src_http.md#createheadersdecoder)
- [createParameterDecoder](packages_wp_typia_rest_src_http.md#createparameterdecoder)

## Functions

### createQueryDecoder

▸ **createQueryDecoder**\<`T`\>(`validate?`): (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `validate?` | (`input`: `string` \| `URLSearchParams`) => `IFailure` \| \{ `data?`: `unknown` ; `errors?`: `unknown` ; `success?`: `unknown`  } \| `ISuccess`\<`T`\> |

#### Returns

`fn`

▸ (`input`): [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown` |

##### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

#### Defined in

[packages/wp-typia-rest/src/http.ts:55](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/http.ts#L55)

___

### createHeadersDecoder

▸ **createHeadersDecoder**\<`T`\>(`validate?`): (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `validate?` | (`input`: `Record`\<`string`, `undefined` \| `string` \| `string`[]\>) => `IFailure` \| \{ `data?`: `unknown` ; `errors?`: `unknown` ; `success?`: `unknown`  } \| `ISuccess`\<`T`\> |

#### Returns

`fn`

▸ (`input`): [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown` |

##### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<`T`\>

#### Defined in

[packages/wp-typia-rest/src/http.ts:72](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/http.ts#L72)

___

### createParameterDecoder

▸ **createParameterDecoder**\<`T`\>(): (`input`: `string`) => `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends ``null`` \| `string` \| `number` \| `bigint` \| `boolean` |

#### Returns

`fn`

▸ (`input`): `T`

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `string` |

##### Returns

`T`

#### Defined in

[packages/wp-typia-rest/src/http.ts:127](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/http.ts#L127)
