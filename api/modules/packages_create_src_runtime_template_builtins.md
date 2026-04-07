[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/template-builtins

# Module: packages/create/src/runtime/template-builtins

## Table of contents

### Interfaces

- [BuiltInTemplateVariantOptions](../interfaces/packages_create_src_runtime_template_builtins.BuiltInTemplateVariantOptions.md)
- [MaterializedBuiltInTemplateSource](../interfaces/packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md)

### Type Aliases

- [BuiltInPersistencePolicy](packages_create_src_runtime_template_builtins.md#builtinpersistencepolicy)

### Functions

- [getBuiltInTemplateLayerDirs](packages_create_src_runtime_template_builtins.md#getbuiltintemplatelayerdirs)
- [resolveBuiltInTemplateSource](packages_create_src_runtime_template_builtins.md#resolvebuiltintemplatesource)

## Type Aliases

### BuiltInPersistencePolicy

Ƭ **BuiltInPersistencePolicy**: ``"authenticated"`` \| ``"public"``

Controls which persistence layer is applied when materializing the built-in
`persistence` template.

#### Defined in

[packages/create/src/runtime/template-builtins.ts:18](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L18)

## Functions

### getBuiltInTemplateLayerDirs

▸ **getBuiltInTemplateLayerDirs**(`templateId`, `«destructured»?`): `string`[]

Returns the ordered overlay directories for a built-in template.

Persistence templates include the shared base, the persistence core layer,
the selected policy layer, and the thin template overlay. All other built-ins
resolve to the shared base plus their own template directory.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | ``"interactivity"`` \| ``"basic"`` \| ``"persistence"`` \| ``"compound"`` |
| `«destructured»` | [`BuiltInTemplateVariantOptions`](../interfaces/packages_create_src_runtime_template_builtins.BuiltInTemplateVariantOptions.md) |

#### Returns

`string`[]

#### Defined in

[packages/create/src/runtime/template-builtins.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L44)

___

### resolveBuiltInTemplateSource

▸ **resolveBuiltInTemplateSource**(`templateId`, `options?`): `Promise`\<[`MaterializedBuiltInTemplateSource`](../interfaces/packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md)\>

Materializes a built-in template into a temporary directory by copying each
resolved layer in order.

Callers should invoke the returned `cleanup` function when they no longer
need the materialized directory. If copying fails, the temporary directory is
removed before the error is rethrown.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | ``"interactivity"`` \| ``"basic"`` \| ``"persistence"`` \| ``"compound"`` |
| `options` | [`BuiltInTemplateVariantOptions`](../interfaces/packages_create_src_runtime_template_builtins.BuiltInTemplateVariantOptions.md) |

#### Returns

`Promise`\<[`MaterializedBuiltInTemplateSource`](../interfaces/packages_create_src_runtime_template_builtins.MaterializedBuiltInTemplateSource.md)\>

#### Defined in

[packages/create/src/runtime/template-builtins.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/template-builtins.ts#L101)
