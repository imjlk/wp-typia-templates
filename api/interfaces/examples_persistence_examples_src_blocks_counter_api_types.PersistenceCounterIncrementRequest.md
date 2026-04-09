[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/persistence-examples/src/blocks/counter/api-types](../modules/examples_persistence_examples_src_blocks_counter_api_types.md) / PersistenceCounterIncrementRequest

# Interface: PersistenceCounterIncrementRequest

[examples/persistence-examples/src/blocks/counter/api-types](../modules/examples_persistence_examples_src_blocks_counter_api_types.md).PersistenceCounterIncrementRequest

## Table of contents

### Properties

- [postId](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md#postid)
- [publicWriteRequestId](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md#publicwriterequestid)
- [resourceKey](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md#resourcekey)
- [publicWriteToken](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md#publicwritetoken)
- [delta](examples_persistence_examples_src_blocks_counter_api_types.PersistenceCounterIncrementRequest.md#delta)

## Properties

### postId

• **postId**: `number` & `Type`\<``"uint32"``\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-types.ts:14](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-types.ts#L14)

___

### publicWriteRequestId

• **publicWriteRequestId**: `string` & `MinLength`\<``1``\> & `MaxLength`\<``128``\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-types.ts:15](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-types.ts#L15)

___

### resourceKey

• **resourceKey**: `string` & `MinLength`\<``1``\> & `MaxLength`\<``100``\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-types.ts:16](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-types.ts#L16)

___

### publicWriteToken

• `Optional` **publicWriteToken**: `string` & `MinLength`\<``1``\> & `MaxLength`\<``512``\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-types.ts:17](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-types.ts#L17)

___

### delta

• `Optional` **delta**: `number` & `Minimum`\<``1``\> & `Type`\<``"uint32"``\> & `Default`\<``1``\>

#### Defined in

[examples/persistence-examples/src/blocks/counter/api-types.ts:18](https://github.com/imjlk/wp-typia/blob/main/examples/persistence-examples/src/blocks/counter/api-types.ts#L18)
