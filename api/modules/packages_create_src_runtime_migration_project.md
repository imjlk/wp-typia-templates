[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-project

# Module: packages/create/src/runtime/migration-project

## Table of contents

### Type Aliases

- [DiscoveredMigrationLayout](packages_create_src_runtime_migration_project.md#discoveredmigrationlayout)

### Functions

- [ensureAdvancedMigrationProject](packages_create_src_runtime_migration_project.md#ensureadvancedmigrationproject)
- [getProjectPaths](packages_create_src_runtime_migration_project.md#getprojectpaths)
- [discoverMigrationInitLayout](packages_create_src_runtime_migration_project.md#discovermigrationinitlayout)
- [resolveMigrationBlocks](packages_create_src_runtime_migration_project.md#resolvemigrationblocks)
- [getSnapshotRoot](packages_create_src_runtime_migration_project.md#getsnapshotroot)
- [getSnapshotBlockJsonPath](packages_create_src_runtime_migration_project.md#getsnapshotblockjsonpath)
- [getSnapshotManifestPath](packages_create_src_runtime_migration_project.md#getsnapshotmanifestpath)
- [getAvailableSnapshotVersionsForBlock](packages_create_src_runtime_migration_project.md#getavailablesnapshotversionsforblock)
- [createMissingBlockSnapshotMessage](packages_create_src_runtime_migration_project.md#createmissingblocksnapshotmessage)
- [getSnapshotSavePath](packages_create_src_runtime_migration_project.md#getsnapshotsavepath)
- [getGeneratedDirForBlock](packages_create_src_runtime_migration_project.md#getgenerateddirforblock)
- [getRuleFilePath](packages_create_src_runtime_migration_project.md#getrulefilepath)
- [getFixtureFilePath](packages_create_src_runtime_migration_project.md#getfixturefilepath)
- [getValidatorsImportPath](packages_create_src_runtime_migration_project.md#getvalidatorsimportpath)
- [ensureMigrationDirectories](packages_create_src_runtime_migration_project.md#ensuremigrationdirectories)
- [writeInitialMigrationScaffold](packages_create_src_runtime_migration_project.md#writeinitialmigrationscaffold)
- [loadMigrationProject](packages_create_src_runtime_migration_project.md#loadmigrationproject)
- [discoverMigrationEntries](packages_create_src_runtime_migration_project.md#discovermigrationentries)
- [parseMigrationConfig](packages_create_src_runtime_migration_project.md#parsemigrationconfig)
- [writeMigrationConfig](packages_create_src_runtime_migration_project.md#writemigrationconfig)
- [readProjectBlockName](packages_create_src_runtime_migration_project.md#readprojectblockname)
- [assertRuleHasNoTodos](packages_create_src_runtime_migration_project.md#assertrulehasnotodos)
- [readRuleMetadata](packages_create_src_runtime_migration_project.md#readrulemetadata)
- [createMigrationBlockConfig](packages_create_src_runtime_migration_project.md#createmigrationblockconfig)

## Type Aliases

### DiscoveredMigrationLayout

Ƭ **DiscoveredMigrationLayout**: \{ `block`: [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) ; `mode`: ``"single"``  } \| \{ `blocks`: [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)[] ; `mode`: ``"multi"``  }

Describes the migration retrofit layout discovered in a project directory.

Multi-block discovery wins when block targets are discovered under
`src/blocks/<slug>/block.json`.
Otherwise the runtime falls back to a supported single-block layout.

#### Defined in

[packages/create/src/runtime/migration-project.ts:55](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L55)

## Functions

### ensureAdvancedMigrationProject

▸ **ensureAdvancedMigrationProject**(`projectDir`, `blocks?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `blocks?` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)[] |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-project.ts:218](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L218)

___

### getProjectPaths

▸ **getProjectPaths**(`projectDir`): [`MigrationProjectPaths`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectPaths.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

[`MigrationProjectPaths`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectPaths.md)

#### Defined in

[packages/create/src/runtime/migration-project.ts:229](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L229)

___

### discoverMigrationInitLayout

▸ **discoverMigrationInitLayout**(`projectDir`): [`DiscoveredMigrationLayout`](packages_create_src_runtime_migration_project.md#discoveredmigrationlayout)

Detects the supported migration retrofit layout for `migrations init`.

Multi-block targets under `src/blocks/<slug>` take precedence over
single-block layouts.
Returns the detected layout on success and throws an actionable error when no
supported first-party layout can be inferred.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

[`DiscoveredMigrationLayout`](packages_create_src_runtime_migration_project.md#discoveredmigrationlayout)

#### Defined in

[packages/create/src/runtime/migration-project.ts:427](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L427)

___

### resolveMigrationBlocks

▸ **resolveMigrationBlocks**(`projectDir`, `config`): [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `config` | [`MigrationConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationConfig.md) |

#### Returns

[`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md)[]

#### Defined in

[packages/create/src/runtime/migration-project.ts:441](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L441)

___

### getSnapshotRoot

▸ **getSnapshotRoot**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:467](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L467)

___

### getSnapshotBlockJsonPath

▸ **getSnapshotBlockJsonPath**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:478](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L478)

___

### getSnapshotManifestPath

▸ **getSnapshotManifestPath**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:486](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L486)

___

### getAvailableSnapshotVersionsForBlock

▸ **getAvailableSnapshotVersionsForBlock**(`projectDir`, `supportedVersions`, `block`): `string`[]

Lists the snapshot versions currently present for a specific block target.

Returns the sorted subset of `supportedVersions` that have a manifest on disk
for the provided block, or an empty array when none exist.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `supportedVersions` | `string`[] |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |

#### Returns

`string`[]

#### Defined in

[packages/create/src/runtime/migration-project.ts:500](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L500)

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

[packages/create/src/runtime/migration-project.ts:516](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L516)

___

### getSnapshotSavePath

▸ **getSnapshotSavePath**(`projectDir`, `block`, `version`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `version` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:529](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L529)

___

### getGeneratedDirForBlock

▸ **getGeneratedDirForBlock**(`paths`, `block`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectPaths.md) |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:537](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L537)

___

### getRuleFilePath

▸ **getRuleFilePath**(`paths`, `block`, `fromVersion`, `toVersion`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectPaths.md) |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:547](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L547)

___

### getFixtureFilePath

▸ **getFixtureFilePath**(`paths`, `block`, `fromVersion`, `toVersion`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectPaths.md) |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:559](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L559)

___

### getValidatorsImportPath

▸ **getValidatorsImportPath**(`projectDir`, `block`, `fromDir`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromDir` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:571](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L571)

___

### ensureMigrationDirectories

▸ **ensureMigrationDirectories**(`projectDir`, `blocks?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `blocks?` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)[] |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-project.ts:583](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L583)

___

### writeInitialMigrationScaffold

▸ **writeInitialMigrationScaffold**(`projectDir`, `currentVersion`, `blocks?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentVersion` | `string` |
| `blocks?` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)[] |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-project.ts:601](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L601)

___

### loadMigrationProject

▸ **loadMigrationProject**(`projectDir`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `projectDir` | `string` | `undefined` |
| `«destructured»` | `Object` | `{}` |
| › `allowMissingConfig?` | `boolean` | `false` |
| › `allowSyncTypes?` | `boolean` | `true` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create/src/runtime/migration-project.ts:637](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L637)

___

### discoverMigrationEntries

▸ **discoverMigrationEntries**(`state`): [`MigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |

#### Returns

[`MigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)[]

#### Defined in

[packages/create/src/runtime/migration-project.ts:681](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L681)

___

### parseMigrationConfig

▸ **parseMigrationConfig**(`source`): [`MigrationConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationConfig.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |

#### Returns

[`MigrationConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationConfig.md)

#### Defined in

[packages/create/src/runtime/migration-project.ts:734](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L734)

___

### writeMigrationConfig

▸ **writeMigrationConfig**(`projectDir`, `config`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `config` | [`MigrationConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationConfig.md) |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-project.ts:799](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L799)

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

[packages/create/src/runtime/migration-project.ts:857](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L857)

___

### assertRuleHasNoTodos

▸ **assertRuleHasNoTodos**(`projectDir`, `block`, `fromVersion`, `toVersion`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) \| [`ResolvedMigrationBlockTarget`](../interfaces/packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-project.ts:861](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L861)

___

### readRuleMetadata

▸ **readRuleMetadata**(`rulePath`): [`RuleMetadata`](../interfaces/packages_create_src_runtime_migration_types.RuleMetadata.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `rulePath` | `string` |

#### Returns

[`RuleMetadata`](../interfaces/packages_create_src_runtime_migration_types.RuleMetadata.md)

#### Defined in

[packages/create/src/runtime/migration-project.ts:877](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L877)

___

### createMigrationBlockConfig

▸ **createMigrationBlockConfig**(`block`): [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md) |

#### Returns

[`MigrationBlockConfig`](../interfaces/packages_create_src_runtime_migration_types.MigrationBlockConfig.md)

#### Defined in

[packages/create/src/runtime/migration-project.ts:899](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L899)
