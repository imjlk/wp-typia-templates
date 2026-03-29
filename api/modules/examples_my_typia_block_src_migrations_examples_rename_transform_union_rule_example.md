[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example

# Module: examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example

## Table of contents

### Variables

- [renameMap](examples_my_typia_block_src_migrations_examples_rename_transform_union_rule_example.md#renamemap)
- [transforms](examples_my_typia_block_src_migrations_examples_rename_transform_union_rule_example.md#transforms)
- [unresolved](examples_my_typia_block_src_migrations_examples_rename_transform_union_rule_example.md#unresolved)

### Functions

- [migrate](examples_my_typia_block_src_migrations_examples_rename_transform_union_rule_example.md#migrate)

## Variables

### renameMap

• `Const` **renameMap**: [`RenameMap`](examples_my_typia_block_src_migrations_helpers.md#renamemap)

#### Defined in

[examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts:10](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts#L10)

___

### transforms

• `Const` **transforms**: [`TransformMap`](examples_my_typia_block_src_migrations_helpers.md#transformmap)

#### Defined in

[examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts:17](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts#L17)

___

### unresolved

• `Const` **unresolved**: readonly [``"linkTarget: union-branch-removal (branch post was removed)"``]

#### Defined in

[examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts:43](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts#L43)

## Functions

### migrate

▸ **migrate**(`input`): [`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Record`\<`string`, `unknown`\> |

#### Returns

[`MyTypiaBlockAttributes`](../interfaces/examples_my_typia_block_src_types.MyTypiaBlockAttributes.md)

#### Defined in

[examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts:63](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/migrations/examples/rename-transform-union/rule.example.ts#L63)
