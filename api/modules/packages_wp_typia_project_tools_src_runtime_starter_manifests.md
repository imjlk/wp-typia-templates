[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/starter-manifests

# Module: packages/wp-typia-project-tools/src/runtime/starter-manifests

## Table of contents

### Functions

- [buildCompoundChildStarterManifestDocument](packages_wp_typia_project_tools_src_runtime_starter_manifests.md#buildcompoundchildstartermanifestdocument)
- [getStarterManifestFiles](packages_wp_typia_project_tools_src_runtime_starter_manifests.md#getstartermanifestfiles)
- [stringifyStarterManifest](packages_wp_typia_project_tools_src_runtime_starter_manifests.md#stringifystartermanifest)

## Functions

### buildCompoundChildStarterManifestDocument

▸ **buildCompoundChildStarterManifestDocument**(`childTypeName`, `childTitle`, `bodyPlaceholder?`): [`ManifestDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ManifestDocument.md)

Builds the starter manifest used by generated compound child blocks.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `childTypeName` | `string` | `undefined` |
| `childTitle` | `string` | `undefined` |
| `bodyPlaceholder` | `string` | `DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER` |

#### Returns

[`ManifestDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ManifestDocument.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/starter-manifests.ts:371](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/starter-manifests.ts#L371)

___

### getStarterManifestFiles

▸ **getStarterManifestFiles**(`templateId`, `variables`): \{ `document`: [`ManifestDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ManifestDocument.md) ; `relativePath`: `string`  }[]

Returns the starter manifest files that should be seeded for a built-in
template before the first sync.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `variables` | [`ScaffoldTemplateVariables`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md) |

#### Returns

\{ `document`: [`ManifestDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ManifestDocument.md) ; `relativePath`: `string`  }[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/starter-manifests.ts:404](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/starter-manifests.ts#L404)

___

### stringifyStarterManifest

▸ **stringifyStarterManifest**(`document`): `string`

Serializes a starter manifest using the generated-project JSON formatting
convention.

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`ManifestDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ManifestDocument.md) |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/starter-manifests.ts:458](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/starter-manifests.ts#L458)
