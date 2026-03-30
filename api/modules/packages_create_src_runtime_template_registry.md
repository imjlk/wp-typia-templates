[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/template-registry

# Module: packages/create/src/runtime/template-registry

## Table of contents

### Interfaces

- [TemplateDefinition](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)

### Type Aliases

- [BuiltInTemplateId](packages_create_src_runtime_template_registry.md#builtintemplateid)

### Variables

- [CREATE\_PACKAGE\_ROOT](packages_create_src_runtime_template_registry.md#create_package_root)
- [TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#template_root)
- [SHARED\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_template_root)
- [SHARED\_BASE\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_base_template_root)
- [BUILTIN\_TEMPLATE\_IDS](packages_create_src_runtime_template_registry.md#builtin_template_ids)
- [TEMPLATE\_REGISTRY](packages_create_src_runtime_template_registry.md#template_registry)
- [TEMPLATE\_IDS](packages_create_src_runtime_template_registry.md#template_ids)

### Functions

- [resolvePackageRoot](packages_create_src_runtime_template_registry.md#resolvepackageroot)
- [isBuiltInTemplateId](packages_create_src_runtime_template_registry.md#isbuiltintemplateid)
- [listTemplates](packages_create_src_runtime_template_registry.md#listtemplates)
- [getTemplateById](packages_create_src_runtime_template_registry.md#gettemplatebyid)
- [getTemplateLayerDirs](packages_create_src_runtime_template_registry.md#gettemplatelayerdirs)
- [getTemplateSelectOptions](packages_create_src_runtime_template_registry.md#gettemplateselectoptions)

## Type Aliases

### BuiltInTemplateId

Ƭ **BuiltInTemplateId**: typeof [`BUILTIN_TEMPLATE_IDS`](packages_create_src_runtime_template_registry.md#builtin_template_ids)[`number`]

#### Defined in

[packages/create/src/runtime/template-registry.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L36)

## Variables

### CREATE\_PACKAGE\_ROOT

• `Const` **CREATE\_PACKAGE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L31)

___

### TEMPLATE\_ROOT

• `Const` **TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L32)

___

### SHARED\_TEMPLATE\_ROOT

• `Const` **SHARED\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L33)

___

### SHARED\_BASE\_TEMPLATE\_ROOT

• `Const` **SHARED\_BASE\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L34)

___

### BUILTIN\_TEMPLATE\_IDS

• `Const` **BUILTIN\_TEMPLATE\_IDS**: readonly [``"basic"``, ``"interactivity"``]

#### Defined in

[packages/create/src/runtime/template-registry.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L35)

___

### TEMPLATE\_REGISTRY

• `Const` **TEMPLATE\_REGISTRY**: readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L46)

___

### TEMPLATE\_IDS

• `Const` **TEMPLATE\_IDS**: (``"basic"`` \| ``"interactivity"``)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:63](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L63)

## Functions

### resolvePackageRoot

▸ **resolvePackageRoot**(`startDir`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `startDir` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:7](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L7)

___

### isBuiltInTemplateId

▸ **isBuiltInTemplateId**(`templateId`): templateId is "basic" \| "interactivity"

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

templateId is "basic" \| "interactivity"

#### Defined in

[packages/create/src/runtime/template-registry.ts:65](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L65)

___

### listTemplates

▸ **listTemplates**(): readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Returns

readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:69](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L69)

___

### getTemplateById

▸ **getTemplateById**(`templateId`): [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

[`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)

#### Defined in

[packages/create/src/runtime/template-registry.ts:73](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L73)

___

### getTemplateLayerDirs

▸ **getTemplateLayerDirs**(`templateId`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | ``"basic"`` \| ``"interactivity"`` |

#### Returns

`string`[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:81](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L81)

___

### getTemplateSelectOptions

▸ **getTemplateSelectOptions**(): \{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Returns

\{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L85)
