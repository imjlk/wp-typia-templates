[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/hooked-blocks

# Module: packages/wp-typia-project-tools/src/runtime/hooked-blocks

## Table of contents

### Type Aliases

- [HookedBlockPositionId](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hookedblockpositionid)

### Variables

- [HOOKED\_BLOCK\_POSITION\_IDS](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hooked_block_position_ids)
- [HOOKED\_BLOCK\_POSITION\_SET](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hooked_block_position_set)
- [HOOKED\_BLOCK\_ANCHOR\_PATTERN](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hooked_block_anchor_pattern)

## Type Aliases

### HookedBlockPositionId

Ƭ **HookedBlockPositionId**: typeof [`HOOKED_BLOCK_POSITION_IDS`](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hooked_block_position_ids)[`number`]

Union of valid `blockHooks` positions accepted by wp-typia workspace flows.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts:10](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts#L10)

## Variables

### HOOKED\_BLOCK\_POSITION\_IDS

• `Const` **HOOKED\_BLOCK\_POSITION\_IDS**: readonly [``"before"``, ``"after"``, ``"firstChild"``, ``"lastChild"``]

Shared hooked-block metadata primitives used by add flows, doctor checks,
and interactive prompts.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts:5](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts#L5)

___

### HOOKED\_BLOCK\_POSITION\_SET

• `Const` **HOOKED\_BLOCK\_POSITION\_SET**: `Set`\<`string`\>

Fast lookup set for validating hooked-block positions across runtime surfaces.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts:15](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts#L15)

___

### HOOKED\_BLOCK\_ANCHOR\_PATTERN

• `Const` **HOOKED\_BLOCK\_ANCHOR\_PATTERN**: `RegExp`

Canonical `namespace/slug` block name format required for hooked-block anchors.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts:20](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/hooked-blocks.ts#L20)
