import type {
  EndpointManifestDefinition,
  EndpointManifestEndpointDefinition,
} from '@wp-typia/block-runtime/metadata-core';
import {
  normalizeEndpointAuthDefinition,
  projectJsonSchemaDocument,
  type EndpointAuthIntent,
  type EndpointWordPressAuthDefinition,
  type JsonSchemaDocument,
} from '../runtime/schema-core.js';
import {
  resolveAbilityCategorySpec,
  type AbilityCategorySpec,
  type AbilitySpec,
  type AbilitySpecCatalog,
} from './ability-spec.js';

export type {
  AbilityAnnotationSpec,
  AbilityCategorySpec,
  AbilityMcpProjectionSpec,
  AbilityMetaSpec,
  AbilitySpec,
  AbilitySpecCatalog,
} from './ability-spec.js';

export interface ProjectedWordPressAbilityDefinition {
  authIntent: EndpointAuthIntent;
  authMode?: EndpointManifestEndpointDefinition['authMode'];
  category: string;
  description: string;
  executeCallback: string;
  id: string;
  inputSchema: Record<string, unknown> | null;
  label: string;
  meta: Record<string, unknown>;
  method: EndpointManifestEndpointDefinition['method'];
  operationId: string;
  outputSchema: Record<string, unknown>;
  path: string;
  permissionCallback: string;
  wordpressAuth?: EndpointWordPressAuthDefinition;
}

export interface ProjectedWordPressAbilitiesDocument {
  abilities: ProjectedWordPressAbilityDefinition[];
  category: {
    id: string;
    label: string;
  };
  generatedFrom: {
    blockSlug: string;
    responseSchemaPath: string;
    schemaProfile: 'ai-structured-output';
  };
}

export interface WordPressAiInputSchemaTransformContext {
  contractName: string;
  endpoint: EndpointManifestEndpointDefinition;
  schema: JsonSchemaDocument & Record<string, unknown>;
}

interface BuildWordPressAbilitiesDocumentOptions {
  abilityCatalog: AbilitySpecCatalog;
  buildAbilityId?: (operationId: string) => string;
  generatedFrom: ProjectedWordPressAbilitiesDocument['generatedFrom'];
  loadInputSchema?: (
    endpoint: EndpointManifestEndpointDefinition,
    contractName: string,
  ) => Promise<JsonSchemaDocument & Record<string, unknown>>;
  manifest: EndpointManifestDefinition;
  outputSchema: Record<string, unknown>;
  transformInputSchema?: (
    context: WordPressAiInputSchemaTransformContext,
  ) => JsonSchemaDocument & Record<string, unknown>;
}

interface BuildWordPressAiArtifactsOptions extends Omit<
  BuildWordPressAbilitiesDocumentOptions,
  'outputSchema'
> {
  responseSchema: JsonSchemaDocument & Record<string, unknown>;
}

function getEndpointInputContractName(
  endpoint: EndpointManifestEndpointDefinition,
): string | null {
  if (
    endpoint.method !== 'GET' &&
    endpoint.bodyContract &&
    endpoint.queryContract
  ) {
    throw new Error(
      `Endpoint "${endpoint.operationId}" defines both bodyContract and queryContract; WordPress AI input projection is ambiguous.`,
    );
  }

  if (endpoint.method === 'GET') {
    return endpoint.queryContract ?? null;
  }

  return endpoint.bodyContract ?? endpoint.queryContract ?? null;
}

function toAbilityId(categoryId: string, operationId: string): string {
  return `${categoryId}/${operationId
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;
}

export function projectWordPressAiSchema(
  schema: JsonSchemaDocument & Record<string, unknown>,
): JsonSchemaDocument & Record<string, unknown> {
  return projectJsonSchemaDocument(schema, {
    profile: 'ai-structured-output',
  }) as JsonSchemaDocument & Record<string, unknown>;
}

export async function buildWordPressAbilitiesDocument({
  abilityCatalog,
  buildAbilityId,
  generatedFrom,
  loadInputSchema,
  manifest,
  outputSchema,
  transformInputSchema,
}: BuildWordPressAbilitiesDocumentOptions): Promise<ProjectedWordPressAbilitiesDocument> {
  let documentCategory: AbilityCategorySpec | null = null;
  const abilities = await Promise.all(
    manifest.endpoints.map(async (endpoint) => {
      const abilitySpec = abilityCatalog.abilities[endpoint.operationId];
      if (!abilitySpec) {
        throw new Error(
          `Missing AbilitySpec for operationId "${endpoint.operationId}".`,
        );
      }

      const category = resolveAbilityCategorySpec(
        abilitySpec,
        abilityCatalog.categories,
        endpoint.operationId,
      );
      if (!documentCategory) {
        documentCategory = category;
      } else if (documentCategory.id !== category.id) {
        throw new Error(
          `Operation "${endpoint.operationId}" uses AbilitySpec category "${category.id}" but WordPress AI projections currently support one shared category per document.`,
        );
      }

      const inputContractName = getEndpointInputContractName(endpoint);
      let inputSchema: (JsonSchemaDocument & Record<string, unknown>) | null =
        null;

      if (inputContractName) {
        if (!manifest.contracts[inputContractName]) {
          throw new Error(
            `Endpoint "${endpoint.operationId}" references missing input contract "${inputContractName}".`,
          );
        }
        if (!loadInputSchema) {
          throw new Error(
            `Missing input schema loader for operationId "${endpoint.operationId}".`,
          );
        }

        const projectedInputSchema = projectWordPressAiSchema(
          await loadInputSchema(endpoint, inputContractName),
        );
        inputSchema = transformInputSchema
          ? transformInputSchema({
              contractName: inputContractName,
              endpoint,
              schema: projectedInputSchema,
            })
          : projectedInputSchema;
      }

      const normalizedAuth = normalizeEndpointAuthDefinition(endpoint);
      return {
        authIntent: normalizedAuth.auth,
        ...(normalizedAuth.authMode
          ? { authMode: normalizedAuth.authMode }
          : {}),
        category: category.id,
        description: endpoint.summary ?? abilitySpec.label,
        executeCallback: abilitySpec.executeCallback,
        id: (
          buildAbilityId ??
          ((operationId) => toAbilityId(category.id, operationId))
        )(endpoint.operationId),
        inputSchema,
        label: abilitySpec.label,
        meta: {
          ...(abilitySpec.annotations ?? {}),
          ...(abilitySpec.meta ?? {}),
          show_in_rest: abilitySpec.showInRest ?? true,
        },
        method: endpoint.method,
        operationId: endpoint.operationId,
        outputSchema,
        path: endpoint.path,
        permissionCallback: abilitySpec.permissionCallback,
        ...(normalizedAuth.wordpressAuth
          ? { wordpressAuth: normalizedAuth.wordpressAuth }
          : {}),
      } satisfies ProjectedWordPressAbilityDefinition;
    }),
  );

  if (!documentCategory) {
    throw new Error(
      'WordPress AI projection requires at least one endpoint before it can resolve an AbilitySpec category.',
    );
  }

  return {
    abilities,
    category: documentCategory,
    generatedFrom,
  };
}

export async function buildWordPressAiArtifacts({
  abilityCatalog,
  buildAbilityId,
  generatedFrom,
  loadInputSchema,
  manifest,
  responseSchema,
  transformInputSchema,
}: BuildWordPressAiArtifactsOptions): Promise<{
  abilitiesDocument: ProjectedWordPressAbilitiesDocument;
  aiResponseSchema: Record<string, unknown>;
}> {
  const responseContractName = manifest.endpoints[0]?.responseContract;
  if (!responseContractName) {
    throw new Error('The manifest is missing its shared response contract.');
  }
  for (const endpoint of manifest.endpoints) {
    if (endpoint.responseContract !== responseContractName) {
      throw new Error(
        `Endpoint "${endpoint.operationId}" uses response contract "${endpoint.responseContract}" but expected shared response contract "${responseContractName}".`,
      );
    }
  }
  if (!manifest.contracts[responseContractName]) {
    throw new Error(
      `The manifest references missing response contract "${responseContractName}".`,
    );
  }

  const aiResponseSchema = projectWordPressAiSchema(responseSchema);
  const abilitiesDocument = await buildWordPressAbilitiesDocument({
    abilityCatalog,
    buildAbilityId,
    generatedFrom,
    loadInputSchema,
    manifest,
    outputSchema: aiResponseSchema,
    transformInputSchema,
  });

  return {
    abilitiesDocument,
    aiResponseSchema,
  };
}
