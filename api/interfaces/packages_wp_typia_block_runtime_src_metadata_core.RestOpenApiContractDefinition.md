[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / RestOpenApiContractDefinition

# Interface: RestOpenApiContractDefinition

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).RestOpenApiContractDefinition

Backward-compatible source type mapping used when generating aggregate REST OpenAPI documents.

## Hierarchy

- [`EndpointManifestContractDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)

  ↳ **`RestOpenApiContractDefinition`**

## Table of contents

### Properties

- [schemaName](packages_wp_typia_block_runtime_src_metadata_core.RestOpenApiContractDefinition.md#schemaname)
- [sourceTypeName](packages_wp_typia_block_runtime_src_metadata_core.RestOpenApiContractDefinition.md#sourcetypename)

## Properties

### schemaName

• `Optional` **schemaName**: `string`

Optional component name override for the generated schema reference.

#### Inherited from

[EndpointManifestContractDefinition](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md).[schemaName](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md#schemaname)

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:163](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L163)

___

### sourceTypeName

• **sourceTypeName**: `string`

Type name exported from the source `typesFile`.

#### Inherited from

[EndpointManifestContractDefinition](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md).[sourceTypeName](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md#sourcetypename)

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:165](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L165)
