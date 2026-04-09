[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/migration-utils

# Module: packages/wp-typia-project-tools/src/runtime/migration-utils

## Table of contents

### References

- [cloneJsonValue](packages_wp_typia_project_tools_src_runtime_migration_utils.md#clonejsonvalue)

### Functions

- [getValueAtPath](packages_wp_typia_project_tools_src_runtime_migration_utils.md#getvalueatpath)
- [setValueAtPath](packages_wp_typia_project_tools_src_runtime_migration_utils.md#setvalueatpath)
- [deleteValueAtPath](packages_wp_typia_project_tools_src_runtime_migration_utils.md#deletevalueatpath)
- [createFixtureScalarValue](packages_wp_typia_project_tools_src_runtime_migration_utils.md#createfixturescalarvalue)
- [createTransformFixtureValue](packages_wp_typia_project_tools_src_runtime_migration_utils.md#createtransformfixturevalue)
- [readJson](packages_wp_typia_project_tools_src_runtime_migration_utils.md#readjson)
- [renderPhpValue](packages_wp_typia_project_tools_src_runtime_migration_utils.md#renderphpvalue)
- [copyFile](packages_wp_typia_project_tools_src_runtime_migration_utils.md#copyfile)
- [sanitizeSaveSnapshotSource](packages_wp_typia_project_tools_src_runtime_migration_utils.md#sanitizesavesnapshotsource)
- [sanitizeSnapshotBlockJson](packages_wp_typia_project_tools_src_runtime_migration_utils.md#sanitizesnapshotblockjson)
- [runProjectScriptIfPresent](packages_wp_typia_project_tools_src_runtime_migration_utils.md#runprojectscriptifpresent)
- [detectPackageManagerId](packages_wp_typia_project_tools_src_runtime_migration_utils.md#detectpackagemanagerid)
- [getLocalTsxBinary](packages_wp_typia_project_tools_src_runtime_migration_utils.md#getlocaltsxbinary)
- [isInteractiveTerminal](packages_wp_typia_project_tools_src_runtime_migration_utils.md#isinteractiveterminal)
- [resolveTargetMigrationVersion](packages_wp_typia_project_tools_src_runtime_migration_utils.md#resolvetargetmigrationversion)
- [isMigrationVersionLabel](packages_wp_typia_project_tools_src_runtime_migration_utils.md#ismigrationversionlabel)
- [isLegacySemverMigrationVersion](packages_wp_typia_project_tools_src_runtime_migration_utils.md#islegacysemvermigrationversion)
- [assertMigrationVersionLabel](packages_wp_typia_project_tools_src_runtime_migration_utils.md#assertmigrationversionlabel)
- [compareMigrationVersionLabels](packages_wp_typia_project_tools_src_runtime_migration_utils.md#comparemigrationversionlabels)
- [formatLegacyMigrationWorkspaceResetGuidance](packages_wp_typia_project_tools_src_runtime_migration_utils.md#formatlegacymigrationworkspaceresetguidance)
- [escapeForCode](packages_wp_typia_project_tools_src_runtime_migration_utils.md#escapeforcode)
- [renderObjectKey](packages_wp_typia_project_tools_src_runtime_migration_utils.md#renderobjectkey)
- [isNumber](packages_wp_typia_project_tools_src_runtime_migration_utils.md#isnumber)

## References

### cloneJsonValue

Re-exports [cloneJsonValue](packages_wp_typia_block_runtime_src_json_utils.md#clonejsonvalue)

## Functions

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:12](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L12)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L22)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L38)

___

### createFixtureScalarValue

▸ **createFixtureScalarValue**(`pathLabel`): [`JsonValue`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonvalue)

#### Parameters

| Name | Type |
| :------ | :------ |
| `pathLabel` | `string` |

#### Returns

[`JsonValue`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonvalue)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L51)

___

### createTransformFixtureValue

▸ **createTransformFixtureValue**(`attribute`, `pathLabel`): [`JsonValue`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonvalue)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `undefined` \| ``null`` \| [`ManifestAttribute`](../interfaces/packages_wp_typia_project_tools_src_runtime_migration_types.ManifestAttribute.md) |
| `pathLabel` | `string` |

#### Returns

[`JsonValue`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonvalue)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:65](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L65)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:78](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L78)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:82](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L82)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L117)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L122)

___

### sanitizeSnapshotBlockJson

▸ **sanitizeSnapshotBlockJson**(`blockJson`): [`JsonObject`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonobject)

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockJson` | [`JsonObject`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonobject) |

#### Returns

[`JsonObject`](packages_wp_typia_project_tools_src_runtime_migration_types.md#jsonobject)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:134](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L134)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:151](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L151)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:166](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L166)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:177](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L177)

___

### isInteractiveTerminal

▸ **isInteractiveTerminal**(): `boolean`

Returns whether isInteractiveTerminal() is running with both stdin and stdout
attached to a TTY so CLI and migration flows can safely prompt the user.

#### Returns

`boolean`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:192](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L192)

___

### resolveTargetMigrationVersion

▸ **resolveTargetMigrationVersion**(`currentMigrationVersion`, `value`): `string`

Resolves the `current` sentinel to the current migration version label.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currentMigrationVersion` | `string` | Current migration version label for the workspace. |
| `value` | `string` | Requested target value, which may be `current`. |

#### Returns

`string`

The concrete migration version label that should be used.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:203](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L203)

___

### isMigrationVersionLabel

▸ **isMigrationVersionLabel**(`value`): `boolean`

Returns whether a value matches the canonical `vN` migration label format.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | Candidate migration version label. |

#### Returns

`boolean`

`true` when the value is a valid `vN` label with `N >= 1`.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:213](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L213)

___

### isLegacySemverMigrationVersion

▸ **isLegacySemverMigrationVersion**(`value`): `boolean`

Returns whether a value looks like a legacy semver-based migration label.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | Candidate migration version label. |

#### Returns

`boolean`

`true` when the value matches the legacy `x.y.z` semver pattern.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:223](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L223)

___

### assertMigrationVersionLabel

▸ **assertMigrationVersionLabel**(`value`, `label`): `void`

Throws when a migration version label does not match the canonical `vN` format.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `string` | Candidate migration version label. |
| `label` | `string` | Human-readable label used in the thrown error message. |

#### Returns

`void`

Nothing.

**`Throws`**

Error When the provided value is not a valid `vN` migration label.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:235](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L235)

___

### compareMigrationVersionLabels

▸ **compareMigrationVersionLabels**(`left`, `right`): `number`

Compares two migration version labels by their numeric suffix.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `left` | `string` | Left migration version label. |
| `right` | `string` | Right migration version label. |

#### Returns

`number`

A negative number when `left < right`, zero when equal, and a positive number when `left > right`.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:256](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L256)

___

### formatLegacyMigrationWorkspaceResetGuidance

▸ **formatLegacyMigrationWorkspaceResetGuidance**(`reason?`): `string`

Formats the reset guidance shown when a legacy semver migration workspace is detected.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `reason?` | `string` | Optional leading reason that explains what legacy pattern was found. |

#### Returns

`string`

A user-facing guidance string that explains how to reset to `v1` labels.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:266](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L266)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:274](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L274)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:278](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L278)

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

[packages/wp-typia-project-tools/src/runtime/migration-utils.ts:282](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/migration-utils.ts#L282)
