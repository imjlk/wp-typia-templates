[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/cli-prompt

# Module: packages/wp-typia-project-tools/src/runtime/cli-prompt

## Table of contents

### Interfaces

- [ReadlinePrompt](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_prompt.ReadlinePrompt.md)

### Functions

- [createReadlinePrompt](packages_wp_typia_project_tools_src_runtime_cli_prompt.md#createreadlineprompt)

## Functions

### createReadlinePrompt

▸ **createReadlinePrompt**(): [`ReadlinePrompt`](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_prompt.ReadlinePrompt.md)

Create the default readline-backed prompt implementation for the CLI.

#### Returns

[`ReadlinePrompt`](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_prompt.ReadlinePrompt.md)

A prompt adapter that reads from stdin and writes to stdout.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-prompt.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-prompt.ts#L25)
