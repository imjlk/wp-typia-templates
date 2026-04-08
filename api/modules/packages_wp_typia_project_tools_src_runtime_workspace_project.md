[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/workspace-project

# Module: packages/wp-typia-project-tools/src/runtime/workspace-project

## Table of contents

### Interfaces

- [WorkspacePackageJson](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspacePackageJson.md)
- [WorkspaceProject](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspaceProject.md)

### Variables

- [WORKSPACE\_TEMPLATE\_PACKAGE](packages_wp_typia_project_tools_src_runtime_workspace_project.md#workspace_template_package)

### Functions

- [parseWorkspacePackageJson](packages_wp_typia_project_tools_src_runtime_workspace_project.md#parseworkspacepackagejson)
- [getInvalidWorkspaceProjectReason](packages_wp_typia_project_tools_src_runtime_workspace_project.md#getinvalidworkspaceprojectreason)
- [parseWorkspacePackageManagerId](packages_wp_typia_project_tools_src_runtime_workspace_project.md#parseworkspacepackagemanagerid)
- [tryResolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime_workspace_project.md#tryresolveworkspaceproject)
- [resolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime_workspace_project.md#resolveworkspaceproject)

## Variables

### WORKSPACE\_TEMPLATE\_PACKAGE

• `Const` **WORKSPACE\_TEMPLATE\_PACKAGE**: ``"@wp-typia/create-workspace-template"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:6](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L6)

## Functions

### parseWorkspacePackageJson

▸ **parseWorkspacePackageJson**(`projectDirOrManifestPath`): [`WorkspacePackageJson`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspacePackageJson.md)

Parse a workspace package manifest from a project directory or `package.json` path.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `projectDirOrManifestPath` | `string` | Absolute or relative project directory, or a direct path to `package.json`. |

#### Returns

[`WorkspacePackageJson`](../interfaces/packages_wp_typia_project_tools_src_runtime_workspace_project.WorkspacePackageJson.md)

The parsed workspace package manifest.

**`Throws`**

When the manifest cannot be parsed.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L42)

___

### getInvalidWorkspaceProjectReason

▸ **getInvalidWorkspaceProjectReason**(`startDir`): `string` \| ``null``

Explain why a nearby wp-typia workspace cannot be resolved from `startDir`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `startDir` | `string` | Directory to begin walking upward from. |

#### Returns

`string` \| ``null``

A human-readable validation error when a candidate workspace package
manifest is found but its `wpTypia` metadata is invalid, or `null` when no
invalid workspace candidate is discovered.

**`Throws`**

When a discovered `package.json` cannot be parsed.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:94](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L94)

___

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

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:124](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L124)

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

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:147](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L147)

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

[packages/wp-typia-project-tools/src/runtime/workspace-project.ts:198](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/workspace-project.ts#L198)
