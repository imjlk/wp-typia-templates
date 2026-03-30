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
- [toNestedAttributePatch](packages_create_src_runtime_validation.md#tonestedattributepatch)
- [mergeNestedAttributeUpdate](packages_create_src_runtime_validation.md#mergenestedattributeupdate)
- [createAttributeUpdater](packages_create_src_runtime_validation.md#createattributeupdater)
- [createNestedAttributeUpdater](packages_create_src_runtime_validation.md#createnestedattributeupdater)

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

[packages/create/src/runtime/validation.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L43)

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

[packages/create/src/runtime/validation.ts:57](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L57)

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

[packages/create/src/runtime/validation.ts:80](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L80)

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

[packages/create/src/runtime/validation.ts:84](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L84)

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

[packages/create/src/runtime/validation.ts:90](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L90)

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

[packages/create/src/runtime/validation.ts:154](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L154)

___

### toNestedAttributePatch

▸ **toNestedAttributePatch**\<`T`\>(`attributes`, `path`, `value`): `Partial`\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `T` |
| `path` | `string` |
| `value` | `unknown` |

#### Returns

`Partial`\<`T`\>

#### Defined in

[packages/create/src/runtime/validation.ts:163](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L163)

___

### mergeNestedAttributeUpdate

▸ **mergeNestedAttributeUpdate**\<`T`\>(`attributes`, `path`, `value`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `T` |
| `path` | `string` |
| `value` | `unknown` |

#### Returns

`T`

#### Defined in

[packages/create/src/runtime/validation.ts:183](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L183)

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

[packages/create/src/runtime/validation.ts:194](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L194)

___

### createNestedAttributeUpdater

▸ **createNestedAttributeUpdater**\<`T`\>(`attributes`, `setAttributes`, `validate`, `onValidationError?`): (`path`: `string`, `value`: `unknown`) => `boolean`

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
| `onValidationError?` | (`result`: [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>, `path`: `string`) => `void` |

#### Returns

`fn`

▸ (`path`, `value`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `value` | `unknown` |

##### Returns

`boolean`

#### Defined in

[packages/create/src/runtime/validation.ts:214](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L214)
