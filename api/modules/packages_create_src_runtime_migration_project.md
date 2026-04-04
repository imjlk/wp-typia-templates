[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-project

# Module: packages/create/src/runtime/migration-project

## Table of contents

### Functions

- [ensureAdvancedMigrationProject](packages_create_src_runtime_migration_project.md#ensureadvancedmigrationproject)
- [getProjectPaths](packages_create_src_runtime_migration_project.md#getprojectpaths)
- [resolveMigrationBlocks](packages_create_src_runtime_migration_project.md#resolvemigrationblocks)
- [getSnapshotRoot](packages_create_src_runtime_migration_project.md#getsnapshotroot)
- [getSnapshotBlockJsonPath](packages_create_src_runtime_migration_project.md#getsnapshotblockjsonpath)
- [getSnapshotManifestPath](packages_create_src_runtime_migration_project.md#getsnapshotmanifestpath)
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

[packages/create/src/runtime/migration-project.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L85)

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

[packages/create/src/runtime/migration-project.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L96)

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

[packages/create/src/runtime/migration-project.ts:106](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L106)

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

[packages/create/src/runtime/migration-project.ts:132](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L132)

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

[packages/create/src/runtime/migration-project.ts:143](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L143)

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

[packages/create/src/runtime/migration-project.ts:151](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L151)

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

[packages/create/src/runtime/migration-project.ts:159](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L159)

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

[packages/create/src/runtime/migration-project.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L167)

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

[packages/create/src/runtime/migration-project.ts:177](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L177)

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

[packages/create/src/runtime/migration-project.ts:189](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L189)

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

[packages/create/src/runtime/migration-project.ts:201](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L201)

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

[packages/create/src/runtime/migration-project.ts:213](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L213)

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

[packages/create/src/runtime/migration-project.ts:231](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L231)

___

### loadMigrationProject

▸ **loadMigrationProject**(`projectDir`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `projectDir` | `string` | `undefined` |
| `«destructured»` | `Object` | `{}` |
| › `allowMissingConfig?` | `boolean` | `false` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create/src/runtime/migration-project.ts:267](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L267)

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

[packages/create/src/runtime/migration-project.ts:302](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L302)

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

[packages/create/src/runtime/migration-project.ts:355](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L355)

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

[packages/create/src/runtime/migration-project.ts:420](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L420)

___

### readProjectBlockName

▸ **readProjectBlockName**(`projectDir`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-project.ts:471](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L471)

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

[packages/create/src/runtime/migration-project.ts:480](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L480)

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

[packages/create/src/runtime/migration-project.ts:496](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L496)

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

[packages/create/src/runtime/migration-project.ts:518](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-project.ts#L518)
