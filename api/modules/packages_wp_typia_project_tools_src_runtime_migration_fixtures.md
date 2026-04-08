[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/migration-fixtures

# Module: packages/wp-typia-project-tools/src/runtime/migration-fixtures

## Table of contents

### Functions

- [ensureEdgeFixtureFile](packages_wp_typia_project_tools_src_runtime_migration_fixtures.md#ensureedgefixturefile)
- [createEdgeFixtureDocument](packages_wp_typia_project_tools_src_runtime_migration_fixtures.md#createedgefixturedocument)

## Functions

### ensureEdgeFixtureFile

▸ **ensureEdgeFixtureFile**(`projectDir`, `block`, `fromVersion`, `toVersion`, `diff`, `«destructured»?`): `Object`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `projectDir` | `string` | `undefined` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) | `undefined` |
| `fromVersion` | `string` | `undefined` |
| `toVersion` | `string` | `undefined` |
| `diff` | [`MigrationDiff`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationDiff.md) | `undefined` |
| `«destructured»` | `Object` | `{}` |
| › `force?` | `boolean` | `false` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `fixturePath` | `string` |
| `written` | `boolean` |

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-fixtures.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-fixtures.ts#L31)

___

### createEdgeFixtureDocument

▸ **createEdgeFixtureDocument**(`projectDir`, `block`, `fromVersion`, `toVersion`, `diff`): [`MigrationFixtureDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationFixtureDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `block` | [`MigrationBlockConfig`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationBlockConfig.md) |
| `fromVersion` | `string` |
| `toVersion` | `string` |
| `diff` | [`MigrationDiff`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationDiff.md) |

#### Returns

[`MigrationFixtureDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.MigrationFixtureDocument.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-fixtures.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-fixtures.ts#L51)
