[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/internal/typia-llm

# Module: packages/wp-typia-project-tools/src/internal/typia-llm

## Table of contents

### Interfaces

- [TypiaLlmEndpointMethodDescriptor](../interfaces/packages_wp_typia_project_tools_src_internal_typia_llm.TypiaLlmEndpointMethodDescriptor.md)
- [RenderTypiaLlmModuleOptions](../interfaces/packages_wp_typia_project_tools_src_internal_typia_llm.RenderTypiaLlmModuleOptions.md)

### Functions

- [buildTypiaLlmEndpointMethodDescriptors](packages_wp_typia_project_tools_src_internal_typia_llm.md#buildtypiallmendpointmethoddescriptors)
- [renderTypiaLlmModule](packages_wp_typia_project_tools_src_internal_typia_llm.md#rendertypiallmmodule)

## Functions

### buildTypiaLlmEndpointMethodDescriptors

▸ **buildTypiaLlmEndpointMethodDescriptors**(`manifest`): [`TypiaLlmEndpointMethodDescriptor`](../interfaces/packages_wp_typia_project_tools_src_internal_typia_llm.TypiaLlmEndpointMethodDescriptor.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[]\> |

#### Returns

[`TypiaLlmEndpointMethodDescriptor`](../interfaces/packages_wp_typia_project_tools_src_internal_typia_llm.TypiaLlmEndpointMethodDescriptor.md)[]

#### Defined in

[packages/wp-typia-project-tools/src/internal/typia-llm.ts:113](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/internal/typia-llm.ts#L113)

___

### renderTypiaLlmModule

▸ **renderTypiaLlmModule**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`RenderTypiaLlmModuleOptions`](../interfaces/packages_wp_typia_project_tools_src_internal_typia_llm.RenderTypiaLlmModuleOptions.md) |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/internal/typia-llm.ts:138](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/internal/typia-llm.ts#L138)
