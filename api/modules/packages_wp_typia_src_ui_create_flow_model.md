[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/ui/create-flow-model

# Module: packages/wp-typia/src/ui/create-flow-model

## Table of contents

### Type Aliases

- [CreateFlowValues](packages_wp_typia_src_ui_create_flow_model.md#createflowvalues)
- [CreateFieldName](packages_wp_typia_src_ui_create_flow_model.md#createfieldname)

### Variables

- [createFlowSchema](packages_wp_typia_src_ui_create_flow_model.md#createflowschema)
- [CREATE\_CHECKBOX\_FIELD\_NAMES](packages_wp_typia_src_ui_create_flow_model.md#create_checkbox_field_names)
- [CREATE\_FIELD\_ORDER](packages_wp_typia_src_ui_create_flow_model.md#create_field_order)

### Functions

- [isCreatePersistenceTemplate](packages_wp_typia_src_ui_create_flow_model.md#iscreatepersistencetemplate)
- [getVisibleCreateFieldNames](packages_wp_typia_src_ui_create_flow_model.md#getvisiblecreatefieldnames)
- [getCreateViewportHeight](packages_wp_typia_src_ui_create_flow_model.md#getcreateviewportheight)
- [getCreateScrollTop](packages_wp_typia_src_ui_create_flow_model.md#getcreatescrolltop)
- [sanitizeCreateSubmitValues](packages_wp_typia_src_ui_create_flow_model.md#sanitizecreatesubmitvalues)

## Type Aliases

### CreateFlowValues

Ƭ **CreateFlowValues**: `z.infer`\<typeof [`createFlowSchema`](packages_wp_typia_src_ui_create_flow_model.md#createflowschema)\>

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:28](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L28)

___

### CreateFieldName

Ƭ **CreateFieldName**: ``"project-dir"`` \| ``"template"`` \| ``"package-manager"`` \| ``"namespace"`` \| ``"text-domain"`` \| ``"php-prefix"`` \| ``"data-storage"`` \| ``"persistence-policy"`` \| ``"no-install"`` \| ``"yes"`` \| ``"with-wp-env"`` \| ``"with-test-preset"`` \| ``"with-migration-ui"``

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L30)

## Variables

### createFlowSchema

• `Const` **createFlowSchema**: `ZodObject`\<\{ `data-storage`: `ZodOptional`\<`ZodString`\> ; `namespace`: `ZodOptional`\<`ZodString`\> ; `no-install`: `ZodDefault`\<`ZodBoolean`\> ; `package-manager`: `ZodOptional`\<`ZodString`\> ; `persistence-policy`: `ZodOptional`\<`ZodString`\> ; `php-prefix`: `ZodOptional`\<`ZodString`\> ; `project-dir`: `ZodString` ; `template`: `ZodOptional`\<`ZodString`\> ; `text-domain`: `ZodOptional`\<`ZodString`\> ; `variant`: `ZodOptional`\<`ZodString`\> ; `with-migration-ui`: `ZodDefault`\<`ZodBoolean`\> ; `with-test-preset`: `ZodDefault`\<`ZodBoolean`\> ; `with-wp-env`: `ZodDefault`\<`ZodBoolean`\> ; `yes`: `ZodDefault`\<`ZodBoolean`\>  }, `$strip`\>

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L11)

___

### CREATE\_CHECKBOX\_FIELD\_NAMES

• `Const` **CREATE\_CHECKBOX\_FIELD\_NAMES**: readonly [``"no-install"``, ``"yes"``, ``"with-wp-env"``, ``"with-test-preset"``, ``"with-migration-ui"``]

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L45)

___

### CREATE\_FIELD\_ORDER

• `Const` **CREATE\_FIELD\_ORDER**: readonly [``"project-dir"``, ``"template"``, ``"package-manager"``, ``"namespace"``, ``"text-domain"``, ``"php-prefix"``, ``"data-storage"``, ``"persistence-policy"``, ``"no-install"``, ``"yes"``, ``"with-wp-env"``, ``"with-test-preset"``, ``"with-migration-ui"``]

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:53](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L53)

## Functions

### isCreatePersistenceTemplate

▸ **isCreatePersistenceTemplate**(`template?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `template?` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:81](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L81)

___

### getVisibleCreateFieldNames

▸ **getVisibleCreateFieldNames**(`values`): [`CreateFieldName`](packages_wp_typia_src_ui_create_flow_model.md#createfieldname)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | `Partial`\<\{ `data-storage?`: `string` ; `namespace?`: `string` ; `no-install`: `boolean` ; `package-manager?`: `string` ; `persistence-policy?`: `string` ; `php-prefix?`: `string` ; `project-dir`: `string` ; `template?`: `string` ; `text-domain?`: `string` ; `variant?`: `string` ; `with-migration-ui`: `boolean` ; `with-test-preset`: `boolean` ; `with-wp-env`: `boolean` ; `yes`: `boolean`  }\> |

#### Returns

[`CreateFieldName`](packages_wp_typia_src_ui_create_flow_model.md#createfieldname)[]

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L85)

___

### getCreateViewportHeight

▸ **getCreateViewportHeight**(`terminalHeight?`): `number`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `terminalHeight` | `number` | `24` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L97)

___

### getCreateScrollTop

▸ **getCreateScrollTop**(`options`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.activeFieldName` | ``null`` \| `string` |
| `options.values` | `Partial`\<\{ `data-storage?`: `string` ; `namespace?`: `string` ; `no-install`: `boolean` ; `package-manager?`: `string` ; `persistence-policy?`: `string` ; `php-prefix?`: `string` ; `project-dir`: `string` ; `template?`: `string` ; `text-domain?`: `string` ; `variant?`: `string` ; `with-migration-ui`: `boolean` ; `with-test-preset`: `boolean` ; `with-wp-env`: `boolean` ; `yes`: `boolean`  }\> |
| `options.viewportHeight` | `number` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L101)

___

### sanitizeCreateSubmitValues

▸ **sanitizeCreateSubmitValues**(`values`): [`CreateFlowValues`](packages_wp_typia_src_ui_create_flow_model.md#createflowvalues)

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | `Object` |
| `values.data-storage?` | `string` |
| `values.namespace?` | `string` |
| `values.no-install` | `boolean` |
| `values.package-manager?` | `string` |
| `values.persistence-policy?` | `string` |
| `values.php-prefix?` | `string` |
| `values.project-dir` | `string` |
| `values.template?` | `string` |
| `values.text-domain?` | `string` |
| `values.variant?` | `string` |
| `values.with-migration-ui` | `boolean` |
| `values.with-test-preset` | `boolean` |
| `values.with-wp-env` | `boolean` |
| `values.yes` | `boolean` |

#### Returns

[`CreateFlowValues`](packages_wp_typia_src_ui_create_flow_model.md#createflowvalues)

#### Defined in

[packages/wp-typia/src/ui/create-flow-model.ts:115](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/create-flow-model.ts#L115)
