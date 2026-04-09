[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/persistence-examples/src/blocks/counter/data

# Module: examples/persistence-examples/src/blocks/counter/data

## Table of contents

### Interfaces

- [UseIncrementCounterMutationOptions](../interfaces/examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md)

### Type Aliases

- [UsePersistenceCounterQueryOptions](examples_persistence_examples_src_blocks_counter_data.md#usepersistencecounterqueryoptions)
- [UsePersistenceCounterBootstrapQueryOptions](examples_persistence_examples_src_blocks_counter_data.md#usepersistencecounterbootstrapqueryoptions)

### Functions

- [usePersistenceCounterQuery](examples_persistence_examples_src_blocks_counter_data.md#usepersistencecounterquery)
- [usePersistenceCounterBootstrapQuery](examples_persistence_examples_src_blocks_counter_data.md#usepersistencecounterbootstrapquery)
- [useIncrementCounterMutation](examples_persistence_examples_src_blocks_counter_data.md#useincrementcountermutation)

## Type Aliases

### UsePersistenceCounterQueryOptions

Ƭ **UsePersistenceCounterQueryOptions**\<`Selected`\>: [`UseEndpointQueryOptions`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md)\<[`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md), `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md) |

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L26)

___

### UsePersistenceCounterBootstrapQueryOptions

Ƭ **UsePersistenceCounterBootstrapQueryOptions**\<`Selected`\>: [`UseEndpointQueryOptions`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryOptions.md)\<[`PersistenceCounterBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapQuery.md), [`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md), `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md) |

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:34](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L34)

## Functions

### usePersistenceCounterQuery

▸ **usePersistenceCounterQuery**\<`Selected`\>(`request`, `options?`): [`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md), `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterQuery.md) |
| `options` | [`UsePersistenceCounterQueryOptions`](examples_persistence_examples_src_blocks_counter_data.md#usepersistencecounterqueryoptions)\<`Selected`\> |

#### Returns

[`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md), `Selected`\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:63](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L63)

___

### usePersistenceCounterBootstrapQuery

▸ **usePersistenceCounterBootstrapQuery**\<`Selected`\>(`request`, `options?`): [`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md), `Selected`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Selected` | [`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`PersistenceCounterBootstrapQuery`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapQuery.md) |
| `options` | [`UsePersistenceCounterBootstrapQueryOptions`](examples_persistence_examples_src_blocks_counter_data.md#usepersistencecounterbootstrapqueryoptions)\<`Selected`\> |

#### Returns

[`UseEndpointQueryResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointQueryResult.md)\<[`PersistenceCounterBootstrapResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterBootstrapResponse.md), `Selected`\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:72](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L72)

___

### useIncrementCounterMutation

▸ **useIncrementCounterMutation**\<`Context`\>(`options?`): [`UseEndpointMutationResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`UseIncrementCounterMutationOptions`](../interfaces/examples_persistence_examples_src_blocks_counter_data.UseIncrementCounterMutationOptions.md)\<`Context`\> |

#### Returns

[`UseEndpointMutationResult`](../interfaces/packages_wp_typia_rest_src_react.UseEndpointMutationResult.md)\<[`PersistenceCounterIncrementRequest`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md), [`PersistenceCounterResponse`](../interfaces/examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterResponse.md)\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/data.ts:81](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/data.ts#L81)
