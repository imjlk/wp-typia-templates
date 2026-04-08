[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/config

# Module: packages/wp-typia/src/config

## Table of contents

### Type Aliases

- [WpTypiaSchemaSource](packages_wp_typia_src_config.md#wptypiaschemasource)
- [WpTypiaUserConfig](packages_wp_typia_src_config.md#wptypiauserconfig)

### Variables

- [WP\_TYPIA\_CONFIG\_SOURCES](packages_wp_typia_src_config.md#wp_typia_config_sources)

### Functions

- [mergeWpTypiaUserConfig](packages_wp_typia_src_config.md#mergewptypiauserconfig)
- [loadWpTypiaUserConfigFromSource](packages_wp_typia_src_config.md#loadwptypiauserconfigfromsource)
- [loadWpTypiaUserConfig](packages_wp_typia_src_config.md#loadwptypiauserconfig)
- [getCreateDefaults](packages_wp_typia_src_config.md#getcreatedefaults)
- [getAddBlockDefaults](packages_wp_typia_src_config.md#getaddblockdefaults)
- [getMcpSchemaSources](packages_wp_typia_src_config.md#getmcpschemasources)

## Type Aliases

### WpTypiaSchemaSource

Ƭ **WpTypiaSchemaSource**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `namespace` | `string` |
| `path` | `string` |

#### Defined in

[packages/wp-typia/src/config.ts:5](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L5)

___

### WpTypiaUserConfig

Ƭ **WpTypiaUserConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create?` | \{ `data-storage?`: `string` ; `namespace?`: `string` ; `no-install?`: `boolean` ; `package-manager?`: `string` ; `persistence-policy?`: `string` ; `php-prefix?`: `string` ; `template?`: `string` ; `text-domain?`: `string` ; `variant?`: `string` ; `with-migration-ui?`: `boolean` ; `with-test-preset?`: `boolean` ; `with-wp-env?`: `boolean` ; `yes?`: `boolean`  } |
| `create.data-storage?` | `string` |
| `create.namespace?` | `string` |
| `create.no-install?` | `boolean` |
| `create.package-manager?` | `string` |
| `create.persistence-policy?` | `string` |
| `create.php-prefix?` | `string` |
| `create.template?` | `string` |
| `create.text-domain?` | `string` |
| `create.variant?` | `string` |
| `create.with-migration-ui?` | `boolean` |
| `create.with-test-preset?` | `boolean` |
| `create.with-wp-env?` | `boolean` |
| `create.yes?` | `boolean` |
| `add?` | \{ `block?`: \{ `data-storage?`: `string` ; `persistence-policy?`: `string` ; `template?`: `string`  }  } |
| `add.block?` | \{ `data-storage?`: `string` ; `persistence-policy?`: `string` ; `template?`: `string`  } |
| `add.block.data-storage?` | `string` |
| `add.block.persistence-policy?` | `string` |
| `add.block.template?` | `string` |
| `mcp?` | \{ `schemaSources?`: [`WpTypiaSchemaSource`](packages_wp_typia_src_config.md#wptypiaschemasource)[]  } |
| `mcp.schemaSources?` | [`WpTypiaSchemaSource`](packages_wp_typia_src_config.md#wptypiaschemasource)[] |

#### Defined in

[packages/wp-typia/src/config.ts:10](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L10)

## Variables

### WP\_TYPIA\_CONFIG\_SOURCES

• `Const` **WP\_TYPIA\_CONFIG\_SOURCES**: readonly [``"~/.config/wp-typia/config.json"``, ``".wp-typiarc"``, ``".wp-typiarc.json"``]

#### Defined in

[packages/wp-typia/src/config.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L38)

## Functions

### mergeWpTypiaUserConfig

▸ **mergeWpTypiaUserConfig**(`base`, `incoming`): [`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)

#### Parameters

| Name | Type |
| :------ | :------ |
| `base` | [`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig) |
| `incoming` | [`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig) |

#### Returns

[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)

#### Defined in

[packages/wp-typia/src/config.ts:93](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L93)

___

### loadWpTypiaUserConfigFromSource

▸ **loadWpTypiaUserConfigFromSource**(`cwd`, `source`): `Promise`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |
| `source` | `string` |

#### Returns

`Promise`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)\>

#### Defined in

[packages/wp-typia/src/config.ts:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L100)

___

### loadWpTypiaUserConfig

▸ **loadWpTypiaUserConfig**(`cwd`): `Promise`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |

#### Returns

`Promise`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)\>

#### Defined in

[packages/wp-typia/src/config.ts:108](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L108)

___

### getCreateDefaults

▸ **getCreateDefaults**(`config`): `NonNullable`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)[``"create"``]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig) |

#### Returns

`NonNullable`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)[``"create"``]\>

#### Defined in

[packages/wp-typia/src/config.ts:127](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L127)

___

### getAddBlockDefaults

▸ **getAddBlockDefaults**(`config`): `NonNullable`\<`NonNullable`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)[``"add"``]\>[``"block"``]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig) |

#### Returns

`NonNullable`\<`NonNullable`\<[`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig)[``"add"``]\>[``"block"``]\>

#### Defined in

[packages/wp-typia/src/config.ts:131](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L131)

___

### getMcpSchemaSources

▸ **getMcpSchemaSources**(`config`): [`WpTypiaSchemaSource`](packages_wp_typia_src_config.md#wptypiaschemasource)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`WpTypiaUserConfig`](packages_wp_typia_src_config.md#wptypiauserconfig) |

#### Returns

[`WpTypiaSchemaSource`](packages_wp_typia_src_config.md#wptypiaschemasource)[]

#### Defined in

[packages/wp-typia/src/config.ts:137](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/config.ts#L137)
