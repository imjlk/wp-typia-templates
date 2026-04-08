[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/workspace-inventory

# Module: packages/wp-typia-project-tools/src/runtime/workspace-inventory

## Table of contents

### Interfaces

- [WorkspaceBlockInventoryEntry](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceBlockInventoryEntry.md)
- [WorkspaceVariationInventoryEntry](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceVariationInventoryEntry.md)
- [WorkspacePatternInventoryEntry](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspacePatternInventoryEntry.md)
- [WorkspaceBindingSourceInventoryEntry](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceBindingSourceInventoryEntry.md)
- [WorkspaceInventory](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceInventory.md)

### Variables

- [BLOCK\_CONFIG\_ENTRY\_MARKER](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#block_config_entry_marker)
- [VARIATION\_CONFIG\_ENTRY\_MARKER](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#variation_config_entry_marker)
- [PATTERN\_CONFIG\_ENTRY\_MARKER](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#pattern_config_entry_marker)
- [BINDING\_SOURCE\_CONFIG\_ENTRY\_MARKER](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#binding_source_config_entry_marker)

### Functions

- [parseWorkspaceInventorySource](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#parseworkspaceinventorysource)
- [readWorkspaceInventory](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#readworkspaceinventory)
- [getWorkspaceBlockSelectOptions](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#getworkspaceblockselectoptions)
- [updateWorkspaceInventorySource](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#updateworkspaceinventorysource)
- [appendWorkspaceInventoryEntries](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#appendworkspaceinventoryentries)

## Variables

### BLOCK\_CONFIG\_ENTRY\_MARKER

• `Const` **BLOCK\_CONFIG\_ENTRY\_MARKER**: ``"\t// wp-typia add block entries"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L44)

___

### VARIATION\_CONFIG\_ENTRY\_MARKER

• `Const` **VARIATION\_CONFIG\_ENTRY\_MARKER**: ``"\t// wp-typia add variation entries"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L45)

___

### PATTERN\_CONFIG\_ENTRY\_MARKER

• `Const` **PATTERN\_CONFIG\_ENTRY\_MARKER**: ``"\t// wp-typia add pattern entries"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L46)

___

### BINDING\_SOURCE\_CONFIG\_ENTRY\_MARKER

• `Const` **BINDING\_SOURCE\_CONFIG\_ENTRY\_MARKER**: ``"\t// wp-typia add binding-source entries"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:47](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L47)

## Functions

### parseWorkspaceInventorySource

▸ **parseWorkspaceInventorySource**(`source`): `Omit`\<[`WorkspaceInventory`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceInventory.md), ``"blockConfigPath"``\>

Parse workspace inventory entries from the source of `scripts/block-config.ts`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `source` | `string` | Raw TypeScript source from `scripts/block-config.ts`. |

#### Returns

`Omit`\<[`WorkspaceInventory`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceInventory.md), ``"blockConfigPath"``\>

Parsed inventory sections without the resolved `blockConfigPath`.

**`Throws`**

When `BLOCKS` is missing or any inventory entry is malformed.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:265](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L265)

___

### readWorkspaceInventory

▸ **readWorkspaceInventory**(`projectDir`): [`WorkspaceInventory`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceInventory.md)

Read and parse the canonical workspace inventory file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Workspace root directory. |

#### Returns

[`WorkspaceInventory`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_inventory.WorkspaceInventory.md)

Parsed `WorkspaceInventory` including the resolved `blockConfigPath`.

**`Throws`**

When `scripts/block-config.ts` is missing or invalid.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:311](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L311)

___

### getWorkspaceBlockSelectOptions

▸ **getWorkspaceBlockSelectOptions**(`projectDir`): \{ `description`: `string` ; `name`: `string` ; `value`: `string`  }[]

Return select options for the current workspace block inventory.

The `description` field mirrors `block.typesFile`, while `name` and `value`
both map to the block slug for use in interactive add flows.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Workspace root directory. |

#### Returns

\{ `description`: `string` ; `name`: `string` ; `value`: `string`  }[]

Block options for variation-target selection.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:345](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L345)

___

### updateWorkspaceInventorySource

▸ **updateWorkspaceInventorySource**(`source`, `options?`): `string`

Update `scripts/block-config.ts` source text with additional inventory entries.

Missing `VARIATIONS` and `PATTERNS` sections are created automatically before
new entries are appended at their marker comments. When provided,
`transformSource` runs before any entries are inserted.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `source` | `string` | `undefined` | Existing `scripts/block-config.ts` source. |
| `options` | `Object` | `{}` | Entry lists plus an optional source transformer. |
| `options.blockEntries?` | `string`[] | `[]` | - |
| `options.bindingSourceEntries?` | `string`[] | `[]` | - |
| `options.patternEntries?` | `string`[] | `[]` | - |
| `options.transformSource?` | (`source`: `string`) => `string` | `undefined` | - |
| `options.variationEntries?` | `string`[] | `[]` | - |

#### Returns

`string`

Updated source text with all requested inventory entries appended.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:406](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L406)

___

### appendWorkspaceInventoryEntries

▸ **appendWorkspaceInventoryEntries**(`projectDir`, `options`): `Promise`\<`void`\>

Append new entries to the canonical workspace inventory file on disk.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Workspace root directory. |
| `options` | `undefined` \| \{ `blockEntries?`: `string`[] ; `bindingSourceEntries?`: `string`[] ; `patternEntries?`: `string`[] ; `transformSource?`: (`source`: `string`) => `string` ; `variationEntries?`: `string`[]  } | Entry lists and optional source transform passed through to `updateWorkspaceInventorySource`. |

#### Returns

`Promise`\<`void`\>

Resolves once `scripts/block-config.ts` has been updated if needed.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts:445](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-inventory.ts#L445)
