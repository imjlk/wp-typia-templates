[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/client](../modules/packages_wp_typia_rest_src_client.md) / ApiEndpoint

# Interface: ApiEndpoint\<Req, Res\>

[packages/wp-typia-rest/src/client](../modules/packages_wp_typia_rest_src_client.md).ApiEndpoint

## Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

## Table of contents

### Properties

- [buildRequestOptions](packages_wp_typia_rest_src_client.ApiEndpoint.md#buildrequestoptions)
- [method](packages_wp_typia_rest_src_client.ApiEndpoint.md#method)
- [path](packages_wp_typia_rest_src_client.ApiEndpoint.md#path)
- [validateRequest](packages_wp_typia_rest_src_client.ApiEndpoint.md#validaterequest)
- [validateResponse](packages_wp_typia_rest_src_client.ApiEndpoint.md#validateresponse)

## Properties

### buildRequestOptions

• `Optional` **buildRequestOptions**: (`request`: `Req`) => `Partial`\<`APIFetchOptions`\<`boolean`\>\>

#### Type declaration

▸ (`request`): `Partial`\<`APIFetchOptions`\<`boolean`\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `Req` |

##### Returns

`Partial`\<`APIFetchOptions`\<`boolean`\>\>

#### Defined in

[packages/wp-typia-rest/src/client.ts:23](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L23)

___

### method

• **method**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

#### Defined in

[packages/wp-typia-rest/src/client.ts:24](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L24)

___

### path

• **path**: `string`

#### Defined in

[packages/wp-typia-rest/src/client.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L25)

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

[packages/wp-typia-rest/src/client.ts:26](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L26)

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

[packages/wp-typia-rest/src/client.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/client.ts#L27)
