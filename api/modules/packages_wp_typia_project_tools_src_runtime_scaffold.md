[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/scaffold

# Module: packages/wp-typia-project-tools/src/runtime/scaffold

## Table of contents

### Interfaces

- [ScaffoldAnswers](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md)
- [ScaffoldTemplateVariables](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md)
- [ScaffoldProjectResult](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldProjectResult.md)

### Type Aliases

- [DataStorageMode](packages_wp_typia_project_tools_src_runtime_scaffold.md#datastoragemode)
- [PersistencePolicy](packages_wp_typia_project_tools_src_runtime_scaffold.md#persistencepolicy)

### Variables

- [DATA\_STORAGE\_MODES](packages_wp_typia_project_tools_src_runtime_scaffold.md#data_storage_modes)
- [PERSISTENCE\_POLICIES](packages_wp_typia_project_tools_src_runtime_scaffold.md#persistence_policies)

### Functions

- [buildBlockCssClassName](packages_wp_typia_project_tools_src_runtime_scaffold.md#buildblockcssclassname)
- [isDataStorageMode](packages_wp_typia_project_tools_src_runtime_scaffold.md#isdatastoragemode)
- [isPersistencePolicy](packages_wp_typia_project_tools_src_runtime_scaffold.md#ispersistencepolicy)
- [detectAuthor](packages_wp_typia_project_tools_src_runtime_scaffold.md#detectauthor)
- [getDefaultAnswers](packages_wp_typia_project_tools_src_runtime_scaffold.md#getdefaultanswers)
- [resolveTemplateId](packages_wp_typia_project_tools_src_runtime_scaffold.md#resolvetemplateid)
- [resolvePackageManagerId](packages_wp_typia_project_tools_src_runtime_scaffold.md#resolvepackagemanagerid)
- [collectScaffoldAnswers](packages_wp_typia_project_tools_src_runtime_scaffold.md#collectscaffoldanswers)
- [getTemplateVariables](packages_wp_typia_project_tools_src_runtime_scaffold.md#gettemplatevariables)
- [scaffoldProject](packages_wp_typia_project_tools_src_runtime_scaffold.md#scaffoldproject)

## Type Aliases

### DataStorageMode

Ƭ **DataStorageMode**: typeof [`DATA_STORAGE_MODES`](packages_wp_typia_project_tools_src_runtime_scaffold.md#data_storage_modes)[`number`]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L87)

___

### PersistencePolicy

Ƭ **PersistencePolicy**: typeof [`PERSISTENCE_POLICIES`](packages_wp_typia_project_tools_src_runtime_scaffold.md#persistence_policies)[`number`]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:89](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L89)

## Variables

### DATA\_STORAGE\_MODES

• `Const` **DATA\_STORAGE\_MODES**: readonly [``"post-meta"``, ``"custom-table"``]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:86](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L86)

___

### PERSISTENCE\_POLICIES

• `Const` **PERSISTENCE\_POLICIES**: readonly [``"authenticated"``, ``"public"``]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:88](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L88)

## Functions

### buildBlockCssClassName

▸ **buildBlockCssClassName**(`namespace`, `slug`): `string`

Builds the generated WordPress wrapper CSS class for a scaffolded block.

Returns `wp-block-{namespace}-{slug}` when a non-empty namespace is present,
or `wp-block-{slug}` when the namespace is empty or undefined. Both inputs
are normalized and validated with the same scaffold identifier rules used for
block names.

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `undefined` \| `string` |
| `slug` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:279](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L279)

___

### isDataStorageMode

▸ **isDataStorageMode**(`value`): value is "post-meta" \| "custom-table"

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

value is "post-meta" \| "custom-table"

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:324](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L324)

___

### isPersistencePolicy

▸ **isPersistencePolicy**(`value`): value is "public" \| "authenticated"

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

value is "public" \| "authenticated"

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:328](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L328)

___

### detectAuthor

▸ **detectAuthor**(): `string`

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:332](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L332)

___

### getDefaultAnswers

▸ **getDefaultAnswers**(`projectName`, `templateId`): [`ScaffoldAnswers`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectName` | `string` |
| `templateId` | `string` |

#### Returns

[`ScaffoldAnswers`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:345](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L345)

___

### resolveTemplateId

▸ **resolveTemplateId**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ResolveTemplateOptions` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:364](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L364)

___

### resolvePackageManagerId

▸ **resolvePackageManagerId**(`«destructured»`): `Promise`\<[`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ResolvePackageManagerOptions` |

#### Returns

`Promise`\<[`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid)\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:393](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L393)

___

### collectScaffoldAnswers

▸ **collectScaffoldAnswers**(`«destructured»`): `Promise`\<[`ScaffoldAnswers`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CollectScaffoldAnswersOptions` |

#### Returns

`Promise`\<[`ScaffoldAnswers`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md)\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:418](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L418)

___

### getTemplateVariables

▸ **getTemplateVariables**(`templateId`, `answers`): [`ScaffoldTemplateVariables`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `answers` | [`ScaffoldAnswers`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md) |

#### Returns

[`ScaffoldTemplateVariables`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:473](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L473)

___

### scaffoldProject

▸ **scaffoldProject**(`«destructured»`): `Promise`\<[`ScaffoldProjectResult`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldProjectResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ScaffoldProjectOptions` |

#### Returns

`Promise`\<[`ScaffoldProjectResult`](../interfaces/packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldProjectResult.md)\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:896](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L896)
