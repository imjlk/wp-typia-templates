[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/cli-doctor](../modules/packages_create_src_runtime_cli_doctor.md) / DoctorCheck

# Interface: DoctorCheck

[packages/create/src/runtime/cli-doctor](../modules/packages_create_src_runtime_cli_doctor.md).DoctorCheck

One doctor check rendered by the CLI diagnostics flow.

## Table of contents

### Properties

- [detail](packages_create_src_runtime_cli_doctor.DoctorCheck.md#detail)
- [label](packages_create_src_runtime_cli_doctor.DoctorCheck.md#label)
- [status](packages_create_src_runtime_cli_doctor.DoctorCheck.md#status)

## Properties

### detail

• **detail**: `string`

Human-readable status detail rendered next to the label.

#### Defined in

[packages/create/src/runtime/cli-doctor.ts:15](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-doctor.ts#L15)

___

### label

• **label**: `string`

Short label for the dependency, directory, or template check.

#### Defined in

[packages/create/src/runtime/cli-doctor.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-doctor.ts#L17)

___

### status

• **status**: ``"pass"`` \| ``"fail"``

Final pass/fail status for this diagnostic row.

#### Defined in

[packages/create/src/runtime/cli-doctor.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-doctor.ts#L19)
