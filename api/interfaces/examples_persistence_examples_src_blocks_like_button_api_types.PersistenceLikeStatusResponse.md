[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/like-button/api-types](../modules/examples_persistence_examples_src_blocks_like_button_api_types.md) / PersistenceLikeStatusResponse

# Interface: PersistenceLikeStatusResponse

[examples/persistence-examples/src/blocks/like-button/api-types](../modules/examples_persistence_examples_src_blocks_like_button_api_types.md).PersistenceLikeStatusResponse

## Table of contents

### Properties

- [postId](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md#postid)
- [resourceKey](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md#resourcekey)
- [count](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md#count)
- [likedByCurrentUser](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md#likedbycurrentuser)
- [storage](examples_persistence_examples_src_blocks_like_button_api_types.PersistenceLikeStatusResponse.md#storage)

## Properties

### postId

• **postId**: `number` & `Type`\<``"uint32"``\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:14](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L14)

___

### resourceKey

• **resourceKey**: `string` & `MinLength`\<``1``\> & `MaxLength`\<``100``\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:15](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L15)

___

### count

• **count**: `number` & `Minimum`\<``0``\> & `Type`\<``"uint32"``\>

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:16](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L16)

___

### likedByCurrentUser

• **likedByCurrentUser**: `boolean`

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:17](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L17)

___

### storage

• **storage**: ``"custom-table"``

#### Defined in

[examples/persistence-examples/src/blocks/like-button/api-types.ts:18](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/like-button/api-types.ts#L18)
