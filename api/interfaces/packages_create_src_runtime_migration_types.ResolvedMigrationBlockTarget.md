[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/migration-types](../modules/packages_create_src_runtime_migration_types.md) / ResolvedMigrationBlockTarget

# Interface: ResolvedMigrationBlockTarget

[packages/create/src/runtime/migration-types](../modules/packages_create_src_runtime_migration_types.md).ResolvedMigrationBlockTarget

Declares one migration-capable block target inside a project workspace.

## Hierarchy

- [`MigrationBlockConfig`](packages_create_src_runtime_migration_types.MigrationBlockConfig.md)

  ↳ **`ResolvedMigrationBlockTarget`**

## Table of contents

### Properties

- [blockJsonFile](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#blockjsonfile)
- [blockName](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#blockname)
- [key](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#key)
- [manifestFile](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#manifestfile)
- [saveFile](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#savefile)
- [typesFile](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#typesfile)
- [currentBlockJson](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#currentblockjson)
- [currentManifest](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#currentmanifest)
- [layout](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md#layout)

## Properties

### blockJsonFile

• **blockJsonFile**: `string`

Relative path to the target block.json metadata file.

#### Inherited from

[MigrationBlockConfig](packages_create_src_runtime_migration_types.MigrationBlockConfig.md).[blockJsonFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#blockjsonfile)

#### Defined in

[packages/create/src/runtime/migration-types.ts:107](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L107)

___

### blockName

• **blockName**: `string`

Registered block name for this migration target.

#### Inherited from

[MigrationBlockConfig](packages_create_src_runtime_migration_types.MigrationBlockConfig.md).[blockName](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#blockname)

#### Defined in

[packages/create/src/runtime/migration-types.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L109)

___

### key

• **key**: `string`

Stable block key used for generated file naming and registry entries.

#### Inherited from

[MigrationBlockConfig](packages_create_src_runtime_migration_types.MigrationBlockConfig.md).[key](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#key)

#### Defined in

[packages/create/src/runtime/migration-types.ts:111](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L111)

___

### manifestFile

• **manifestFile**: `string`

Relative path to the generated manifest snapshot input for the block.

#### Inherited from

[MigrationBlockConfig](packages_create_src_runtime_migration_types.MigrationBlockConfig.md).[manifestFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#manifestfile)

#### Defined in

[packages/create/src/runtime/migration-types.ts:113](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L113)

___

### saveFile

• **saveFile**: `string`

Relative path to the saved-markup source file used for snapshot capture.

#### Inherited from

[MigrationBlockConfig](packages_create_src_runtime_migration_types.MigrationBlockConfig.md).[saveFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#savefile)

#### Defined in

[packages/create/src/runtime/migration-types.ts:115](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L115)

___

### typesFile

• **typesFile**: `string`

Relative path to the canonical types source for the block.

#### Inherited from

[MigrationBlockConfig](packages_create_src_runtime_migration_types.MigrationBlockConfig.md).[typesFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#typesfile)

#### Defined in

[packages/create/src/runtime/migration-types.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L117)

___

### currentBlockJson

• **currentBlockJson**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/create/src/runtime/migration-types.ts:121](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L121)

___

### currentManifest

• **currentManifest**: [`ManifestDocument`](packages_create_src_runtime_migration_types.ManifestDocument.md)

#### Defined in

[packages/create/src/runtime/migration-types.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L122)

___

### layout

• **layout**: ``"legacy"`` \| ``"multi"``

#### Defined in

[packages/create/src/runtime/migration-types.ts:123](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L123)
