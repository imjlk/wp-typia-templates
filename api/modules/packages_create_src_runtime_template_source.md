[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/template-source

# Module: packages/create/src/runtime/template-source

## Table of contents

### Interfaces

- [TemplateVariableContext](../interfaces/packages_create_src_runtime_template_source.TemplateVariableContext.md)
- [ResolvedTemplateSource](../interfaces/packages_create_src_runtime_template_source.ResolvedTemplateSource.md)

### Functions

- [parseGitHubTemplateLocator](packages_create_src_runtime_template_source.md#parsegithubtemplatelocator)
- [parseNpmTemplateLocator](packages_create_src_runtime_template_source.md#parsenpmtemplatelocator)
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

[packages/create/src/runtime/template-source.ts:228](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L228)

___

### parseNpmTemplateLocator

▸ **parseNpmTemplateLocator**(`templateId`): `NpmTemplateLocator` \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

`NpmTemplateLocator` \| ``null``

#### Defined in

[packages/create/src/runtime/template-source.ts:250](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L250)

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

[packages/create/src/runtime/template-source.ts:272](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L272)

___

### resolveTemplateSource

▸ **resolveTemplateSource**(`templateId`, `cwd`, `variables`, `variant?`): `Promise`\<[`ResolvedTemplateSource`](../interfaces/packages_create_src_runtime_template_source.ResolvedTemplateSource.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `cwd` | `string` |
| `variables` | `Object` |
| `variant?` | `string` |

#### Returns

`Promise`\<[`ResolvedTemplateSource`](../interfaces/packages_create_src_runtime_template_source.ResolvedTemplateSource.md)\>

#### Defined in

[packages/create/src/runtime/template-source.ts:876](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L876)
