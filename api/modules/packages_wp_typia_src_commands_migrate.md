[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/commands/migrate

# Module: packages/wp-typia/src/commands/migrate

## Table of contents

### References

- [default](packages_wp_typia_src_commands_migrate.md#default)

### Variables

- [migrateCommand](packages_wp_typia_src_commands_migrate.md#migratecommand)

## References

### default

Renames and re-exports [migrateCommand](packages_wp_typia_src_commands_migrate.md#migratecommand)

## Variables

### migrateCommand

• `Const` **migrateCommand**: `RunnableCommand`\<\{ `all`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Run across every configured migration version and block target."; `schema`: `ZodDefault`\<`ZodBoolean`\>  } ; `current-migration-version`: \{ `description`: `string` = "Current migration version label for \`migrate init\`."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `force`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Force overwrite behavior where supported."; `schema`: `ZodDefault`\<`ZodBoolean`\>  } ; `from-migration-version`: \{ `description`: `string` = "Source migration version label."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `iterations`: \{ `description`: `string` = "Iteration count for \`migrate fuzz\`."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `migration-version`: \{ `description`: `string` = "Version label to capture with \`migrate snapshot\`."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `seed`: \{ `description`: `string` = "Deterministic fuzz seed."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `to-migration-version`: \{ `description`: `string` = "Target migration version label."; `schema`: `ZodOptional`\<`ZodString`\>  }  }, {}, `string`\> & {}

#### Defined in

[packages/wp-typia/src/commands/migrate.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/commands/migrate.ts#L59)
