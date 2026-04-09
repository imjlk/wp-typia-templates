[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/api-contract-adapter-poc/src/counter-adapter

# Module: examples/api-contract-adapter-poc/src/counter-adapter

## Table of contents

### Interfaces

- [CounterAdapterRouteDefinition](../interfaces/examples_api_contract_adapter_poc_src_counter_adapter.CounterAdapterRouteDefinition.md)
- [CounterAdapterServer](../interfaces/examples_api_contract_adapter_poc_src_counter_adapter.CounterAdapterServer.md)

### Variables

- [counterEndpointManifest](examples_api_contract_adapter_poc_src_counter_adapter.md#counterendpointmanifest)

### Functions

- [getCounterAdapterRouteTable](examples_api_contract_adapter_poc_src_counter_adapter.md#getcounteradapterroutetable)
- [startCounterAdapterServer](examples_api_contract_adapter_poc_src_counter_adapter.md#startcounteradapterserver)

## Variables

### counterEndpointManifest

• `Const` **counterEndpointManifest**: [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<\{ `counter-query`: \{ `sourceTypeName`: ``"PersistenceCounterQuery"`` = 'PersistenceCounterQuery' } ; `increment-request`: \{ `sourceTypeName`: ``"PersistenceCounterIncrementRequest"`` = 'PersistenceCounterIncrementRequest' } ; `counter-response`: \{ `sourceTypeName`: ``"PersistenceCounterResponse"`` = 'PersistenceCounterResponse' }  }, readonly [\{ `auth`: ``"public"`` = 'public'; `method`: ``"GET"`` = 'GET'; `operationId`: ``"getPersistenceCounterState"`` = 'getPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `queryContract`: ``"counter-query"`` = 'counter-query'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Read the current counter state."`` = 'Read the current counter state.'; `tags`: readonly [``"Counter"``]  }, \{ `auth`: ``"public-write-protected"`` = 'public-write-protected'; `bodyContract`: ``"increment-request"`` = 'increment-request'; `method`: ``"POST"`` = 'POST'; `operationId`: ``"incrementPersistenceCounterState"`` = 'incrementPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Increment the current counter state."`` = 'Increment the current counter state.'; `tags`: readonly [``"Counter"``] ; `wordpressAuth`: \{ `mechanism`: ``"public-signed-token"`` = 'public-signed-token' }  }]\> & [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[]\> = `counterBlock.restManifest`

#### Defined in

[examples/api-contract-adapter-poc/src/counter-adapter.ts:49](https://github.com/imjlk/wp-typia/blob/main/examples/api-contract-adapter-poc/src/counter-adapter.ts#L49)

## Functions

### getCounterAdapterRouteTable

▸ **getCounterAdapterRouteTable**(`manifest?`): [`CounterAdapterRouteDefinition`](../interfaces/examples_api_contract_adapter_poc_src_counter_adapter.CounterAdapterRouteDefinition.md)[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<\{ `counter-query`: \{ `sourceTypeName`: ``"PersistenceCounterQuery"`` = 'PersistenceCounterQuery' } ; `increment-request`: \{ `sourceTypeName`: ``"PersistenceCounterIncrementRequest"`` = 'PersistenceCounterIncrementRequest' } ; `counter-response`: \{ `sourceTypeName`: ``"PersistenceCounterResponse"`` = 'PersistenceCounterResponse' }  }, readonly [\{ `auth`: ``"public"`` = 'public'; `method`: ``"GET"`` = 'GET'; `operationId`: ``"getPersistenceCounterState"`` = 'getPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `queryContract`: ``"counter-query"`` = 'counter-query'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Read the current counter state."`` = 'Read the current counter state.'; `tags`: readonly [``"Counter"``]  }, \{ `auth`: ``"public-write-protected"`` = 'public-write-protected'; `bodyContract`: ``"increment-request"`` = 'increment-request'; `method`: ``"POST"`` = 'POST'; `operationId`: ``"incrementPersistenceCounterState"`` = 'incrementPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Increment the current counter state."`` = 'Increment the current counter state.'; `tags`: readonly [``"Counter"``] ; `wordpressAuth`: \{ `mechanism`: ``"public-signed-token"`` = 'public-signed-token' }  }]\> & [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[]\> | `counterEndpointManifest` |

#### Returns

[`CounterAdapterRouteDefinition`](../interfaces/examples_api_contract_adapter_poc_src_counter_adapter.CounterAdapterRouteDefinition.md)[]

#### Defined in

[examples/api-contract-adapter-poc/src/counter-adapter.ts:51](https://github.com/imjlk/wp-typia/blob/main/examples/api-contract-adapter-poc/src/counter-adapter.ts#L51)

___

### startCounterAdapterServer

▸ **startCounterAdapterServer**(`port?`): `Promise`\<[`CounterAdapterServer`](../interfaces/examples_api_contract_adapter_poc_src_counter_adapter.CounterAdapterServer.md)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `port` | `number` | `0` |

#### Returns

`Promise`\<[`CounterAdapterServer`](../interfaces/examples_api_contract_adapter_poc_src_counter_adapter.CounterAdapterServer.md)\>

#### Defined in

[examples/api-contract-adapter-poc/src/counter-adapter.ts:234](https://github.com/imjlk/wp-typia/blob/main/examples/api-contract-adapter-poc/src/counter-adapter.ts#L234)
