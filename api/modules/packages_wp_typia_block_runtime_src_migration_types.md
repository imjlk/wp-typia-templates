[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/migration-types

# Module: packages/wp-typia-block-runtime/src/migration-types

## Table of contents

### Interfaces

- [ManifestConstraints](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestConstraints.md)
- [ManifestUnionMetadata](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestUnionMetadata.md)
- [ManifestTsMetadata](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestTsMetadata.md)
- [ManifestTypiaMetadata](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestTypiaMetadata.md)
- [ManifestWpMetadata](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestWpMetadata.md)
- [ManifestAttribute](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestAttribute.md)
- [ManifestDocument](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md)

### Type Aliases

- [JsonPrimitive](packages_wp_typia_block_runtime_src_migration_types.md#jsonprimitive)
- [JsonValue](packages_wp_typia_block_runtime_src_migration_types.md#jsonvalue)
- [ManifestTsKind](packages_wp_typia_block_runtime_src_migration_types.md#manifesttskind)

## Type Aliases

### JsonPrimitive

Ƭ **JsonPrimitive**: `string` \| `number` \| `boolean` \| ``null``

#### Defined in

[packages/wp-typia-block-runtime/src/migration-types.ts:1](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/migration-types.ts#L1)

___

### JsonValue

Ƭ **JsonValue**: [`JsonPrimitive`](packages_wp_typia_block_runtime_src_migration_types.md#jsonprimitive) \| [`JsonValue`](packages_wp_typia_block_runtime_src_migration_types.md#jsonvalue)[] \| \{ `[key: string]`: [`JsonValue`](packages_wp_typia_block_runtime_src_migration_types.md#jsonvalue);  }

#### Defined in

[packages/wp-typia-block-runtime/src/migration-types.ts:2](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/migration-types.ts#L2)

___

### ManifestTsKind

Ƭ **ManifestTsKind**: ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"array"`` \| ``"object"`` \| ``"union"``

#### Defined in

[packages/wp-typia-block-runtime/src/migration-types.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/migration-types.ts#L4)
