[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/template-render](../modules/packages_wp_typia_project_tools_src_runtime_template_render.md) / CopyRawDirectoryOptions

# Interface: CopyRawDirectoryOptions

[packages/wp-typia-project-tools/src/runtime/template-render](../modules/packages_wp_typia_project_tools_src_runtime_template_render.md).CopyRawDirectoryOptions

Optional controls for raw directory copies.

The filter runs for each discovered entry before copying. Returning `false`
skips only that entry; when the skipped entry is a directory, the subtree is
skipped as well.

## Table of contents

### Properties

- [filter](packages_wp_typia_project_tools_src_runtime_template_render.CopyRawDirectoryOptions.md#filter)

## Properties

### filter

• `Optional` **filter**: (`sourcePath`: `string`, `targetPath`: `string`, `entry`: `Dirent`\<`string`\>) => `boolean` \| `Promise`\<`boolean`\>

Predicate that decides whether a discovered entry should be copied.

Throwing or rejecting aborts the copy and bubbles to the caller.

#### Type declaration

▸ (`sourcePath`, `targetPath`, `entry`): `boolean` \| `Promise`\<`boolean`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `sourcePath` | `string` |
| `targetPath` | `string` |
| `entry` | `Dirent`\<`string`\> |

##### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-render.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-render.ts#L42)
