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
- [BUILTIN\_TEMPLATE\_IDS](packages_create_src_runtime_template_registry.md#builtin_template_ids)
- [TEMPLATE\_REGISTRY](packages_create_src_runtime_template_registry.md#template_registry)
- [TEMPLATE\_IDS](packages_create_src_runtime_template_registry.md#template_ids)

### Functions

- [resolvePackageRoot](packages_create_src_runtime_template_registry.md#resolvepackageroot)
- [isBuiltInTemplateId](packages_create_src_runtime_template_registry.md#isbuiltintemplateid)
- [listTemplates](packages_create_src_runtime_template_registry.md#listtemplates)
- [getTemplateById](packages_create_src_runtime_template_registry.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_create_src_runtime_template_registry.md#gettemplateselectoptions)

## Type Aliases

### BuiltInTemplateId

Ƭ **BuiltInTemplateId**: typeof [`BUILTIN_TEMPLATE_IDS`](packages_create_src_runtime_template_registry.md#builtin_template_ids)[`number`]

#### Defined in

[packages/create/src/runtime/template-registry.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L34)

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

### BUILTIN\_TEMPLATE\_IDS

• `Const` **BUILTIN\_TEMPLATE\_IDS**: readonly [``"basic"``, ``"interactivity"``]

#### Defined in

[packages/create/src/runtime/template-registry.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L33)

___

### TEMPLATE\_REGISTRY

• `Const` **TEMPLATE\_REGISTRY**: readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L44)

___

### TEMPLATE\_IDS

• `Const` **TEMPLATE\_IDS**: (``"basic"`` \| ``"interactivity"``)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:61](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L61)

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

[packages/create/src/runtime/template-registry.ts:63](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L63)

___

### listTemplates

▸ **listTemplates**(): readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Returns

readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:67](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L67)

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

[packages/create/src/runtime/template-registry.ts:71](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L71)

___

### getTemplateSelectOptions

▸ **getTemplateSelectOptions**(): \{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Returns

\{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:79](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L79)
