[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/rest-contract-adapter-poc/src/counter-adapter

# Module: examples/rest-contract-adapter-poc/src/counter-adapter

## Table of contents

### Interfaces

- [CounterAdapterRouteDefinition](../interfaces/examples_rest_contract_adapter_poc_src_counter_adapter.CounterAdapterRouteDefinition.md)
- [CounterAdapterServer](../interfaces/examples_rest_contract_adapter_poc_src_counter_adapter.CounterAdapterServer.md)

### Variables

- [counterEndpointManifest](examples_rest_contract_adapter_poc_src_counter_adapter.md#counterendpointmanifest)

### Functions

- [getCounterAdapterRouteTable](examples_rest_contract_adapter_poc_src_counter_adapter.md#getcounteradapterroutetable)
- [startCounterAdapterServer](examples_rest_contract_adapter_poc_src_counter_adapter.md#startcounteradapterserver)

## Variables

### counterEndpointManifest

• `Const` **counterEndpointManifest**: [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<\{ `counter-query`: \{ `sourceTypeName`: ``"PersistenceCounterQuery"`` = 'PersistenceCounterQuery' } ; `increment-request`: \{ `sourceTypeName`: ``"PersistenceCounterIncrementRequest"`` = 'PersistenceCounterIncrementRequest' } ; `counter-response`: \{ `sourceTypeName`: ``"PersistenceCounterResponse"`` = 'PersistenceCounterResponse' }  }, readonly [\{ `authMode`: ``"public-read"`` = 'public-read'; `method`: ``"GET"`` = 'GET'; `operationId`: ``"getPersistenceCounterState"`` = 'getPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `queryContract`: ``"counter-query"`` = 'counter-query'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Read the current counter state."`` = 'Read the current counter state.'; `tags`: readonly [``"Counter"``]  }, \{ `authMode`: ``"public-signed-token"`` = 'public-signed-token'; `bodyContract`: ``"increment-request"`` = 'increment-request'; `method`: ``"POST"`` = 'POST'; `operationId`: ``"incrementPersistenceCounterState"`` = 'incrementPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Increment the current counter state."`` = 'Increment the current counter state.'; `tags`: readonly [``"Counter"``]  }]\> & [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointManifestEndpointDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)[]\> = `counterBlock.restManifest`

#### Defined in

[examples/rest-contract-adapter-poc/src/counter-adapter.ts:48](https://github.com/imjlk/wp-typia/blob/main/examples/rest-contract-adapter-poc/src/counter-adapter.ts#L48)

## Functions

### getCounterAdapterRouteTable

▸ **getCounterAdapterRouteTable**(`manifest?`): [`CounterAdapterRouteDefinition`](../interfaces/examples_rest_contract_adapter_poc_src_counter_adapter.CounterAdapterRouteDefinition.md)[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<\{ `counter-query`: \{ `sourceTypeName`: ``"PersistenceCounterQuery"`` = 'PersistenceCounterQuery' } ; `increment-request`: \{ `sourceTypeName`: ``"PersistenceCounterIncrementRequest"`` = 'PersistenceCounterIncrementRequest' } ; `counter-response`: \{ `sourceTypeName`: ``"PersistenceCounterResponse"`` = 'PersistenceCounterResponse' }  }, readonly [\{ `authMode`: ``"public-read"`` = 'public-read'; `method`: ``"GET"`` = 'GET'; `operationId`: ``"getPersistenceCounterState"`` = 'getPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `queryContract`: ``"counter-query"`` = 'counter-query'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Read the current counter state."`` = 'Read the current counter state.'; `tags`: readonly [``"Counter"``]  }, \{ `authMode`: ``"public-signed-token"`` = 'public-signed-token'; `bodyContract`: ``"increment-request"`` = 'increment-request'; `method`: ``"POST"`` = 'POST'; `operationId`: ``"incrementPersistenceCounterState"`` = 'incrementPersistenceCounterState'; `path`: ``"/persistence-examples/v1/counter"`` = '/persistence-examples/v1/counter'; `responseContract`: ``"counter-response"`` = 'counter-response'; `summary`: ``"Increment the current counter state."`` = 'Increment the current counter state.'; `tags`: readonly [``"Counter"``]  }]\> & [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointManifestEndpointDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)[]\> | `counterEndpointManifest` |

#### Returns

[`CounterAdapterRouteDefinition`](../interfaces/examples_rest_contract_adapter_poc_src_counter_adapter.CounterAdapterRouteDefinition.md)[]

#### Defined in

[examples/rest-contract-adapter-poc/src/counter-adapter.ts:50](https://github.com/imjlk/wp-typia/blob/main/examples/rest-contract-adapter-poc/src/counter-adapter.ts#L50)

___

### startCounterAdapterServer

▸ **startCounterAdapterServer**(`port?`): `Promise`\<[`CounterAdapterServer`](../interfaces/examples_rest_contract_adapter_poc_src_counter_adapter.CounterAdapterServer.md)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `port` | `number` | `0` |

#### Returns

`Promise`\<[`CounterAdapterServer`](../interfaces/examples_rest_contract_adapter_poc_src_counter_adapter.CounterAdapterServer.md)\>

#### Defined in

[examples/rest-contract-adapter-poc/src/counter-adapter.ts:224](https://github.com/imjlk/wp-typia/blob/main/examples/rest-contract-adapter-poc/src/counter-adapter.ts#L224)
