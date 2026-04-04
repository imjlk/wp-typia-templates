[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-render

# Module: packages/create/src/runtime/migration-render

## Table of contents

### Functions

- [formatDiffReport](packages_create_src_runtime_migration_render.md#formatdiffreport)
- [renderMigrationRuleFile](packages_create_src_runtime_migration_render.md#rendermigrationrulefile)
- [renderMigrationRegistryFile](packages_create_src_runtime_migration_render.md#rendermigrationregistryfile)
- [renderGeneratedDeprecatedFile](packages_create_src_runtime_migration_render.md#rendergenerateddeprecatedfile)
- [renderGeneratedMigrationIndexFile](packages_create_src_runtime_migration_render.md#rendergeneratedmigrationindexfile)
- [renderPhpMigrationRegistryFile](packages_create_src_runtime_migration_render.md#renderphpmigrationregistryfile)
- [renderVerifyFile](packages_create_src_runtime_migration_render.md#renderverifyfile)
- [renderFuzzFile](packages_create_src_runtime_migration_render.md#renderfuzzfile)

## Functions

### formatDiffReport

▸ **formatDiffReport**(`diff`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `diff` | [`MigrationDiff`](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:29](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L29)

___

### renderMigrationRuleFile

▸ **renderMigrationRuleFile**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`MigrationRuleFileInput`](../interfaces/packages_create_src_runtime_migration_types.MigrationRuleFileInput.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L85)

___

### renderMigrationRegistryFile

▸ **renderMigrationRegistryFile**(`state`, `blockKey`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `blockKey` | `string` |
| `entries` | [`GeneratedMigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.GeneratedMigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:188](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L188)

___

### renderGeneratedDeprecatedFile

▸ **renderGeneratedDeprecatedFile**(`entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:243](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L243)

___

### renderGeneratedMigrationIndexFile

▸ **renderGeneratedMigrationIndexFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:279](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L279)

___

### renderPhpMigrationRegistryFile

▸ **renderPhpMigrationRegistryFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:331](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L331)

___

### renderVerifyFile

▸ **renderVerifyFile**(`state`, `blockKey`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `blockKey` | `string` |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:408](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L408)

___

### renderFuzzFile

▸ **renderFuzzFile**(`state`, `blockKey`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `blockKey` | `string` |
| `entries` | [`GeneratedMigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.GeneratedMigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:496](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L496)
