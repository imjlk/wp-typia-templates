[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/my-typia-block/src/migrations/helpers](../modules/examples_my_typia_block_src_migrations_helpers.md) / ManifestAttribute

# Interface: ManifestAttribute

[examples/my-typia-block/src/migrations/helpers](../modules/examples_my_typia_block_src_migrations_helpers.md).ManifestAttribute

## Table of contents

### Properties

- [typia](examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md#typia)
- [ts](examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md#ts)
- [wp](examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md#wp)

## Properties

### typia

• **typia**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `constraints` | \{ `format`: ``null`` \| `string` ; `maxLength`: ``null`` \| `number` ; `maximum`: ``null`` \| `number` ; `minLength`: ``null`` \| `number` ; `minimum`: ``null`` \| `number` ; `pattern`: ``null`` \| `string` ; `typeTag`: ``null`` \| `string`  } |
| `constraints.format` | ``null`` \| `string` |
| `constraints.maxLength` | ``null`` \| `number` |
| `constraints.maximum` | ``null`` \| `number` |
| `constraints.minLength` | ``null`` \| `number` |
| `constraints.minimum` | ``null`` \| `number` |
| `constraints.pattern` | ``null`` \| `string` |
| `constraints.typeTag` | ``null`` \| `string` |
| `defaultValue` | `unknown` |
| `hasDefault` | `boolean` |

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:9](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L9)

___

### ts

• **ts**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `items` | ``null`` \| [`ManifestAttribute`](examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md) |
| `kind` | ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"object"`` \| ``"array"`` \| ``"union"`` |
| `properties` | ``null`` \| `Record`\<`string`, [`ManifestAttribute`](examples_my_typia_block_src_migrations_helpers.ManifestAttribute.md)\> |
| `required` | `boolean` |
| `union` | ``null`` \| [`ManifestUnion`](examples_my_typia_block_src_migrations_helpers.ManifestUnion.md) |

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:22](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L22)

___

### wp

• **wp**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `defaultValue` | `unknown` |
| `enum` | ``null`` \| (`string` \| `number` \| `boolean`)[] |
| `hasDefault` | `boolean` |
| `type` | ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"object"`` \| ``"array"`` |

#### Defined in

[examples/my-typia-block/src/migrations/helpers.ts:29](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/helpers.ts#L29)
