[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/template-source

# Module: packages/create/src/runtime/template-source

## Table of contents

### Interfaces

- [TemplateVariableContext](../interfaces/packages_create_src_runtime_template_source.TemplateVariableContext.md)
- [ResolvedTemplateSource](../interfaces/packages_create_src_runtime_template_source.ResolvedTemplateSource.md)

### Functions

- [parseGitHubTemplateLocator](packages_create_src_runtime_template_source.md#parsegithubtemplatelocator)
- [parseTemplateLocator](packages_create_src_runtime_template_source.md#parsetemplatelocator)
- [resolveTemplateSource](packages_create_src_runtime_template_source.md#resolvetemplatesource)

## Functions

### parseGitHubTemplateLocator

▸ **parseGitHubTemplateLocator**(`templateId`): `GitHubTemplateLocator` \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`GitHubTemplateLocator` \| ``null``

#### Defined in

[packages/create/src/runtime/template-source.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L54)

___

### parseTemplateLocator

▸ **parseTemplateLocator**(`templateId`): `RemoteTemplateLocator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`RemoteTemplateLocator`

#### Defined in

[packages/create/src/runtime/template-source.ts:76](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L76)

___

### resolveTemplateSource

▸ **resolveTemplateSource**(`templateId`, `cwd`, `variables`): `Promise`\<[`ResolvedTemplateSource`](../interfaces/packages_create_src_runtime_template_source.ResolvedTemplateSource.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `cwd` | `string` |
| `variables` | `Object` |

#### Returns

`Promise`\<[`ResolvedTemplateSource`](../interfaces/packages_create_src_runtime_template_source.ResolvedTemplateSource.md)\>

#### Defined in

[packages/create/src/runtime/template-source.ts:417](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L417)
