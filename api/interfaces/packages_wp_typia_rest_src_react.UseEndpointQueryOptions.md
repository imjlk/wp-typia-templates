[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md) / UseEndpointQueryOptions

# Interface: UseEndpointQueryOptions\<_Req, Res, Selected\>

[packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md).UseEndpointQueryOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `_Req` | `_Req` |
| `Res` | `Res` |
| `Selected` | `Res` |

## Table of contents

### Properties

- [client](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#client)
- [enabled](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#enabled)
- [fetchFn](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#fetchfn)
- [initialData](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#initialdata)
- [onError](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#onerror)
- [onSuccess](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#onsuccess)
- [resolveCallOptions](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#resolvecalloptions)
- [select](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#select)
- [staleTime](packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md#staletime)

## Properties

### client

• `Optional` **client**: [`EndpointDataClient`](packages_wp_typia_rest_src_react.EndpointDataClient.md)

#### Defined in

[packages/wp-typia-rest/src/react.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L85)

___

### enabled

• `Optional` **enabled**: `boolean`

#### Defined in

[packages/wp-typia-rest/src/react.ts:86](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L86)

___

### fetchFn

• `Optional` **fetchFn**: `ApiFetch`

#### Defined in

[packages/wp-typia-rest/src/react.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L87)

___

### initialData

• `Optional` **initialData**: `Res`

#### Defined in

[packages/wp-typia-rest/src/react.ts:88](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L88)

___

### onError

• `Optional` **onError**: (`error`: `unknown`) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`error`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:89](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L89)

___

### onSuccess

• `Optional` **onSuccess**: (`data`: `Selected`, `validation`: [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>) => `void` \| `Promise`\<`void`\>

#### Type declaration

▸ (`data`, `validation`): `void` \| `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `Selected` |
| `validation` | [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\> |

##### Returns

`void` \| `Promise`\<`void`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:90](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L90)

___

### resolveCallOptions

• `Optional` **resolveCallOptions**: () => `undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

#### Type declaration

▸ (): `undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

##### Returns

`undefined` \| [`EndpointCallOptions`](packages_wp_typia_rest_src_client.EndpointCallOptions.md)

#### Defined in

[packages/wp-typia-rest/src/react.ts:94](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L94)

___

### select

• `Optional` **select**: (`data`: `Res`) => `Selected`

#### Type declaration

▸ (`data`): `Selected`

##### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `Res` |

##### Returns

`Selected`

#### Defined in

[packages/wp-typia-rest/src/react.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L95)

___

### staleTime

• `Optional` **staleTime**: `number`

#### Defined in

[packages/wp-typia-rest/src/react.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L96)
