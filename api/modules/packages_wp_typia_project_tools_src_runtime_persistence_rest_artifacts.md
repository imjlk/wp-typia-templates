[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/persistence-rest-artifacts

# Module: packages/wp-typia-project-tools/src/runtime/persistence-rest-artifacts

## Table of contents

### Functions

- [buildPersistenceEndpointManifest](packages_wp_typia_project_tools_src_runtime_persistence_rest_artifacts.md#buildpersistenceendpointmanifest)
- [syncPersistenceRestArtifacts](packages_wp_typia_project_tools_src_runtime_persistence_rest_artifacts.md#syncpersistencerestartifacts)

## Functions

### buildPersistenceEndpointManifest

▸ **buildPersistenceEndpointManifest**(`variables`): [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<\{ `bootstrap-query`: \{ `sourceTypeName`: \`$\{string}BootstrapQuery\`  } ; `bootstrap-response`: \{ `sourceTypeName`: \`$\{string}BootstrapResponse\`  } ; `state-query`: \{ `sourceTypeName`: \`$\{string}StateQuery\`  } ; `state-response`: \{ `sourceTypeName`: \`$\{string}StateResponse\`  } ; `write-state-request`: \{ `sourceTypeName`: \`$\{string}WriteStateRequest\`  }  }, readonly [\{ `auth`: ``"public"`` = "public"; `method`: ``"GET"`` = "GET"; `operationId`: \`get$\{string}State\` ; `path`: \`/$\{string}/v1/$\{string}/state\` ; `queryContract`: ``"state-query"`` = "state-query"; `responseContract`: ``"state-response"`` = "state-response"; `summary`: ``"Read the current persisted state."`` = "Read the current persisted state."; `tags`: readonly [`string`]  }, \{ `auth`: ``"authenticated"`` \| ``"public-write-protected"`` = variables.restWriteAuthIntent; `bodyContract`: ``"write-state-request"`` = "write-state-request"; `method`: ``"POST"`` = "POST"; `operationId`: \`write$\{string}State\` ; `path`: \`/$\{string}/v1/$\{string}/state\` ; `responseContract`: ``"state-response"`` = "state-response"; `summary`: ``"Write the current persisted state."`` = "Write the current persisted state."; `tags`: readonly [`string`] ; `wordpressAuth`: \{ `mechanism`: ``"public-signed-token"`` \| ``"rest-nonce"`` = variables.restWriteAuthMechanism }  }, \{ `auth`: ``"public"`` = "public"; `method`: ``"GET"`` = "GET"; `operationId`: \`get$\{string}Bootstrap\` ; `path`: \`/$\{string}/v1/$\{string}/bootstrap\` ; `queryContract`: ``"bootstrap-query"`` = "bootstrap-query"; `responseContract`: ``"bootstrap-response"`` = "bootstrap-response"; `summary`: ``"Read fresh session bootstrap state for the current viewer."`` = "Read fresh session bootstrap state for the current viewer."; `tags`: readonly [`string`]  }]\>

Build the canonical persistence REST endpoint manifest for scaffold-time
schema, OpenAPI, and client generation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `variables` | `PersistenceTemplateVariablesLike` | Persistence template naming and auth metadata. |

#### Returns

[`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<\{ `bootstrap-query`: \{ `sourceTypeName`: \`$\{string}BootstrapQuery\`  } ; `bootstrap-response`: \{ `sourceTypeName`: \`$\{string}BootstrapResponse\`  } ; `state-query`: \{ `sourceTypeName`: \`$\{string}StateQuery\`  } ; `state-response`: \{ `sourceTypeName`: \`$\{string}StateResponse\`  } ; `write-state-request`: \{ `sourceTypeName`: \`$\{string}WriteStateRequest\`  }  }, readonly [\{ `auth`: ``"public"`` = "public"; `method`: ``"GET"`` = "GET"; `operationId`: \`get$\{string}State\` ; `path`: \`/$\{string}/v1/$\{string}/state\` ; `queryContract`: ``"state-query"`` = "state-query"; `responseContract`: ``"state-response"`` = "state-response"; `summary`: ``"Read the current persisted state."`` = "Read the current persisted state."; `tags`: readonly [`string`]  }, \{ `auth`: ``"authenticated"`` \| ``"public-write-protected"`` = variables.restWriteAuthIntent; `bodyContract`: ``"write-state-request"`` = "write-state-request"; `method`: ``"POST"`` = "POST"; `operationId`: \`write$\{string}State\` ; `path`: \`/$\{string}/v1/$\{string}/state\` ; `responseContract`: ``"state-response"`` = "state-response"; `summary`: ``"Write the current persisted state."`` = "Write the current persisted state."; `tags`: readonly [`string`] ; `wordpressAuth`: \{ `mechanism`: ``"public-signed-token"`` \| ``"rest-nonce"`` = variables.restWriteAuthMechanism }  }, \{ `auth`: ``"public"`` = "public"; `method`: ``"GET"`` = "GET"; `operationId`: \`get$\{string}Bootstrap\` ; `path`: \`/$\{string}/v1/$\{string}/bootstrap\` ; `queryContract`: ``"bootstrap-query"`` = "bootstrap-query"; `responseContract`: ``"bootstrap-response"`` = "bootstrap-response"; `summary`: ``"Read fresh session bootstrap state for the current viewer."`` = "Read fresh session bootstrap state for the current viewer."; `tags`: readonly [`string`]  }]\>

Endpoint manifest covering bootstrap, state read, and state write operations.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/persistence-rest-artifacts.ts:33](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/persistence-rest-artifacts.ts#L33)

___

### syncPersistenceRestArtifacts

▸ **syncPersistenceRestArtifacts**(`options`): `Promise`\<`void`\>

Generate the REST-derived persistence artifacts for a scaffolded block.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `SyncPersistenceRestArtifactsOptions` | Scaffold output paths plus persistence template variables. |

#### Returns

`Promise`\<`void`\>

A promise that resolves after schema, OpenAPI, and client files are written.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/persistence-rest-artifacts.ts:102](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/persistence-rest-artifacts.ts#L102)
