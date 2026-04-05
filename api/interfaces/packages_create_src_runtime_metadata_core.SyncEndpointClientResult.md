[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncEndpointClientResult

# Interface: SyncEndpointClientResult

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncEndpointClientResult

Result returned after writing a generated portable endpoint client module.

## Table of contents

### Properties

- [endpointCount](packages_create_src_runtime_metadata_core.SyncEndpointClientResult.md#endpointcount)
- [clientPath](packages_create_src_runtime_metadata_core.SyncEndpointClientResult.md#clientpath)
- [operationIds](packages_create_src_runtime_metadata_core.SyncEndpointClientResult.md#operationids)

## Properties

### endpointCount

• **endpointCount**: `number`

Number of endpoints included in the generated client file.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:388](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L388)

___

### clientPath

• **clientPath**: `string`

Absolute path to the generated client file.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:390](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L390)

___

### operationIds

• **operationIds**: `string`[]

Operation ids emitted as endpoint constants and convenience wrappers.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:392](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L392)
