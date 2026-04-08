[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/template-defaults

# Module: packages/wp-typia-project-tools/src/runtime/template-defaults

## Table of contents

### Type Aliases

- [RemovedBuiltInTemplateId](packages_wp_typia_project_tools_src_runtime_template_defaults.md#removedbuiltintemplateid)

### Variables

- [BUILTIN\_BLOCK\_METADATA\_VERSION](packages_wp_typia_project_tools_src_runtime_template_defaults.md#builtin_block_metadata_version)
- [BUILTIN\_TEMPLATE\_METADATA\_DEFAULTS](packages_wp_typia_project_tools_src_runtime_template_defaults.md#builtin_template_metadata_defaults)
- [COMPOUND\_CHILD\_BLOCK\_METADATA\_DEFAULTS](packages_wp_typia_project_tools_src_runtime_template_defaults.md#compound_child_block_metadata_defaults)
- [REMOVED\_BUILTIN\_TEMPLATE\_IDS](packages_wp_typia_project_tools_src_runtime_template_defaults.md#removed_builtin_template_ids)

### Functions

- [getBuiltInTemplateMetadataDefaults](packages_wp_typia_project_tools_src_runtime_template_defaults.md#getbuiltintemplatemetadatadefaults)
- [isRemovedBuiltInTemplateId](packages_wp_typia_project_tools_src_runtime_template_defaults.md#isremovedbuiltintemplateid)
- [getRemovedBuiltInTemplateMessage](packages_wp_typia_project_tools_src_runtime_template_defaults.md#getremovedbuiltintemplatemessage)

## Type Aliases

### RemovedBuiltInTemplateId

Ƭ **RemovedBuiltInTemplateId**: typeof [`REMOVED_BUILTIN_TEMPLATE_IDS`](packages_wp_typia_project_tools_src_runtime_template_defaults.md#removed_builtin_template_ids)[`number`]

Union of removed built-in template ids accepted by compatibility checks.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L43)

## Variables

### BUILTIN\_BLOCK\_METADATA\_VERSION

• `Const` **BUILTIN\_BLOCK\_METADATA\_VERSION**: ``"0.1.0"``

Internal built-in template metadata defaults used by scaffold rendering.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L4)

___

### BUILTIN\_TEMPLATE\_METADATA\_DEFAULTS

• `Const` **BUILTIN\_TEMPLATE\_METADATA\_DEFAULTS**: `Readonly`\<\{ `basic`: `Readonly`\<\{ `category`: ``"text"`` = "text"; `icon`: ``"smiley"`` = "smiley" }\> ; `interactivity`: `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"smiley"`` = "smiley" }\> ; `persistence`: `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"database"`` = "database" }\> ; `compound`: `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"screenoptions"`` = "screenoptions" }\>  }\>

Built-in parent block metadata defaults keyed by template id.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:9](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L9)

___

### COMPOUND\_CHILD\_BLOCK\_METADATA\_DEFAULTS

• `Const` **COMPOUND\_CHILD\_BLOCK\_METADATA\_DEFAULTS**: `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"excerpt-view"`` = "excerpt-view" }\>

Shared hidden child block metadata defaults for compound scaffolds.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L31)

___

### REMOVED\_BUILTIN\_TEMPLATE\_IDS

• `Const` **REMOVED\_BUILTIN\_TEMPLATE\_IDS**: readonly [``"data"``, ``"persisted"``]

Legacy built-in template ids that were removed in favor of persistence modes.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L39)

## Functions

### getBuiltInTemplateMetadataDefaults

▸ **getBuiltInTemplateMetadataDefaults**(`templateId`): `Readonly`\<\{ `category`: ``"text"`` = "text"; `icon`: ``"smiley"`` = "smiley" }\> \| `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"smiley"`` = "smiley" }\> \| `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"database"`` = "database" }\> \| `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"screenoptions"`` = "screenoptions" }\>

Returns the metadata defaults for a built-in scaffold template id.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `templateId` | ``"basic"`` \| ``"interactivity"`` \| ``"persistence"`` \| ``"compound"`` | Built-in template id whose metadata defaults should be read. |

#### Returns

`Readonly`\<\{ `category`: ``"text"`` = "text"; `icon`: ``"smiley"`` = "smiley" }\> \| `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"smiley"`` = "smiley" }\> \| `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"database"`` = "database" }\> \| `Readonly`\<\{ `category`: ``"widgets"`` = "widgets"; `icon`: ``"screenoptions"`` = "screenoptions" }\>

The stable category/icon defaults used by scaffold rendering.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L51)

___

### isRemovedBuiltInTemplateId

▸ **isRemovedBuiltInTemplateId**(`templateId`): templateId is "data" \| "persisted"

Checks whether a template id points at a removed built-in scaffold.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `templateId` | `string` | Template id supplied to scaffold resolution. |

#### Returns

templateId is "data" \| "persisted"

True when the template id is one of the removed legacy built-ins.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:63](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L63)

___

### getRemovedBuiltInTemplateMessage

▸ **getRemovedBuiltInTemplateMessage**(`templateId`): `string`

Builds the stable recovery guidance shown for removed built-in template ids.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `templateId` | ``"data"`` \| ``"persisted"`` | Removed template id, where `data` maps to the public policy and `persisted` maps to the authenticated policy. |

#### Returns

`string`

A user-facing error string in the form
`Built-in template "<id>" was removed. Use --template persistence --persistence-policy <policy> instead.`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-defaults.ts:77](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-defaults.ts#L77)
