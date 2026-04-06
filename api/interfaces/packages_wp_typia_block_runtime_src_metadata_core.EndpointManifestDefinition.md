[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / EndpointManifestDefinition

# Interface: EndpointManifestDefinition\<Contracts, Endpoints\>

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).EndpointManifestDefinition

Canonical TypeScript description of one scaffolded REST surface.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Contracts` | extends `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\> = `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\> |
| `Endpoints` | extends readonly [`EndpointManifestEndpointDefinition`](../modules/packages_wp_typia_block_runtime_src_metadata_core.md#endpointmanifestendpointdefinition)[] = readonly [`EndpointManifestEndpointDefinition`](../modules/packages_wp_typia_block_runtime_src_metadata_core.md#endpointmanifestendpointdefinition)[] |

## Table of contents

### Properties

- [contracts](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md#contracts)
- [endpoints](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md#endpoints)
- [info](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md#info)

## Properties

### contracts

• **contracts**: `Contracts`

Contract registry keyed by logical route contract ids.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:174](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L174)

___

### endpoints

• **endpoints**: `Endpoints`

Route registry keyed by concrete REST path and method pairs.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:176](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L176)

___

### info

• `Optional` **info**: [`OpenApiInfo`](packages_wp_typia_block_runtime_src_schema_core.OpenApiInfo.md)

Optional document-level metadata for aggregate OpenAPI output.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:178](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L178)
