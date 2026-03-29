[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/scaffold

# Module: packages/create/src/runtime/scaffold

## Table of contents

### Interfaces

- [ScaffoldAnswers](../interfaces/packages_create_src_runtime_scaffold.ScaffoldAnswers.md)
- [ScaffoldTemplateVariables](../interfaces/packages_create_src_runtime_scaffold.ScaffoldTemplateVariables.md)
- [ScaffoldProjectResult](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md)

### Functions

- [detectAuthor](packages_create_src_runtime_scaffold.md#detectauthor)
- [getDefaultAnswers](packages_create_src_runtime_scaffold.md#getdefaultanswers)
- [resolveTemplateId](packages_create_src_runtime_scaffold.md#resolvetemplateid)
- [resolvePackageManagerId](packages_create_src_runtime_scaffold.md#resolvepackagemanagerid)
- [collectScaffoldAnswers](packages_create_src_runtime_scaffold.md#collectscaffoldanswers)
- [getTemplateVariables](packages_create_src_runtime_scaffold.md#gettemplatevariables)
- [scaffoldProject](packages_create_src_runtime_scaffold.md#scaffoldproject)

## Functions

### detectAuthor

▸ **detectAuthor**(): `string`

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:140](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L140)

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

[packages/create/src/runtime/scaffold.ts:153](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L153)

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

[packages/create/src/runtime/scaffold.ts:168](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L168)

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

[packages/create/src/runtime/scaffold.ts:194](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L194)

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

[packages/create/src/runtime/scaffold.ts:219](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L219)

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

[packages/create/src/runtime/scaffold.ts:248](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L248)

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

[packages/create/src/runtime/scaffold.ts:507](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L507)
