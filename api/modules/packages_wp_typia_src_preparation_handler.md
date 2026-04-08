[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/preparation-handler

# Module: packages/wp-typia/src/preparation-handler

## Table of contents

### Functions

- [createPreparationOnlyMessage](packages_wp_typia_src_preparation_handler.md#createpreparationonlymessage)
- [runPreparationOnlyCommand](packages_wp_typia_src_preparation_handler.md#runpreparationonlycommand)

## Functions

### createPreparationOnlyMessage

▸ **createPreparationOnlyMessage**(`commandPath`): `string`

Return the shared placeholder message for Bunli-prep commands that have not
taken over active execution yet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `commandPath` | `string` | Future Bunli command path such as `add block`. |

#### Returns

`string`

Human-readable migration message.

#### Defined in

[packages/wp-typia/src/preparation-handler.ts:8](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/preparation-handler.ts#L8)

___

### runPreparationOnlyCommand

▸ **runPreparationOnlyCommand**(`commandPath`): `Promise`\<`never`\>

Throw the shared Bunli-prep placeholder error.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `commandPath` | `string` | Future Bunli command path such as `create`. |

#### Returns

`Promise`\<`never`\>

Promise that always rejects.

#### Defined in

[packages/wp-typia/src/preparation-handler.ts:21](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/preparation-handler.ts#L21)
