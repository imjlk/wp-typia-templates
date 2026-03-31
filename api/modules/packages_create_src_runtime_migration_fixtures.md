[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-fixtures

# Module: packages/create/src/runtime/migration-fixtures

## Table of contents

### Functions

- [ensureEdgeFixtureFile](packages_create_src_runtime_migration_fixtures.md#ensureedgefixturefile)
- [createEdgeFixtureDocument](packages_create_src_runtime_migration_fixtures.md#createedgefixturedocument)

## Functions

### ensureEdgeFixtureFile

▸ **ensureEdgeFixtureFile**(`projectDir`, `fromVersion`, `toVersion`, `diff`, `«destructured»?`): `Object`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `projectDir` | `string` | `undefined` |
| `fromVersion` | `string` | `undefined` |
| `toVersion` | `string` | `undefined` |
| `diff` | [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) | `undefined` |
| `«destructured»` | `Object` | `{}` |
| › `force?` | `boolean` | `false` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `fixturePath` | `string` |
| `written` | `boolean` |

#### Defined in

[packages/create/src/runtime/migration-fixtures.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-fixtures.ts#L27)

___

### createEdgeFixtureDocument

▸ **createEdgeFixtureDocument**(`projectDir`, `fromVersion`, `toVersion`, `diff`): [`MigrationFixtureDocument`](../interfaces/packages_create_src_runtime_migration_types.MigrationFixtureDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `fromVersion` | `string` |
| `toVersion` | `string` |
| `diff` | [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) |

#### Returns

[`MigrationFixtureDocument`](../interfaces/packages_create_src_runtime_migration_types.MigrationFixtureDocument.md)

#### Defined in

[packages/create/src/runtime/migration-fixtures.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-fixtures.ts#L45)
