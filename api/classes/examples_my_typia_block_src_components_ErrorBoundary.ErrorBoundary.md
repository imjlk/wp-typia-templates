[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [examples/my-typia-block/src/components/ErrorBoundary](../modules/examples_my_typia_block_src_components_ErrorBoundary.md) / ErrorBoundary

# Class: ErrorBoundary

[examples/my-typia-block/src/components/ErrorBoundary](../modules/examples_my_typia_block_src_components_ErrorBoundary.md).ErrorBoundary

Error Boundary component for My Typia Block

## Hierarchy

- `Component`\<`Props`, `State`\>

  ↳ **`ErrorBoundary`**

## Table of contents

### Constructors

- [constructor](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md#constructor)

### Properties

- [state](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md#state)

### Methods

- [getDerivedStateFromError](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md#getderivedstatefromerror)
- [componentDidCatch](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md#componentdidcatch)
- [render](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md#render)

## Constructors

### constructor

• **new ErrorBoundary**(`props`): [`ErrorBoundary`](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Props` |

#### Returns

[`ErrorBoundary`](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md)

#### Inherited from

Component\< Props, State \>.constructor

#### Defined in

node_modules/.bun/@types+react@19.2.14/node_modules/@types/react/index.d.ts:958

• **new ErrorBoundary**(`props`, `context`): [`ErrorBoundary`](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `Props` |  |
| `context` | `any` | value of the parent [Context](https://react.dev/reference/react/Component#context) specified in `contextType`. |

#### Returns

[`ErrorBoundary`](examples_my_typia_block_src_components_ErrorBoundary.ErrorBoundary.md)

#### Inherited from

Component\< Props, State \>.constructor

#### Defined in

node_modules/.bun/@types+react@19.2.14/node_modules/@types/react/index.d.ts:966

## Properties

### state

• **state**: `State`

#### Overrides

Component.state

#### Defined in

[examples/my-typia-block/src/components/ErrorBoundary.tsx:18](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/components/ErrorBoundary.tsx#L18)

## Methods

### getDerivedStateFromError

▸ **getDerivedStateFromError**(`error`): `State`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |

#### Returns

`State`

#### Defined in

[examples/my-typia-block/src/components/ErrorBoundary.tsx:22](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/components/ErrorBoundary.tsx#L22)

___

### componentDidCatch

▸ **componentDidCatch**(`error`, `errorInfo`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `errorInfo` | `ErrorInfo` |

#### Returns

`void`

#### Overrides

Component.componentDidCatch

#### Defined in

[examples/my-typia-block/src/components/ErrorBoundary.tsx:26](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/components/ErrorBoundary.tsx#L26)

___

### render

▸ **render**(): `undefined` \| ``null`` \| `string` \| `number` \| `bigint` \| `boolean` \| `Element` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\>

#### Returns

`undefined` \| ``null`` \| `string` \| `number` \| `bigint` \| `boolean` \| `Element` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\>

#### Overrides

Component.render

#### Defined in

[examples/my-typia-block/src/components/ErrorBoundary.tsx:30](https://github.com/imjlk/wp-typia/blob/main/examples/my-typia-block/src/components/ErrorBoundary.tsx#L30)
