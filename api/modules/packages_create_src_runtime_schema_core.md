[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/schema-core

# Module: packages/create/src/runtime/schema-core

## Table of contents

### Interfaces

- [JsonSchemaObject](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)
- [OpenApiInfo](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md)

### Functions

- [manifestAttributeToJsonSchema](packages_create_src_runtime_schema_core.md#manifestattributetojsonschema)
- [manifestToJsonSchema](packages_create_src_runtime_schema_core.md#manifesttojsonschema)
- [manifestToOpenApi](packages_create_src_runtime_schema_core.md#manifesttoopenapi)

## Functions

### manifestAttributeToJsonSchema

▸ **manifestAttributeToJsonSchema**(`attribute`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Defined in

[packages/create/src/runtime/schema-core.ts:107](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L107)

___

### manifestToJsonSchema

▸ **manifestToJsonSchema**(`doc`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Defined in

[packages/create/src/runtime/schema-core.ts:174](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L174)

___

### manifestToOpenApi

▸ **manifestToOpenApi**(`doc`, `info?`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |
| `info` | [`OpenApiInfo`](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md) |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Defined in

[packages/create/src/runtime/schema-core.ts:193](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L193)
