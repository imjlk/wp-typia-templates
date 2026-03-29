[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-manifest

# Module: packages/create/src/runtime/migration-manifest

## Table of contents

### Functions

- [flattenManifestLeafAttributes](packages_create_src_runtime_migration_manifest.md#flattenmanifestleafattributes)
- [flattenManifestAttribute](packages_create_src_runtime_migration_manifest.md#flattenmanifestattribute)
- [getAttributeByCurrentPath](packages_create_src_runtime_migration_manifest.md#getattributebycurrentpath)
- [hasManifestDefault](packages_create_src_runtime_migration_manifest.md#hasmanifestdefault)
- [getManifestDefaultValue](packages_create_src_runtime_migration_manifest.md#getmanifestdefaultvalue)
- [summarizeManifest](packages_create_src_runtime_migration_manifest.md#summarizemanifest)
- [summarizeUnionBranches](packages_create_src_runtime_migration_manifest.md#summarizeunionbranches)
- [defaultValueForManifestAttribute](packages_create_src_runtime_migration_manifest.md#defaultvalueformanifestattribute)

## Functions

### flattenManifestLeafAttributes

▸ **flattenManifestLeafAttributes**(`attributes`): [`FlattenedAttributeDescriptor`](../interfaces/packages_create_src_runtime_migration_types.FlattenedAttributeDescriptor.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md)\> |

#### Returns

[`FlattenedAttributeDescriptor`](../interfaces/packages_create_src_runtime_migration_types.FlattenedAttributeDescriptor.md)[]

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L19)

___

### flattenManifestAttribute

▸ **flattenManifestAttribute**(`attribute`, `currentPath`, `sourcePath`, `context`): [`FlattenedAttributeDescriptor`](../interfaces/packages_create_src_runtime_migration_types.FlattenedAttributeDescriptor.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `undefined` \| ``null`` \| [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |
| `currentPath` | `string` |
| `sourcePath` | `string` |
| `context` | `FlattenContext` |

#### Returns

[`FlattenedAttributeDescriptor`](../interfaces/packages_create_src_runtime_migration_types.FlattenedAttributeDescriptor.md)[]

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L32)

___

### getAttributeByCurrentPath

▸ **getAttributeByCurrentPath**(`attributes`, `currentPath`): [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md)\> |
| `currentPath` | `string` |

#### Returns

[`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) \| ``null``

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:74](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L74)

___

### hasManifestDefault

▸ **hasManifestDefault**(`attribute`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `undefined` \| ``null`` \| [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |

#### Returns

`boolean`

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:110](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L110)

___

### getManifestDefaultValue

▸ **getManifestDefaultValue**(`attribute`): ``null`` \| `string` \| `number` \| `boolean` \| [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)[] \| \{ `[key: string]`: [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue);  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `undefined` \| ``null`` \| [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |

#### Returns

``null`` \| `string` \| `number` \| `boolean` \| [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)[] \| \{ `[key: string]`: [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue);  }

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:114](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L114)

___

### summarizeManifest

▸ **summarizeManifest**(`manifest`): [`ManifestSummary`](../interfaces/packages_create_src_runtime_migration_types.ManifestSummary.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |

#### Returns

[`ManifestSummary`](../interfaces/packages_create_src_runtime_migration_types.ManifestSummary.md)

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:118](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L118)

___

### summarizeUnionBranches

▸ **summarizeUnionBranches**(`manifestSummary`): [`UnionBranchSummary`](../interfaces/packages_create_src_runtime_migration_types.UnionBranchSummary.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifestSummary` | [`ManifestSummary`](../interfaces/packages_create_src_runtime_migration_types.ManifestSummary.md) |

#### Returns

[`UnionBranchSummary`](../interfaces/packages_create_src_runtime_migration_types.UnionBranchSummary.md)[]

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:139](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L139)

___

### defaultValueForManifestAttribute

▸ **defaultValueForManifestAttribute**(`attribute`): `ManifestDefaultValue` \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |

#### Returns

`ManifestDefaultValue` \| ``null``

#### Defined in

[packages/create/src/runtime/migration-manifest.ts:153](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-manifest.ts#L153)
