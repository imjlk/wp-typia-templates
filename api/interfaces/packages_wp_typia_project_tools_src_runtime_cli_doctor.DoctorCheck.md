[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/cli-doctor](../modules/packages_wp_typia_project_tools_src_runtime_cli_doctor.md) / DoctorCheck

# Interface: DoctorCheck

[packages/wp-typia-project-tools/src/runtime/cli-doctor](../modules/packages_wp_typia_project_tools_src_runtime_cli_doctor.md).DoctorCheck

One doctor check rendered by the CLI diagnostics flow.

## Table of contents

### Properties

- [detail](packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md#detail)
- [label](packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md#label)
- [status](packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md#status)

## Properties

### detail

• **detail**: `string`

Human-readable status detail rendered next to the label.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-doctor.ts:28](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-doctor.ts#L28)

___

### label

• **label**: `string`

Short label for the dependency, directory, or template check.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-doctor.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-doctor.ts#L30)

___

### status

• **status**: ``"fail"`` \| ``"pass"``

Final pass/fail status for this diagnostic row.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-doctor.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-doctor.ts#L32)
