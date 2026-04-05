[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/object-utils

# Module: packages/create/src/runtime/object-utils

## Table of contents

### Type Aliases

- [UnknownRecord](packages_create_src_runtime_object_utils.md#unknownrecord)

### Functions

- [isPlainObject](packages_create_src_runtime_object_utils.md#isplainobject)

## Type Aliases

### UnknownRecord

Ƭ **UnknownRecord**: `Record`\<`string`, `unknown`\>

Generic record type used for JSON-like plain-object inspection.

#### Defined in

[packages/create/src/runtime/object-utils.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/object-utils.ts#L4)

## Functions

### isPlainObject

▸ **isPlainObject**(`value`): value is UnknownRecord

Check whether a value is a plain object record.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `unknown` | Runtime value to inspect. |

#### Returns

value is UnknownRecord

`true` when the value is a non-null plain object with an
`Object.prototype` or `null` prototype.

#### Defined in

[packages/create/src/runtime/object-utils.ts:13](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/object-utils.ts#L13)
