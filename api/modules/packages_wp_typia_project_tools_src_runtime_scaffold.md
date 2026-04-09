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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:94](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L94)

___

### PersistencePolicy

Ƭ **PersistencePolicy**: typeof [`PERSISTENCE_POLICIES`](packages_wp_typia_project_tools_src_runtime_scaffold.md#persistence_policies)[`number`]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L96)

## Variables

### DATA\_STORAGE\_MODES

• `Const` **DATA\_STORAGE\_MODES**: readonly [``"post-meta"``, ``"custom-table"``]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:93](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L93)

___

### PERSISTENCE\_POLICIES

• `Const` **PERSISTENCE\_POLICIES**: readonly [``"authenticated"``, ``"public"``]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L95)

## Functions

### buildBlockCssClassName

▸ **buildBlockCssClassName**(`namespace`, `slug`): `string`

Builds the generated WordPress wrapper CSS class for a scaffolded block.

Returns `wp-block-{namespace}-{slug}` when a non-empty namespace is present,
or `wp-block-{slug}` when the namespace is empty or undefined. When the
normalized namespace equals the normalized slug, appends `-block` so the
generated class avoids repeated namespace segments without colliding with the
default core wrapper classes. Both inputs are normalized and validated with
the same scaffold identifier rules used for block names.

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `undefined` \| `string` |
| `slug` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:298](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L298)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:347](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L347)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:351](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L351)

___

### detectAuthor

▸ **detectAuthor**(): `string`

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:355](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L355)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:368](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L368)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:387](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L387)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:416](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L416)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:441](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L441)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:496](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L496)

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

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:1036](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L1036)
