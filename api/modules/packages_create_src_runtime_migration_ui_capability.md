[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/migration-ui-capability

# Module: packages/create/src/runtime/migration-ui-capability

## Table of contents

### Functions

- [applyMigrationUiCapability](packages_create_src_runtime_migration_ui_capability.md#applymigrationuicapability)

## Functions

### applyMigrationUiCapability

▸ **applyMigrationUiCapability**(`«destructured»`): `Promise`\<`void`\>

Layer the migration dashboard capability onto a freshly scaffolded project.

This copies the shared migration UI files, wires template-specific editor
hooks, and injects pinned migration scripts that shell out to the matching
`@wp-typia/create` CLI version.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `ApplyMigrationUiCapabilityOptions` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/migration-ui-capability.ts:251](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/migration-ui-capability.ts#L251)
