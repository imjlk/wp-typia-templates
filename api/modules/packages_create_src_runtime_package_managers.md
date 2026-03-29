[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/package-managers

# Module: packages/create/src/runtime/package-managers

## Table of contents

### Interfaces

- [PackageManagerDefinition](../interfaces/packages_create_src_runtime_package_managers.PackageManagerDefinition.md)

### Type Aliases

- [PackageManagerId](packages_create_src_runtime_package_managers.md#packagemanagerid)

### Variables

- [PACKAGE\_MANAGER\_IDS](packages_create_src_runtime_package_managers.md#package_manager_ids)
- [PACKAGE\_MANAGERS](packages_create_src_runtime_package_managers.md#package_managers)

### Functions

- [getPackageManager](packages_create_src_runtime_package_managers.md#getpackagemanager)
- [getPackageManagerSelectOptions](packages_create_src_runtime_package_managers.md#getpackagemanagerselectoptions)
- [formatRunScript](packages_create_src_runtime_package_managers.md#formatrunscript)
- [formatInstallCommand](packages_create_src_runtime_package_managers.md#formatinstallcommand)
- [transformPackageManagerText](packages_create_src_runtime_package_managers.md#transformpackagemanagertext)

## Type Aliases

### PackageManagerId

Ƭ **PackageManagerId**: ``"bun"`` \| ``"npm"`` \| ``"pnpm"`` \| ``"yarn"``

#### Defined in

[packages/create/src/runtime/package-managers.ts:1](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L1)

## Variables

### PACKAGE\_MANAGER\_IDS

• `Const` **PACKAGE\_MANAGER\_IDS**: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid)[]

#### Defined in

[packages/create/src/runtime/package-managers.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L42)

___

### PACKAGE\_MANAGERS

• `Const` **PACKAGE\_MANAGERS**: `Readonly`\<`Record`\<[`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid), [`PackageManagerDefinition`](../interfaces/packages_create_src_runtime_package_managers.PackageManagerDefinition.md)\>\>

#### Defined in

[packages/create/src/runtime/package-managers.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L43)

## Functions

### getPackageManager

▸ **getPackageManager**(`id`): [`PackageManagerDefinition`](../interfaces/packages_create_src_runtime_package_managers.PackageManagerDefinition.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`PackageManagerDefinition`](../interfaces/packages_create_src_runtime_package_managers.PackageManagerDefinition.md)

#### Defined in

[packages/create/src/runtime/package-managers.ts:58](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L58)

___

### getPackageManagerSelectOptions

▸ **getPackageManagerSelectOptions**(): \{ `label`: `string` ; `value`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) ; `hint`: `string`  }[]

#### Returns

\{ `label`: `string` ; `value`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) ; `hint`: `string`  }[]

#### Defined in

[packages/create/src/runtime/package-managers.ts:68](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L68)

___

### formatRunScript

▸ **formatRunScript**(`packageManagerId`, `scriptName`, `extraArgs?`): `string`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `packageManagerId` | [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) | `undefined` |
| `scriptName` | `string` | `undefined` |
| `extraArgs` | `string` | `""` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/package-managers.ts:80](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L80)

___

### formatInstallCommand

▸ **formatInstallCommand**(`packageManagerId`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `packageManagerId` | [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/package-managers.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L96)

___

### transformPackageManagerText

▸ **transformPackageManagerText**(`content`, `packageManagerId`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `content` | `string` |
| `packageManagerId` | [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/package-managers.ts:175](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/package-managers.ts#L175)
