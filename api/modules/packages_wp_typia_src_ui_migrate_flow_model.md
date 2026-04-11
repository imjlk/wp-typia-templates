[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/ui/migrate-flow-model

# Module: packages/wp-typia/src/ui/migrate-flow-model

## Table of contents

### Type Aliases

- [MigrateFlowValues](packages_wp_typia_src_ui_migrate_flow_model.md#migrateflowvalues)
- [MigrateFieldName](packages_wp_typia_src_ui_migrate_flow_model.md#migratefieldname)

### Variables

- [migrateFlowSchema](packages_wp_typia_src_ui_migrate_flow_model.md#migrateflowschema)

### Functions

- [getVisibleMigrateFieldNames](packages_wp_typia_src_ui_migrate_flow_model.md#getvisiblemigratefieldnames)
- [getMigrateViewportHeight](packages_wp_typia_src_ui_migrate_flow_model.md#getmigrateviewportheight)
- [getMigrateScrollTop](packages_wp_typia_src_ui_migrate_flow_model.md#getmigratescrolltop)
- [sanitizeMigrateSubmitValues](packages_wp_typia_src_ui_migrate_flow_model.md#sanitizemigratesubmitvalues)

## Type Aliases

### MigrateFlowValues

Ƭ **MigrateFlowValues**: `z.infer`\<typeof [`migrateFlowSchema`](packages_wp_typia_src_ui_migrate_flow_model.md#migrateflowschema)\>

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L34)

___

### MigrateFieldName

Ƭ **MigrateFieldName**: ``"command"`` \| ``"current-migration-version"`` \| ``"migration-version"`` \| ``"from-migration-version"`` \| ``"to-migration-version"`` \| ``"all"`` \| ``"force"`` \| ``"iterations"`` \| ``"seed"``

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L36)

## Variables

### migrateFlowSchema

• `Const` **migrateFlowSchema**: `ZodObject`\<\{ `all`: `ZodDefault`\<`ZodBoolean`\> ; `command`: `ZodEnum`\<\{ `scaffold`: ``"scaffold"`` ; `doctor`: ``"doctor"`` ; `init`: ``"init"`` ; `snapshot`: ``"snapshot"`` ; `diff`: ``"diff"`` ; `plan`: ``"plan"`` ; `wizard`: ``"wizard"`` ; `verify`: ``"verify"`` ; `fixtures`: ``"fixtures"`` ; `fuzz`: ``"fuzz"``  }\> ; `current-migration-version`: `ZodOptional`\<`ZodString`\> ; `force`: `ZodDefault`\<`ZodBoolean`\> ; `from-migration-version`: `ZodOptional`\<`ZodString`\> ; `iterations`: `ZodOptional`\<`ZodString`\> ; `migration-version`: `ZodOptional`\<`ZodString`\> ; `seed`: `ZodOptional`\<`ZodString`\> ; `to-migration-version`: `ZodOptional`\<`ZodString`\>  }, `$strip`\>

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L11)

## Functions

### getVisibleMigrateFieldNames

▸ **getVisibleMigrateFieldNames**(`values`): [`MigrateFieldName`](packages_wp_typia_src_ui_migrate_flow_model.md#migratefieldname)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | `Partial`\<\{ `all`: `boolean` ; `command`: ``"scaffold"`` \| ``"doctor"`` \| ``"init"`` \| ``"snapshot"`` \| ``"diff"`` \| ``"plan"`` \| ``"wizard"`` \| ``"verify"`` \| ``"fixtures"`` \| ``"fuzz"`` ; `current-migration-version?`: `string` ; `force`: `boolean` ; `from-migration-version?`: `string` ; `iterations?`: `string` ; `migration-version?`: `string` ; `seed?`: `string` ; `to-migration-version?`: `string`  }\> |

#### Returns

[`MigrateFieldName`](packages_wp_typia_src_ui_migrate_flow_model.md#migratefieldname)[]

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L59)

___

### getMigrateViewportHeight

▸ **getMigrateViewportHeight**(`terminalHeight?`): `number`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `terminalHeight` | `number` | `24` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:88](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L88)

___

### getMigrateScrollTop

▸ **getMigrateScrollTop**(`options`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.activeFieldName` | ``null`` \| `string` |
| `options.values` | `Partial`\<\{ `all`: `boolean` ; `command`: ``"scaffold"`` \| ``"doctor"`` \| ``"init"`` \| ``"snapshot"`` \| ``"diff"`` \| ``"plan"`` \| ``"wizard"`` \| ``"verify"`` \| ``"fixtures"`` \| ``"fuzz"`` ; `current-migration-version?`: `string` ; `force`: `boolean` ; `from-migration-version?`: `string` ; `iterations?`: `string` ; `migration-version?`: `string` ; `seed?`: `string` ; `to-migration-version?`: `string`  }\> |
| `options.viewportHeight` | `number` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:92](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L92)

___

### sanitizeMigrateSubmitValues

▸ **sanitizeMigrateSubmitValues**(`values`): `Record`\<`string`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | `Object` |
| `values.all` | `boolean` |
| `values.command` | ``"scaffold"`` \| ``"doctor"`` \| ``"init"`` \| ``"snapshot"`` \| ``"diff"`` \| ``"plan"`` \| ``"wizard"`` \| ``"verify"`` \| ``"fixtures"`` \| ``"fuzz"`` |
| `values.current-migration-version?` | `string` |
| `values.force` | `boolean` |
| `values.from-migration-version?` | `string` |
| `values.iterations?` | `string` |
| `values.migration-version?` | `string` |
| `values.seed?` | `string` |
| `values.to-migration-version?` | `string` |

#### Returns

`Record`\<`string`, `unknown`\>

#### Defined in

[packages/wp-typia/src/ui/migrate-flow-model.ts:106](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/migrate-flow-model.ts#L106)
