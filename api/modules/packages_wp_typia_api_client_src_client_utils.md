[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-api-client/src/client-utils

# Module: packages/wp-typia-api-client/src/client-utils

## Table of contents

### Type Aliases

- [QueryScalar](packages_wp_typia_api_client_src_client_utils.md#queryscalar)

### Functions

- [parseResponsePayload](packages_wp_typia_api_client_src_client_utils.md#parseresponsepayload)
- [isQueryScalar](packages_wp_typia_api_client_src_client_utils.md#isqueryscalar)
- [encodeGetLikeRequest](packages_wp_typia_api_client_src_client_utils.md#encodegetlikerequest)
- [joinPathWithQuery](packages_wp_typia_api_client_src_client_utils.md#joinpathwithquery)
- [joinUrlWithQuery](packages_wp_typia_api_client_src_client_utils.md#joinurlwithquery)
- [mergeHeaderInputs](packages_wp_typia_api_client_src_client_utils.md#mergeheaderinputs)

## Type Aliases

### QueryScalar

Ƭ **QueryScalar**: `boolean` \| `number` \| `string`

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:3](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L3)

## Functions

### parseResponsePayload

▸ **parseResponsePayload**(`response`): `Promise`\<`unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `response` | `Response` |

#### Returns

`Promise`\<`unknown`\>

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:5](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L5)

___

### isQueryScalar

▸ **isQueryScalar**(`value`): value is QueryScalar

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

value is QueryScalar

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L22)

___

### encodeGetLikeRequest

▸ **encodeGetLikeRequest**(`request`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `unknown` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L30)

___

### joinPathWithQuery

▸ **joinPathWithQuery**(`path`, `query`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `query` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:70](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L70)

___

### joinUrlWithQuery

▸ **joinUrlWithQuery**(`url`, `query`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `query` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:83](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L83)

___

### mergeHeaderInputs

▸ **mergeHeaderInputs**(`baseHeaders?`, `requestHeaders?`): `Record`\<`string`, `string`\> \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `baseHeaders?` | `HeadersInit` |
| `requestHeaders?` | `HeadersInit` |

#### Returns

`Record`\<`string`, `string`\> \| `undefined`

#### Defined in

[packages/wp-typia-api-client/src/client-utils.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-api-client/src/client-utils.ts#L96)
