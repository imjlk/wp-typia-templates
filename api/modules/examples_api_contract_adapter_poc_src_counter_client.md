[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/api-contract-adapter-poc/src/counter-client

# Module: examples/api-contract-adapter-poc/src/counter-client

## Table of contents

### References

- [PersistenceCounterIncrementRequest](examples_api_contract_adapter_poc_src_counter_client.md#persistencecounterincrementrequest)
- [PersistenceCounterQuery](examples_api_contract_adapter_poc_src_counter_client.md#persistencecounterquery)
- [PersistenceCounterResponse](examples_api_contract_adapter_poc_src_counter_client.md#persistencecounterresponse)

### Interfaces

- [CounterPortableClient](../interfaces/examples_api_contract_adapter_poc_src_counter_client.CounterPortableClient.md)

### Functions

- [createCounterPortableClient](examples_api_contract_adapter_poc_src_counter_client.md#createcounterportableclient)

## References

### PersistenceCounterIncrementRequest

Re-exports [PersistenceCounterIncrementRequest](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md)

___

### PersistenceCounterQuery

Re-exports [PersistenceCounterQuery](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md)

___

### PersistenceCounterResponse

Re-exports [PersistenceCounterResponse](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)

## Functions

### createCounterPortableClient

▸ **createCounterPortableClient**(`baseUrl`): [`CounterPortableClient`](../interfaces/examples_api_contract_adapter_poc_src_counter_client.CounterPortableClient.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `baseUrl` | `string` |

#### Returns

[`CounterPortableClient`](../interfaces/examples_api_contract_adapter_poc_src_counter_client.CounterPortableClient.md)

#### Defined in

[examples/api-contract-adapter-poc/src/counter-client.ts:22](https://github.com/imjlk/wp-typia/blob/main/examples/api-contract-adapter-poc/src/counter-client.ts#L22)
