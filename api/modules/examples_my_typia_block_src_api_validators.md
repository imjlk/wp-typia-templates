[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/api-validators

# Module: examples/my-typia-block/src/api-validators

## Table of contents

### Variables

- [apiValidators](examples_my_typia_block_src_api_validators.md#apivalidators)

## Variables

### apiValidators

• `Const` **apiValidators**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `counterQuery` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockCounterQuery`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterQuery.md)\> |
| `counterResponse` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockCounterResponse`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockCounterResponse.md)\> |
| `incrementRequest` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`MyTypiaBlockIncrementRequest`](../interfaces/examples_my_typia_block_src_api_types.MyTypiaBlockIncrementRequest.md)\> |
| `post` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostRecord`](../interfaces/examples_my_typia_block_src_api_types.WpPostRecord.md)\> |
| `postCollection` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostRecord`](../interfaces/examples_my_typia_block_src_api_types.WpPostRecord.md)[]\> |
| `postTypes` | (`input`: `unknown`) => [`ValidationResult`](../interfaces/packages_wp_typia_rest_src_client.ValidationResult.md)\<[`WpPostTypeCollection`](examples_my_typia_block_src_api_types.md#wpposttypecollection)\> |

#### Defined in

[examples/my-typia-block/src/api-validators.ts:21](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/api-validators.ts#L21)
