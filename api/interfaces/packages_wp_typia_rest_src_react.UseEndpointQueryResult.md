[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md) / UseEndpointQueryResult

# Interface: UseEndpointQueryResult\<Res, Selected\>

[packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md).UseEndpointQueryResult

## Type parameters

| Name | Type |
| :------ | :------ |
| `Res` | `Res` |
| `Selected` | `Res` |

## Table of contents

### Properties

- [data](packages_wp_typia_rest_src_react.UseEndpointQueryResult.md#data)
- [error](packages_wp_typia_rest_src_react.UseEndpointQueryResult.md#error)
- [isFetching](packages_wp_typia_rest_src_react.UseEndpointQueryResult.md#isfetching)
- [isLoading](packages_wp_typia_rest_src_react.UseEndpointQueryResult.md#isloading)
- [refetch](packages_wp_typia_rest_src_react.UseEndpointQueryResult.md#refetch)
- [validation](packages_wp_typia_rest_src_react.UseEndpointQueryResult.md#validation)

## Properties

### data

• **data**: `undefined` \| `Selected`

#### Defined in

[packages/wp-typia-rest/src/react.ts:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L100)

___

### error

• **error**: `unknown`

#### Defined in

[packages/wp-typia-rest/src/react.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L101)

___

### isFetching

• **isFetching**: `boolean`

#### Defined in

[packages/wp-typia-rest/src/react.ts:102](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L102)

___

### isLoading

• **isLoading**: `boolean`

#### Defined in

[packages/wp-typia-rest/src/react.ts:103](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L103)

___

### refetch

• **refetch**: () => `Promise`\<[`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>\>

#### Type declaration

▸ (): `Promise`\<[`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>\>

##### Returns

`Promise`\<[`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:104](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L104)

___

### validation

• **validation**: ``null`` \| [`ValidationResult`](packages_wp_typia_rest_src_client.ValidationResult.md)\<`Res`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:105](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L105)
