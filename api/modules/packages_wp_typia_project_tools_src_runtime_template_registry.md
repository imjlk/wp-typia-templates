[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/template-registry

# Module: packages/wp-typia-project-tools/src/runtime/template-registry

## Table of contents

### Interfaces

- [TemplateDefinition](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)

### Type Aliases

- [BuiltInTemplateId](packages_wp_typia_project_tools_src_runtime_template_registry.md#builtintemplateid)
- [PersistencePolicy](packages_wp_typia_project_tools_src_runtime_template_registry.md#persistencepolicy)

### Variables

- [PROJECT\_TOOLS\_PACKAGE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#project_tools_package_root)
- [TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#template_root)
- [SHARED\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_template_root)
- [SHARED\_BASE\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_base_template_root)
- [SHARED\_COMPOUND\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_compound_template_root)
- [SHARED\_PERSISTENCE\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_persistence_template_root)
- [SHARED\_PRESET\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_preset_template_root)
- [SHARED\_REST\_HELPER\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_rest_helper_template_root)
- [SHARED\_MIGRATION\_UI\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_migration_ui_template_root)
- [SHARED\_WORKSPACE\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_workspace_template_root)
- [SHARED\_TEST\_PRESET\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_test_preset_template_root)
- [SHARED\_WP\_ENV\_PRESET\_TEMPLATE\_ROOT](packages_wp_typia_project_tools_src_runtime_template_registry.md#shared_wp_env_preset_template_root)
- [BUILTIN\_TEMPLATE\_IDS](packages_wp_typia_project_tools_src_runtime_template_registry.md#builtin_template_ids)
- [TEMPLATE\_REGISTRY](packages_wp_typia_project_tools_src_runtime_template_registry.md#template_registry)
- [TEMPLATE\_IDS](packages_wp_typia_project_tools_src_runtime_template_registry.md#template_ids)

### Functions

- [resolvePackageRoot](packages_wp_typia_project_tools_src_runtime_template_registry.md#resolvepackageroot)
- [isBuiltInTemplateId](packages_wp_typia_project_tools_src_runtime_template_registry.md#isbuiltintemplateid)
- [listTemplates](packages_wp_typia_project_tools_src_runtime_template_registry.md#listtemplates)
- [getTemplateById](packages_wp_typia_project_tools_src_runtime_template_registry.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_wp_typia_project_tools_src_runtime_template_registry.md#gettemplateselectoptions)

## Type Aliases

### BuiltInTemplateId

Ƭ **BuiltInTemplateId**: typeof [`BUILTIN_TEMPLATE_IDS`](packages_wp_typia_project_tools_src_runtime_template_registry.md#builtin_template_ids)[`number`]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L49)

___

### PersistencePolicy

Ƭ **PersistencePolicy**: ``"authenticated"`` \| ``"public"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L50)

## Variables

### PROJECT\_TOOLS\_PACKAGE\_ROOT

• `Const` **PROJECT\_TOOLS\_PACKAGE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L33)

___

### TEMPLATE\_ROOT

• `Const` **TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L34)

___

### SHARED\_TEMPLATE\_ROOT

• `Const` **SHARED\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L35)

___

### SHARED\_BASE\_TEMPLATE\_ROOT

• `Const` **SHARED\_BASE\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L36)

___

### SHARED\_COMPOUND\_TEMPLATE\_ROOT

• `Const` **SHARED\_COMPOUND\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L37)

___

### SHARED\_PERSISTENCE\_TEMPLATE\_ROOT

• `Const` **SHARED\_PERSISTENCE\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L38)

___

### SHARED\_PRESET\_TEMPLATE\_ROOT

• `Const` **SHARED\_PRESET\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L39)

___

### SHARED\_REST\_HELPER\_TEMPLATE\_ROOT

• `Const` **SHARED\_REST\_HELPER\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L40)

___

### SHARED\_MIGRATION\_UI\_TEMPLATE\_ROOT

• `Const` **SHARED\_MIGRATION\_UI\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L41)

___

### SHARED\_WORKSPACE\_TEMPLATE\_ROOT

• `Const` **SHARED\_WORKSPACE\_TEMPLATE\_ROOT**: `string`

Shared workspace template overlay root used by workspace scaffolding flows.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L45)

___

### SHARED\_TEST\_PRESET\_TEMPLATE\_ROOT

• `Const` **SHARED\_TEST\_PRESET\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L46)

___

### SHARED\_WP\_ENV\_PRESET\_TEMPLATE\_ROOT

• `Const` **SHARED\_WP\_ENV\_PRESET\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:47](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L47)

___

### BUILTIN\_TEMPLATE\_IDS

• `Const` **BUILTIN\_TEMPLATE\_IDS**: readonly [``"basic"``, ``"interactivity"``, ``"persistence"``, ``"compound"``]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L48)

___

### TEMPLATE\_REGISTRY

• `Const` **TEMPLATE\_REGISTRY**: readonly [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:60](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L60)

___

### TEMPLATE\_IDS

• `Const` **TEMPLATE\_IDS**: (``"basic"`` \| ``"interactivity"`` \| ``"persistence"`` \| ``"compound"``)[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:91](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L91)

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

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:9](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L9)

___

### isBuiltInTemplateId

▸ **isBuiltInTemplateId**(`templateId`): templateId is "basic" \| "interactivity" \| "persistence" \| "compound"

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

templateId is "basic" \| "interactivity" \| "persistence" \| "compound"

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:93](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L93)

___

### listTemplates

▸ **listTemplates**(): readonly [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)[]

#### Returns

readonly [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L97)

___

### getTemplateById

▸ **getTemplateById**(`templateId`): [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

[`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L101)

___

### getTemplateSelectOptions

▸ **getTemplateSelectOptions**(): \{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Returns

\{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-registry.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-registry.ts#L109)
