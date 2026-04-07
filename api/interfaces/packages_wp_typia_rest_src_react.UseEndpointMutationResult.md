[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md) / UseEndpointMutationResult

# Interface: UseEndpointMutationResult\<Req, Res\>

[packages/wp-typia-rest/src/react](../modules/packages_wp_typia_rest_src_react.md).UseEndpointMutationResult

## Type parameters

| Name |
| :------ |
| `Req` |
| `Res` |

## Table of contents

### Properties

- [data](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#data)
- [error](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#error)
- [isPending](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#ispending)
- [mutate](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#mutate)
- [mutateAsync](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#mutateasync)
- [reset](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#reset)
- [validation](packages_wp_typia_rest_src_react.UseEndpointMutationResult.md#validation)

## Properties

### data

• **data**: `undefined` \| `Res`

#### Defined in

[packages/wp-typia-rest/src/react.ts:152](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L152)

___

### error

• **error**: `unknown`

#### Defined in

[packages/wp-typia-rest/src/react.ts:153](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L153)

___

### isPending

• **isPending**: `boolean`

#### Defined in

[packages/wp-typia-rest/src/react.ts:154](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L154)

___

### mutate

• **mutate**: (`variables`: `Req`) => `void`

#### Type declaration

▸ (`variables`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `variables` | `Req` |

##### Returns

`void`

#### Defined in

[packages/wp-typia-rest/src/react.ts:155](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L155)

___

### mutateAsync

• **mutateAsync**: (`variables`: `Req`) => `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>\>

#### Type declaration

▸ (`variables`): `Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `variables` | `Req` |

##### Returns

`Promise`\<[`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:156](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L156)

___

### reset

• **reset**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[packages/wp-typia-rest/src/react.ts:157](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L157)

___

### validation

• **validation**: ``null`` \| [`ValidationResult`](packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`Res`\>

#### Defined in

[packages/wp-typia-rest/src/react.ts:158](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-rest/src/react.ts#L158)
