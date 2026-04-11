[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/ui/first-party-form-model

# Module: packages/wp-typia/src/ui/first-party-form-model

## Table of contents

### Type Aliases

- [FirstPartyFieldHeights](packages_wp_typia_src_ui_first_party_form_model.md#firstpartyfieldheights)

### Variables

- [FIRST\_PARTY\_FIELD\_GAP](packages_wp_typia_src_ui_first_party_form_model.md#first_party_field_gap)
- [FIRST\_PARTY\_TEXT\_FIELD\_BODY\_HEIGHT](packages_wp_typia_src_ui_first_party_form_model.md#first_party_text_field_body_height)
- [FIRST\_PARTY\_CHECKBOX\_FIELD\_BODY\_HEIGHT](packages_wp_typia_src_ui_first_party_form_model.md#first_party_checkbox_field_body_height)
- [FIRST\_PARTY\_SELECT\_FIELD\_LABEL\_GAP](packages_wp_typia_src_ui_first_party_form_model.md#first_party_select_field_label_gap)
- [FIRST\_PARTY\_SELECT\_FIELD\_CONTROL\_HEIGHT](packages_wp_typia_src_ui_first_party_form_model.md#first_party_select_field_control_height)
- [FIRST\_PARTY\_SELECT\_FIELD\_BODY\_HEIGHT](packages_wp_typia_src_ui_first_party_form_model.md#first_party_select_field_body_height)

### Functions

- [getWrappedFieldNeighbors](packages_wp_typia_src_ui_first_party_form_model.md#getwrappedfieldneighbors)
- [getFirstPartyViewportHeight](packages_wp_typia_src_ui_first_party_form_model.md#getfirstpartyviewportheight)
- [getFirstPartyScrollTop](packages_wp_typia_src_ui_first_party_form_model.md#getfirstpartyscrolltop)

## Type Aliases

### FirstPartyFieldHeights

Ƭ **FirstPartyFieldHeights**\<`TName`\>: `Record`\<`TName`, `number`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TName` | extends `string` |

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:9](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L9)

## Variables

### FIRST\_PARTY\_FIELD\_GAP

• `Const` **FIRST\_PARTY\_FIELD\_GAP**: ``1``

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:1](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L1)

___

### FIRST\_PARTY\_TEXT\_FIELD\_BODY\_HEIGHT

• `Const` **FIRST\_PARTY\_TEXT\_FIELD\_BODY\_HEIGHT**: ``6``

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:2](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L2)

___

### FIRST\_PARTY\_CHECKBOX\_FIELD\_BODY\_HEIGHT

• `Const` **FIRST\_PARTY\_CHECKBOX\_FIELD\_BODY\_HEIGHT**: ``2``

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:3](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L3)

___

### FIRST\_PARTY\_SELECT\_FIELD\_LABEL\_GAP

• `Const` **FIRST\_PARTY\_SELECT\_FIELD\_LABEL\_GAP**: ``1``

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L4)

___

### FIRST\_PARTY\_SELECT\_FIELD\_CONTROL\_HEIGHT

• `Const` **FIRST\_PARTY\_SELECT\_FIELD\_CONTROL\_HEIGHT**: ``3``

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:5](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L5)

___

### FIRST\_PARTY\_SELECT\_FIELD\_BODY\_HEIGHT

• `Const` **FIRST\_PARTY\_SELECT\_FIELD\_BODY\_HEIGHT**: `number`

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:6](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L6)

## Functions

### getWrappedFieldNeighbors

▸ **getWrappedFieldNeighbors**\<`TName`\>(`visibleFieldNames`, `fieldName`): `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TName` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `visibleFieldNames` | readonly `TName`[] |
| `fieldName` | `TName` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `nextFieldName?` | `TName` |
| `previousFieldName?` | `TName` |

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L11)

___

### getFirstPartyViewportHeight

▸ **getFirstPartyViewportHeight**(`terminalHeight?`): `number`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `terminalHeight` | `number` | `24` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L30)

___

### getFirstPartyScrollTop

▸ **getFirstPartyScrollTop**\<`TName`\>(`options`): `number`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TName` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.activeFieldName` | ``null`` \| `string` |
| `options.fieldHeights` | [`FirstPartyFieldHeights`](packages_wp_typia_src_ui_first_party_form_model.md#firstpartyfieldheights)\<`TName`\> |
| `options.visibleFieldNames` | readonly `TName`[] |
| `options.viewportHeight` | `number` |

#### Returns

`number`

#### Defined in

[packages/wp-typia/src/ui/first-party-form-model.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form-model.ts#L34)
