[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/runtime-bridge

# Module: packages/wp-typia/src/runtime-bridge

## Table of contents

### References

- [formatAddHelpText](packages_wp_typia_src_runtime_bridge.md#formataddhelptext)
- [formatMigrationHelpText](packages_wp_typia_src_runtime_bridge.md#formatmigrationhelptext)
- [listTemplates](packages_wp_typia_src_runtime_bridge.md#listtemplates)

### Functions

- [executeCreateCommand](packages_wp_typia_src_runtime_bridge.md#executecreatecommand)
- [executeAddCommand](packages_wp_typia_src_runtime_bridge.md#executeaddcommand)
- [executeTemplatesCommand](packages_wp_typia_src_runtime_bridge.md#executetemplatescommand)
- [executeDoctorCommand](packages_wp_typia_src_runtime_bridge.md#executedoctorcommand)
- [executeMigrateCommand](packages_wp_typia_src_runtime_bridge.md#executemigratecommand)
- [getAddWorkspaceBlockOptions](packages_wp_typia_src_runtime_bridge.md#getaddworkspaceblockoptions)

## References

### formatAddHelpText

Re-exports [formatAddHelpText](packages_wp_typia_project_tools_src_runtime_cli_add.md#formataddhelptext)

___

### formatMigrationHelpText

Re-exports [formatMigrationHelpText](packages_wp_typia_project_tools_src_runtime_migrations.md#formatmigrationhelptext)

___

### listTemplates

Re-exports [listTemplates](packages_wp_typia_project_tools_src_runtime_template_registry.md#listtemplates)

## Functions

### executeCreateCommand

▸ **executeCreateCommand**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CreateExecutionInput` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/runtime-bridge.ts:125](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/runtime-bridge.ts#L125)

___

### executeAddCommand

▸ **executeAddCommand**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `AddExecutionInput` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/runtime-bridge.ts:217](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/runtime-bridge.ts#L217)

___

### executeTemplatesCommand

▸ **executeTemplatesCommand**(`«destructured»`, `printLine?`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `TemplatesExecutionInput` | `undefined` |
| `printLine` | `PrintLine` | `console.log` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/runtime-bridge.ts:345](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/runtime-bridge.ts#L345)

___

### executeDoctorCommand

▸ **executeDoctorCommand**(`cwd`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/runtime-bridge.ts:383](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/runtime-bridge.ts#L383)

___

### executeMigrateCommand

▸ **executeMigrateCommand**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `MigrateExecutionInput` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/runtime-bridge.ts:387](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/runtime-bridge.ts#L387)

___

### getAddWorkspaceBlockOptions

▸ **getAddWorkspaceBlockOptions**(`cwd`): \{ `description`: `string` ; `name`: `string` ; `value`: `string`  }[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |

#### Returns

\{ `description`: `string` ; `name`: `string` ; `value`: `string`  }[]

#### Defined in

[packages/wp-typia/src/runtime-bridge.ts:428](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/runtime-bridge.ts#L428)
