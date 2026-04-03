[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/internal/wordpress-ai

# Module: packages/create/src/internal/wordpress-ai

## Table of contents

### Interfaces

- [WordPressAbilityProjectionConfig](../interfaces/packages_create_src_internal_wordpress_ai.WordPressAbilityProjectionConfig.md)
- [ProjectedWordPressAbilityDefinition](../interfaces/packages_create_src_internal_wordpress_ai.ProjectedWordPressAbilityDefinition.md)
- [ProjectedWordPressAbilitiesDocument](../interfaces/packages_create_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md)
- [WordPressAiInputSchemaTransformContext](../interfaces/packages_create_src_internal_wordpress_ai.WordPressAiInputSchemaTransformContext.md)

### Functions

- [projectWordPressAiSchema](packages_create_src_internal_wordpress_ai.md#projectwordpressaischema)
- [buildWordPressAbilitiesDocument](packages_create_src_internal_wordpress_ai.md#buildwordpressabilitiesdocument)
- [buildWordPressAiArtifacts](packages_create_src_internal_wordpress_ai.md#buildwordpressaiartifacts)

## Functions

### projectWordPressAiSchema

▸ **projectWordPressAiSchema**(`schema`): [`JsonSchemaDocument`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md) & `Record`\<`string`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | [`JsonSchemaDocument`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md) & `Record`\<`string`, `unknown`\> |

#### Returns

[`JsonSchemaDocument`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md) & `Record`\<`string`, `unknown`\>

#### Defined in

[packages/create/src/internal/wordpress-ai.ts:104](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/internal/wordpress-ai.ts#L104)

___

### buildWordPressAbilitiesDocument

▸ **buildWordPressAbilitiesDocument**(`«destructured»`): `Promise`\<[`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_create_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `BuildWordPressAbilitiesDocumentOptions` |

#### Returns

`Promise`\<[`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_create_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md)\>

#### Defined in

[packages/create/src/internal/wordpress-ai.ts:112](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/internal/wordpress-ai.ts#L112)

___

### buildWordPressAiArtifacts

▸ **buildWordPressAiArtifacts**(`«destructured»`): `Promise`\<\{ `abilitiesDocument`: [`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_create_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md) ; `aiResponseSchema`: `Record`\<`string`, `unknown`\>  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `BuildWordPressAiArtifactsOptions` |

#### Returns

`Promise`\<\{ `abilitiesDocument`: [`ProjectedWordPressAbilitiesDocument`](../interfaces/packages_create_src_internal_wordpress_ai.ProjectedWordPressAbilitiesDocument.md) ; `aiResponseSchema`: `Record`\<`string`, `unknown`\>  }\>

#### Defined in

[packages/create/src/internal/wordpress-ai.ts:193](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/internal/wordpress-ai.ts#L193)
