[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/ui/add-flow-model

# Module: packages/wp-typia/src/ui/add-flow-model

## Table of contents

### Type Aliases

- [AddFlowValues](packages_wp_typia_src_ui_add_flow_model.md#addflowvalues)
- [AddFieldName](packages_wp_typia_src_ui_add_flow_model.md#addfieldname)

### Variables

- [addFlowSchema](packages_wp_typia_src_ui_add_flow_model.md#addflowschema)

### Functions

- [isAddPersistenceTemplate](packages_wp_typia_src_ui_add_flow_model.md#isaddpersistencetemplate)
- [getVisibleAddFieldNames](packages_wp_typia_src_ui_add_flow_model.md#getvisibleaddfieldnames)
- [getAddViewportHeight](packages_wp_typia_src_ui_add_flow_model.md#getaddviewportheight)
- [getAddScrollTop](packages_wp_typia_src_ui_add_flow_model.md#getaddscrolltop)
- [sanitizeAddSubmitValues](packages_wp_typia_src_ui_add_flow_model.md#sanitizeaddsubmitvalues)

## Type Aliases

### AddFlowValues

Ƭ **AddFlowValues**: `z.infer`\<typeof [`addFlowSchema`](packages_wp_typia_src_ui_add_flow_model.md#addflowschema)\>

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:23](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L23)

___

### AddFieldName

Ƭ **AddFieldName**: ``"kind"`` \| ``"name"`` \| ``"template"`` \| ``"block"`` \| ``"anchor"`` \| ``"position"`` \| ``"data-storage"`` \| ``"persistence-policy"``

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L25)

## Variables

### addFlowSchema

• `Const` **addFlowSchema**: `ZodObject`\<\{ `anchor`: `ZodOptional`\<`ZodString`\> ; `block`: `ZodOptional`\<`ZodString`\> ; `data-storage`: `ZodOptional`\<`ZodString`\> ; `kind`: `ZodDefault`\<`ZodEnum`\<\{ `pattern`: ``"pattern"`` ; `block`: ``"block"`` ; `variation`: ``"variation"`` ; `binding-source`: ``"binding-source"`` ; `hooked-block`: ``"hooked-block"``  }\>\> ; `name`: `ZodOptional`\<`ZodString`\> ; `persistence-policy`: `ZodOptional`\<`ZodString`\> ; `position`: `ZodOptional`\<`ZodString`\> ; `template`: `ZodOptional`\<`ZodString`\>  }, `$strip`\>

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:10](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L10)

## Functions

### isAddPersistenceTemplate

▸ **isAddPersistenceTemplate**(`template?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `template?` | `string` |

#### Returns

`boolean`

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:57](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L57)

___

### getVisibleAddFieldNames

▸ **getVisibleAddFieldNames**(`values`): [`AddFieldName`](packages_wp_typia_src_ui_add_flow_model.md#addfieldname)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | `Partial`\<\{ `anchor?`: `string` ; `block?`: `string` ; `data-storage?`: `string` ; `kind`: ``"pattern"`` \| ``"block"`` \| ``"variation"`` \| ``"binding-source"`` \| ``"hooked-block"`` ; `name?`: `string` ; `persistence-policy?`: `string` ; `position?`: `string` ; `template?`: `string`  }\> |

#### Returns

[`AddFieldName`](packages_wp_typia_src_ui_add_flow_model.md#addfieldname)[]

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:61](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L61)

___

### getAddViewportHeight

▸ **getAddViewportHeight**(`terminalHeight?`): `number`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `terminalHeight` | `number` | `24` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:82](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L82)

___

### getAddScrollTop

▸ **getAddScrollTop**(`options`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.activeFieldName` | ``null`` \| `string` |
| `options.values` | `Partial`\<\{ `anchor?`: `string` ; `block?`: `string` ; `data-storage?`: `string` ; `kind`: ``"pattern"`` \| ``"block"`` \| ``"variation"`` \| ``"binding-source"`` \| ``"hooked-block"`` ; `name?`: `string` ; `persistence-policy?`: `string` ; `position?`: `string` ; `template?`: `string`  }\> |
| `options.viewportHeight` | `number` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:86](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L86)

___

### sanitizeAddSubmitValues

▸ **sanitizeAddSubmitValues**(`values`): `Record`\<`string`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | `Object` |
| `values.anchor?` | `string` |
| `values.block?` | `string` |
| `values.data-storage?` | `string` |
| `values.kind` | ``"pattern"`` \| ``"block"`` \| ``"variation"`` \| ``"binding-source"`` \| ``"hooked-block"`` |
| `values.name?` | `string` |
| `values.persistence-policy?` | `string` |
| `values.position?` | `string` |
| `values.template?` | `string` |

#### Returns

`Record`\<`string`, `unknown`\>

#### Defined in

[packages/wp-typia/src/ui/add-flow-model.ts:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/add-flow-model.ts#L100)
