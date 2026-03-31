[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/validators

# Module: examples/persistence-examples/src/blocks/counter/validators

## Table of contents

### Variables

- [validators](examples_persistence_examples_src_blocks_counter_validators.md#validators)

### Functions

- [validatePersistenceCounterAttributes](examples_persistence_examples_src_blocks_counter_validators.md#validatepersistencecounterattributes)
- [sanitizePersistenceCounterAttributes](examples_persistence_examples_src_blocks_counter_validators.md#sanitizepersistencecounterattributes)
- [createAttributeUpdater](examples_persistence_examples_src_blocks_counter_validators.md#createattributeupdater)

## Variables

### validators

• `Const` **validators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `assert` | (`input`: `unknown`) => [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md) |
| `clone` | (`input`: [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)) => [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md) |
| `is` | (`input`: `unknown`) => input is PersistenceCounterAttributes |
| `prune` | (`input`: [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)) => `void` |
| `random` | () => [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md) |
| `validate` | (`attributes`: `unknown`) => [`PersistenceCounterValidationResult`](examples_persistence_examples_src_blocks_counter_types.md#persistencecountervalidationresult) |

#### Defined in

[examples/persistence-examples/src/blocks/counter/validators.ts:31](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/validators.ts#L31)

## Functions

### validatePersistenceCounterAttributes

▸ **validatePersistenceCounterAttributes**(`attributes`): [`PersistenceCounterValidationResult`](examples_persistence_examples_src_blocks_counter_types.md#persistencecountervalidationresult)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `unknown` |

#### Returns

[`PersistenceCounterValidationResult`](examples_persistence_examples_src_blocks_counter_types.md#persistencecountervalidationresult)

#### Defined in

[examples/persistence-examples/src/blocks/counter/validators.ts:25](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/validators.ts#L25)

___

### sanitizePersistenceCounterAttributes

▸ **sanitizePersistenceCounterAttributes**(`attributes`): [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Partial`\<[`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)\> |

#### Returns

[`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)

#### Defined in

[examples/persistence-examples/src/blocks/counter/validators.ts:40](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/validators.ts#L40)

___

### createAttributeUpdater

▸ **createAttributeUpdater**(`attributes`, `setAttributes`, `validator?`): \<K\>(`key`: `K`, `value`: [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)[`K`]) => `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `attributes` | [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md) | `undefined` |
| `setAttributes` | (`attrs`: `Partial`\<[`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)\>) => `void` | `undefined` |
| `validator` | (`attributes`: `unknown`) => [`PersistenceCounterValidationResult`](examples_persistence_examples_src_blocks_counter_types.md#persistencecountervalidationresult) | `validatePersistenceCounterAttributes` |

#### Returns

`fn`

▸ \<`K`\>(`key`, `value`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends keyof [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md) |

##### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | [`PersistenceCounterAttributes`](../interfaces/examples_persistence_examples_src_blocks_counter_types.PersistenceCounterAttributes.md)[`K`] |

##### Returns

`boolean`

#### Defined in

[examples/persistence-examples/src/blocks/counter/validators.ts:58](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/validators.ts#L58)
