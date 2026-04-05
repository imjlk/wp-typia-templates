[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / RestOpenApiContractDefinition

# Interface: RestOpenApiContractDefinition

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).RestOpenApiContractDefinition

Backward-compatible source type mapping used when generating aggregate REST OpenAPI documents.

## Hierarchy

- [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)

  ↳ **`RestOpenApiContractDefinition`**

## Table of contents

### Properties

- [schemaName](packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md#schemaname)
- [sourceTypeName](packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md#sourcetypename)

## Properties

### schemaName

• `Optional` **schemaName**: `string`

Optional component name override for the generated schema reference.

#### Inherited from

[EndpointManifestContractDefinition](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md).[schemaName](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md#schemaname)

#### Defined in

[packages/create/src/runtime/metadata-core.ts:243](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L243)

___

### sourceTypeName

• **sourceTypeName**: `string`

Type name exported from the source `typesFile`.

#### Inherited from

[EndpointManifestContractDefinition](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md).[sourceTypeName](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md#sourcetypename)

#### Defined in

[packages/create/src/runtime/metadata-core.ts:245](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L245)
