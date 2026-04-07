[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/like-button/validators

# Module: examples/persistence-examples/src/blocks/like-button/validators

## Table of contents

### Variables

- [validators](examples_persistence_examples_src_blocks_like_button_validators.md#validators)

### Functions

- [validatePersistenceLikeButtonAttributes](examples_persistence_examples_src_blocks_like_button_validators.md#validatepersistencelikebuttonattributes)
- [sanitizePersistenceLikeButtonAttributes](examples_persistence_examples_src_blocks_like_button_validators.md#sanitizepersistencelikebuttonattributes)
- [createAttributeUpdater](examples_persistence_examples_src_blocks_like_button_validators.md#createattributeupdater)

## Variables

### validators

• `Const` **validators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `assert` | (`input`: `unknown`) => [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md) |
| `clone` | (`input`: [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)) => [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md) |
| `is` | (`input`: `unknown`) => input is PersistenceLikeButtonAttributes |
| `prune` | (`input`: [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)) => `void` |
| `random` | () => [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md) |
| `validate` | (`attributes`: `unknown`) => [`PersistenceLikeButtonValidationResult`](examples_persistence_examples_src_blocks_like_button_types.md#persistencelikebuttonvalidationresult) |

#### Defined in

[examples/persistence-examples/src/blocks/like-button/validators.ts:32](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/validators.ts#L32)

## Functions

### validatePersistenceLikeButtonAttributes

▸ **validatePersistenceLikeButtonAttributes**(`attributes`): [`PersistenceLikeButtonValidationResult`](examples_persistence_examples_src_blocks_like_button_types.md#persistencelikebuttonvalidationresult)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `unknown` |

#### Returns

[`PersistenceLikeButtonValidationResult`](examples_persistence_examples_src_blocks_like_button_types.md#persistencelikebuttonvalidationresult)

#### Defined in

[examples/persistence-examples/src/blocks/like-button/validators.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/validators.ts#L26)

___

### sanitizePersistenceLikeButtonAttributes

▸ **sanitizePersistenceLikeButtonAttributes**(`attributes`): [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Partial`\<[`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)\> |

#### Returns

[`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)

#### Defined in

[examples/persistence-examples/src/blocks/like-button/validators.ts:41](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/validators.ts#L41)

___

### createAttributeUpdater

▸ **createAttributeUpdater**(`attributes`, `setAttributes`, `validator?`): \<K\>(`key`: `K`, `value`: [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)[`K`]) => `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `attributes` | [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md) | `undefined` |
| `setAttributes` | (`attrs`: `Partial`\<[`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)\>) => `void` | `undefined` |
| `validator` | (`attributes`: `unknown`) => [`PersistenceLikeButtonValidationResult`](examples_persistence_examples_src_blocks_like_button_types.md#persistencelikebuttonvalidationresult) | `validatePersistenceLikeButtonAttributes` |

#### Returns

`fn`

▸ \<`K`\>(`key`, `value`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends keyof [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md) |

##### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | [`PersistenceLikeButtonAttributes`](../interfaces/examples_persistence_examples_src_blocks_like_button_types.PersistenceLikeButtonAttributes.md)[`K`] |

##### Returns

`boolean`

#### Defined in

[examples/persistence-examples/src/blocks/like-button/validators.ts:59](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/validators.ts#L59)
