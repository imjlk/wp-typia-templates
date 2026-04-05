[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncEndpointClientOptions

# Interface: SyncEndpointClientOptions

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncEndpointClientOptions

Manifest-first options for writing a portable endpoint client module.

## Hierarchy

- `SyncEndpointClientBaseOptions`

  ↳ **`SyncEndpointClientOptions`**

## Table of contents

### Properties

- [clientFile](packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md#clientfile)
- [projectRoot](packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md#projectroot)
- [typesFile](packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md#typesfile)
- [validatorsFile](packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md#validatorsfile)
- [manifest](packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md#manifest)

## Properties

### clientFile

• **clientFile**: `string`

Output path for the generated portable client module.

#### Inherited from

SyncEndpointClientBaseOptions.clientFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:365](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L365)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncEndpointClientBaseOptions.projectRoot

#### Defined in

[packages/create/src/runtime/metadata-core.ts:367](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L367)

___

### typesFile

• **typesFile**: `string`

Source file that exports the endpoint contract types.

#### Inherited from

SyncEndpointClientBaseOptions.typesFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:369](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L369)

___

### validatorsFile

• `Optional` **validatorsFile**: `string`

Optional explicit path to the validator module.

#### Inherited from

SyncEndpointClientBaseOptions.validatorsFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:371](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L371)

___

### manifest

• **manifest**: [`EndpointManifestDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapiendpointdefinition)[]\>

Canonical endpoint manifest describing the REST surface.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:379](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L379)
