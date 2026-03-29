[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create-wp-typia/src/runtime/migration-project

# Module: packages/create-wp-typia/src/runtime/migration-project

## Table of contents

### Functions

- [ensureAdvancedMigrationProject](packages_create_wp_typia_src_runtime_migration_project.md#ensureadvancedmigrationproject)
- [getProjectPaths](packages_create_wp_typia_src_runtime_migration_project.md#getprojectpaths)
- [ensureMigrationDirectories](packages_create_wp_typia_src_runtime_migration_project.md#ensuremigrationdirectories)
- [writeInitialMigrationScaffold](packages_create_wp_typia_src_runtime_migration_project.md#writeinitialmigrationscaffold)
- [loadMigrationProject](packages_create_wp_typia_src_runtime_migration_project.md#loadmigrationproject)
- [discoverMigrationEntries](packages_create_wp_typia_src_runtime_migration_project.md#discovermigrationentries)
- [parseMigrationConfig](packages_create_wp_typia_src_runtime_migration_project.md#parsemigrationconfig)
- [writeMigrationConfig](packages_create_wp_typia_src_runtime_migration_project.md#writemigrationconfig)
- [readProjectBlockName](packages_create_wp_typia_src_runtime_migration_project.md#readprojectblockname)
- [assertRuleHasNoTodos](packages_create_wp_typia_src_runtime_migration_project.md#assertrulehasnotodos)
- [getRuleFilePath](packages_create_wp_typia_src_runtime_migration_project.md#getrulefilepath)
- [readRuleMetadata](packages_create_wp_typia_src_runtime_migration_project.md#readrulemetadata)

## Functions

### ensureAdvancedMigrationProject

▸ **ensureAdvancedMigrationProject**(`projectDir`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

`void`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:29](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L29)

___

### getProjectPaths

▸ **getProjectPaths**(`projectDir`): [`MigrationProjectPaths`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectPaths.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

[`MigrationProjectPaths`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectPaths.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:38](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L38)

___

### ensureMigrationDirectories

▸ **ensureMigrationDirectories**(`projectDir`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

`void`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:48](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L48)

___

### writeInitialMigrationScaffold

▸ **writeInitialMigrationScaffold**(`projectDir`, `currentVersion`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentVersion` | `string` |

#### Returns

`void`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:56](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L56)

___

### loadMigrationProject

▸ **loadMigrationProject**(`projectDir`, `«destructured»?`): [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `projectDir` | `string` | `undefined` |
| `«destructured»` | `Object` | `{}` |
| › `allowMissingConfig?` | `boolean` | `false` |

#### Returns

[`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:71](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L71)

___

### discoverMigrationEntries

▸ **discoverMigrationEntries**(`state`): [`MigrationEntry`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationEntry.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md) |

#### Returns

[`MigrationEntry`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationEntry.md)[]

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:99](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L99)

___

### parseMigrationConfig

▸ **parseMigrationConfig**(`source`): [`MigrationConfig`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationConfig.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |

#### Returns

[`MigrationConfig`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationConfig.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:136](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L136)

___

### writeMigrationConfig

▸ **writeMigrationConfig**(`projectDir`, `config`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `config` | [`MigrationConfig`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationConfig.md) |

#### Returns

`void`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:164](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L164)

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

[packages/create-wp-typia/src/runtime/migration-project.ts:182](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L182)

___

### assertRuleHasNoTodos

▸ **assertRuleHasNoTodos**(`projectDir`, `fromVersion`, `toVersion`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`void`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:191](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L191)

___

### getRuleFilePath

▸ **getRuleFilePath**(`paths`, `fromVersion`, `toVersion`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `paths` | [`MigrationProjectPaths`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectPaths.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:202](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L202)

___

### readRuleMetadata

▸ **readRuleMetadata**(`rulePath`): [`RuleMetadata`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.RuleMetadata.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `rulePath` | `string` |

#### Returns

[`RuleMetadata`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.RuleMetadata.md)

#### Defined in

[packages/create-wp-typia/src/runtime/migration-project.ts:206](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-project.ts#L206)
