[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/api-validators

# Module: examples/persistence-examples/src/blocks/counter/api-validators

## Table of contents

### Variables

- [apiValidators](examples_persistence_examples_src_blocks_counter_api_validators.md#apivalidators)

## Variables

### apiValidators

• `Const` **apiValidators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `counterQuery` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md)\> |
| `counterResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |
| `incrementRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_api_client_src_internal_runtime_primitives.ValidationResult.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)\> |

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-validators.ts:19](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-validators.ts#L19)
