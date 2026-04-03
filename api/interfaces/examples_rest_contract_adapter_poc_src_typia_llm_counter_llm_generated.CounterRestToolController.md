[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/rest-contract-adapter-poc/src/typia-llm/counter.llm.generated](../modules/examples_rest_contract_adapter_poc_src_typia_llm_counter_llm_generated.md) / CounterRestToolController

# Interface: CounterRestToolController

[examples/rest-contract-adapter-poc/src/typia-llm/counter.llm.generated](../modules/examples_rest_contract_adapter_poc_src_typia_llm_counter_llm_generated.md).CounterRestToolController

## Table of contents

### Methods

- [getPersistenceCounterState](examples_rest_contract_adapter_poc_src_typia_llm_counter_llm_generated.CounterRestToolController.md#getpersistencecounterstate)
- [incrementPersistenceCounterState](examples_rest_contract_adapter_poc_src_typia_llm_counter_llm_generated.CounterRestToolController.md#incrementpersistencecounterstate)

## Methods

### getPersistenceCounterState

▸ **getPersistenceCounterState**(`input`): [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)

Read the current counter state.

REST path: GET /persistence-examples/v1/counter
Auth mode: public-read

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`PersistenceCounterQuery`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |

#### Returns

[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)

**`Tag`**

Counter

#### Defined in

[examples/rest-contract-adapter-poc/src/typia-llm/counter.llm.generated.ts:16](https://github.com/imjlk/wp-typia/blob/main/examples/rest-contract-adapter-poc/src/typia-llm/counter.llm.generated.ts#L16)

___

### incrementPersistenceCounterState

▸ **incrementPersistenceCounterState**(`input`): [`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)

Increment the current counter state.

REST path: POST /persistence-examples/v1/counter
Auth mode: public-signed-token

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`PersistenceCounterIncrementRequest`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md) |

#### Returns

[`PersistenceCounterResponse`](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)

**`Tag`**

Counter

#### Defined in

[examples/rest-contract-adapter-poc/src/typia-llm/counter.llm.generated.ts:25](https://github.com/imjlk/wp-typia/blob/main/examples/rest-contract-adapter-poc/src/typia-llm/counter.llm.generated.ts#L25)
