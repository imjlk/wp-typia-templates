[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/metadata-parser

# Module: packages/wp-typia-project-tools/src/runtime/metadata-parser

## Table of contents

### Functions

- [analyzeSourceType](packages_wp_typia_project_tools_src_runtime_metadata_parser.md#analyzesourcetype)
- [analyzeSourceTypes](packages_wp_typia_project_tools_src_runtime_metadata_parser.md#analyzesourcetypes)
- [parseNamedDeclaration](packages_wp_typia_project_tools_src_runtime_metadata_parser.md#parsenameddeclaration)
- [parseTypeNode](packages_wp_typia_project_tools_src_runtime_metadata_parser.md#parsetypenode)

## Functions

### analyzeSourceType

▸ **analyzeSourceType**(`options`): `Object`

Analyze one named source type from a TypeScript module.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `Object` | Metadata analysis options including the project root, source type name, and types file path. |
| `options.projectRoot?` | `string` | - |
| `options.sourceTypeName` | `string` | - |
| `options.typesFile` | `string` | - |

#### Returns

`Object`

The resolved project root plus the parsed root attribute node for
the requested source type.

| Name | Type |
| :------ | :------ |
| `projectRoot` | `string` |
| `rootNode` | [`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md) |

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-parser.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-parser.ts#L48)

___

### analyzeSourceTypes

▸ **analyzeSourceTypes**(`options`, `sourceTypeNames`): `Record`\<`string`, [`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md)\>

Analyze multiple named source types from a TypeScript module.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `Object` | Metadata analysis options including the optional project root and the relative types file path to parse. |
| `options.projectRoot?` | `string` | - |
| `options.typesFile` | `string` | - |
| `sourceTypeNames` | `string`[] | Exported type or interface names to resolve from the configured types file. |

#### Returns

`Record`\<`string`, [`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md)\>

A record keyed by source type name with parsed attribute-node trees
for each requested type.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-parser.ts:80](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-parser.ts#L80)

___

### parseNamedDeclaration

▸ **parseNamedDeclaration**(`declaration`, `ctx`, `pathLabel`, `required`): [`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md)

Parse an interface or type alias declaration into one attribute-node tree.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `declaration` | `InterfaceDeclaration` \| `TypeAliasDeclaration` | TypeScript declaration node to parse. |
| `ctx` | [`AnalysisContext`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_analysis.AnalysisContext.md) | Shared analysis context used for type resolution and recursion detection. |
| `pathLabel` | `string` | Human-readable path label for diagnostics. |
| `required` | `boolean` | Whether the resulting node should be marked as required. |

#### Returns

[`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md)

The parsed attribute-node representation for the declaration.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-parser.ts:138](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-parser.ts#L138)

___

### parseTypeNode

▸ **parseTypeNode**(`node`, `ctx`, `pathLabel`): [`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md)

Parse one TypeScript type node into the internal metadata model.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | `TypeNode` | TypeScript AST node describing the source type shape. |
| `ctx` | [`AnalysisContext`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_analysis.AnalysisContext.md) | Shared analysis context used for symbol and type resolution. |
| `pathLabel` | `string` | Human-readable path label used in parse errors and warnings. |

#### Returns

[`AttributeNode`](../interfaces/packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeNode.md)

The parsed attribute-node representation of the provided type node.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-parser.ts:228](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-parser.ts#L228)
