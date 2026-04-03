[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/my-typia-block/src/types](../modules/examples_my_typia_block_src_types.md) / MyTypiaBlockAttributes

# Interface: MyTypiaBlockAttributes

[examples/my-typia-block/src/types](../modules/examples_my_typia_block_src_types.md).MyTypiaBlockAttributes

My Typia Block block attributes with Typia validation

## Table of contents

### Properties

- [id](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#id)
- [version](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#version)
- [className](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#classname)
- [content](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#content)
- [alignment](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#alignment)
- [isVisible](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#isvisible)
- [fontSize](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#fontsize)
- [textColor](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#textcolor)
- [backgroundColor](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#backgroundcolor)
- [aspectRatio](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#aspectratio)
- [padding](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#padding)
- [borderRadius](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#borderradius)
- [animation](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#animation)
- [linkTarget](examples_my_typia_block_src_types.MyTypiaBlockAttributes.md#linktarget)

## Properties

### id

• `Optional` **id**: `string` & `Format`\<``"uuid"``\>

Unique identifier

#### Defined in

[examples/my-typia-block/src/types.ts:13](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L13)

___

### version

• `Optional` **version**: `number` & `Type`\<``"uint32"``\> & `Default`\<``1``\>

Block version for migrations

#### Defined in

[examples/my-typia-block/src/types.ts:18](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L18)

___

### className

• `Optional` **className**: `string` & `MaxLength`\<``100``\>

Custom CSS class

#### Defined in

[examples/my-typia-block/src/types.ts:23](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L23)

___

### content

• **content**: `string` & `MinLength`\<``0``\> & `MaxLength`\<``1000``\> & `Default`\<``""``\>

Main content

#### Defined in

[examples/my-typia-block/src/types.ts:28](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L28)

___

### alignment

• `Optional` **alignment**: TextAlignment & Default\<"left"\>

Text alignment

#### Defined in

[examples/my-typia-block/src/types.ts:36](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L36)

___

### isVisible

• `Optional` **isVisible**: boolean & Default\<true\>

Is the block visible

#### Defined in

[examples/my-typia-block/src/types.ts:41](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L41)

___

### fontSize

• `Optional` **fontSize**: ("small" \| "medium" \| "large" \| "xlarge") & Default\<"medium"\>

Showcase-only richer typography controls.

#### Defined in

[examples/my-typia-block/src/types.ts:46](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L46)

___

### textColor

• `Optional` **textColor**: CssNamedColor & Default\<"currentColor"\>

Pipeline-compatible semantic color values from @wp-typia/block-types.

#### Defined in

[examples/my-typia-block/src/types.ts:52](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L52)

___

### backgroundColor

• `Optional` **backgroundColor**: CssNamedColor & Default\<"transparent"\>

#### Defined in

[examples/my-typia-block/src/types.ts:54](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L54)

___

### aspectRatio

• `Optional` **aspectRatio**: AspectRatio & Default\<"16/9"\>

#### Defined in

[examples/my-typia-block/src/types.ts:56](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L56)

___

### padding

• `Optional` **padding**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `top` | `number` & `Minimum`\<``0``\> & `Default`\<``0``\> |
| `right` | `number` & `Minimum`\<``0``\> & `Default`\<``0``\> |
| `bottom` | `number` & `Minimum`\<``0``\> & `Default`\<``0``\> |
| `left` | `number` & `Minimum`\<``0``\> & `Default`\<``0``\> |

#### Defined in

[examples/my-typia-block/src/types.ts:58](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L58)

___

### borderRadius

• `Optional` **borderRadius**: `number` & `Minimum`\<``0``\> & `Default`\<``0``\>

#### Defined in

[examples/my-typia-block/src/types.ts:65](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L65)

___

### animation

• `Optional` **animation**: ("none" \| "bounce" \| "fadeIn") & Default\<"none"\>

#### Defined in

[examples/my-typia-block/src/types.ts:67](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L67)

___

### linkTarget

• `Optional` **linkTarget**: \{ `kind`: ``"url"`` ; `href`: `string` & `Format`\<``"uri"``\>  } \| \{ `kind`: ``"post"`` ; `postId`: `number` & `Type`\<``"uint32"``\>  }

#### Defined in

[examples/my-typia-block/src/types.ts:69](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/types.ts#L69)
