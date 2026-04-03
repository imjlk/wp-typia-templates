[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/internal/typia-llm

# Module: packages/create/src/internal/typia-llm

## Table of contents

### Interfaces

- [TypiaLlmEndpointMethodDescriptor](../interfaces/packages_create_src_internal_typia_llm.TypiaLlmEndpointMethodDescriptor.md)
- [RenderTypiaLlmModuleOptions](../interfaces/packages_create_src_internal_typia_llm.RenderTypiaLlmModuleOptions.md)

### Functions

- [buildTypiaLlmEndpointMethodDescriptors](packages_create_src_internal_typia_llm.md#buildtypiallmendpointmethoddescriptors)
- [renderTypiaLlmModule](packages_create_src_internal_typia_llm.md#rendertypiallmmodule)

## Functions

### buildTypiaLlmEndpointMethodDescriptors

▸ **buildTypiaLlmEndpointMethodDescriptors**(`manifest`): [`TypiaLlmEndpointMethodDescriptor`](../interfaces/packages_create_src_internal_typia_llm.TypiaLlmEndpointMethodDescriptor.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointManifestEndpointDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)[]\> |

#### Returns

[`TypiaLlmEndpointMethodDescriptor`](../interfaces/packages_create_src_internal_typia_llm.TypiaLlmEndpointMethodDescriptor.md)[]

#### Defined in

[packages/create/src/internal/typia-llm.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/internal/typia-llm.ts#L97)

___

### renderTypiaLlmModule

▸ **renderTypiaLlmModule**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`RenderTypiaLlmModuleOptions`](../interfaces/packages_create_src_internal_typia_llm.RenderTypiaLlmModuleOptions.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/internal/typia-llm.ts:112](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/internal/typia-llm.ts#L112)
