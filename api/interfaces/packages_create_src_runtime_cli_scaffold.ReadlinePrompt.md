[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/cli-scaffold](../modules/packages_create_src_runtime_cli_scaffold.md) / ReadlinePrompt

# Interface: ReadlinePrompt

[packages/create/src/runtime/cli-scaffold](../modules/packages_create_src_runtime_cli_scaffold.md).ReadlinePrompt

Prompt adapter used by CLI scaffold flows and tests.

## Table of contents

### Methods

- [close](packages_create_src_runtime_cli_scaffold.ReadlinePrompt.md#close)
- [select](packages_create_src_runtime_cli_scaffold.ReadlinePrompt.md#select)
- [text](packages_create_src_runtime_cli_scaffold.ReadlinePrompt.md#text)

## Methods

### close

▸ **close**(): `void`

Close the underlying prompt resources.

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/cli-scaffold.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-scaffold.ts#L41)

___

### select

▸ **select**\<`T`\>(`message`, `options`, `defaultValue?`): `Promise`\<`T`\>

Prompt for one option from a fixed list.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | Prompt message shown above the options. |
| `options` | `PromptOption`\<`T`\>[] | Available option definitions. |
| `defaultValue?` | `number` | One-based default option index. |

#### Returns

`Promise`\<`T`\>

The selected option value.

#### Defined in

[packages/create/src/runtime/cli-scaffold.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-scaffold.ts#L50)

___

### text

▸ **text**(`message`, `defaultValue`, `validate?`): `Promise`\<`string`\>

Prompt for free-form text with optional validation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | Prompt message shown to the user. |
| `defaultValue` | `string` | Default value used when the response is empty. |
| `validate?` | `ValidateInput` | Optional validator that can reject the response. |

#### Returns

`Promise`\<`string`\>

The accepted text value.

#### Defined in

[packages/create/src/runtime/cli-scaffold.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-scaffold.ts#L59)
