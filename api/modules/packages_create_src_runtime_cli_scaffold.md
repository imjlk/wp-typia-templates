[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/cli-scaffold

# Module: packages/create/src/runtime/cli-scaffold

## Table of contents

### Functions

- [getNextSteps](packages_create_src_runtime_cli_scaffold.md#getnextsteps)
- [getOptionalOnboarding](packages_create_src_runtime_cli_scaffold.md#getoptionalonboarding)
- [runScaffoldFlow](packages_create_src_runtime_cli_scaffold.md#runscaffoldflow)

## Functions

### getNextSteps

▸ **getNextSteps**(`options`): `string`[]

Build the printed next-step commands for a scaffolded project.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `GetNextStepsOptions` | Project location and package-manager details used to format next-step commands. |

#### Returns

`string`[]

Ordered shell commands shown after scaffolding succeeds.

#### Defined in

[packages/create/src/runtime/cli-scaffold.ts:200](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-scaffold.ts#L200)

___

### getOptionalOnboarding

▸ **getOptionalOnboarding**(`options`): `OptionalOnboardingGuidance`

Compute optional onboarding guidance shown after scaffolding completes.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `GetOptionalOnboardingOptions` | Package-manager and template context for optional guidance. |

#### Returns

`OptionalOnboardingGuidance`

Optional onboarding note and step list.

#### Defined in

[packages/create/src/runtime/cli-scaffold.ts:224](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-scaffold.ts#L224)

___

### runScaffoldFlow

▸ **runScaffoldFlow**(`options`): `Promise`\<\{ `optionalOnboarding`: `OptionalOnboardingGuidance` ; `projectDir`: `string` ; `projectInput`: `string` ; `packageManager`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) = resolvedPackageManager; `result`: [`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md) ; `nextSteps`: `string`[]  }\>

Resolve scaffold options, prompts, and follow-up steps for one CLI run.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `RunScaffoldFlowOptions` | CLI/runtime inputs used to collect answers and scaffold a project. |

#### Returns

`Promise`\<\{ `optionalOnboarding`: `OptionalOnboardingGuidance` ; `projectDir`: `string` ; `projectInput`: `string` ; `packageManager`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) = resolvedPackageManager; `result`: [`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md) ; `nextSteps`: `string`[]  }\>

The scaffold result together with next-step guidance.

#### Defined in

[packages/create/src/runtime/cli-scaffold.ts:244](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-scaffold.ts#L244)
