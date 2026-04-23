import { describe, expect, test } from 'bun:test';
import type { EndpointManifestDefinition } from '@wp-typia/block-runtime/metadata-core';
import type { JsonSchemaDocument } from '../src/runtime/schema-core.js';
import {
  ABILITY_SPEC_MERGE_BOUNDARY,
  type AbilitySpecCatalog,
} from '../src/internal/ability-spec.js';
import {
  AI_FEATURE_DEFINITIONS,
  resolveAiFeatureCapabilityPlan,
} from '../src/internal/ai-feature-capability.js';
import { buildWordPressAbilitiesDocument } from '../src/internal/wordpress-ai.js';

const RESPONSE_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  additionalProperties: false,
  properties: {
    count: {
      type: 'integer',
    },
  },
  required: ['count'],
  title: 'CounterResponse',
  type: 'object',
} as const satisfies JsonSchemaDocument & Record<string, unknown>;

const INPUT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  additionalProperties: false,
  properties: {
    id: {
      type: 'integer',
    },
  },
  required: ['id'],
  title: 'CounterInput',
  type: 'object',
} as const satisfies JsonSchemaDocument & Record<string, unknown>;

const MANIFEST = {
  contracts: {
    CounterQuery: {
      sourceTypeName: 'CounterQuery',
    },
    CounterResponse: {
      sourceTypeName: 'CounterResponse',
    },
    ResetCounterRequest: {
      sourceTypeName: 'ResetCounterRequest',
    },
  },
  endpoints: [
    {
      auth: 'public',
      method: 'GET',
      operationId: 'getCounter',
      path: '/demo/v1/counter',
      queryContract: 'CounterQuery',
      responseContract: 'CounterResponse',
      summary: 'Read the current counter value.',
      tags: ['counter'],
    },
    {
      auth: 'authenticated',
      bodyContract: 'ResetCounterRequest',
      method: 'POST',
      operationId: 'resetCounter',
      path: '/demo/v1/counter/reset',
      responseContract: 'CounterResponse',
      summary: 'Reset the current counter value.',
      tags: ['counter'],
    },
  ],
} as const satisfies EndpointManifestDefinition;

describe('WordPress AI AbilitySpec foundation', () => {
  test('documents the merge boundary between endpoint manifests and AbilitySpec metadata', () => {
    expect(ABILITY_SPEC_MERGE_BOUNDARY.endpointManifestOwns).toContain(
      'responseContract',
    );
    expect(ABILITY_SPEC_MERGE_BOUNDARY.endpointManifestOwns).toContain(
      'wordpressAuth',
    );
    expect(ABILITY_SPEC_MERGE_BOUNDARY.abilitySpecOwns).toContain(
      'executeCallback',
    );
    expect(ABILITY_SPEC_MERGE_BOUNDARY.abilitySpecOwns).toContain(
      'meta.mcp.public',
    );
  });

  test('composes endpoint manifests with AbilitySpec catalogs and preserves optional MCP metadata', async () => {
    const abilityCatalog = {
      abilities: {
        getCounter: {
          annotations: {
            idempotent: true,
            readonly: true,
          },
          categoryId: 'counter',
          executeCallback: 'demo_execute_get_counter',
          label: 'Get Counter',
          meta: {
            mcp: {
              public: true,
            },
          },
          permissionCallback: 'demo_can_get_counter',
        },
        resetCounter: {
          annotations: {
            destructive: true,
            idempotent: false,
            readonly: false,
          },
          categoryId: 'counter',
          executeCallback: 'demo_execute_reset_counter',
          label: 'Reset Counter',
          permissionCallback: 'demo_can_reset_counter',
          showInRest: false,
        },
      },
      categories: {
        counter: {
          id: 'counter',
          label: 'Counter',
        },
      },
    } as const satisfies AbilitySpecCatalog;

    const document = await buildWordPressAbilitiesDocument({
      abilityCatalog,
      generatedFrom: {
        blockSlug: 'counter',
        responseSchemaPath: 'wordpress-ai/counter-response.ai.schema.json',
        schemaProfile: 'ai-structured-output',
      },
      loadInputSchema: async () => INPUT_SCHEMA,
      manifest: MANIFEST,
      outputSchema: RESPONSE_SCHEMA,
    });

    expect(document.category).toEqual({
      id: 'counter',
      label: 'Counter',
    });
    expect(document.abilities).toHaveLength(2);
    expect(document.abilities[0]).toMatchObject({
      category: 'counter',
      description: 'Read the current counter value.',
      executeCallback: 'demo_execute_get_counter',
      label: 'Get Counter',
      meta: {
        annotations: {
          idempotent: true,
          readonly: true,
        },
        mcp: {
          public: true,
        },
        show_in_rest: true,
      },
      operationId: 'getCounter',
      permissionCallback: 'demo_can_get_counter',
    });
    expect(document.abilities[1]?.meta).toEqual({
      annotations: {
        destructive: true,
        idempotent: false,
        readonly: false,
      },
      show_in_rest: false,
    });
  });

  test('rejects mixed AbilitySpec categories until multi-category projections are designed', async () => {
    const mixedCategoryCatalog = {
      abilities: {
        getCounter: {
          categoryId: 'counter',
          executeCallback: 'demo_execute_get_counter',
          label: 'Get Counter',
          permissionCallback: 'demo_can_get_counter',
        },
        resetCounter: {
          categoryId: 'mutations',
          executeCallback: 'demo_execute_reset_counter',
          label: 'Reset Counter',
          permissionCallback: 'demo_can_reset_counter',
        },
      },
      categories: {
        counter: {
          id: 'counter',
          label: 'Counter',
        },
        mutations: {
          id: 'mutations',
          label: 'Mutations',
        },
      },
    } as const satisfies AbilitySpecCatalog;

    await expect(
      buildWordPressAbilitiesDocument({
        abilityCatalog: mixedCategoryCatalog,
        generatedFrom: {
          blockSlug: 'counter',
          responseSchemaPath: 'wordpress-ai/counter-response.ai.schema.json',
          schemaProfile: 'ai-structured-output',
        },
        loadInputSchema: async () => INPUT_SCHEMA,
        manifest: MANIFEST,
        outputSchema: RESPONSE_SCHEMA,
      }),
    ).rejects.toThrow(/one shared category per document/);
  });

  test('keeps optional AI features out of hard minimums and lets required features raise the baseline', () => {
    const plan = resolveAiFeatureCapabilityPlan([
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
        mode: 'optional',
      },
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressCoreAbilities.id,
        mode: 'required',
      },
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressServerAbilities.id,
        mode: 'required',
      },
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressCoreAbilities.id,
        mode: 'optional',
      },
    ]);

    expect(plan.hardMinimums).toEqual({
      wordpress: '7.0',
    });
    expect(plan.requiredFeatures.map((feature) => feature.id)).toEqual([
      AI_FEATURE_DEFINITIONS.wordpressCoreAbilities.id,
      AI_FEATURE_DEFINITIONS.wordpressServerAbilities.id,
    ]);
    expect(plan.optionalFeatures.map((feature) => feature.id)).toEqual([
      AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
    ]);
  });

  test('rejects invalid version floor segments instead of silently comparing them', () => {
    expect(() =>
      resolveAiFeatureCapabilityPlan(
        [
          {
            featureId: 'valid-feature',
            mode: 'required',
          },
          {
            featureId: 'invalid-feature',
            mode: 'required',
          },
        ],
        {
          'invalid-feature': {
            description: 'Invalid floor',
            id: 'invalid-feature',
            label: 'Invalid floor',
            minimumVersions: {
              wordpress: '7.x',
            },
          },
          'valid-feature': {
            description: 'Valid floor',
            id: 'valid-feature',
            label: 'Valid floor',
            minimumVersions: {
              wordpress: '7.0',
            },
          },
        },
      ),
    ).toThrow(/compareVersionFloors received an invalid version floor "7\.x"/);
  });
});
