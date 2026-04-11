[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia/src/ui/alternate-buffer-lifecycle

# Module: packages/wp-typia/src/ui/alternate-buffer-lifecycle

## Table of contents

### Functions

- [describeAlternateBufferFailure](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#describealternatebufferfailure)
- [isAlternateBufferExitKey](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#isalternatebufferexitkey)
- [reportAlternateBufferFailure](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#reportalternatebufferfailure)
- [runAlternateBufferAction](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#runalternatebufferaction)
- [resolveLazyFlowComponent](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#resolvelazyflowcomponent)
- [useAlternateBufferExitKeys](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#usealternatebufferexitkeys)
- [useAlternateBufferLifecycle](packages_wp_typia_src_ui_alternate_buffer_lifecycle.md#usealternatebufferlifecycle)

## Functions

### describeAlternateBufferFailure

▸ **describeAlternateBufferFailure**(`context`, `error`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `string` |
| `error` | `unknown` |

#### Returns

`string`

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L25)

___

### isAlternateBufferExitKey

▸ **isAlternateBufferExitKey**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `AlternateBufferKeyEvent` |

#### Returns

`boolean`

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L30)

___

### reportAlternateBufferFailure

▸ **reportAlternateBufferFailure**(`«destructured»`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `AlternateBufferFailureOptions` |

#### Returns

`void`

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L34)

___

### runAlternateBufferAction

▸ **runAlternateBufferAction**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `RunAlternateBufferActionOptions` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L45)

___

### resolveLazyFlowComponent

▸ **resolveLazyFlowComponent**\<`TProps`\>(`«destructured»`): `Promise`\<`void`\>

#### Type parameters

| Name |
| :------ |
| `TProps` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `loader` | () => `Promise`\<\{ `default`: `ComponentType`\<`TProps`\>  }\> |
| › `onLoaded` | (`component`: `ComponentType`\<`TProps`\>) => `void` |
| › `onFailure` | (`error`: `unknown`) => `void` |
| › `isDisposed` | () => `boolean` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L59)

___

### useAlternateBufferExitKeys

▸ **useAlternateBufferExitKeys**(`options?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.enabled?` | `boolean` |
| `options.exit?` | () => `void` |

#### Returns

`void`

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:82](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L82)

___

### useAlternateBufferLifecycle

▸ **useAlternateBufferLifecycle**(`context`, `options?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `string` |
| `options` | `Object` |
| `options.enableExitKeys?` | `boolean` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `handleCancel` | () => `void` |
| `handleFailure` | (`error`: `unknown`) => `void` |
| `handleSubmit` | (`action`: () => `Promise`\<`void`\>) => `Promise`\<`void`\> |

#### Defined in

[packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia/src/ui/alternate-buffer-lifecycle.ts#L101)
