[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/ui/first-party-form

# Module: packages/wp-typia/src/ui/first-party-form

## Table of contents

### Functions

- [FirstPartyTextField](packages_wp_typia_src_ui_first_party_form.md#firstpartytextfield)
- [FirstPartySelectField](packages_wp_typia_src_ui_first_party_form.md#firstpartyselectfield)
- [FirstPartyCheckboxField](packages_wp_typia_src_ui_first_party_form.md#firstpartycheckboxfield)
- [FirstPartyScrollBox](packages_wp_typia_src_ui_first_party_form.md#firstpartyscrollbox)

## Functions

### FirstPartyTextField

▸ **FirstPartyTextField**(`«destructured»`): `ReactElement`\<\{ `style`: \{ `flexDirection`: `string` = "column"; `marginBottom`: `number` = FIRST\_PARTY\_FIELD\_GAP; `gap`: `number` = 1 }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `defaultValue?` | `string` | `""` |
| › `description?` | `string` | `undefined` |
| › `label` | `string` | `undefined` |
| › `name` | `string` | `undefined` |
| › `nextFieldName?` | `string` | `undefined` |
| › `placeholder?` | `string` | `undefined` |
| › `previousFieldName?` | `string` | `undefined` |
| › `required?` | `boolean` | `undefined` |

#### Returns

`ReactElement`\<\{ `style`: \{ `flexDirection`: `string` = "column"; `marginBottom`: `number` = FIRST\_PARTY\_FIELD\_GAP; `gap`: `number` = 1 }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Defined in

[packages/wp-typia/src/ui/first-party-form.tsx:136](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form.tsx#L136)

___

### FirstPartySelectField

▸ **FirstPartySelectField**(`«destructured»`): `ReactElement`\<\{ `style`: \{ `flexDirection`: `string` = "column"; `gap`: `number` = FIRST\_PARTY\_SELECT\_FIELD\_LABEL\_GAP; `marginBottom`: `number` = FIRST\_PARTY\_FIELD\_GAP }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `defaultValue?` | `string` |
| › `label` | `string` |
| › `name` | `string` |
| › `nextFieldName?` | `string` |
| › `options` | `SelectOption`[] |
| › `previousFieldName?` | `string` |

#### Returns

`ReactElement`\<\{ `style`: \{ `flexDirection`: `string` = "column"; `gap`: `number` = FIRST\_PARTY\_SELECT\_FIELD\_LABEL\_GAP; `marginBottom`: `number` = FIRST\_PARTY\_FIELD\_GAP }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Defined in

[packages/wp-typia/src/ui/first-party-form.tsx:218](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form.tsx#L218)

___

### FirstPartyCheckboxField

▸ **FirstPartyCheckboxField**(`«destructured»`): `ReactElement`\<\{ `style`: \{ `flexDirection`: `string` = "column"; `height`: `number` = FIRST\_PARTY\_CHECKBOX\_FIELD\_BODY\_HEIGHT; `marginBottom`: `number` = FIRST\_PARTY\_FIELD\_GAP }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `label` | `string` |
| › `name` | `string` |
| › `nextFieldName?` | `string` |
| › `previousFieldName?` | `string` |

#### Returns

`ReactElement`\<\{ `style`: \{ `flexDirection`: `string` = "column"; `height`: `number` = FIRST\_PARTY\_CHECKBOX\_FIELD\_BODY\_HEIGHT; `marginBottom`: `number` = FIRST\_PARTY\_FIELD\_GAP }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Defined in

[packages/wp-typia/src/ui/first-party-form.tsx:352](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form.tsx#L352)

___

### FirstPartyScrollBox

▸ **FirstPartyScrollBox**(`«destructured»`): `ReactElement`\<\{ `ref`: `RefObject`\<``null`` \| \{ `scrollTop`: `number`  }\> = bodyRef; `height`: `number` = viewportHeight; `scrollY`: `boolean` = true; `scrollbarOptions`: \{ `visible`: `boolean` = true; `trackOptions`: \{ `backgroundColor`: `string` = tokens.backgroundMuted; `foregroundColor`: `string` = tokens.borderMuted }  } ; `viewportOptions`: \{ `width`: `string` = "100%" } ; `contentOptions`: \{ `width`: `string` = "100%" }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `children?` | `ReactNode` |
| › `scrollTop` | `number` |
| › `viewportHeight` | `number` |

#### Returns

`ReactElement`\<\{ `ref`: `RefObject`\<``null`` \| \{ `scrollTop`: `number`  }\> = bodyRef; `height`: `number` = viewportHeight; `scrollY`: `boolean` = true; `scrollbarOptions`: \{ `visible`: `boolean` = true; `trackOptions`: \{ `backgroundColor`: `string` = tokens.backgroundMuted; `foregroundColor`: `string` = tokens.borderMuted }  } ; `viewportOptions`: \{ `width`: `string` = "100%" } ; `contentOptions`: \{ `width`: `string` = "100%" }  }, `string` \| `JSXElementConstructor`\<`any`\>\>

#### Defined in

[packages/wp-typia/src/ui/first-party-form.tsx:418](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/first-party-form.tsx#L418)
