[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/template-builtins](../modules/packages_create_src_runtime_template_builtins.md) / MaterializedBuiltInTemplateSource

# Interface: MaterializedBuiltInTemplateSource

[packages/create/src/runtime/template-builtins](../modules/packages_create_src_runtime_template_builtins.md).MaterializedBuiltInTemplateSource

## Table of contents

### Properties

- [id](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#id)
- [defaultCategory](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#defaultcategory)
- [description](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#description)
- [features](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#features)
- [format](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#format)
- [templateDir](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#templatedir)
- [cleanup](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#cleanup)
- [selectedVariant](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#selectedvariant)
- [warnings](packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md#warnings)

## Properties

### id

• **id**: ``"persistence"`` \| ``"basic"`` \| ``"interactivity"``

#### Defined in

[packages/create/src/runtime/template-builtins.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L19)

___

### defaultCategory

• **defaultCategory**: `string`

#### Defined in

[packages/create/src/runtime/template-builtins.ts:20](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L20)

___

### description

• **description**: `string`

#### Defined in

[packages/create/src/runtime/template-builtins.ts:21](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L21)

___

### features

• **features**: `string`[]

#### Defined in

[packages/create/src/runtime/template-builtins.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L22)

___

### format

• **format**: ``"wp-typia"``

#### Defined in

[packages/create/src/runtime/template-builtins.ts:23](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L23)

___

### templateDir

• **templateDir**: `string`

#### Defined in

[packages/create/src/runtime/template-builtins.ts:24](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L24)

___

### cleanup

• `Optional` **cleanup**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/template-builtins.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L25)

___

### selectedVariant

• `Optional` **selectedVariant**: ``null`` \| `string`

#### Defined in

[packages/create/src/runtime/template-builtins.ts:26](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L26)

___

### warnings

• `Optional` **warnings**: `string`[]

#### Defined in

[packages/create/src/runtime/template-builtins.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L27)
