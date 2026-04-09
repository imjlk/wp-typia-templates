[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/like-button/api-types](../modules/examples_persistence_examples_src_blocks_like_button_api_types.md) / PersistenceToggleLikeResponse

# Interface: PersistenceToggleLikeResponse

[examples/persistence-examples/src/blocks/like-button/api-types](../modules/examples_persistence_examples_src_blocks_like_button_api_types.md).PersistenceToggleLikeResponse

## Table of contents

### Properties

- [postId](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md#postid)
- [resourceKey](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md#resourcekey)
- [count](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md#count)
- [likedByCurrentUser](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md#likedbycurrentuser)
- [storage](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceToggleLikeResponse.md#storage)

## Properties

### postId

• **postId**: `number` & `Type`\<``"uint32"``\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:32](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L32)

___

### resourceKey

• **resourceKey**: `string` & `MinLength`\<``1``\> & `MaxLength`\<``100``\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:33](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L33)

___

### count

• **count**: `number` & `Minimum`\<``0``\> & `Type`\<``"uint32"``\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:34](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L34)

___

### likedByCurrentUser

• **likedByCurrentUser**: `boolean`

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:35](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L35)

___

### storage

• **storage**: ``"custom-table"``

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:36](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L36)
