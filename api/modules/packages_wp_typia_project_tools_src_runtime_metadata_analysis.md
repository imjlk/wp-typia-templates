[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/metadata-analysis

# Module: packages/wp-typia-project-tools/src/runtime/metadata-analysis

## Table of contents

### Interfaces

- [AnalysisContext](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_analysis.AnalysisContext.md)

### Functions

- [getTaggedSyncBlockMetadataFailureCode](packages_wp_typia_project_tools_src_runtime_metadata_analysis.md#gettaggedsyncblockmetadatafailurecode)
- [createAnalysisContext](packages_wp_typia_project_tools_src_runtime_metadata_analysis.md#createanalysiscontext)

## Functions

### getTaggedSyncBlockMetadataFailureCode

▸ **getTaggedSyncBlockMetadataFailureCode**(`error`): ``"typescript-diagnostic"`` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |

#### Returns

``"typescript-diagnostic"`` \| `undefined`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-analysis.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-analysis.ts#L87)

___

### createAnalysisContext

▸ **createAnalysisContext**(`projectRoot`, `typesFilePath`): [`AnalysisContext`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_analysis.AnalysisContext.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectRoot` | `string` |
| `typesFilePath` | `string` |

#### Returns

[`AnalysisContext`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_analysis.AnalysisContext.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-analysis.ts:366](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-analysis.ts#L366)
