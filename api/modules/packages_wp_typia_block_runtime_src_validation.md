[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/validation

# Module: packages/wp-typia-block-runtime/src/validation

## Table of contents

### Interfaces

- [TypiaValidationError](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)
- [ValidationResult](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)
- [ValidationState](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)
- [ValidationHookBindings](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationHookBindings.md)
- [ScaffoldValidatorToolkitOptions](../interfaces/packages_wp_typia_block_runtime_src_validation.ScaffoldValidatorToolkitOptions.md)

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

## Functions

### normalizeValidationError

▸ **normalizeValidationError**(`error`): [`TypiaValidationError`](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

[`TypiaValidationError`](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:73](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L73)

___

### toValidationResult

▸ **toValidationResult**\<`T`\>(`result`): [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `unknown` |

#### Returns

[`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L87)

___

### formatValidationError

▸ **formatValidationError**(`error`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | [`TypiaValidationError`](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md) |

#### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:110](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L110)

___

### formatValidationErrors

▸ **formatValidationErrors**(`errors`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `errors` | readonly [`TypiaValidationError`](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)[] |

#### Returns

`string`[]

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:114](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L114)

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
| `result` | [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |

#### Returns

[`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:120](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L120)

___

### createUseTypiaValidationHook

▸ **createUseTypiaValidationHook**(`«destructured»`): \<T\>(`value`: `T`, `validator`: (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>) => [`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

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
| `validator` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |

##### Returns

[`ValidationState`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:129](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L129)

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
| `createAttributeUpdater` | (`attributes`: `T`, `setAttributes`: (`attrs`: `Partial`\<`T`\>) => `void`, `validator`: (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>) => \<K\>(`key`: `K`, `value`: `T`[`K`]) => `boolean` |
| `sanitizeAttributes` | (`value`: `Partial`\<`T`\>) => `T` |
| `validateAttributes` | (`value`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |
| `validators` | \{ `assert`: (`value`: `unknown`) => `T` ; `clone`: (`value`: `T`) => `T` ; `is`: (`value`: `unknown`) => value is T ; `prune`: (`value`: `T`) => `unknown` ; `random`: (...`args`: `unknown`[]) => `T` ; `validate`: (`value`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> = validateAttributes } |
| `validators.assert` | (`value`: `unknown`) => `T` |
| `validators.clone` | (`value`: `T`) => `T` |
| `validators.is` | (`value`: `unknown`) => value is T |
| `validators.prune` | (`value`: `T`) => `unknown` |
| `validators.random` | (...`args`: `unknown`[]) => `T` |
| `validators.validate` | (`value`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |

#### Defined in

[packages/wp-typia-block-runtime/src/validation.ts:143](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L143)

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
| `validate` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |
| `onValidationError?` | (`result`: [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>, `key`: keyof `T`) => `void` |

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

[packages/wp-typia-block-runtime/src/validation.ts:287](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L287)

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

[packages/wp-typia-block-runtime/src/validation.ts:312](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L312)

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

[packages/wp-typia-block-runtime/src/validation.ts:323](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L323)

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

[packages/wp-typia-block-runtime/src/validation.ts:332](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L332)

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
| `validate` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |
| `onValidationError?` | (`result`: [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\>, `path`: `string`) => `void` |

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

[packages/wp-typia-block-runtime/src/validation.ts:352](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/validation.ts#L352)
