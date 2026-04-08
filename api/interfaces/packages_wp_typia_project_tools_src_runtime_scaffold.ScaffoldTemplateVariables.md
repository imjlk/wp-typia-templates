[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/scaffold](../modules/packages_wp_typia_project_tools_src_runtime_scaffold.md) / ScaffoldTemplateVariables

# Interface: ScaffoldTemplateVariables

[packages/wp-typia-project-tools/src/runtime/scaffold](../modules/packages_wp_typia_project_tools_src_runtime_scaffold.md).ScaffoldTemplateVariables

Normalized template variables shared by built-in and remote scaffold flows.

## Hierarchy

- `Record`\<`string`, `string`\>

  ↳ **`ScaffoldTemplateVariables`**

## Table of contents

### Properties

- [apiClientPackageVersion](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#apiclientpackageversion)
- [author](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#author)
- [blockRuntimePackageVersion](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#blockruntimepackageversion)
- [blockMetadataVersion](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#blockmetadataversion)
- [blockTypesPackageVersion](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#blocktypespackageversion)
- [category](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#category)
- [icon](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#icon)
- [compoundChildTitle](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#compoundchildtitle)
- [compoundChildCategory](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#compoundchildcategory)
- [compoundChildCssClassName](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#compoundchildcssclassname)
- [compoundChildIcon](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#compoundchildicon)
- [compoundChildTitleJson](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#compoundchildtitlejson)
- [compoundPersistenceEnabled](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#compoundpersistenceenabled)
- [projectToolsPackageVersion](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#projecttoolspackageversion)
- [cssClassName](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#cssclassname)
- [dashCase](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#dashcase)
- [dataStorageMode](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#datastoragemode)
- [description](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#description)
- [frontendCssClassName](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#frontendcssclassname)
- [keyword](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#keyword)
- [namespace](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#namespace)
- [needsMigration](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#needsmigration)
- [pascalCase](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#pascalcase)
- [phpPrefix](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#phpprefix)
- [phpPrefixUpper](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#phpprefixupper)
- [isAuthenticatedPersistencePolicy](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#isauthenticatedpersistencepolicy)
- [isPublicPersistencePolicy](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#ispublicpersistencepolicy)
- [publicWriteRequestIdDeclaration](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#publicwriterequestiddeclaration)
- [restPackageVersion](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#restpackageversion)
- [restWriteAuthIntent](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#restwriteauthintent)
- [restWriteAuthMechanism](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#restwriteauthmechanism)
- [restWriteAuthMode](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#restwriteauthmode)
- [slug](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#slug)
- [slugCamelCase](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#slugcamelcase)
- [slugKebabCase](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#slugkebabcase)
- [slugSnakeCase](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#slugsnakecase)
- [textDomain](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#textdomain)
- [textdomain](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#textdomain-1)
- [title](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#title)
- [titleJson](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#titlejson)
- [titleCase](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#titlecase)
- [persistencePolicy](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldTemplateVariables.md#persistencepolicy)

## Properties

### apiClientPackageVersion

• **apiClientPackageVersion**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L95)

___

### author

• **author**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L96)

___

### blockRuntimePackageVersion

• **blockRuntimePackageVersion**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L97)

___

### blockMetadataVersion

• **blockMetadataVersion**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:98](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L98)

___

### blockTypesPackageVersion

• **blockTypesPackageVersion**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:99](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L99)

___

### category

• **category**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L100)

___

### icon

• **icon**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L101)

___

### compoundChildTitle

• **compoundChildTitle**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:102](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L102)

___

### compoundChildCategory

• **compoundChildCategory**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:103](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L103)

___

### compoundChildCssClassName

• **compoundChildCssClassName**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:104](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L104)

___

### compoundChildIcon

• **compoundChildIcon**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:105](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L105)

___

### compoundChildTitleJson

• **compoundChildTitleJson**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:106](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L106)

___

### compoundPersistenceEnabled

• **compoundPersistenceEnabled**: ``"false"`` \| ``"true"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:107](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L107)

___

### projectToolsPackageVersion

• **projectToolsPackageVersion**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:108](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L108)

___

### cssClassName

• **cssClassName**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L109)

___

### dashCase

• **dashCase**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:110](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L110)

___

### dataStorageMode

• **dataStorageMode**: ``"post-meta"`` \| ``"custom-table"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:111](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L111)

___

### description

• **description**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:112](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L112)

___

### frontendCssClassName

• **frontendCssClassName**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:113](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L113)

___

### keyword

• **keyword**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:114](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L114)

___

### namespace

• **namespace**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:115](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L115)

___

### needsMigration

• **needsMigration**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:116](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L116)

___

### pascalCase

• **pascalCase**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L117)

___

### phpPrefix

• **phpPrefix**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:118](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L118)

___

### phpPrefixUpper

• **phpPrefixUpper**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:119](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L119)

___

### isAuthenticatedPersistencePolicy

• **isAuthenticatedPersistencePolicy**: ``"false"`` \| ``"true"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:120](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L120)

___

### isPublicPersistencePolicy

• **isPublicPersistencePolicy**: ``"false"`` \| ``"true"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:121](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L121)

___

### publicWriteRequestIdDeclaration

• **publicWriteRequestIdDeclaration**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L122)

___

### restPackageVersion

• **restPackageVersion**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:123](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L123)

___

### restWriteAuthIntent

• **restWriteAuthIntent**: ``"authenticated"`` \| ``"public-write-protected"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:124](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L124)

___

### restWriteAuthMechanism

• **restWriteAuthMechanism**: ``"public-signed-token"`` \| ``"rest-nonce"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:125](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L125)

___

### restWriteAuthMode

• **restWriteAuthMode**: ``"public-signed-token"`` \| ``"authenticated-rest-nonce"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:126](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L126)

___

### slug

• **slug**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:127](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L127)

___

### slugCamelCase

• **slugCamelCase**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:128](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L128)

___

### slugKebabCase

• **slugKebabCase**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:129](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L129)

___

### slugSnakeCase

• **slugSnakeCase**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:130](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L130)

___

### textDomain

• **textDomain**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:131](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L131)

___

### textdomain

• **textdomain**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:132](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L132)

___

### title

• **title**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:133](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L133)

___

### titleJson

• **titleJson**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:134](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L134)

___

### titleCase

• **titleCase**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:135](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L135)

___

### persistencePolicy

• **persistencePolicy**: ``"public"`` \| ``"authenticated"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:136](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L136)
