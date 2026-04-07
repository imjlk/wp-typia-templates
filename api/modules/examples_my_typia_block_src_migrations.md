[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/migrations

# Module: examples/my-typia-block/src/migrations

## Table of contents

### References

- [BatchMigrationBlockResult](examples_my_typia_block_src_migrations.md#batchmigrationblockresult)
- [BatchMigrationPostResult](examples_my_typia_block_src_migrations.md#batchmigrationpostresult)
- [BatchMigrationResult](examples_my_typia_block_src_migrations.md#batchmigrationresult)
- [BlockScanResult](examples_my_typia_block_src_migrations.md#blockscanresult)
- [MigrationAnalysis](examples_my_typia_block_src_migrations.md#migrationanalysis)
- [MigrationPreview](examples_my_typia_block_src_migrations.md#migrationpreview)
- [UnionBranchPreview](examples_my_typia_block_src_migrations.md#unionbranchpreview)
- [autoMigrate](examples_my_typia_block_src_migrations.md#automigrate)
- [batchMigrateScanResults](examples_my_typia_block_src_migrations.md#batchmigratescanresults)
- [detectBlockMigration](examples_my_typia_block_src_migrations.md#detectblockmigration)
- [generateMigrationReport](examples_my_typia_block_src_migrations.md#generatemigrationreport)
- [scanSiteForMigrations](examples_my_typia_block_src_migrations.md#scansiteformigrations)

### Variables

- [migrationUtils](examples_my_typia_block_src_migrations.md#migrationutils)

## References

### BatchMigrationBlockResult

Re-exports [BatchMigrationBlockResult](../interfaces/examples_my_typia_block_src_migrations_types.BatchMigrationBlockResult.md)

___

### BatchMigrationPostResult

Re-exports [BatchMigrationPostResult](../interfaces/examples_my_typia_block_src_migrations_types.BatchMigrationPostResult.md)

___

### BatchMigrationResult

Re-exports [BatchMigrationResult](../interfaces/examples_my_typia_block_src_migrations_types.BatchMigrationResult.md)

___

### BlockScanResult

Re-exports [BlockScanResult](../interfaces/examples_my_typia_block_src_migrations_types.BlockScanResult.md)

___

### MigrationAnalysis

Re-exports [MigrationAnalysis](../interfaces/examples_my_typia_block_src_migrations_types.MigrationAnalysis.md)

___

### MigrationPreview

Re-exports [MigrationPreview](../interfaces/examples_my_typia_block_src_migrations_types.MigrationPreview.md)

___

### UnionBranchPreview

Re-exports [UnionBranchPreview](../interfaces/examples_my_typia_block_src_migrations_types.UnionBranchPreview.md)

___

### autoMigrate

Re-exports [autoMigrate](examples_my_typia_block_src_migrations_analysis.md#automigrate)

___

### batchMigrateScanResults

Re-exports [batchMigrateScanResults](examples_my_typia_block_src_migrations_site.md#batchmigratescanresults)

___

### detectBlockMigration

Re-exports [detectBlockMigration](examples_my_typia_block_src_migrations_analysis.md#detectblockmigration)

___

### generateMigrationReport

Re-exports [generateMigrationReport](examples_my_typia_block_src_migrations_report.md#generatemigrationreport)

___

### scanSiteForMigrations

Re-exports [scanSiteForMigrations](examples_my_typia_block_src_migrations_site.md#scansiteformigrations)

## Variables

### migrationUtils

• `Const` **migrationUtils**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getStats` | () => \{ `blockName`: ``"create-block/my-typia-block"`` = migrationConfig.blockName; `currentMigrationVersion`: `string` = migrationRegistry.currentMigrationVersion; `deprecatedEntries`: `number` = deprecated.length; `legacyMigrationVersions`: `string`[] ; `supportedMigrationVersions`: `string`[]  } |
| `testMigration` | (`attributes`: `Record`\<`string`, `unknown`\>) => `Record`\<`string`, `unknown`\> |

#### Defined in

[examples/my-typia-block/src/migrations/index.ts:26](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/index.ts#L26)
