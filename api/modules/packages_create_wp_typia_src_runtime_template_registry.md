[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create-wp-typia/src/runtime/template-registry

# Module: packages/create-wp-typia/src/runtime/template-registry

## Table of contents

### Interfaces

- [TemplateDefinition](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)

### Variables

- [TEMPLATE\_REGISTRY](packages_create_wp_typia_src_runtime_template_registry.md#template_registry)
- [TEMPLATE\_IDS](packages_create_wp_typia_src_runtime_template_registry.md#template_ids)

### Functions

- [listTemplates](packages_create_wp_typia_src_runtime_template_registry.md#listtemplates)
- [getTemplateById](packages_create_wp_typia_src_runtime_template_registry.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_create_wp_typia_src_runtime_template_registry.md#gettemplateselectoptions)

## Variables

### TEMPLATE\_REGISTRY

• `Const` **TEMPLATE\_REGISTRY**: readonly [`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create-wp-typia/src/runtime/template-registry.ts:41](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/template-registry.ts#L41)

___

### TEMPLATE\_IDS

• `Const` **TEMPLATE\_IDS**: (``"basic"`` \| ``"full"`` \| ``"interactivity"`` \| ``"advanced"``)[]

#### Defined in

[packages/create-wp-typia/src/runtime/template-registry.ts:72](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/template-registry.ts#L72)

## Functions

### listTemplates

▸ **listTemplates**(): readonly [`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[]

#### Returns

readonly [`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create-wp-typia/src/runtime/template-registry.ts:74](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/template-registry.ts#L74)

___

### getTemplateById

▸ **getTemplateById**(`templateId`): [`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

[`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)

#### Defined in

[packages/create-wp-typia/src/runtime/template-registry.ts:78](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/template-registry.ts#L78)

___

### getTemplateSelectOptions

▸ **getTemplateSelectOptions**(): \{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Returns

\{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_wp_typia_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Defined in

[packages/create-wp-typia/src/runtime/template-registry.ts:86](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/template-registry.ts#L86)
