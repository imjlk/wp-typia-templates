[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/validation

# Module: packages/wp-typia-block-runtime/src/validation

## Table of contents

### Interfaces

- [ValidationState](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)
- [ValidationHookBindings](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationHookBindings.md)
- [ScaffoldValidatorToolkitOptions](../interfaces/packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md)

### Type Aliases

- [TypiaValidationError](packages_wp_typia_block_runtime_src_validation.md#typiavalidationerror)
- [ValidationResult](packages_wp_typia_block_runtime_src_validation.md#validationresult)

### Functions

- [normalizeValidationError](packages_wp_typia_block_runtime_src_validation.md#normalizevalidationerror)
- [toValidationResult](packages_wp_typia_block_runtime_src_validation.md#tovalidationresult)
- [formatValidationError](packages_wp_typia_block_runtime_src_validation.md#formatvalidationerror)
- [formatValidationErrors](packages_wp_typia_block_runtime_src_validation.md#formatvalidationerrors)
- [toValidationState](packages_wp_typia_block_runtime_src_validation.md#tovalidationstate)
- [createUseTypiaValidationHook](packages_wp_typia_block_runtime_src_validation.md#createusetypiavalidationhook)
- [createScaffoldValidatorToolkit](packages_wp_typia_block_runtime_src_validation.md#createscaffoldvalidatortoolkit)
- [createAttributeUpdater](packages_wp_typia_block_runtime_src_validation.md#createattributeupdater)
- [mergeNestedAttributeUpdate](packages_wp_typia_block_runtime_src_validation.md#mergenestedattributeupdate)
- [toAttributePatch](packages_wp_typia_block_runtime_src_validation.md#toattributepatch)
- [toNestedAttributePatch](packages_wp_typia_block_runtime_src_validation.md#tonestedattributepatch)
- [createNestedAttributeUpdater](packages_wp_typia_block_runtime_src_validation.md#createnestedattributeupdater)

## Type Aliases

### TypiaValidationError

Ƭ **TypiaValidationError**: [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:12](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L12)

___

### ValidationResult

Ƭ **ValidationResult**\<`T`\>: [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:14](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L14)

## Functions

### normalizeValidationError

▸ **normalizeValidationError**(`error`): [`TypiaValidationError`](packages_wp_typia_block_runtime_src_validation.md#typiavalidationerror)

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

[`TypiaValidationError`](packages_wp_typia_block_runtime_src_validation.md#typiavalidationerror)

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:58](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L58)

___

### toValidationResult

▸ **toValidationResult**\<`T`\>(`result`): [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `unknown` |

#### Returns

[`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:62](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L62)

___

### formatValidationError

▸ **formatValidationError**(`error`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md) |

#### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:66](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L66)

___

### formatValidationErrors

▸ **formatValidationErrors**(`errors`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `errors` | readonly [`ValidationError`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationError.md)[] |

#### Returns

`string`[]

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:70](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L70)

___

### toValidationState

▸ **toValidationState**\<`T`\>(`result`): [`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |

#### Returns

[`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:76](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L76)

___

### createUseTypiaValidationHook

▸ **createUseTypiaValidationHook**(`«destructured»`): \<T\>(`value`: `T`, `validator`: (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>) => [`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ValidationHookBindings`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationHookBindings.md) |

#### Returns

`fn`

▸ \<`T`\>(`value`, `validator`): [`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |
| `validator` | (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |

##### Returns

[`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L85)

___

### createScaffoldValidatorToolkit

▸ **createScaffoldValidatorToolkit**\<`T`\>(`«destructured»`): `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`ScaffoldValidatorToolkitOptions`](../interfaces/packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md)\<`T`\> |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `createAttributeUpdater` | (`attributes`: `T`, `setAttributes`: (`attrs`: `Partial`\<`T`\>) => `void`, `validator`: (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>) => \<K\>(`key`: `K`, `value`: `T`[`K`]) => `boolean` |
| `sanitizeAttributes` | (`value`: `Partial`\<`T`\>) => `T` |
| `validateAttributes` | (`value`: `unknown`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |
| `validators` | \{ `assert`: (`value`: `unknown`) => `T` ; `clone`: (`value`: `T`) => `T` ; `is`: (`value`: `unknown`) => value is T ; `prune`: (`value`: `T`) => `unknown` ; `random`: (...`args`: `unknown`[]) => `T` ; `validate`: (`value`: `unknown`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> = validateAttributes } |
| `validators.assert` | (`value`: `unknown`) => `T` |
| `validators.clone` | (`value`: `T`) => `T` |
| `validators.is` | (`value`: `unknown`) => value is T |
| `validators.prune` | (`value`: `T`) => `unknown` |
| `validators.random` | (...`args`: `unknown`[]) => `T` |
| `validators.validate` | (`value`: `unknown`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:99](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L99)

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
| `validate` | (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |
| `onValidationError?` | (`result`: [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>, `key`: keyof `T`) => `void` |

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

[packages/wp-typia-block-runtime/src/validation.ts:243](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L243)

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

[packages/wp-typia-block-runtime/src/validation.ts:268](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L268)

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

[packages/wp-typia-block-runtime/src/validation.ts:279](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L279)

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

[packages/wp-typia-block-runtime/src/validation.ts:288](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L288)

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
| `validate` | (`value`: `T`) => [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\> |
| `onValidationError?` | (`result`: [`ValidationResult`](packages_wp_typia_block_runtime_src_validation.md#validationresult)\<`T`\>, `path`: `string`) => `void` |

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

[packages/wp-typia-block-runtime/src/validation.ts:308](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L308)
