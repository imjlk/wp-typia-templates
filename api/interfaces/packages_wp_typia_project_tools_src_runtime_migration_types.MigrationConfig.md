[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/migration-types](../modules/packages_wp_typia_project_tools_src_runtime_migration_types.md) / MigrationConfig

# Interface: MigrationConfig

[packages/wp-typia-project-tools/src/runtime/migration-types](../modules/packages_wp_typia_project_tools_src_runtime_migration_types.md).MigrationConfig

Declares the migration-lineage labels and block targets used by a project migration workspace.

These labels describe schema lineage such as `v1`, `v2`, and `v3`; they do
not represent package, plugin, or release versions.

## Table of contents

### Properties

- [blockName](packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md#blockname)
- [blocks](packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md#blocks)
- [currentMigrationVersion](packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md#currentmigrationversion)
- [snapshotDir](packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md#snapshotdir)
- [supportedMigrationVersions](packages_wp_typia_project_tools_src_runtime_migration_types.MigrationConfig.md#supportedmigrationversions)

## Properties

### blockName

• `Optional` **blockName**: `string`

Optional single-block name used by legacy-root retrofit layouts.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-types.ts:91](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-types.ts#L91)

___

### blocks

• `Optional` **blocks**: [`MigrationBlockConfig`](packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md)[]

Optional explicit block target list for multi-block migration workspaces.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-types.ts:93](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-types.ts#L93)

___

### currentMigrationVersion

• **currentMigrationVersion**: `string`

Current migration-lineage label for newly generated snapshots and rules.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-types.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-types.ts#L95)

___

### snapshotDir

• **snapshotDir**: `string`

Relative directory that stores versioned migration snapshots.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-types.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-types.ts#L97)

___

### supportedMigrationVersions

• **supportedMigrationVersions**: `string`[]

Ordered migration-lineage labels configured for this workspace, including the current label.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-types.ts:99](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-types.ts#L99)
