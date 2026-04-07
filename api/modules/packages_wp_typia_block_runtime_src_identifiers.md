[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/identifiers

# Module: packages/wp-typia-block-runtime/src/identifiers

## Table of contents

### Functions

- [generateBlockId](packages_wp_typia_block_runtime_src_identifiers.md#generateblockid)
- [generateScopedClientId](packages_wp_typia_block_runtime_src_identifiers.md#generatescopedclientid)
- [generateResourceKey](packages_wp_typia_block_runtime_src_identifiers.md#generateresourcekey)
- [generatePublicWriteRequestId](packages_wp_typia_block_runtime_src_identifiers.md#generatepublicwriterequestid)

## Functions

### generateBlockId

▸ **generateBlockId**(): `string`

Generate a UUID v4-style id for block attributes.

#### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/identifiers.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/identifiers.ts#L11)

___

### generateScopedClientId

▸ **generateScopedClientId**(`prefix`): `string`

Generate a prefixed runtime id for client-side attributes such as uniqueId.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `prefix` | `string` | Prefix chosen by the scaffold/template. |

#### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/identifiers.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/identifiers.ts#L19)

___

### generateResourceKey

▸ **generateResourceKey**(`prefix`): `string`

Generate a prefixed persistence resource key.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `prefix` | `string` | Prefix chosen by the scaffold/template. |

#### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/identifiers.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/identifiers.ts#L27)

___

### generatePublicWriteRequestId

▸ **generatePublicWriteRequestId**(): `string`

Generate an opaque id for one public write attempt.

#### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/identifiers.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/identifiers.ts#L34)
