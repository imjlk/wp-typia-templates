[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/cli-prompt](../modules/packages_create_src_runtime_cli_prompt.md) / ReadlinePrompt

# Interface: ReadlinePrompt

[packages/create/src/runtime/cli-prompt](../modules/packages_create_src_runtime_cli_prompt.md).ReadlinePrompt

Prompt adapter used by CLI scaffold flows and migration wizard flows.

## Table of contents

### Methods

- [close](packages_create_src_runtime_cli_prompt.ReadlinePrompt.md#close)
- [select](packages_create_src_runtime_cli_prompt.ReadlinePrompt.md#select)
- [text](packages_create_src_runtime_cli_prompt.ReadlinePrompt.md#text)

## Methods

### close

▸ **close**(): `void`

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/cli-prompt.ts:15](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-prompt.ts#L15)

___

### select

▸ **select**\<`T`\>(`message`, `options`, `defaultValue?`): `Promise`\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `options` | `PromptOption`\<`T`\>[] |
| `defaultValue?` | `number` |

#### Returns

`Promise`\<`T`\>

#### Defined in

[packages/create/src/runtime/cli-prompt.ts:16](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-prompt.ts#L16)

___

### text

▸ **text**(`message`, `defaultValue`, `validate?`): `Promise`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `defaultValue` | `string` |
| `validate?` | `ValidateInput` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[packages/create/src/runtime/cli-prompt.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-prompt.ts#L17)
