[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / EndpointManifestDefinition

# Interface: EndpointManifestDefinition\<Contracts, Endpoints\>

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).EndpointManifestDefinition

Canonical TypeScript description of one scaffolded REST surface.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Contracts` | extends `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\> = `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\> |
| `Endpoints` | extends readonly [`EndpointManifestEndpointDefinition`](../modules/packages_create_src_runtime_metadata_core.md#endpointmanifestendpointdefinition)[] = readonly [`EndpointManifestEndpointDefinition`](../modules/packages_create_src_runtime_metadata_core.md#endpointmanifestendpointdefinition)[] |

## Table of contents

### Properties

- [contracts](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md#contracts)
- [endpoints](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md#endpoints)
- [info](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md#info)

## Properties

### contracts

• **contracts**: `Contracts`

Contract registry keyed by logical route contract ids.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:264](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L264)

___

### endpoints

• **endpoints**: `Endpoints`

Route registry keyed by concrete REST path and method pairs.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:266](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L266)

___

### info

• `Optional` **info**: [`OpenApiInfo`](packages_create_src_runtime_schema_core.OpenApiInfo.md)

Optional document-level metadata for aggregate OpenAPI output.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:268](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L268)
