[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/cli-add

# Module: packages/create/src/runtime/cli-add

## Table of contents

### Type Aliases

- [AddKindId](packages_create_src_runtime_cli_add.md#addkindid)
- [AddBlockTemplateId](packages_create_src_runtime_cli_add.md#addblocktemplateid)

### Variables

- [ADD\_KIND\_IDS](packages_create_src_runtime_cli_add.md#add_kind_ids)
- [ADD\_BLOCK\_TEMPLATE\_IDS](packages_create_src_runtime_cli_add.md#add_block_template_ids)

### Functions

- [formatAddHelpText](packages_create_src_runtime_cli_add.md#formataddhelptext)
- [seedWorkspaceMigrationProject](packages_create_src_runtime_cli_add.md#seedworkspacemigrationproject)
- [runAddBlockCommand](packages_create_src_runtime_cli_add.md#runaddblockcommand)
- [createAddPlaceholderMessage](packages_create_src_runtime_cli_add.md#createaddplaceholdermessage)

## Type Aliases

### AddKindId

Ƭ **AddKindId**: typeof [`ADD_KIND_IDS`](packages_create_src_runtime_cli_add.md#add_kind_ids)[`number`]

#### Defined in

[packages/create/src/runtime/cli-add.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L38)

___

### AddBlockTemplateId

Ƭ **AddBlockTemplateId**: typeof [`ADD_BLOCK_TEMPLATE_IDS`](packages_create_src_runtime_cli_add.md#add_block_template_ids)[`number`]

#### Defined in

[packages/create/src/runtime/cli-add.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L49)

## Variables

### ADD\_KIND\_IDS

• `Const` **ADD\_KIND\_IDS**: readonly [``"block"``, ``"variation"``, ``"pattern"``]

Supported top-level `wp-typia add` kinds exposed by the canonical CLI.

#### Defined in

[packages/create/src/runtime/cli-add.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L37)

___

### ADD\_BLOCK\_TEMPLATE\_IDS

• `Const` **ADD\_BLOCK\_TEMPLATE\_IDS**: readonly [``"basic"``, ``"interactivity"``, ``"persistence"``, ``"compound"``]

Supported built-in block families accepted by `wp-typia add block --template`.

#### Defined in

[packages/create/src/runtime/cli-add.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L43)

## Functions

### formatAddHelpText

▸ **formatAddHelpText**(): `string`

Returns help text for the canonical `wp-typia add` subcommands.

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-add.ts:703](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L703)

___

### seedWorkspaceMigrationProject

▸ **seedWorkspaceMigrationProject**(`projectDir`, `currentMigrationVersion`): `Promise`\<`void`\>

Seeds an empty official workspace migration project before any blocks are added.

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `currentMigrationVersion` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/cli-add.ts:717](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L717)

___

### runAddBlockCommand

▸ **runAddBlockCommand**(`«destructured»`): `Promise`\<\{ `blockSlugs`: `string`[] ; `projectDir`: `string` ; `templateId`: [`AddBlockTemplateId`](packages_create_src_runtime_cli_add.md#addblocktemplateid)  }\>

Adds one built-in block slice to an official workspace project.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `RunAddBlockCommandOptions` |

#### Returns

`Promise`\<\{ `blockSlugs`: `string`[] ; `projectDir`: `string` ; `templateId`: [`AddBlockTemplateId`](packages_create_src_runtime_cli_add.md#addblocktemplateid)  }\>

#### Defined in

[packages/create/src/runtime/cli-add.ts:754](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L754)

___

### createAddPlaceholderMessage

▸ **createAddPlaceholderMessage**(`kind`): `string`

Returns the current placeholder guidance for unsupported `wp-typia add` kinds.

#### Parameters

| Name | Type |
| :------ | :------ |
| `kind` | ``"pattern"`` \| ``"variation"`` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-add.ts:890](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-add.ts#L890)
