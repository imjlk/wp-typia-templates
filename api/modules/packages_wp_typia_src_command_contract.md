[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/command-contract

# Module: packages/wp-typia/src/command-contract

## Table of contents

### Type Aliases

- [WpTypiaReservedTopLevelCommandName](packages_wp_typia_src_command_contract.md#wptypiareservedtoplevelcommandname)

### Variables

- [WP\_TYPIA\_CANONICAL\_CREATE\_USAGE](packages_wp_typia_src_command_contract.md#wp_typia_canonical_create_usage)
- [WP\_TYPIA\_POSITIONAL\_ALIAS\_USAGE](packages_wp_typia_src_command_contract.md#wp_typia_positional_alias_usage)
- [WP\_TYPIA\_BUNLI\_MIGRATION\_DOC](packages_wp_typia_src_command_contract.md#wp_typia_bunli_migration_doc)
- [WP\_TYPIA\_RESERVED\_TOP\_LEVEL\_COMMAND\_NAMES](packages_wp_typia_src_command_contract.md#wp_typia_reserved_top_level_command_names)
- [WP\_TYPIA\_FUTURE\_COMMAND\_TREE](packages_wp_typia_src_command_contract.md#wp_typia_future_command_tree)

## Type Aliases

### WpTypiaReservedTopLevelCommandName

Ƭ **WpTypiaReservedTopLevelCommandName**: typeof [`WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES`](packages_wp_typia_src_command_contract.md#wp_typia_reserved_top_level_command_names)[`number`]

#### Defined in

[packages/wp-typia/src/command-contract.ts:13](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L13)

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

### WP\_TYPIA\_BUNLI\_MIGRATION\_DOC

• `Const` **WP\_TYPIA\_BUNLI\_MIGRATION\_DOC**: ``"docs/bunli-cli-migration.md"``

#### Defined in

[packages/wp-typia/src/command-contract.ts:3](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L3)

___

### WP\_TYPIA\_RESERVED\_TOP\_LEVEL\_COMMAND\_NAMES

• `Const` **WP\_TYPIA\_RESERVED\_TOP\_LEVEL\_COMMAND\_NAMES**: readonly [``"create"``, ``"add"``, ``"templates"``, ``"migrations"``, ``"doctor"``]

#### Defined in

[packages/wp-typia/src/command-contract.ts:5](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L5)

___

### WP\_TYPIA\_FUTURE\_COMMAND\_TREE

• `Const` **WP\_TYPIA\_FUTURE\_COMMAND\_TREE**: readonly [\{ `description`: ``"Scaffold a new wp-typia project."`` = "Scaffold a new wp-typia project."; `name`: ``"create"`` = "create" }, \{ `description`: ``"Extend an official wp-typia workspace."`` = "Extend an official wp-typia workspace."; `name`: ``"add"`` = "add"; `subcommands`: readonly [``"block"``, ``"variation"``, ``"pattern"``]  }, \{ `description`: ``"Inspect scaffold templates."`` = "Inspect scaffold templates."; `name`: ``"templates"`` = "templates"; `subcommands`: readonly [``"list"``, ``"inspect"``]  }, \{ `description`: ``"Run migration workflows."`` = "Run migration workflows."; `name`: ``"migrations"`` = "migrations"; `subcommands`: readonly [``"init"``, ``"snapshot"``, ``"diff"``, ``"scaffold"``, ``"plan"``, ``"wizard"``, ``"verify"``, ``"doctor"``, ``"fixtures"``, ``"fuzz"``]  }, \{ `description`: ``"Run repository and project diagnostics."`` = "Run repository and project diagnostics."; `name`: ``"doctor"`` = "doctor" }]

#### Defined in

[packages/wp-typia/src/command-contract.ts:16](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/command-contract.ts#L16)
