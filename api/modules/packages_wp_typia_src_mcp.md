[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/mcp

# Module: packages/wp-typia/src/mcp

## Table of contents

### Functions

- [loadMcpToolGroups](packages_wp_typia_src_mcp.md#loadmcptoolgroups)
- [syncMcpSchemas](packages_wp_typia_src_mcp.md#syncmcpschemas)

## Functions

### loadMcpToolGroups

▸ **loadMcpToolGroups**(`cwd`, `schemaSources`): `Promise`\<`MCPToolGroup`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |
| `schemaSources` | [`WpTypiaSchemaSource`](packages_wp_typia_src_config.md#wptypiaschemasource)[] |

#### Returns

`Promise`\<`MCPToolGroup`[]\>

#### Defined in

[packages/wp-typia/src/mcp.ts:60](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/mcp.ts#L60)

___

### syncMcpSchemas

▸ **syncMcpSchemas**(`cwd`, `schemaSources`, `outputDir?`): `Promise`\<\{ `commandCount`: `number` ; `groups`: `MCPToolGroup`[] ; `outputDir`: `string`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |
| `schemaSources` | [`WpTypiaSchemaSource`](packages_wp_typia_src_config.md#wptypiaschemasource)[] |
| `outputDir` | `string` |

#### Returns

`Promise`\<\{ `commandCount`: `number` ; `groups`: `MCPToolGroup`[] ; `outputDir`: `string`  }\>

#### Defined in

[packages/wp-typia/src/mcp.ts:67](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/mcp.ts#L67)
