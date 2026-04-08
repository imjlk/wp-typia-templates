[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/commands/add

# Module: packages/wp-typia/src/commands/add

## Table of contents

### References

- [default](packages_wp_typia_src_commands_add.md#default)

### Variables

- [addCommand](packages_wp_typia_src_commands_add.md#addcommand)

## References

### default

Renames and re-exports [addCommand](packages_wp_typia_src_commands_add.md#addcommand)

## Variables

### addCommand

• `Const` **addCommand**: `RunnableCommand`\<\{ `block`: \{ `description`: `string` = "Target block slug for variation workflows."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `data-storage`: \{ `description`: `string` = "Persistence storage mode for persistence-capable templates."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `persistence-policy`: \{ `description`: `string` = "Persistence write policy for persistence-capable templates."; `schema`: `ZodOptional`\<`ZodString`\>  } ; `template`: \{ `description`: `string` = "Built-in block family for the new block."; `schema`: `ZodOptional`\<`ZodString`\>  }  }, {}, `string`\> & {}

#### Defined in

[packages/wp-typia/src/commands/add.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/commands/add.ts#L42)
