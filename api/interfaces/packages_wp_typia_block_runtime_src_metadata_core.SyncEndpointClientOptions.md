[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncEndpointClientOptions

# Interface: SyncEndpointClientOptions

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncEndpointClientOptions

Manifest-first options for writing a portable endpoint client module.

## Hierarchy

- `SyncEndpointClientBaseOptions`

  ↳ **`SyncEndpointClientOptions`**

## Table of contents

### Properties

- [clientFile](packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md#clientfile)
- [projectRoot](packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md#projectroot)
- [typesFile](packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md#typesfile)
- [validatorsFile](packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md#validatorsfile)
- [manifest](packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md#manifest)

## Properties

### clientFile

• **clientFile**: `string`

Output path for the generated portable client module.

#### Inherited from

SyncEndpointClientBaseOptions.clientFile

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:276](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L276)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncEndpointClientBaseOptions.projectRoot

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:278](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L278)

___

### typesFile

• **typesFile**: `string`

Source file that exports the endpoint contract types.

#### Inherited from

SyncEndpointClientBaseOptions.typesFile

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:280](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L280)

___

### validatorsFile

• `Optional` **validatorsFile**: `string`

Optional explicit path to the validator module.

#### Inherited from

SyncEndpointClientBaseOptions.validatorsFile

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:282](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L282)

___

### manifest

• **manifest**: [`EndpointManifestDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[]\>

Canonical endpoint manifest describing the REST surface.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:290](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L290)
