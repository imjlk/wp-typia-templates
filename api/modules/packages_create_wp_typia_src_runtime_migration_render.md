[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create-wp-typia/src/runtime/migration-render

# Module: packages/create-wp-typia/src/runtime/migration-render

## Table of contents

### Functions

- [formatDiffReport](packages_create_wp_typia_src_runtime_migration_render.md#formatdiffreport)
- [renderMigrationRuleFile](packages_create_wp_typia_src_runtime_migration_render.md#rendermigrationrulefile)
- [renderMigrationRegistryFile](packages_create_wp_typia_src_runtime_migration_render.md#rendermigrationregistryfile)
- [renderGeneratedDeprecatedFile](packages_create_wp_typia_src_runtime_migration_render.md#rendergenerateddeprecatedfile)
- [renderPhpMigrationRegistryFile](packages_create_wp_typia_src_runtime_migration_render.md#renderphpmigrationregistryfile)
- [renderVerifyFile](packages_create_wp_typia_src_runtime_migration_render.md#renderverifyfile)

## Functions

### formatDiffReport

▸ **formatDiffReport**(`diff`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `diff` | [`MigrationDiff`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationDiff.md) |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-render.ts:22](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-render.ts#L22)

___

### renderMigrationRuleFile

▸ **renderMigrationRuleFile**(`«destructured»`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`MigrationRuleFileInput`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationRuleFileInput.md) |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-render.ts:76](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-render.ts#L76)

___

### renderMigrationRegistryFile

▸ **renderMigrationRegistryFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-render.ts:167](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-render.ts#L167)

___

### renderGeneratedDeprecatedFile

▸ **renderGeneratedDeprecatedFile**(`entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-render.ts:198](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-render.ts#L198)

___

### renderPhpMigrationRegistryFile

▸ **renderPhpMigrationRegistryFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-render.ts:232](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-render.ts#L232)

___

### renderVerifyFile

▸ **renderVerifyFile**(`state`, `entries`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `state` | [`MigrationProjectState`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationProjectState.md) |
| `entries` | [`MigrationEntry`](../interfaces/packages_create_wp_typia_src_runtime_migration_types.MigrationEntry.md)[] |

#### Returns

`string`

#### Defined in

[packages/create-wp-typia/src/runtime/migration-render.ts:303](https://github.com/yourusername/wp-typia-boilerplate/blob/main/packages/create-wp-typia/src/runtime/migration-render.ts#L303)
