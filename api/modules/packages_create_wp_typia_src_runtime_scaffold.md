[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create-wp-typia/src/runtime/scaffold

# Module: packages/create-wp-typia/src/runtime/scaffold

## Table of contents

### Interfaces

- [ScaffoldAnswers](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldAnswers.md)
- [ScaffoldTemplateVariables](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldTemplateVariables.md)
- [ScaffoldProjectResult](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldProjectResult.md)

### Functions

- [detectAuthor](packages_create_wp_typia_src_runtime_scaffold.md#detectauthor)
- [getDefaultAnswers](packages_create_wp_typia_src_runtime_scaffold.md#getdefaultanswers)
- [resolveTemplateId](packages_create_wp_typia_src_runtime_scaffold.md#resolvetemplateid)
- [resolvePackageManagerId](packages_create_wp_typia_src_runtime_scaffold.md#resolvepackagemanagerid)
- [collectScaffoldAnswers](packages_create_wp_typia_src_runtime_scaffold.md#collectscaffoldanswers)
- [getTemplateVariables](packages_create_wp_typia_src_runtime_scaffold.md#gettemplatevariables)
- [scaffoldProject](packages_create_wp_typia_src_runtime_scaffold.md#scaffoldproject)

## Functions

### detectAuthor

▸ **detectAuthor**(): `string`

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:135](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L135)

___

### getDefaultAnswers

▸ **getDefaultAnswers**(`projectName`, `templateId`): [`ScaffoldAnswers`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldAnswers.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectName` | `string` |
| `templateId` | ``"basic"`` \| ``"full"`` \| ``"interactivity"`` \| ``"advanced"`` |

#### Returns

[`ScaffoldAnswers`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldAnswers.md)

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:148](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L148)

___

### resolveTemplateId

▸ **resolveTemplateId**(`«destructured»`): `Promise`\<[`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[``"id"``]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ResolveTemplateOptions` |

#### Returns

`Promise`\<[`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[``"id"``]\>

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:163](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L163)

___

### resolvePackageManagerId

▸ **resolvePackageManagerId**(`«destructured»`): `Promise`\<[`PackageManagerId`](packages_create_wp_typia_src_runtime_package_managers.md#packagemanagerid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ResolvePackageManagerOptions` |

#### Returns

`Promise`\<[`PackageManagerId`](packages_create_wp_typia_src_runtime_package_managers.md#packagemanagerid)\>

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:184](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L184)

___

### collectScaffoldAnswers

▸ **collectScaffoldAnswers**(`«destructured»`): `Promise`\<[`ScaffoldAnswers`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldAnswers.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CollectScaffoldAnswersOptions` |

#### Returns

`Promise`\<[`ScaffoldAnswers`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldAnswers.md)\>

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:209](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L209)

___

### getTemplateVariables

▸ **getTemplateVariables**(`templateId`, `answers`): [`ScaffoldTemplateVariables`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldTemplateVariables.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | ``"basic"`` \| ``"full"`` \| ``"interactivity"`` \| ``"advanced"`` |
| `answers` | [`ScaffoldAnswers`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldAnswers.md) |

#### Returns

[`ScaffoldTemplateVariables`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldTemplateVariables.md)

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:238](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L238)

___

### scaffoldProject

▸ **scaffoldProject**(`«destructured»`): `Promise`\<[`ScaffoldProjectResult`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldProjectResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ScaffoldProjectOptions` |

#### Returns

`Promise`\<[`ScaffoldProjectResult`](../interfaces/packages_create_wp_typia_src_runtime_scaffold.ScaffoldProjectResult.md)\>

#### Defined in

[packages/create-wp-typia/src/runtime/scaffold.ts:493](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/scaffold.ts#L493)
