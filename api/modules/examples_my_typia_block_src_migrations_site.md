[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/migrations/site

# Module: examples/my-typia-block/src/migrations/site

## Table of contents

### Functions

- [scanSiteForMigrations](examples_my_typia_block_src_migrations_site.md#scansiteformigrations)
- [batchMigrateScanResults](examples_my_typia_block_src_migrations_site.md#batchmigratescanresults)

## Functions

### scanSiteForMigrations

▸ **scanSiteForMigrations**(`blockName?`): `Promise`\<[`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations_types.BlockScanResult.md)[]\>

Scans editable posts for blocks that still need migration work.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `blockName` | `string` | `migrationConfig.blockName` |

#### Returns

`Promise`\<[`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations_types.BlockScanResult.md)[]\>

#### Defined in

[examples/my-typia-block/src/migrations/site.ts:45](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/site.ts#L45)

___

### batchMigrateScanResults

▸ **batchMigrateScanResults**(`results`, `root0?`): `Promise`\<[`BatchMigrationResult`](../interfaces/examples_my_typia_block_src_migrations_types.BatchMigrationResult.md)\>

Replays a scan result set and writes migrated post content when requested.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `results` | [`BlockScanResult`](../interfaces/examples_my_typia_block_src_migrations_types.BlockScanResult.md)[] | `undefined` |
| `root0` | `Object` | `{}` |
| `root0.dryRun?` | `boolean` | `false` |

#### Returns

`Promise`\<[`BatchMigrationResult`](../interfaces/examples_my_typia_block_src_migrations_types.BatchMigrationResult.md)\>

#### Defined in

[examples/my-typia-block/src/migrations/site.ts:103](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/site.ts#L103)
