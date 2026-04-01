[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/scaffold

# Module: packages/create/src/runtime/scaffold

## Table of contents

### Interfaces

- [ScaffoldAnswers](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md)
- [ScaffoldTemplateVariables](../interfaces/packages_create_src_runtime_scaffold.ScaffoldTemplateVariables.md)
- [ScaffoldProjectResult](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md)

### Type Aliases

- [DataStorageMode](packages_create_src_runtime_scaffold.md#datastoragemode)
- [PersistencePolicy](packages_create_src_runtime_scaffold.md#persistencepolicy)

### Variables

- [DATA\_STORAGE\_MODES](packages_create_src_runtime_scaffold.md#data_storage_modes)
- [PERSISTENCE\_POLICIES](packages_create_src_runtime_scaffold.md#persistence_policies)

### Functions

- [isDataStorageMode](packages_create_src_runtime_scaffold.md#isdatastoragemode)
- [isPersistencePolicy](packages_create_src_runtime_scaffold.md#ispersistencepolicy)
- [detectAuthor](packages_create_src_runtime_scaffold.md#detectauthor)
- [getDefaultAnswers](packages_create_src_runtime_scaffold.md#getdefaultanswers)
- [resolveTemplateId](packages_create_src_runtime_scaffold.md#resolvetemplateid)
- [resolvePackageManagerId](packages_create_src_runtime_scaffold.md#resolvepackagemanagerid)
- [collectScaffoldAnswers](packages_create_src_runtime_scaffold.md#collectscaffoldanswers)
- [getTemplateVariables](packages_create_src_runtime_scaffold.md#gettemplatevariables)
- [scaffoldProject](packages_create_src_runtime_scaffold.md#scaffoldproject)

## Type Aliases

### DataStorageMode

Ƭ **DataStorageMode**: typeof [`DATA_STORAGE_MODES`](packages_create_src_runtime_scaffold.md#data_storage_modes)[`number`]

#### Defined in

[packages/create/src/runtime/scaffold.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L40)

___

### PersistencePolicy

Ƭ **PersistencePolicy**: typeof [`PERSISTENCE_POLICIES`](packages_create_src_runtime_scaffold.md#persistence_policies)[`number`]

#### Defined in

[packages/create/src/runtime/scaffold.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L42)

## Variables

### DATA\_STORAGE\_MODES

• `Const` **DATA\_STORAGE\_MODES**: readonly [``"post-meta"``, ``"custom-table"``]

#### Defined in

[packages/create/src/runtime/scaffold.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L39)

___

### PERSISTENCE\_POLICIES

• `Const` **PERSISTENCE\_POLICIES**: readonly [``"authenticated"``, ``"public"``]

#### Defined in

[packages/create/src/runtime/scaffold.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L41)

## Functions

### isDataStorageMode

▸ **isDataStorageMode**(`value`): value is "post-meta" \| "custom-table"

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

value is "post-meta" \| "custom-table"

#### Defined in

[packages/create/src/runtime/scaffold.ts:163](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L163)

___

### isPersistencePolicy

▸ **isPersistencePolicy**(`value`): value is "authenticated" \| "public"

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

value is "authenticated" \| "public"

#### Defined in

[packages/create/src/runtime/scaffold.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L167)

___

### detectAuthor

▸ **detectAuthor**(): `string`

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:171](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L171)

___

### getDefaultAnswers

▸ **getDefaultAnswers**(`projectName`, `templateId`): [`ScaffoldAnswers`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectName` | `string` |
| `templateId` | `string` |

#### Returns

[`ScaffoldAnswers`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md)

#### Defined in

[packages/create/src/runtime/scaffold.ts:184](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L184)

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

[packages/create/src/runtime/scaffold.ts:201](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L201)

___

### resolvePackageManagerId

▸ **resolvePackageManagerId**(`«destructured»`): `Promise`\<[`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ResolvePackageManagerOptions` |

#### Returns

`Promise`\<[`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid)\>

#### Defined in

[packages/create/src/runtime/scaffold.ts:234](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L234)

___

### collectScaffoldAnswers

▸ **collectScaffoldAnswers**(`«destructured»`): `Promise`\<[`ScaffoldAnswers`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CollectScaffoldAnswersOptions` |

#### Returns

`Promise`\<[`ScaffoldAnswers`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md)\>

#### Defined in

[packages/create/src/runtime/scaffold.ts:259](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L259)

___

### getTemplateVariables

▸ **getTemplateVariables**(`templateId`, `answers`): [`ScaffoldTemplateVariables`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldTemplateVariables.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `answers` | [`ScaffoldAnswers`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md) |

#### Returns

[`ScaffoldTemplateVariables`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldTemplateVariables.md)

#### Defined in

[packages/create/src/runtime/scaffold.ts:296](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L296)

___

### scaffoldProject

▸ **scaffoldProject**(`«destructured»`): `Promise`\<[`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ScaffoldProjectOptions` |

#### Returns

`Promise`\<[`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md)\>

#### Defined in

[packages/create/src/runtime/scaffold.ts:546](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L546)
