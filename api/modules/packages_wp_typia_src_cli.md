[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/cli

# Module: packages/wp-typia/src/cli

## Table of contents

### References

- [default](packages_wp_typia_src_cli.md#default)

### Variables

- [bunliPreparedCommands](packages_wp_typia_src_cli.md#bunlipreparedcommands)

### Functions

- [createPreparedWpTypiaCli](packages_wp_typia_src_cli.md#createpreparedwptypiacli)

## References

### default

Renames and re-exports [createPreparedWpTypiaCli](packages_wp_typia_src_cli.md#createpreparedwptypiacli)

## Variables

### bunliPreparedCommands

• `Const` **bunliPreparedCommands**: `Command`\<`any`, `any`\>[]

#### Defined in

[packages/wp-typia/src/cli.ts:10](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/cli.ts#L10)

## Functions

### createPreparedWpTypiaCli

▸ **createPreparedWpTypiaCli**(): `Promise`\<`CLI`\>

Create the future Bunli-owned `wp-typia` CLI without switching the active
published runtime in this release.

The current `bin/wp-typia.js` entry remains authoritative until the next
migration round wires this CLI into the published package surface.

#### Returns

`Promise`\<`CLI`\>

Prepared Bunli CLI instance for command-tree validation.

#### Defined in

[packages/wp-typia/src/cli.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/cli.ts#L27)
