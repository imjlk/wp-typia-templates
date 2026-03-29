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

[test-template/my-typia-block/src/types.ts:11](https://github.com/yourusername/wp-typia/blob/main/test-template/my-typia-block/src/types.ts#L11)

___

### version

• `Optional` **version**: `number` & `Type`\<``"uint32"``\> & `Default`\<``1``\>

Block version for migrations

#### Defined in

[test-template/my-typia-block/src/types.ts:16](https://github.com/yourusername/wp-typia/blob/main/test-template/my-typia-block/src/types.ts#L16)

___

### className

• `Optional` **className**: `string` & `MaxLength`\<``100``\>

Custom CSS class

#### Defined in

[test-template/my-typia-block/src/types.ts:21](https://github.com/yourusername/wp-typia/blob/main/test-template/my-typia-block/src/types.ts#L21)

___

### content

• **content**: `string` & `MinLength`\<``0``\> & `MaxLength`\<``1000``\> & `Default`\<``""``\>

Main content

#### Defined in

[test-template/my-typia-block/src/types.ts:26](https://github.com/yourusername/wp-typia/blob/main/test-template/my-typia-block/src/types.ts#L26)

___

### alignment

• `Optional` **alignment**: TextAlignment & Default\<"left"\>

Text alignment

#### Defined in

[test-template/my-typia-block/src/types.ts:31](https://github.com/yourusername/wp-typia/blob/main/test-template/my-typia-block/src/types.ts#L31)

___

### isVisible

• `Optional` **isVisible**: boolean & Default\<true\>

Is the block visible

#### Defined in

[test-template/my-typia-block/src/types.ts:36](https://github.com/yourusername/wp-typia/blob/main/test-template/my-typia-block/src/types.ts#L36)
