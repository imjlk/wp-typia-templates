[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-types

# Module: packages/create/src/runtime/migration-types

## Table of contents

### Interfaces

- [ManifestConstraints](../interfaces/packages_create_src_runtime_migration_types.ManifestConstraints.md)
- [ManifestUnionMetadata](../interfaces/packages_create_src_runtime_migration_types.ManifestUnionMetadata.md)
- [ManifestTsMetadata](../interfaces/packages_create_src_runtime_migration_types.ManifestTsMetadata.md)
- [ManifestTypiaMetadata](../interfaces/packages_create_src_runtime_migration_types.ManifestTypiaMetadata.md)
- [ManifestWpMetadata](../interfaces/packages_create_src_runtime_migration_types.ManifestWpMetadata.md)
- [ManifestAttribute](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md)
- [ManifestDocument](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md)
- [ManifestSummaryAttribute](../interfaces/packages_create_src_runtime_migration_types.ManifestSummaryAttribute.md)
- [ManifestSummary](../interfaces/packages_create_src_runtime_migration_types.ManifestSummary.md)
- [UnionBranchSummary](../interfaces/packages_create_src_runtime_migration_types.UnionBranchSummary.md)
- [MigrationConfig](../interfaces/packages_create_src_runtime_migration_types.MigrationConfig.md)
- [MigrationProjectPaths](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectPaths.md)
- [MigrationProjectState](../interfaces/packages_create_src_runtime_migration_types.MigrationProjectState.md)
- [MigrationEntry](../interfaces/packages_create_src_runtime_migration_types.MigrationEntry.md)
- [RuleMetadata](../interfaces/packages_create_src_runtime_migration_types.RuleMetadata.md)
- [FlattenedAttributeDescriptor](../interfaces/packages_create_src_runtime_migration_types.FlattenedAttributeDescriptor.md)
- [DiffOutcome](../interfaces/packages_create_src_runtime_migration_types.DiffOutcome.md)
- [RenameCandidate](../interfaces/packages_create_src_runtime_migration_types.RenameCandidate.md)
- [TransformSuggestion](../interfaces/packages_create_src_runtime_migration_types.TransformSuggestion.md)
- [MigrationDiffSummary](../interfaces/packages_create_src_runtime_migration_types.MigrationDiffSummary.md)
- [MigrationDiff](../interfaces/packages_create_src_runtime_migration_types.MigrationDiff.md)
- [MigrationRuleFileInput](../interfaces/packages_create_src_runtime_migration_types.MigrationRuleFileInput.md)
- [MigrationFixtureCase](../interfaces/packages_create_src_runtime_migration_types.MigrationFixtureCase.md)
- [MigrationFixtureDocument](../interfaces/packages_create_src_runtime_migration_types.MigrationFixtureDocument.md)
- [ParsedMigrationArgs](../interfaces/packages_create_src_runtime_migration_types.ParsedMigrationArgs.md)

### Type Aliases

- [JsonPrimitive](packages_create_src_runtime_migration_types.md#jsonprimitive)
- [JsonValue](packages_create_src_runtime_migration_types.md#jsonvalue)
- [ManifestTsKind](packages_create_src_runtime_migration_types.md#manifesttskind)
- [RenderLine](packages_create_src_runtime_migration_types.md#renderline)
- [JsonObject](packages_create_src_runtime_migration_types.md#jsonobject)

## Type Aliases

### JsonPrimitive

Ƭ **JsonPrimitive**: `string` \| `number` \| `boolean` \| ``null``

#### Defined in

[packages/create/src/runtime/migration-types.ts:1](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L1)

___

### JsonValue

Ƭ **JsonValue**: [`JsonPrimitive`](packages_create_src_runtime_migration_types.md#jsonprimitive) \| [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)[] \| \{ `[key: string]`: [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue);  }

#### Defined in

[packages/create/src/runtime/migration-types.ts:2](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L2)

___

### ManifestTsKind

Ƭ **ManifestTsKind**: ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"array"`` \| ``"object"`` \| ``"union"``

#### Defined in

[packages/create/src/runtime/migration-types.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L4)

___

### RenderLine

Ƭ **RenderLine**: (`line`: `string`) => `void`

#### Type declaration

▸ (`line`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `line` | `string` |

##### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-types.ts:195](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L195)

___

### JsonObject

Ƭ **JsonObject**: `Record`\<`string`, [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)\>

#### Defined in

[packages/create/src/runtime/migration-types.ts:196](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-types.ts#L196)
