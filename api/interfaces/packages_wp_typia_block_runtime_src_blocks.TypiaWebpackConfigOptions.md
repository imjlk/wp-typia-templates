[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/blocks](../modules/packages_wp_typia_block_runtime_src_blocks.md) / TypiaWebpackConfigOptions

# Interface: TypiaWebpackConfigOptions

[packages/wp-typia-block-runtime/src/blocks](../modules/packages_wp_typia_block_runtime_src_blocks.md).TypiaWebpackConfigOptions

## Table of contents

### Properties

- [defaultConfig](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#defaultconfig)
- [fs](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#fs)
- [getArtifactEntries](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#getartifactentries)
- [getEditorEntries](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#geteditorentries)
- [getOptionalModuleEntries](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#getoptionalmoduleentries)
- [importTypiaWebpackPlugin](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#importtypiawebpackplugin)
- [isScriptModuleAsset](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#isscriptmoduleasset)
- [moduleEntriesMode](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#moduleentriesmode)
- [nonModuleEntriesMode](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#nonmoduleentriesmode)
- [path](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#path)
- [projectRoot](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md#projectroot)

## Properties

### defaultConfig

• **defaultConfig**: `unknown`

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L38)

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

[packages/wp-typia-block-runtime/src/blocks.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L39)

___

### getArtifactEntries

• **getArtifactEntries**: () => [`TypiaWebpackArtifactEntry`](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackArtifactEntry.md)[]

#### Type declaration

▸ (): [`TypiaWebpackArtifactEntry`](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackArtifactEntry.md)[]

##### Returns

[`TypiaWebpackArtifactEntry`](packages_wp_typia_block_runtime_src_blocks.TypiaWebpackArtifactEntry.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L44)

___

### getEditorEntries

• `Optional` **getEditorEntries**: () => `EntryMap`

#### Type declaration

▸ (): `EntryMap`

##### Returns

`EntryMap`

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L45)

___

### getOptionalModuleEntries

• `Optional` **getOptionalModuleEntries**: () => `EntryMap`

#### Type declaration

▸ (): `EntryMap`

##### Returns

`EntryMap`

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L46)

___

### importTypiaWebpackPlugin

• **importTypiaWebpackPlugin**: () => `Promise`\<\{ `default`: () => `unknown`  }\>

#### Type declaration

▸ (): `Promise`\<\{ `default`: () => `unknown`  }\>

##### Returns

`Promise`\<\{ `default`: () => `unknown`  }\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:47](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L47)

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

[packages/wp-typia-block-runtime/src/blocks.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L48)

___

### moduleEntriesMode

• `Optional` **moduleEntriesMode**: ``"replace"`` \| ``"merge"``

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L49)

___

### nonModuleEntriesMode

• `Optional` **nonModuleEntriesMode**: ``"replace"`` \| ``"merge"``

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L50)

___

### path

• **path**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `join` | (...`paths`: `string`[]) => `string` |

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L51)

___

### projectRoot

• `Optional` **projectRoot**: `string`

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L54)
