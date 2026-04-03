[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/validation](../modules/packages_create_src_runtime_validation.md) / ValidationHookBindings

# Interface: ValidationHookBindings

[packages/create/src/runtime/validation](../modules/packages_create_src_runtime_validation.md).ValidationHookBindings

React-like hook bindings used to create a reusable validation hook without
coupling the runtime package to a specific hook implementation.

## Table of contents

### Properties

- [useMemo](packages_create_src_runtime_validation.ValidationHookBindings.md#usememo)

## Properties

### useMemo

• **useMemo**: \<S\>(`factory`: () => `S`, `deps`: readonly `unknown`[]) => `S`

#### Type declaration

▸ \<`S`\>(`factory`, `deps`): `S`

##### Type parameters

| Name |
| :------ |
| `S` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `factory` | () => `S` |
| `deps` | readonly `unknown`[] |

##### Returns

`S`

#### Defined in

[packages/create/src/runtime/validation.ts:26](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/validation.ts#L26)
