[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/commands/create

# Module: packages/wp-typia/src/commands/create

## Table of contents

### References

- [default](packages_wp_typia_src_commands_create.md#default)

### Variables

- [createCommand](packages_wp_typia_src_commands_create.md#createcommand)

## References

### default

Renames and re-exports [createCommand](packages_wp_typia_src_commands_create.md#createcommand)

## Variables

### createCommand

• `Const` **createCommand**: `RunnableCommand`\<\{ `data-storage`: \{ `description`: `string` = "Persistence storage mode for persistence-capable templates."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `namespace`: \{ `description`: `string` = "Override the default block namespace."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `no-install`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Skip dependency installation after scaffold."; `schema`: `ZodDefault`\<`ZodBoolean`\>  } ; `package-manager`: \{ `description`: `string` = "Package manager to use for install and scripts."; `schema`: `ZodOptional`\<`ZodString`\> ; `short`: `string` = "p" } ; `persistence-policy`: \{ `description`: `string` = "Authenticated or public write policy for persistence-capable templates."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `php-prefix`: \{ `description`: `string` = "Custom PHP symbol prefix."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `template`: \{ `description`: `string` = "Template id or external template package."; `schema`: `ZodOptional`\<`ZodString`\> ; `short`: `string` = "t" } ; `text-domain`: \{ `description`: `string` = "Custom text domain for the generated project."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `variant`: \{ `description`: `string` = "Optional template variant identifier."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `with-migration-ui`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Enable migration UI support when the template supports it."; `schema`: `ZodDefault`\<`ZodBoolean`\>  } ; `with-test-preset`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Include the Playwright smoke-test preset."; `schema`: `ZodDefault`\<`ZodBoolean`\>  } ; `with-wp-env`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Include a local wp-env preset."; `schema`: `ZodDefault`\<`ZodBoolean`\>  } ; `yes`: \{ `argumentKind`: ``"flag"`` ; `description`: `string` = "Accept defaults without prompt fallbacks."; `schema`: `ZodDefault`\<`ZodBoolean`\> ; `short`: `string` = "y" }  }, {}, `string`\> & {}

#### Defined in

[packages/wp-typia/src/commands/create.ts:86](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/commands/create.ts#L86)
