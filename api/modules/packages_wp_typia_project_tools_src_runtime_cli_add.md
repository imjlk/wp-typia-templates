[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/cli-add

# Module: packages/wp-typia-project-tools/src/runtime/cli-add

## Table of contents

### References

- [getWorkspaceBlockSelectOptions](packages_wp_typia_project_tools_src_runtime_cli_add.md#getworkspaceblockselectoptions)

### Type Aliases

- [AddKindId](packages_wp_typia_project_tools_src_runtime_cli_add.md#addkindid)
- [AddBlockTemplateId](packages_wp_typia_project_tools_src_runtime_cli_add.md#addblocktemplateid)

### Variables

- [ADD\_KIND\_IDS](packages_wp_typia_project_tools_src_runtime_cli_add.md#add_kind_ids)
- [ADD\_BLOCK\_TEMPLATE\_IDS](packages_wp_typia_project_tools_src_runtime_cli_add.md#add_block_template_ids)

### Functions

- [formatAddHelpText](packages_wp_typia_project_tools_src_runtime_cli_add.md#formataddhelptext)
- [seedWorkspaceMigrationProject](packages_wp_typia_project_tools_src_runtime_cli_add.md#seedworkspacemigrationproject)
- [runAddBlockCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddblockcommand)
- [runAddVariationCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddvariationcommand)
- [runAddPatternCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddpatterncommand)
- [runAddBindingSourceCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddbindingsourcecommand)

## References

### getWorkspaceBlockSelectOptions

Re-exports [getWorkspaceBlockSelectOptions](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#getworkspaceblockselectoptions)

## Type Aliases

### AddKindId

Ƭ **AddKindId**: typeof [`ADD_KIND_IDS`](packages_wp_typia_project_tools_src_runtime_cli_add.md#add_kind_ids)[`number`]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L49)

___

### AddBlockTemplateId

Ƭ **AddBlockTemplateId**: typeof [`ADD_BLOCK_TEMPLATE_IDS`](packages_wp_typia_project_tools_src_runtime_cli_add.md#add_block_template_ids)[`number`]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:60](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L60)

## Variables

### ADD\_KIND\_IDS

• `Const` **ADD\_KIND\_IDS**: readonly [``"block"``, ``"variation"``, ``"pattern"``, ``"binding-source"``]

Supported top-level `wp-typia add` kinds exposed by the canonical CLI.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L48)

___

### ADD\_BLOCK\_TEMPLATE\_IDS

• `Const` **ADD\_BLOCK\_TEMPLATE\_IDS**: readonly [``"basic"``, ``"interactivity"``, ``"persistence"``, ``"compound"``]

Supported built-in block families accepted by `wp-typia add block --template`.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L54)

## Functions

### formatAddHelpText

▸ **formatAddHelpText**(): `string`

Returns help text for the canonical `wp-typia add` subcommands.

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:1137](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L1137)

___

### seedWorkspaceMigrationProject

▸ **seedWorkspaceMigrationProject**(`projectDir`, `currentMigrationVersion`): `Promise`\<`void`\>

Seeds an empty official workspace migration project before any blocks are added.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentMigrationVersion` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:1154](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L1154)

___

### runAddBlockCommand

▸ **runAddBlockCommand**(`«destructured»`): `Promise`\<\{ `blockSlugs`: `string`[] ; `projectDir`: `string` ; `templateId`: [`AddBlockTemplateId`](packages_wp_typia_project_tools_src_runtime_cli_add.md#addblocktemplateid)  }\>

Adds one built-in block slice to an official workspace project.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `RunAddBlockCommandOptions` |

#### Returns

`Promise`\<\{ `blockSlugs`: `string`[] ; `projectDir`: `string` ; `templateId`: [`AddBlockTemplateId`](packages_wp_typia_project_tools_src_runtime_cli_add.md#addblocktemplateid)  }\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:1183](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L1183)

___

### runAddVariationCommand

▸ **runAddVariationCommand**(`options`): `Promise`\<\{ `blockSlug`: `string` ; `projectDir`: `string` ; `variationSlug`: `string`  }\>

Add one variation entry to an existing workspace block.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `RunAddVariationCommandOptions` | Command options for the variation scaffold workflow. |

#### Returns

`Promise`\<\{ `blockSlug`: `string` ; `projectDir`: `string` ; `variationSlug`: `string`  }\>

A promise that resolves with the normalized `blockSlug`,
`variationSlug`, and owning `projectDir` after the variation files and
inventory entry have been written successfully.

**`Throws`**

When the command is run outside an official workspace, when
the target block is unknown, when the variation slug is invalid, or when a
conflicting file or inventory entry already exists.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:1407](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L1407)

___

### runAddPatternCommand

▸ **runAddPatternCommand**(`options`): `Promise`\<\{ `patternSlug`: `string` ; `projectDir`: `string`  }\>

Add one PHP block pattern shell to an official workspace project.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `RunAddPatternCommandOptions` | Command options for the pattern scaffold workflow. |

#### Returns

`Promise`\<\{ `patternSlug`: `string` ; `projectDir`: `string`  }\>

A promise that resolves with the normalized `patternSlug` and
owning `projectDir` after the pattern file and inventory entry have been
written successfully.

**`Throws`**

When the command is run outside an official workspace, when
the pattern slug is invalid, or when a conflicting file or inventory entry
already exists.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:1482](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L1482)

___

### runAddBindingSourceCommand

▸ **runAddBindingSourceCommand**(`options`): `Promise`\<\{ `bindingSourceSlug`: `string` ; `projectDir`: `string`  }\>

Add one block binding source scaffold to an official workspace project.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `RunAddBindingSourceCommandOptions` | Command options for the binding-source scaffold workflow. |

#### Returns

`Promise`\<\{ `bindingSourceSlug`: `string` ; `projectDir`: `string`  }\>

A promise that resolves with the normalized `bindingSourceSlug` and
owning `projectDir` after the server/editor files and inventory entry have
been written successfully.

**`Throws`**

When the command is run outside an official workspace, when
the slug is invalid, or when a conflicting file or inventory entry exists.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-add.ts:1548](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-add.ts#L1548)
