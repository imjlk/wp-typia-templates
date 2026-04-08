[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/migration-project

# Module: packages/wp-typia-project-tools/src/runtime/migration-project

## Table of contents

### Type Aliases

- [DiscoveredMigrationLayout](packages_wp_typia_project_tools_src_runtime_migration_project.md#discoveredmigrationlayout)

### Functions

- [ensureAdvancedMigrationProject](packages_wp_typia_project_tools_src_runtime_migration_project.md#ensureadvancedmigrationproject)
- [getProjectPaths](packages_wp_typia_project_tools_src_runtime_migration_project.md#getprojectpaths)
- [discoverMigrationInitLayout](packages_wp_typia_project_tools_src_runtime_migration_project.md#discovermigrationinitlayout)
- [resolveMigrationBlocks](packages_wp_typia_project_tools_src_runtime_migration_project.md#resolvemigrationblocks)
- [getSnapshotRoot](packages_wp_typia_project_tools_src_runtime_migration_project.md#getsnapshotroot)
- [getSnapshotBlockJsonPath](packages_wp_typia_project_tools_src_runtime_migration_project.md#getsnapshotblockjsonpath)
- [getSnapshotManifestPath](packages_wp_typia_project_tools_src_runtime_migration_project.md#getsnapshotmanifestpath)
- [getAvailableSnapshotVersionsForBlock](packages_wp_typia_project_tools_src_runtime_migration_project.md#getavailablesnapshotversionsforblock)
- [createMissingBlockSnapshotMessage](packages_wp_typia_project_tools_src_runtime_migration_project.md#createmissingblocksnapshotmessage)
- [getSnapshotSavePath](packages_wp_typia_project_tools_src_runtime_migration_project.md#getsnapshotsavepath)
- [getGeneratedDirForBlock](packages_wp_typia_project_tools_src_runtime_migration_project.md#getgenerateddirforblock)
- [getRuleFilePath](packages_wp_typia_project_tools_src_runtime_migration_project.md#getrulefilepath)
- [getFixtureFilePath](packages_wp_typia_project_tools_src_runtime_migration_project.md#getfixturefilepath)
- [getValidatorsImportPath](packages_wp_typia_project_tools_src_runtime_migration_project.md#getvalidatorsimportpath)
- [ensureMigrationDirectories](packages_wp_typia_project_tools_src_runtime_migration_project.md#ensuremigrationdirectories)
- [writeInitialMigrationScaffold](packages_wp_typia_project_tools_src_runtime_migration_project.md#writeinitialmigrationscaffold)
- [assertNoLegacySemverMigrationWorkspace](packages_wp_typia_project_tools_src_runtime_migration_project.md#assertnolegacysemvermigrationworkspace)
- [loadMigrationProject](packages_wp_typia_project_tools_src_runtime_migration_project.md#loadmigrationproject)
- [discoverMigrationEntries](packages_wp_typia_project_tools_src_runtime_migration_project.md#discovermigrationentries)
- [parseMigrationConfig](packages_wp_typia_project_tools_src_runtime_migration_project.md#parsemigrationconfig)
- [writeMigrationConfig](packages_wp_typia_project_tools_src_runtime_migration_project.md#writemigrationconfig)
- [readProjectBlockName](packages_wp_typia_project_tools_src_runtime_migration_project.md#readprojectblockname)
- [assertRuleHasNoTodos](packages_wp_typia_project_tools_src_runtime_migration_project.md#assertrulehasnotodos)
- [readRuleMetadata](packages_wp_typia_project_tools_src_runtime_migration_project.md#readrulemetadata)
- [createMigrationBlockConfig](packages_wp_typia_project_tools_src_runtime_migration_project.md#createmigrationblockconfig)

## Type Aliases

### DiscoveredMigrationLayout

Ƭ **DiscoveredMigrationLayout**: \{ `block`: [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) ; `mode`: ``"single"``  } \| \{ `blocks`: [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)[] ; `mode`: ``"multi"``  }

Describes the migration retrofit layout discovered in a project directory.

Multi-block discovery wins when block targets are discovered under
`src/blocks/<slug>/block.json`.
Otherwise the runtime falls back to a supported single-block layout.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:72](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L72)

## Functions

### ensureAdvancedMigrationProject

▸ **ensureAdvancedMigrationProject**(`projectDir`, `blocks?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `blocks?` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)[] |

#### Returns

`void`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:589](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L589)

___

### getProjectPaths

▸ **getProjectPaths**(`projectDir`): [`MigrationProjectPaths`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectPaths.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

[`MigrationProjectPaths`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectPaths.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:600](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L600)

___

### discoverMigrationInitLayout

▸ **discoverMigrationInitLayout**(`projectDir`): [`DiscoveredMigrationLayout`](packages_wp_typia_project_tools_src_runtime_migration_project.md#discoveredmigrationlayout)

Detects the supported migration retrofit layout for `migrate init`.

Multi-block targets under `src/blocks/<slug>` take precedence over
single-block layouts.
Returns the detected layout on success and throws an actionable error when no
supported first-party layout can be inferred.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

[`DiscoveredMigrationLayout`](packages_wp_typia_project_tools_src_runtime_migration_project.md#discoveredmigrationlayout)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:798](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L798)

___

### resolveMigrationBlocks

▸ **resolveMigrationBlocks**(`projectDir`, `config`): [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `config` | [`MigrationConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md) |

#### Returns

[`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md)[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:812](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L812)

___

### getSnapshotRoot

▸ **getSnapshotRoot**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:845](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L845)

___

### getSnapshotBlockJsonPath

▸ **getSnapshotBlockJsonPath**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:856](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L856)

___

### getSnapshotManifestPath

▸ **getSnapshotManifestPath**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:864](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L864)

___

### getAvailableSnapshotVersionsForBlock

▸ **getAvailableSnapshotVersionsForBlock**(`projectDir`, `supportedMigrationVersions`, `block`): `string`[]

Lists the snapshot versions currently present for a specific block target.

Returns the sorted subset of supported migration versions that have a manifest on disk
for the provided block, or an empty array when none exist.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `supportedMigrationVersions` | `string`[] |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |

#### Returns

`string`[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:878](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L878)

___

### createMissingBlockSnapshotMessage

▸ **createMissingBlockSnapshotMessage**(`blockName`, `fromVersion`, `availableSnapshotVersions`): `string`

Formats the standard missing-snapshot guidance for a block target.

Returns a user-facing message that either lists the available snapshot
versions or explains that no snapshots exist yet for the block.

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockName` | `string` |
| `fromVersion` | `string` |
| `availableSnapshotVersions` | `string`[] |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:894](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L894)

___

### getSnapshotSavePath

▸ **getSnapshotSavePath**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:907](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L907)

___

### getGeneratedDirForBlock

▸ **getGeneratedDirForBlock**(`paths`, `block`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectPaths.md) |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:915](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L915)

___

### getRuleFilePath

▸ **getRuleFilePath**(`paths`, `block`, `fromVersion`, `toVersion`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectPaths.md) |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:925](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L925)

___

### getFixtureFilePath

▸ **getFixtureFilePath**(`paths`, `block`, `fromVersion`, `toVersion`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectPaths.md) |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:937](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L937)

___

### getValidatorsImportPath

▸ **getValidatorsImportPath**(`projectDir`, `block`, `fromDir`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromDir` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:949](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L949)

___

### ensureMigrationDirectories

▸ **ensureMigrationDirectories**(`projectDir`, `blocks?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `blocks?` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)[] |

#### Returns

`void`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:961](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L961)

___

### writeInitialMigrationScaffold

▸ **writeInitialMigrationScaffold**(`projectDir`, `currentMigrationVersion`, `blocks?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentMigrationVersion` | `string` |
| `blocks?` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)[] |

#### Returns

`void`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:979](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L979)

___

### assertNoLegacySemverMigrationWorkspace

▸ **assertNoLegacySemverMigrationWorkspace**(`projectDir`): `void`

Guards a project directory against legacy semver-based migration workspaces.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDir` | `string` | Absolute or relative project directory containing the migration workspace. |

#### Returns

`void`

Nothing.

**`Throws`**

Error When legacy config keys or semver-named migration artifacts are detected.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1060](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1060)

___

### loadMigrationProject

▸ **loadMigrationProject**(`projectDir`, `options?`): [`MigrationProjectState`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectState.md)

Loads the migration workspace state for a project directory.

By default this loader may run the project's `sync-types` script when the
current manifest files are missing, because later migration commands depend
on those generated artifacts. Pass `allowSyncTypes: false` to keep the call
read-only and fail instead of mutating the workspace.

When `allowMissingConfig` is enabled and the migration config file does not
exist yet, the loader synthesizes a minimal legacy-root config so bootstrap
flows can continue before the first config write.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `projectDir` | `string` | `undefined` | Absolute or relative project directory containing the migration workspace. |
| `options` | `Object` | `{}` | Loader flags controlling config fallback and `sync-types` side effects. |
| `options.allowMissingConfig?` | `boolean` | `false` | - |
| `options.allowSyncTypes?` | `boolean` | `true` | - |

#### Returns

[`MigrationProjectState`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectState.md)

The resolved migration project state, including config, block targets, and helper paths.

**`Throws`**

Error When the project is not migration-capable, required manifests remain missing, or generated files cannot be read.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1096](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1096)

___

### discoverMigrationEntries

▸ **discoverMigrationEntries**(`state`): [`MigrationEntry`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationEntry.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationProjectState.md) |

#### Returns

[`MigrationEntry`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationEntry.md)[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1159](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1159)

___

### parseMigrationConfig

▸ **parseMigrationConfig**(`source`): [`MigrationConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |

#### Returns

[`MigrationConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1212](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1212)

___

### writeMigrationConfig

▸ **writeMigrationConfig**(`projectDir`, `config`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `config` | [`MigrationConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md) |

#### Returns

`void`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1327](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1327)

___

### readProjectBlockName

▸ **readProjectBlockName**(`projectDir`): `string`

Returns the discovered block name for a supported single-block project.

Uses `discoverSingleBlockTarget(projectDir)` internally and throws when the
project directory does not resolve to a supported single-block migration
layout.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1385](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1385)

___

### assertRuleHasNoTodos

▸ **assertRuleHasNoTodos**(`projectDir`, `block`, `fromMigrationVersion`, `toMigrationVersion`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromMigrationVersion` | `string` |
| `toMigrationVersion` | `string` |

#### Returns

`void`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1389](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1389)

___

### readRuleMetadata

▸ **readRuleMetadata**(`rulePath`): [`RuleMetadata`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.RuleMetadata.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `rulePath` | `string` |

#### Returns

[`RuleMetadata`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.RuleMetadata.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1405](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1405)

___

### createMigrationBlockConfig

▸ **createMigrationBlockConfig**(`block`): [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) |

#### Returns

[`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-project.ts:1427](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-project.ts#L1427)
