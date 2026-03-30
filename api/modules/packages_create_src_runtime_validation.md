[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/validation

# Module: packages/create/src/runtime/validation

## Table of contents

### Interfaces

- [TypiaValidationError](../interfaces/packages_create_src_runtime_validation.TypiaValidationError.md)
- [ValidationResult](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)
- [ValidationState](../interfaces/packages_create_src_runtime_validation.ValidationState.md)

### Functions

- [normalizeValidationError](packages_create_src_runtime_validation.md#normalizevalidationerror)
- [toValidationResult](packages_create_src_runtime_validation.md#tovalidationresult)
- [formatValidationError](packages_create_src_runtime_validation.md#formatvalidationerror)
- [formatValidationErrors](packages_create_src_runtime_validation.md#formatvalidationerrors)
- [toValidationState](packages_create_src_runtime_validation.md#tovalidationstate)
- [toAttributePatch](packages_create_src_runtime_validation.md#toattributepatch)
- [createAttributeUpdater](packages_create_src_runtime_validation.md#createattributeupdater)

## Functions

### normalizeValidationError

▸ **normalizeValidationError**(`error`): [`TypiaValidationError`](../interfaces/packages_create_src_runtime_validation.TypiaValidationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

[`TypiaValidationError`](../interfaces/packages_create_src_runtime_validation.TypiaValidationError.md)

#### Defined in

[packages/create/src/runtime/validation.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L41)

___

### toValidationResult

▸ **toValidationResult**\<`T`\>(`result`): [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `unknown` |

#### Returns

[`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>

#### Defined in

[packages/create/src/runtime/validation.ts:55](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L55)

___

### formatValidationError

▸ **formatValidationError**(`error`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | [`TypiaValidationError`](../interfaces/packages_create_src_runtime_validation.TypiaValidationError.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/validation.ts:78](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L78)

___

### formatValidationErrors

▸ **formatValidationErrors**(`errors`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `errors` | readonly [`TypiaValidationError`](../interfaces/packages_create_src_runtime_validation.TypiaValidationError.md)[] |

#### Returns

`string`[]

#### Defined in

[packages/create/src/runtime/validation.ts:82](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L82)

___

### toValidationState

▸ **toValidationState**\<`T`\>(`result`): [`ValidationState`](../interfaces/packages_create_src_runtime_validation.ValidationState.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |

#### Returns

[`ValidationState`](../interfaces/packages_create_src_runtime_validation.ValidationState.md)\<`T`\>

#### Defined in

[packages/create/src/runtime/validation.ts:88](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L88)

___

### toAttributePatch

▸ **toAttributePatch**\<`T`, `K`\>(`key`, `value`): `Pick`\<`T`, `K`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `K` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | `T`[`K`] |

#### Returns

`Pick`\<`T`, `K`\>

#### Defined in

[packages/create/src/runtime/validation.ts:108](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L108)

___

### createAttributeUpdater

▸ **createAttributeUpdater**\<`T`\>(`attributes`, `setAttributes`, `validate`, `onValidationError?`): \<K\>(`key`: `K`, `value`: `T`[`K`]) => `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `T` |
| `setAttributes` | (`attrs`: `Partial`\<`T`\>) => `void` |
| `validate` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |
| `onValidationError?` | (`result`: [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>, `key`: keyof `T`) => `void` |

#### Returns

`fn`

▸ \<`K`\>(`key`, `value`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends `string` \| `number` \| `symbol` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | `T`[`K`] |

##### Returns

`boolean`

#### Defined in

[packages/create/src/runtime/validation.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L117)
