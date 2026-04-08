[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/command-contract

# Module: packages/wp-typia/src/command-contract

## Table of contents

### Variables

- [WP\_TYPIA\_CANONICAL\_CREATE\_USAGE](packages_wp_typia_src_command_contract.md#wp_typia_canonical_create_usage)
- [WP\_TYPIA\_POSITIONAL\_ALIAS\_USAGE](packages_wp_typia_src_command_contract.md#wp_typia_positional_alias_usage)
- [WP\_TYPIA\_CANONICAL\_MIGRATE\_USAGE](packages_wp_typia_src_command_contract.md#wp_typia_canonical_migrate_usage)
- [WP\_TYPIA\_DEPRECATED\_MIGRATIONS\_USAGE](packages_wp_typia_src_command_contract.md#wp_typia_deprecated_migrations_usage)
- [WP\_TYPIA\_BUNLI\_MIGRATION\_DOC](packages_wp_typia_src_command_contract.md#wp_typia_bunli_migration_doc)
- [WP\_TYPIA\_RESERVED\_TOP\_LEVEL\_COMMAND\_NAMES](packages_wp_typia_src_command_contract.md#wp_typia_reserved_top_level_command_names)
- [WP\_TYPIA\_TOP\_LEVEL\_COMMAND\_NAMES](packages_wp_typia_src_command_contract.md#wp_typia_top_level_command_names)
- [WP\_TYPIA\_FUTURE\_COMMAND\_TREE](packages_wp_typia_src_command_contract.md#wp_typia_future_command_tree)

### Functions

- [isReservedTopLevelCommandName](packages_wp_typia_src_command_contract.md#isreservedtoplevelcommandname)
- [normalizeWpTypiaArgv](packages_wp_typia_src_command_contract.md#normalizewptypiaargv)

## Variables

### WP\_TYPIA\_CANONICAL\_CREATE\_USAGE

• `Const` **WP\_TYPIA\_CANONICAL\_CREATE\_USAGE**: ``"wp-typia create <project-dir>"``

#### Defined in

[packages/wp-typia/src/command-contract.ts:1](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L1)

___

### WP\_TYPIA\_POSITIONAL\_ALIAS\_USAGE

• `Const` **WP\_TYPIA\_POSITIONAL\_ALIAS\_USAGE**: ``"wp-typia <project-dir>"``

#### Defined in

[packages/wp-typia/src/command-contract.ts:2](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L2)

___

### WP\_TYPIA\_CANONICAL\_MIGRATE\_USAGE

• `Const` **WP\_TYPIA\_CANONICAL\_MIGRATE\_USAGE**: ``"wp-typia migrate <subcommand>"``

#### Defined in

[packages/wp-typia/src/command-contract.ts:3](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L3)

___

### WP\_TYPIA\_DEPRECATED\_MIGRATIONS\_USAGE

• `Const` **WP\_TYPIA\_DEPRECATED\_MIGRATIONS\_USAGE**: ``"wp-typia migrations <subcommand>"``

#### Defined in

[packages/wp-typia/src/command-contract.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L4)

___

### WP\_TYPIA\_BUNLI\_MIGRATION\_DOC

• `Const` **WP\_TYPIA\_BUNLI\_MIGRATION\_DOC**: ``"docs/bunli-cli-migration.md"``

#### Defined in

[packages/wp-typia/src/command-contract.ts:5](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L5)

___

### WP\_TYPIA\_RESERVED\_TOP\_LEVEL\_COMMAND\_NAMES

• `Const` **WP\_TYPIA\_RESERVED\_TOP\_LEVEL\_COMMAND\_NAMES**: readonly [``"create"``, ``"add"``, ``"migrate"``, ``"templates"``, ``"doctor"``, ``"mcp"``, ``"skills"``, ``"completions"``, ``"complete"``]

#### Defined in

[packages/wp-typia/src/command-contract.ts:7](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L7)

___

### WP\_TYPIA\_TOP\_LEVEL\_COMMAND\_NAMES

• `Const` **WP\_TYPIA\_TOP\_LEVEL\_COMMAND\_NAMES**: readonly [``"create"``, ``"add"``, ``"migrate"``, ``"templates"``, ``"doctor"``, ``"mcp"``]

#### Defined in

[packages/wp-typia/src/command-contract.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L19)

___

### WP\_TYPIA\_FUTURE\_COMMAND\_TREE

• `Const` **WP\_TYPIA\_FUTURE\_COMMAND\_TREE**: readonly [\{ `description`: ``"Scaffold a new wp-typia project."`` = "Scaffold a new wp-typia project."; `name`: ``"create"`` = "create" }, \{ `description`: ``"Extend an official wp-typia workspace."`` = "Extend an official wp-typia workspace."; `name`: ``"add"`` = "add"; `subcommands`: readonly [``"block"``, ``"variation"``, ``"pattern"``, ``"binding-source"``, ``"hooked-block"``]  }, \{ `description`: ``"Run migration workflows."`` = "Run migration workflows."; `name`: ``"migrate"`` = "migrate"; `subcommands`: readonly [``"init"``, ``"snapshot"``, ``"diff"``, ``"scaffold"``, ``"plan"``, ``"wizard"``, ``"verify"``, ``"doctor"``, ``"fixtures"``, ``"fuzz"``]  }, \{ `description`: ``"Inspect scaffold templates."`` = "Inspect scaffold templates."; `name`: ``"templates"`` = "templates"; `subcommands`: readonly [``"list"``, ``"inspect"``]  }, \{ `description`: ``"Run repository and project diagnostics."`` = "Run repository and project diagnostics."; `name`: ``"doctor"`` = "doctor" }, \{ `description`: ``"Inspect or sync schema-driven MCP metadata."`` = "Inspect or sync schema-driven MCP metadata."; `name`: ``"mcp"`` = "mcp"; `subcommands`: readonly [``"list"``, ``"sync"``]  }]

#### Defined in

[packages/wp-typia/src/command-contract.ts:106](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L106)

## Functions

### isReservedTopLevelCommandName

▸ **isReservedTopLevelCommandName**(`value`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/wp-typia/src/command-contract.ts:148](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L148)

___

### normalizeWpTypiaArgv

▸ **normalizeWpTypiaArgv**(`argv`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `argv` | `string`[] |

#### Returns

`string`[]

#### Defined in

[packages/wp-typia/src/command-contract.ts:205](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L205)
