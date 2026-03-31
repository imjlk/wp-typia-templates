[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/wp-api

# Module: examples/my-typia-block/src/wp-api

## Table of contents

### Functions

- [getEditablePostTypes](examples_my_typia_block_src_wp_api.md#geteditableposttypes)
- [getPostsByRestBase](examples_my_typia_block_src_wp_api.md#getpostsbyrestbase)
- [getPostByRestBase](examples_my_typia_block_src_wp_api.md#getpostbyrestbase)

## Functions

### getEditablePostTypes

▸ **getEditablePostTypes**(): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostTypeCollection`](examples_my_typia_block_src_api_types.md#wpposttypecollection)\>\>

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostTypeCollection`](examples_my_typia_block_src_api_types.md#wpposttypecollection)\>\>

#### Defined in

[examples/my-typia-block/src/wp-api.ts:20](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/wp-api.ts#L20)

___

### getPostsByRestBase

▸ **getPostsByRestBase**(`restBase`, `page`): `Promise`\<\{ `response`: `Response` ; `validation`: [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostRecord`](../interfaces/examples_my_typia_block_src_api_types.WpPostRecord.md)[]\>  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `restBase` | `string` |
| `page` | `number` |

#### Returns

`Promise`\<\{ `response`: `Response` ; `validation`: [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostRecord`](../interfaces/examples_my_typia_block_src_api_types.WpPostRecord.md)[]\>  }\>

#### Defined in

[examples/my-typia-block/src/wp-api.ts:27](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/wp-api.ts#L27)

___

### getPostByRestBase

▸ **getPostByRestBase**(`restBase`, `postId`): `Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostRecord`](../interfaces/examples_my_typia_block_src_api_types.WpPostRecord.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `restBase` | `string` |
| `postId` | `number` |

#### Returns

`Promise`\<[`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostRecord`](../interfaces/examples_my_typia_block_src_api_types.WpPostRecord.md)\>\>

#### Defined in

[examples/my-typia-block/src/wp-api.ts:34](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/wp-api.ts#L34)
