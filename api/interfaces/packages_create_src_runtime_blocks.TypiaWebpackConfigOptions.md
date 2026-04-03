[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/blocks](../modules/packages_create_src_runtime_blocks.md) / TypiaWebpackConfigOptions

# Interface: TypiaWebpackConfigOptions

[packages/create/src/runtime/blocks](../modules/packages_create_src_runtime_blocks.md).TypiaWebpackConfigOptions

Options for creating scaffold webpack configs with shared Typia artifact and
script-module handling.

## Table of contents

### Properties

- [defaultConfig](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#defaultconfig)
- [fs](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#fs)
- [getArtifactEntries](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#getartifactentries)
- [getEditorEntries](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#geteditorentries)
- [getOptionalModuleEntries](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#getoptionalmoduleentries)
- [importTypiaWebpackPlugin](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#importtypiawebpackplugin)
- [isScriptModuleAsset](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#isscriptmoduleasset)
- [moduleEntriesMode](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#moduleentriesmode)
- [nonModuleEntriesMode](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#nonmoduleentriesmode)
- [path](packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md#path)

## Properties

### defaultConfig

• **defaultConfig**: `unknown`

#### Defined in

[packages/create/src/runtime/blocks.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L45)

___

### fs

• **fs**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `existsSync` | (`path`: `string`) => `boolean` |
| `readFileSync` | (`path`: `string`, `encoding?`: `string`) => `string` \| `Buffer`\<`ArrayBufferLike`\> |
| `writeFileSync` | (`path`: `string`, `data`: `string`) => `void` |

#### Defined in

[packages/create/src/runtime/blocks.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L46)

___

### getArtifactEntries

• **getArtifactEntries**: () => [`TypiaWebpackArtifactEntry`](packages_create_src_runtime_blocks.TypiaWebpackArtifactEntry.md)[]

#### Type declaration

▸ (): [`TypiaWebpackArtifactEntry`](packages_create_src_runtime_blocks.TypiaWebpackArtifactEntry.md)[]

##### Returns

[`TypiaWebpackArtifactEntry`](packages_create_src_runtime_blocks.TypiaWebpackArtifactEntry.md)[]

#### Defined in

[packages/create/src/runtime/blocks.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L51)

___

### getEditorEntries

• `Optional` **getEditorEntries**: () => `EntryMap`

#### Type declaration

▸ (): `EntryMap`

##### Returns

`EntryMap`

#### Defined in

[packages/create/src/runtime/blocks.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L52)

___

### getOptionalModuleEntries

• `Optional` **getOptionalModuleEntries**: () => `EntryMap`

#### Type declaration

▸ (): `EntryMap`

##### Returns

`EntryMap`

#### Defined in

[packages/create/src/runtime/blocks.ts:53](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L53)

___

### importTypiaWebpackPlugin

• **importTypiaWebpackPlugin**: () => `Promise`\<\{ `default`: () => `unknown`  }\>

#### Type declaration

▸ (): `Promise`\<\{ `default`: () => `unknown`  }\>

##### Returns

`Promise`\<\{ `default`: () => `unknown`  }\>

#### Defined in

[packages/create/src/runtime/blocks.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L54)

___

### isScriptModuleAsset

• `Optional` **isScriptModuleAsset**: (`assetName`: `string`) => `boolean`

#### Type declaration

▸ (`assetName`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `assetName` | `string` |

##### Returns

`boolean`

#### Defined in

[packages/create/src/runtime/blocks.ts:55](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L55)

___

### moduleEntriesMode

• `Optional` **moduleEntriesMode**: ``"replace"`` \| ``"merge"``

#### Defined in

[packages/create/src/runtime/blocks.ts:56](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L56)

___

### nonModuleEntriesMode

• `Optional` **nonModuleEntriesMode**: ``"replace"`` \| ``"merge"``

#### Defined in

[packages/create/src/runtime/blocks.ts:57](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L57)

___

### path

• **path**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `join` | (...`paths`: `string`[]) => `string` |

#### Defined in

[packages/create/src/runtime/blocks.ts:58](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L58)
