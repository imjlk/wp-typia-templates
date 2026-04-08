[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/template-render

# Module: packages/wp-typia-project-tools/src/runtime/template-render

## Table of contents

### Interfaces

- [CopyRawDirectoryOptions](../interfaces/packages_wp_typia_project_tools_src_runtime_template_render.CopyRawDirectoryOptions.md)

### Type Aliases

- [TemplateRenderView](packages_wp_typia_project_tools_src_runtime_template_render.md#templaterenderview)

### Functions

- [copyRawDirectory](packages_wp_typia_project_tools_src_runtime_template_render.md#copyrawdirectory)
- [copyRenderedDirectory](packages_wp_typia_project_tools_src_runtime_template_render.md#copyrendereddirectory)
- [copyInterpolatedDirectory](packages_wp_typia_project_tools_src_runtime_template_render.md#copyinterpolateddirectory)
- [pathExists](packages_wp_typia_project_tools_src_runtime_template_render.md#pathexists)

## Type Aliases

### TemplateRenderView

Ƭ **TemplateRenderView**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-render.ts:28](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-render.ts#L28)

## Functions

### copyRawDirectory

▸ **copyRawDirectory**(`sourceDir`, `targetDir`, `options?`): `Promise`\<`void`\>

Recursively copies a directory tree without rendering template contents.

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceDir` | `string` |
| `targetDir` | `string` |
| `options` | [`CopyRawDirectoryOptions`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_render.CopyRawDirectoryOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-render.ts:81](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-render.ts#L81)

___

### copyRenderedDirectory

▸ **copyRenderedDirectory**(`sourceDir`, `targetDir`, `view`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceDir` | `string` |
| `targetDir` | `string` |
| `view` | [`TemplateRenderView`](packages_wp_typia_project_tools_src_runtime_template_render.md#templaterenderview) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-render.ts:103](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-render.ts#L103)

___

### copyInterpolatedDirectory

▸ **copyInterpolatedDirectory**(`sourceDir`, `targetDir`, `view`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceDir` | `string` |
| `targetDir` | `string` |
| `view` | `Record`\<`string`, `string`\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-render.ts:135](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-render.ts#L135)

___

### pathExists

▸ **pathExists**(`targetPath`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetPath` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/template-render.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/template-render.ts#L167)
