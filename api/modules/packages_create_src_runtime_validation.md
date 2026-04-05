[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/validation

# Module: packages/create/src/runtime/validation

## Table of contents

### Interfaces

- [TypiaValidationError](../interfaces/packages_create_src_runtime_validation.TypiaValidationError.md)
- [ValidationResult](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)
- [ValidationState](../interfaces/packages_create_src_runtime_validation.ValidationState.md)
- [ValidationHookBindings](../interfaces/packages_create_src_runtime_validation.ValidationHookBindings.md)
- [ScaffoldValidatorToolkitOptions](../interfaces/packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md)

### Functions

- [normalizeValidationError](packages_create_src_runtime_validation.md#normalizevalidationerror)
- [toValidationResult](packages_create_src_runtime_validation.md#tovalidationresult)
- [formatValidationError](packages_create_src_runtime_validation.md#formatvalidationerror)
- [formatValidationErrors](packages_create_src_runtime_validation.md#formatvalidationerrors)
- [toValidationState](packages_create_src_runtime_validation.md#tovalidationstate)
- [createUseTypiaValidationHook](packages_create_src_runtime_validation.md#createusetypiavalidationhook)
- [createScaffoldValidatorToolkit](packages_create_src_runtime_validation.md#createscaffoldvalidatortoolkit)
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

[packages/create/src/runtime/validation.ts:81](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L81)

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

[packages/create/src/runtime/validation.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L95)

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

[packages/create/src/runtime/validation.ts:118](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L118)

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

[packages/create/src/runtime/validation.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L122)

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

[packages/create/src/runtime/validation.ts:128](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L128)

___

### createUseTypiaValidationHook

▸ **createUseTypiaValidationHook**(`bindings`): \<T\>(`value`: `T`, `validator`: (`value`: `T`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>) => [`ValidationState`](../interfaces/packages_create_src_runtime_validation.ValidationState.md)\<`T`\>

Creates a validation hook factory bound to the provided hook bindings.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bindings` | [`ValidationHookBindings`](../interfaces/packages_create_src_runtime_validation.ValidationHookBindings.md) | React-like `useMemo` implementation. |

#### Returns

`fn`

A `useTypiaValidation` hook that returns normalized validation state.

▸ \<`T`\>(`value`, `validator`): [`ValidationState`](../interfaces/packages_create_src_runtime_validation.ValidationState.md)\<`T`\>

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |
| `validator` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |

##### Returns

[`ValidationState`](../interfaces/packages_create_src_runtime_validation.ValidationState.md)\<`T`\>

#### Defined in

[packages/create/src/runtime/validation.ts:143](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L143)

___

### createScaffoldValidatorToolkit

▸ **createScaffoldValidatorToolkit**\<`T`\>(`options`): `Object`

Creates a scaffold-oriented validator toolkit around Typia-generated helpers.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`ScaffoldValidatorToolkitOptions`](../interfaces/packages_create_src_runtime_validation.ScaffoldValidatorToolkitOptions.md)\<`T`\> | Typia validators, manifest defaults, and optional finalize/error hooks. |

#### Returns

`Object`

Shared sanitize, validate, and validated attribute update helpers.

`sanitizeAttributes()` asserts the final value, so required fields must be
supplied by the input, provided by manifest defaults, or filled during
finalization before the assertion runs.

| Name | Type |
| :------ | :------ |
| `createAttributeUpdater` | (`attributes`: `T`, `setAttributes`: (`attrs`: `Partial`\<`T`\>) => `void`, `validator`: (`value`: `T`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\>) => \<K\>(`key`: `K`, `value`: `T`[`K`]) => `boolean` |
| `sanitizeAttributes` | (`value`: `Partial`\<`T`\>) => `T` |
| `validateAttributes` | (`value`: `unknown`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |
| `validators` | \{ `assert`: (`value`: `unknown`) => `T` ; `clone`: (`value`: `T`) => `T` ; `is`: (`value`: `unknown`) => value is T ; `prune`: (`value`: `T`) => `unknown` ; `random`: (...`args`: `unknown`[]) => `T` ; `validate`: (`value`: `unknown`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> = validateAttributes } |
| `validators.assert` | (`value`: `unknown`) => `T` |
| `validators.clone` | (`value`: `T`) => `T` |
| `validators.is` | (`value`: `unknown`) => value is T |
| `validators.prune` | (`value`: `T`) => `unknown` |
| `validators.random` | (...`args`: `unknown`[]) => `T` |
| `validators.validate` | (`value`: `unknown`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |

#### Defined in

[packages/create/src/runtime/validation.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L167)

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

[packages/create/src/runtime/validation.ts:314](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L314)

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

[packages/create/src/runtime/validation.ts:323](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L323)

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

[packages/create/src/runtime/validation.ts:343](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L343)

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

[packages/create/src/runtime/validation.ts:354](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L354)

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

[packages/create/src/runtime/validation.ts:379](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L379)
