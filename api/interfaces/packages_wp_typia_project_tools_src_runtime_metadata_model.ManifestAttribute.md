[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/metadata-model](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md) / ManifestAttribute

# Interface: ManifestAttribute

[packages/wp-typia-project-tools/src/runtime/metadata-model](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md).ManifestAttribute

## Table of contents

### Properties

- [typia](packages_wp_typia_project_tools_src_runtime_metadata_model.ManifestAttribute.md#typia)
- [ts](packages_wp_typia_project_tools_src_runtime_metadata_model.ManifestAttribute.md#ts)
- [wp](packages_wp_typia_project_tools_src_runtime_metadata_model.ManifestAttribute.md#wp)

## Properties

### typia

• **typia**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `constraints` | [`AttributeConstraints`](packages_wp_typia_project_tools_src_runtime_metadata_model.AttributeConstraints.md) |
| `defaultValue` | [`JsonValue`](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md#jsonvalue) |
| `hasDefault` | `boolean` |

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-model.ts:66](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-model.ts#L66)

___

### ts

• **ts**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `items` | ``null`` \| [`ManifestAttribute`](packages_wp_typia_project_tools_src_runtime_metadata_model.ManifestAttribute.md) |
| `kind` | [`AttributeKind`](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md#attributekind) |
| `properties` | ``null`` \| `Record`\<`string`, [`ManifestAttribute`](packages_wp_typia_project_tools_src_runtime_metadata_model.ManifestAttribute.md)\> |
| `required` | `boolean` |
| `union` | ``null`` \| [`ManifestUnion`](packages_wp_typia_project_tools_src_runtime_metadata_model.ManifestUnion.md) |

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-model.ts:71](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-model.ts#L71)

___

### wp

• **wp**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `defaultValue` | [`JsonValue`](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md#jsonvalue) |
| `enum` | ``null`` \| (`string` \| `number` \| `boolean`)[] |
| `hasDefault` | `boolean` |
| `selector?` | ``null`` \| `string` |
| `source?` | ``null`` \| [`WordPressAttributeSource`](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md#wordpressattributesource) |
| `type` | [`WordPressAttributeKind`](../modules/packages_wp_typia_project_tools_src_runtime_metadata_model.md#wordpressattributekind) |

#### Defined in

[packages/wp-typia-project-tools/src/runtime/metadata-model.ts:78](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/metadata-model.ts#L78)
