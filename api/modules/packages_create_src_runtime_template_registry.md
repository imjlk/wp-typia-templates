[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/template-registry

# Module: packages/create/src/runtime/template-registry

## Table of contents

### Interfaces

- [TemplateDefinition](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)

### Type Aliases

- [BuiltInTemplateId](packages_create_src_runtime_template_registry.md#builtintemplateid)
- [PersistencePolicy](packages_create_src_runtime_template_registry.md#persistencepolicy)

### Variables

- [CREATE\_PACKAGE\_ROOT](packages_create_src_runtime_template_registry.md#create_package_root)
- [TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#template_root)
- [SHARED\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_template_root)
- [SHARED\_BASE\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_base_template_root)
- [SHARED\_COMPOUND\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_compound_template_root)
- [SHARED\_PERSISTENCE\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_persistence_template_root)
- [SHARED\_PRESET\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_preset_template_root)
- [SHARED\_REST\_HELPER\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_rest_helper_template_root)
- [SHARED\_MIGRATION\_UI\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_migration_ui_template_root)
- [SHARED\_TEST\_PRESET\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_test_preset_template_root)
- [SHARED\_WP\_ENV\_PRESET\_TEMPLATE\_ROOT](packages_create_src_runtime_template_registry.md#shared_wp_env_preset_template_root)
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

[packages/create/src/runtime/template-registry.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L45)

___

### PersistencePolicy

Ƭ **PersistencePolicy**: ``"authenticated"`` \| ``"public"``

#### Defined in

[packages/create/src/runtime/template-registry.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L46)

## Variables

### CREATE\_PACKAGE\_ROOT

• `Const` **CREATE\_PACKAGE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L33)

___

### TEMPLATE\_ROOT

• `Const` **TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L34)

___

### SHARED\_TEMPLATE\_ROOT

• `Const` **SHARED\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L35)

___

### SHARED\_BASE\_TEMPLATE\_ROOT

• `Const` **SHARED\_BASE\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L36)

___

### SHARED\_COMPOUND\_TEMPLATE\_ROOT

• `Const` **SHARED\_COMPOUND\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L37)

___

### SHARED\_PERSISTENCE\_TEMPLATE\_ROOT

• `Const` **SHARED\_PERSISTENCE\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L38)

___

### SHARED\_PRESET\_TEMPLATE\_ROOT

• `Const` **SHARED\_PRESET\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L39)

___

### SHARED\_REST\_HELPER\_TEMPLATE\_ROOT

• `Const` **SHARED\_REST\_HELPER\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L40)

___

### SHARED\_MIGRATION\_UI\_TEMPLATE\_ROOT

• `Const` **SHARED\_MIGRATION\_UI\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L41)

___

### SHARED\_TEST\_PRESET\_TEMPLATE\_ROOT

• `Const` **SHARED\_TEST\_PRESET\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L42)

___

### SHARED\_WP\_ENV\_PRESET\_TEMPLATE\_ROOT

• `Const` **SHARED\_WP\_ENV\_PRESET\_TEMPLATE\_ROOT**: `string`

#### Defined in

[packages/create/src/runtime/template-registry.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L43)

___

### BUILTIN\_TEMPLATE\_IDS

• `Const` **BUILTIN\_TEMPLATE\_IDS**: readonly [``"basic"``, ``"interactivity"``, ``"persistence"``, ``"compound"``]

#### Defined in

[packages/create/src/runtime/template-registry.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L44)

___

### TEMPLATE\_REGISTRY

• `Const` **TEMPLATE\_REGISTRY**: readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:56](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L56)

___

### TEMPLATE\_IDS

• `Const` **TEMPLATE\_IDS**: (``"basic"`` \| ``"interactivity"`` \| ``"persistence"`` \| ``"compound"``)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L87)

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

[packages/create/src/runtime/template-registry.ts:9](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L9)

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

[packages/create/src/runtime/template-registry.ts:89](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L89)

___

### listTemplates

▸ **listTemplates**(): readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Returns

readonly [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:93](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L93)

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

[packages/create/src/runtime/template-registry.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L97)

___

### getTemplateSelectOptions

▸ **getTemplateSelectOptions**(): \{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Returns

\{ `label`: `string` ; `value`: [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md)[``"id"``] ; `hint`: `string`  }[]

#### Defined in

[packages/create/src/runtime/template-registry.ts:105](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-registry.ts#L105)
