[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/cli-doctor

# Module: packages/wp-typia-project-tools/src/runtime/cli-doctor

## Table of contents

### Interfaces

- [DoctorCheck](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md)

### Functions

- [getDoctorChecks](packages_wp_typia_project_tools_src_runtime_cli_doctor.md#getdoctorchecks)
- [runDoctor](packages_wp_typia_project_tools_src_runtime_cli_doctor.md#rundoctor)

## Functions

### getDoctorChecks

▸ **getDoctorChecks**(`cwd`): `Promise`\<[`DoctorCheck`](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md)[]\>

Collect all runtime doctor checks for the current environment.

The returned array includes command availability checks, directory
writability checks, and built-in template asset checks in display order.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cwd` | `string` | Working directory to validate for writability. |

#### Returns

`Promise`\<[`DoctorCheck`](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md)[]\>

Ordered doctor check rows ready for CLI rendering.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-doctor.ts:445](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-doctor.ts#L445)

___

### runDoctor

▸ **runDoctor**(`cwd`, `options?`): `Promise`\<[`DoctorCheck`](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md)[]\>

Run doctor checks, render each line, and fail when any check does not pass.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cwd` | `string` | Working directory to validate. |
| `options` | `RunDoctorOptions` | Optional renderer override for each emitted check row. |

#### Returns

`Promise`\<[`DoctorCheck`](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md)[]\>

The completed list of doctor checks.

**`Throws`**

When one or more checks fail.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-doctor.ts:669](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-doctor.ts#L669)
