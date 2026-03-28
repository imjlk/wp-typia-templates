[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / [test-template/my-typia-block/src/types](../modules/test_template_my_typia_block_src_types.md) / MyTypiaBlockAttributes

# Interface: MyTypiaBlockAttributes

[test-template/my-typia-block/src/types](../modules/test_template_my_typia_block_src_types.md).MyTypiaBlockAttributes

My Typia Block attributes with Typia validation

## Table of contents

### Properties

- [id](test_template_my_typia_block_src_types.MyTypiaBlockAttributes.md#id)
- [version](test_template_my_typia_block_src_types.MyTypiaBlockAttributes.md#version)
- [className](test_template_my_typia_block_src_types.MyTypiaBlockAttributes.md#classname)
- [content](test_template_my_typia_block_src_types.MyTypiaBlockAttributes.md#content)
- [alignment](test_template_my_typia_block_src_types.MyTypiaBlockAttributes.md#alignment)
- [isVisible](test_template_my_typia_block_src_types.MyTypiaBlockAttributes.md#isvisible)

## Properties

### id

• `Optional` **id**: `string` & `Format`\<``"uuid"``\>

Unique identifier

#### Defined in

[test-template/my-typia-block/src/types.ts:10](https://github.com/yourusername/wp-typia-boilerplate/blob/main/test-template/my-typia-block/src/types.ts#L10)

___

### version

• `Optional` **version**: `number` & `Type`\<``"uint32"``\> & `Default`\<``1``\>

Block version for migrations

#### Defined in

[test-template/my-typia-block/src/types.ts:15](https://github.com/yourusername/wp-typia-boilerplate/blob/main/test-template/my-typia-block/src/types.ts#L15)

___

### className

• `Optional` **className**: `string` & `MaxLength`\<``100``\>

Custom CSS class

#### Defined in

[test-template/my-typia-block/src/types.ts:20](https://github.com/yourusername/wp-typia-boilerplate/blob/main/test-template/my-typia-block/src/types.ts#L20)

___

### content

• **content**: `string` & `MinLength`\<``0``\> & `MaxLength`\<``1000``\> & `Default`\<``""``\>

Main content

#### Defined in

[test-template/my-typia-block/src/types.ts:25](https://github.com/yourusername/wp-typia-boilerplate/blob/main/test-template/my-typia-block/src/types.ts#L25)

___

### alignment

• `Optional` **alignment**: ("left" \| "center" \| "right" \| "justify") & Default\<"left"\>

Text alignment

#### Defined in

[test-template/my-typia-block/src/types.ts:30](https://github.com/yourusername/wp-typia-boilerplate/blob/main/test-template/my-typia-block/src/types.ts#L30)

___

### isVisible

• `Optional` **isVisible**: boolean & Default\<true\>

Is the block visible

#### Defined in

[test-template/my-typia-block/src/types.ts:35](https://github.com/yourusername/wp-typia-boilerplate/blob/main/test-template/my-typia-block/src/types.ts#L35)
