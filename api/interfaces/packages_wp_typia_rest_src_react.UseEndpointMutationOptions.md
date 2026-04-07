[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md) / UseEndpointMutationOptions

# Interface: UseEndpointMutationOptions\<Req, Res, Context\>

[packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md).UseEndpointMutationOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `Req` | `Req` |
| `Res` | `Res` |
| `Context` | `unknown` |

## Table of contents

### Properties

- [client](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#client)
- [fetchFn](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#fetchfn)
- [invalidate](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#invalidate)
- [onError](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#onerror)
- [onMutate](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#onmutate)
- [onSettled](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#onsettled)
- [onSuccess](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#onsuccess)
- [resolveCallOptions](packages_wp_typia_rest_src_react.UseEndpointMutationOptions.md#resolvecalloptions)

## Properties

### client

• `Optional` **client**: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Defined in

[packages/wp-typia-rest/src/react.ts:110](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L110)

___

### fetchFn

• `Optional` **fetchFn**: `ApiFetch`

#### Defined in

[packages/wp-typia-rest/src/react.ts:111](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L111)

___

### invalidate

• `Optional` **invalidate**: `EndpointInvalidateTargets` \| (`data`: `undefined` \| `Res`, `variables`: `Req`, `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>) => `EndpointInvalidateTargets`

#### Defined in

[packages/wp-typia-rest/src/react.ts:112](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L112)

___

### onError

• `Optional` **onError**: (`error`: `unknown`, `variables`: `Req`, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `Context`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`error`, `variables`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |
| `variables` | `Req` |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `Context` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:119](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L119)

___

### onMutate

• `Optional` **onMutate**: (`variables`: `Req`, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)) => `Context` \| `Promise`\<`Context`\>

#### Type declaration

▸ (`variables`, `client`): `Context` \| `Promise`\<`Context`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `variables` | `Req` |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |

##### Returns

`Context` \| `Promise`\<`Context`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:125](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L125)

___

### onSettled

• `Optional` **onSettled**: (`result`: \{ `data`: `undefined` \| `Res` ; `error`: `unknown` ; `validation`: ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>  }, `variables`: `Req`, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `Context`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`result`, `variables`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `Object` |
| `result.data` | `undefined` \| `Res` |
| `result.error` | `unknown` |
| `result.validation` | ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\> |
| `variables` | `Req` |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `Context` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:129](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L129)

___

### onSuccess

• `Optional` **onSuccess**: (`data`: `undefined` \| `Res`, `variables`: `Req`, `validation`: [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>, `client`: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md), `context`: `undefined` \| `Context`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`data`, `variables`, `validation`, `client`, `context`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `undefined` \| `Res` |
| `variables` | `Req` |
| `validation` | [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\> |
| `client` | [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md) |
| `context` | `undefined` \| `Context` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:139](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L139)

___

### resolveCallOptions

• `Optional` **resolveCallOptions**: (`variables`: `Req`) => `undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

#### Type declaration

▸ (`variables`): `undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `variables` | `Req` |

##### Returns

`undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

#### Defined in

[packages/wp-typia-rest/src/react.ts:146](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L146)
