[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/migrations

# Module: examples/my-typia-block/src/migrations

## Table of contents

### Interfaces

- [MigrationAnalysis](../interfaces/examples_my_typia_block_src_migrations.MigrationAnalysis.md)
- [UnionBranchPreview](../interfaces/examples_my_typia_block_src_migrations.UnionBranchPreview.md)
- [MigrationPreview](../interfaces/examples_my_typia_block_src_migrations.MigrationPreview.md)
- [BlockScanResult](../interfaces/examples_my_typia_block_src_migrations.BlockScanResult.md)
- [BatchMigrationBlockResult](../interfaces/examples_my_typia_block_src_migrations.BatchMigrationBlockResult.md)
- [BatchMigrationPostResult](../interfaces/examples_my_typia_block_src_migrations.BatchMigrationPostResult.md)
- [BatchMigrationResult](../interfaces/examples_my_typia_block_src_migrations.BatchMigrationResult.md)

### Variables

- [migrationUtils](examples_my_typia_block_src_migrations.md#migrationutils)

### Functions

- [detectBlockMigration](examples_my_typia_block_src_migrations.md#detectblockmigration)
- [autoMigrate](examples_my_typia_block_src_migrations.md#automigrate)
- [scanSiteForMigrations](examples_my_typia_block_src_migrations.md#scansiteformigrations)
- [batchMigrateScanResults](examples_my_typia_block_src_migrations.md#batchmigratescanresults)
- [generateMigrationReport](examples_my_typia_block_src_migrations.md#generatemigrationreport)

## Variables

### migrationUtils

• `Const` **migrationUtils**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getStats` | () => \{ `blockName`: ``"create-block/my-typia-block"`` = migrationConfig.blockName; `currentVersion`: `string` = migrationRegistry.currentVersion; `deprecatedEntries`: `number` = deprecated.length; `supportedVersions`: `string`[]  } |
| `testMigration` | (`attributes`: `Record`\<`string`, `unknown`\>) => `Record`\<`string`, `unknown`\> |

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:376](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L376)

## Functions

### detectBlockMigration

▸ **detectBlockMigration**(`attributes`): [`MigrationAnalysis`](../interfaces/examples_my_typia_block_src_migrations.MigrationAnalysis.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, `unknown`\> |

#### Returns

[`MigrationAnalysis`](../interfaces/examples_my_typia_block_src_migrations.MigrationAnalysis.md)

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:140](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L140)

___

### autoMigrate

▸ **autoMigrate**(`attributes`): `Record`\<`string`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, `unknown`\> |

#### Returns

`Record`\<`string`, `unknown`\>

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:146](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L146)

___

### scanSiteForMigrations

▸ **scanSiteForMigrations**(`blockName?`): `Promise`\<[`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations.BlockScanResult.md)[]\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `blockName` | `string` | `migrationConfig.blockName` |

#### Returns

`Promise`\<[`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations.BlockScanResult.md)[]\>

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:159](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L159)

___

### batchMigrateScanResults

▸ **batchMigrateScanResults**(`results`, `«destructured»?`): `Promise`\<[`BatchMigrationResult`](../interfaces/examples_my_typia_block_src_migrations.BatchMigrationResult.md)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `results` | [`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations.BlockScanResult.md)[] | `undefined` |
| `«destructured»` | `Object` | `{}` |
| › `dryRun?` | `boolean` | `false` |

#### Returns

`Promise`\<[`BatchMigrationResult`](../interfaces/examples_my_typia_block_src_migrations.BatchMigrationResult.md)\>

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:211](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L211)

___

### generateMigrationReport

▸ **generateMigrationReport**(`scanResults`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `scanResults` | [`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations.BlockScanResult.md)[] |

#### Returns

`string`

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:325](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L325)
