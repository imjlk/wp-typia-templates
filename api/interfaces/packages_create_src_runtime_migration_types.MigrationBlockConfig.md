[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/migration-types](../modules/packages_create_src_runtime_migration_types.md) / MigrationBlockConfig

# Interface: MigrationBlockConfig

[packages/create/src/runtime/migration-types](../modules/packages_create_src_runtime_migration_types.md).MigrationBlockConfig

Declares one migration-capable block target inside a project workspace.

## Hierarchy

- **`MigrationBlockConfig`**

  ↳ [`ResolvedMigrationBlockTarget`](packages_create_src_runtime_migration_types.ResolvedMigrationBlockTarget.md)

## Table of contents

### Properties

- [blockJsonFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#blockjsonfile)
- [blockName](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#blockname)
- [key](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#key)
- [manifestFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#manifestfile)
- [saveFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#savefile)
- [typesFile](packages_create_src_runtime_migration_types.MigrationBlockConfig.md#typesfile)

## Properties

### blockJsonFile

• **blockJsonFile**: `string`

Relative path to the target block.json metadata file.

#### Defined in

[packages/create/src/runtime/migration-types.ts:107](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L107)

___

### blockName

• **blockName**: `string`

Registered block name for this migration target.

#### Defined in

[packages/create/src/runtime/migration-types.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L109)

___

### key

• **key**: `string`

Stable block key used for generated file naming and registry entries.

#### Defined in

[packages/create/src/runtime/migration-types.ts:111](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L111)

___

### manifestFile

• **manifestFile**: `string`

Relative path to the generated manifest snapshot input for the block.

#### Defined in

[packages/create/src/runtime/migration-types.ts:113](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L113)

___

### saveFile

• **saveFile**: `string`

Relative path to the saved-markup source file used for snapshot capture.

#### Defined in

[packages/create/src/runtime/migration-types.ts:115](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L115)

___

### typesFile

• **typesFile**: `string`

Relative path to the canonical types source for the block.

#### Defined in

[packages/create/src/runtime/migration-types.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L117)
