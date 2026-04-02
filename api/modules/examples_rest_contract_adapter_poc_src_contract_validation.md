[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/rest-contract-adapter-poc/src/contract-validation

# Module: examples/rest-contract-adapter-poc/src/contract-validation

## Table of contents

### Variables

- [counterContractValidators](examples_rest_contract_adapter_poc_src_contract_validation.md#countercontractvalidators)

## Variables

### counterContractValidators

• `Const` **counterContractValidators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `counterQuery` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md)\> |
| `counterResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\> |
| `incrementRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)\> |

#### Defined in

[examples/rest-contract-adapter-poc/src/contract-validation.ts:72](https://github.com/imjlk/wp-typia/blob/main/examples/rest-contract-adapter-poc/src/contract-validation.ts#L72)
