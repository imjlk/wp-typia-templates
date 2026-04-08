[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/internal/wordpress-ai

# Module: packages/wp-typia-project-tools/src/internal/wordpress-ai

## Table of contents

### Interfaces

- [WordPressAbilityProjectionConfig](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.WordPressAbilityProjectionConfig.md)
- [ProjectedWordPressAbilityDefinition](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.ProjectedWordPressAbilityDefinition.md)
- [ProjectedWordPressAbilitiesDocument](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md)
- [WordPressAiInputSchemaTransformContext](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.WordPressAiInputSchemaTransformContext.md)

### Functions

- [projectWordPressAiSchema](packages_wp_typia_project_tools_src_internal_wordpress_ai.md#projectwordpressaischema)
- [buildWordPressAbilitiesDocument](packages_wp_typia_project_tools_src_internal_wordpress_ai.md#buildwordpressabilitiesdocument)
- [buildWordPressAiArtifacts](packages_wp_typia_project_tools_src_internal_wordpress_ai.md#buildwordpressaiartifacts)

## Functions

### projectWordPressAiSchema

▸ **projectWordPressAiSchema**(`schema`): [`JsonSchemaDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaDocument.md) & `Record`\<`string`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | [`JsonSchemaDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaDocument.md) & `Record`\<`string`, `unknown`\> |

#### Returns

[`JsonSchemaDocument`](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaDocument.md) & `Record`\<`string`, `unknown`\>

#### Defined in

[packages/wp-typia-project-tools/src/internal/wordpress-ai.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/internal/wordpress-ai.ts#L109)

___

### buildWordPressAbilitiesDocument

▸ **buildWordPressAbilitiesDocument**(`«destructured»`): `Promise`\<[`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `BuildWordPressAbilitiesDocumentOptions` |

#### Returns

`Promise`\<[`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md)\>

#### Defined in

[packages/wp-typia-project-tools/src/internal/wordpress-ai.ts:117](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/internal/wordpress-ai.ts#L117)

___

### buildWordPressAiArtifacts

▸ **buildWordPressAiArtifacts**(`«destructured»`): `Promise`\<\{ `abilitiesDocument`: [`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md) ; `aiResponseSchema`: `Record`\<`string`, `unknown`\>  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `BuildWordPressAiArtifactsOptions` |

#### Returns

`Promise`\<\{ `abilitiesDocument`: [`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_wp_typia_project_tools_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md) ; `aiResponseSchema`: `Record`\<`string`, `unknown`\>  }\>

#### Defined in

[packages/wp-typia-project-tools/src/internal/wordpress-ai.ts:205](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/internal/wordpress-ai.ts#L205)
