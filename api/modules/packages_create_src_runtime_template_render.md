[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/template-render

# Module: packages/create/src/runtime/template-render

## Table of contents

### Type Aliases

- [TemplateRenderView](packages_create_src_runtime_template_render.md#templaterenderview)

### Functions

- [copyRawDirectory](packages_create_src_runtime_template_render.md#copyrawdirectory)
- [copyRenderedDirectory](packages_create_src_runtime_template_render.md#copyrendereddirectory)
- [copyInterpolatedDirectory](packages_create_src_runtime_template_render.md#copyinterpolateddirectory)
- [pathExists](packages_create_src_runtime_template_render.md#pathexists)

## Type Aliases

### TemplateRenderView

Ƭ **TemplateRenderView**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/create/src/runtime/template-render.ts:26](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-render.ts#L26)

## Functions

### copyRawDirectory

▸ **copyRawDirectory**(`sourceDir`, `targetDir`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceDir` | `string` |
| `targetDir` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/template-render.ts:57](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-render.ts#L57)

___

### copyRenderedDirectory

▸ **copyRenderedDirectory**(`sourceDir`, `targetDir`, `view`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceDir` | `string` |
| `targetDir` | `string` |
| `view` | [`TemplateRenderView`](packages_create_src_runtime_template_render.md#templaterenderview) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/template-render.ts:62](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-render.ts#L62)

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

[packages/create/src/runtime/template-render.ts:94](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-render.ts#L94)

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

[packages/create/src/runtime/template-render.ts:126](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-render.ts#L126)
