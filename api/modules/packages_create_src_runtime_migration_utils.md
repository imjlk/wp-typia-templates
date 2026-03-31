[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-utils

# Module: packages/create/src/runtime/migration-utils

## Table of contents

### Functions

- [cloneJsonValue](packages_create_src_runtime_migration_utils.md#clonejsonvalue)
- [getValueAtPath](packages_create_src_runtime_migration_utils.md#getvalueatpath)
- [setValueAtPath](packages_create_src_runtime_migration_utils.md#setvalueatpath)
- [deleteValueAtPath](packages_create_src_runtime_migration_utils.md#deletevalueatpath)
- [createFixtureScalarValue](packages_create_src_runtime_migration_utils.md#createfixturescalarvalue)
- [createTransformFixtureValue](packages_create_src_runtime_migration_utils.md#createtransformfixturevalue)
- [readJson](packages_create_src_runtime_migration_utils.md#readjson)
- [renderPhpValue](packages_create_src_runtime_migration_utils.md#renderphpvalue)
- [copyFile](packages_create_src_runtime_migration_utils.md#copyfile)
- [sanitizeSaveSnapshotSource](packages_create_src_runtime_migration_utils.md#sanitizesavesnapshotsource)
- [sanitizeSnapshotBlockJson](packages_create_src_runtime_migration_utils.md#sanitizesnapshotblockjson)
- [runProjectScriptIfPresent](packages_create_src_runtime_migration_utils.md#runprojectscriptifpresent)
- [detectPackageManagerId](packages_create_src_runtime_migration_utils.md#detectpackagemanagerid)
- [getLocalTsxBinary](packages_create_src_runtime_migration_utils.md#getlocaltsxbinary)
- [resolveTargetVersion](packages_create_src_runtime_migration_utils.md#resolvetargetversion)
- [assertSemver](packages_create_src_runtime_migration_utils.md#assertsemver)
- [compareSemver](packages_create_src_runtime_migration_utils.md#comparesemver)
- [escapeForCode](packages_create_src_runtime_migration_utils.md#escapeforcode)
- [renderObjectKey](packages_create_src_runtime_migration_utils.md#renderobjectkey)
- [isNumber](packages_create_src_runtime_migration_utils.md#isnumber)

## Functions

### cloneJsonValue

▸ **cloneJsonValue**\<`T`\>(`value`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

`T`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:8](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L8)

___

### getValueAtPath

▸ **getValueAtPath**(`input`, `pathLabel`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Record`\<`string`, `unknown`\> |
| `pathLabel` | `string` |

#### Returns

`unknown`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:12](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L12)

___

### setValueAtPath

▸ **setValueAtPath**(`input`, `pathLabel`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Record`\<`string`, `unknown`\> |
| `pathLabel` | `string` |
| `value` | `unknown` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L22)

___

### deleteValueAtPath

▸ **deleteValueAtPath**(`input`, `pathLabel`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Record`\<`string`, `unknown`\> |
| `pathLabel` | `string` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L38)

___

### createFixtureScalarValue

▸ **createFixtureScalarValue**(`pathLabel`): [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)

#### Parameters

| Name | Type |
| :------ | :------ |
| `pathLabel` | `string` |

#### Returns

[`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)

#### Defined in

[packages/create/src/runtime/migration-utils.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L51)

___

### createTransformFixtureValue

▸ **createTransformFixtureValue**(`attribute`, `pathLabel`): [`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `undefined` \| ``null`` \| [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |
| `pathLabel` | `string` |

#### Returns

[`JsonValue`](packages_create_src_runtime_migration_types.md#jsonvalue)

#### Defined in

[packages/create/src/runtime/migration-utils.ts:65](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L65)

___

### readJson

▸ **readJson**\<`T`\>(`filePath`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filePath` | `string` |

#### Returns

`T`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:78](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L78)

___

### renderPhpValue

▸ **renderPhpValue**(`value`, `indentLevel`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |
| `indentLevel` | `number` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:82](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L82)

___

### copyFile

▸ **copyFile**(`sourcePath`, `targetPath`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourcePath` | `string` |
| `targetPath` | `string` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L117)

___

### sanitizeSaveSnapshotSource

▸ **sanitizeSaveSnapshotSource**(`source`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L122)

___

### sanitizeSnapshotBlockJson

▸ **sanitizeSnapshotBlockJson**(`blockJson`): [`JsonObject`](packages_create_src_runtime_migration_types.md#jsonobject)

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockJson` | [`JsonObject`](packages_create_src_runtime_migration_types.md#jsonobject) |

#### Returns

[`JsonObject`](packages_create_src_runtime_migration_types.md#jsonobject)

#### Defined in

[packages/create/src/runtime/migration-utils.ts:134](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L134)

___

### runProjectScriptIfPresent

▸ **runProjectScriptIfPresent**(`projectDir`, `scriptName`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |
| `scriptName` | `string` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:151](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L151)

___

### detectPackageManagerId

▸ **detectPackageManagerId**(`projectDir`): ``"bun"`` \| ``"npm"`` \| ``"pnpm"`` \| ``"yarn"``

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

``"bun"`` \| ``"npm"`` \| ``"pnpm"`` \| ``"yarn"``

#### Defined in

[packages/create/src/runtime/migration-utils.ts:166](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L166)

___

### getLocalTsxBinary

▸ **getLocalTsxBinary**(`projectDir`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `projectDir` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:177](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L177)

___

### resolveTargetVersion

▸ **resolveTargetVersion**(`currentVersion`, `value`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currentVersion` | `string` |
| `value` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:188](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L188)

___

### assertSemver

▸ **assertSemver**(`value`, `label`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |
| `label` | `string` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:192](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L192)

___

### compareSemver

▸ **compareSemver**(`left`, `right`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `left` | `string` |
| `right` | `string` |

#### Returns

`number`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:198](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L198)

___

### escapeForCode

▸ **escapeForCode**(`value`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:212](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L212)

___

### renderObjectKey

▸ **renderObjectKey**(`key`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/migration-utils.ts:216](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L216)

___

### isNumber

▸ **isNumber**(`value`): value is number

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

value is number

#### Defined in

[packages/create/src/runtime/migration-utils.ts:220](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-utils.ts#L220)
