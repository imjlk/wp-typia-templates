[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-render

# Module: packages/create/src/runtime/migration-render

## Table of contents

### Functions

- [formatDiffReport](packages_create_src_runtime_migration_render.md#formatdiffreport)
- [renderMigrationRuleFile](packages_create_src_runtime_migration_render.md#rendermigrationrulefile)
- [renderMigrationRegistryFile](packages_create_src_runtime_migration_render.md#rendermigrationregistryfile)
- [renderGeneratedDeprecatedFile](packages_create_src_runtime_migration_render.md#rendergenerateddeprecatedfile)
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

[packages/create/src/runtime/migration-render.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L27)

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

[packages/create/src/runtime/migration-render.ts:83](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L83)

___

### renderMigrationRegistryFile

▸ **renderMigrationRegistryFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`GeneratedMigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.GeneratedMigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:174](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L174)

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

[packages/create/src/runtime/migration-render.ts:224](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L224)

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

[packages/create/src/runtime/migration-render.ts:260](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L260)

___

### renderVerifyFile

▸ **renderVerifyFile**(`state`, `entries`): `string`

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

### renderFuzzFile

▸ **renderFuzzFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`GeneratedMigrationEntry`](../interfaces/packages_create_src_runtime_migration_types.GeneratedMigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-render.ts:414](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-render.ts#L414)
