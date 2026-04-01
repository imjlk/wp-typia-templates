[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/template-source](../modules/packages_create_src_runtime_template_source.md) / TemplateVariableContext

# Interface: TemplateVariableContext

[packages/create/src/runtime/template-source](../modules/packages_create_src_runtime_template_source.md).TemplateVariableContext

Public template variables exposed to external template seeds before wp-typia
normalizes them into a scaffold project.

## Hierarchy

- `Record`\<`string`, `unknown`\>

  ↳ **`TemplateVariableContext`**

## Table of contents

### Properties

- [createPackageVersion](packages_create_src_runtime_template_source.TemplateVariableContext.md#createpackageversion)
- [blockTypesPackageVersion](packages_create_src_runtime_template_source.TemplateVariableContext.md#blocktypespackageversion)
- [pascalCase](packages_create_src_runtime_template_source.TemplateVariableContext.md#pascalcase)
- [phpPrefix](packages_create_src_runtime_template_source.TemplateVariableContext.md#phpprefix)
- [title](packages_create_src_runtime_template_source.TemplateVariableContext.md#title)
- [description](packages_create_src_runtime_template_source.TemplateVariableContext.md#description)
- [keyword](packages_create_src_runtime_template_source.TemplateVariableContext.md#keyword)
- [namespace](packages_create_src_runtime_template_source.TemplateVariableContext.md#namespace)
- [slug](packages_create_src_runtime_template_source.TemplateVariableContext.md#slug)
- [textDomain](packages_create_src_runtime_template_source.TemplateVariableContext.md#textdomain)

## Properties

### createPackageVersion

• **createPackageVersion**: `string`

Version string for `@wp-typia/create` used in generated dependencies.

#### Defined in

[packages/create/src/runtime/template-source.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L36)

___

### blockTypesPackageVersion

• **blockTypesPackageVersion**: `string`

Version string for `@wp-typia/block-types` used in generated dependencies.

#### Defined in

[packages/create/src/runtime/template-source.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L38)

___

### pascalCase

• **pascalCase**: `string`

PascalCase block type name derived from the scaffold slug.

#### Defined in

[packages/create/src/runtime/template-source.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L40)

___

### phpPrefix

• **phpPrefix**: `string`

Snake_case PHP symbol prefix used for generated functions, constants, and keys.

#### Defined in

[packages/create/src/runtime/template-source.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L42)

___

### title

• **title**: `string`

Human-readable block title.

#### Defined in

[packages/create/src/runtime/template-source.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L44)

___

### description

• **description**: `string`

Human-readable project or block description.

#### Defined in

[packages/create/src/runtime/template-source.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L46)

___

### keyword

• **keyword**: `string`

Keyword string derived from the slug for generated block metadata.

#### Defined in

[packages/create/src/runtime/template-source.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L48)

___

### namespace

• **namespace**: `string`

Block namespace used in generated block names such as `namespace/slug`.

#### Defined in

[packages/create/src/runtime/template-source.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L50)

___

### slug

• **slug**: `string`

Kebab-case scaffold slug used for package names, paths, and block slugs.

#### Defined in

[packages/create/src/runtime/template-source.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L52)

___

### textDomain

• **textDomain**: `string`

Kebab-case text domain used for generated i18n strings and plugin headers.

#### Defined in

[packages/create/src/runtime/template-source.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-source.ts#L54)
