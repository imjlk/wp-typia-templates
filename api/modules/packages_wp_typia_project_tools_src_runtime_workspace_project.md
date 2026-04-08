[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/workspace-project

# Module: packages/wp-typia-project-tools/src/runtime/workspace-project

## Table of contents

### Interfaces

- [WorkspacePackageJson](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspacePackageJson.md)
- [WorkspaceProject](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspaceProject.md)

### Variables

- [WORKSPACE\_TEMPLATE\_PACKAGE](packages_wp_typia_project_tools_src_runtime_workspace_project.md#workspace_template_package)

### Functions

- [parseWorkspacePackageManagerId](packages_wp_typia_project_tools_src_runtime_workspace_project.md#parseworkspacepackagemanagerid)
- [tryResolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime_workspace_project.md#tryresolveworkspaceproject)
- [resolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime_workspace_project.md#resolveworkspaceproject)

## Variables

### WORKSPACE\_TEMPLATE\_PACKAGE

• `Const` **WORKSPACE\_TEMPLATE\_PACKAGE**: ``"@wp-typia/create-workspace-template"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:6](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L6)

## Functions

### parseWorkspacePackageManagerId

▸ **parseWorkspacePackageManagerId**(`packageManagerField`): [`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid)

Parse a package-manager identifier from a `packageManager` field.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `packageManagerField` | `undefined` \| `string` | Raw package-manager field such as `bun@1.3.11`. |

#### Returns

[`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid)

A normalized `PackageManagerId`, defaulting to `"bun"` when the
field is missing or unsupported.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:36](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L36)

___

### tryResolveWorkspaceProject

▸ **tryResolveWorkspaceProject**(`startDir`): [`WorkspaceProject`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspaceProject.md) \| ``null``

Try to resolve the nearest official wp-typia workspace from `startDir`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `startDir` | `string` | Directory to begin walking upward from. |

#### Returns

[`WorkspaceProject`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspaceProject.md) \| ``null``

The resolved `WorkspaceProject`, or `null` when no
`WORKSPACE_TEMPLATE_PACKAGE` workspace is found.

**`Throws`**

When a discovered `package.json` cannot be parsed.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L59)

___

### resolveWorkspaceProject

▸ **resolveWorkspaceProject**(`startDir`): [`WorkspaceProject`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspaceProject.md)

Resolve the nearest official wp-typia workspace from `startDir`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `startDir` | `string` | Directory to begin walking upward from. |

#### Returns

[`WorkspaceProject`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspaceProject.md)

The resolved `WorkspaceProject`.

**`Throws`**

When no `WORKSPACE_TEMPLATE_PACKAGE` workspace can be found.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:121](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L121)
