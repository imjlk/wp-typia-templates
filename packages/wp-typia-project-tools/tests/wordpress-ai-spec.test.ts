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
import {
  DEFAULT_SCAFFOLD_COMPATIBILITY,
  OPTIONAL_WORDPRESS_AI_CLIENT_COMPATIBILITY,
  REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
  createScaffoldCompatibilityConfig,
  resolveScaffoldCompatibilityPolicy,
  updatePluginHeaderCompatibility,
} from '../src/internal/scaffold-compatibility.js';
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

  test('returns an empty AI capability plan when no features are selected', () => {
    expect(resolveAiFeatureCapabilityPlan([])).toEqual({
      hardMinimums: {},
      optionalFeatures: [],
      requiredFeatures: [],
    });
  });

  test('deduplicates repeated feature ids and lets required mode win', () => {
    const plan = resolveAiFeatureCapabilityPlan([
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
        mode: 'optional',
      },
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
        mode: 'required',
      },
      {
        featureId: AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
        mode: 'optional',
      },
    ]);

    expect(plan.requiredFeatures.map((feature) => feature.id)).toEqual([
      AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
    ]);
    expect(plan.optionalFeatures).toEqual([]);
    expect(plan.hardMinimums).toEqual({
      wordpress: '7.0',
    });
  });

  test('picks the highest WordPress and PHP minimums across required AI features only', () => {
    const plan = resolveAiFeatureCapabilityPlan(
      [
        {
          featureId: 'required-low',
          mode: 'required',
        },
        {
          featureId: 'required-high',
          mode: 'required',
        },
        {
          featureId: 'optional-higher',
          mode: 'optional',
        },
      ],
      {
        'optional-higher': {
          description: 'Optional higher floors',
          id: 'optional-higher',
          label: 'Optional higher floors',
          minimumVersions: {
            php: '8.3',
            wordpress: '7.2',
          },
        },
        'required-high': {
          description: 'Required high floors',
          id: 'required-high',
          label: 'Required high floors',
          minimumVersions: {
            php: '8.1',
            wordpress: '7.0',
          },
        },
        'required-low': {
          description: 'Required low floors',
          id: 'required-low',
          label: 'Required low floors',
          minimumVersions: {
            php: '8.0',
            wordpress: '6.8',
          },
        },
      },
    );

    expect(plan.hardMinimums).toEqual({
      php: '8.1',
      wordpress: '7.0',
    });
    expect(plan.requiredFeatures.map((feature) => feature.id)).toEqual([
      'required-low',
      'required-high',
    ]);
    expect(plan.optionalFeatures.map((feature) => feature.id)).toEqual([
      'optional-higher',
    ]);
  });

  test('maps optional and required AI scaffold compatibility into headers and generated config', () => {
    const optionalPolicy = resolveScaffoldCompatibilityPolicy(
      OPTIONAL_WORDPRESS_AI_CLIENT_COMPATIBILITY,
    );
    expect(optionalPolicy.pluginHeader).toEqual(DEFAULT_SCAFFOLD_COMPATIBILITY);
    expect(createScaffoldCompatibilityConfig(optionalPolicy)).toMatchObject({
      mode: 'optional',
      optionalFeatureIds: ['wordpress-ai-client'],
      optionalFeatures: ['WordPress AI Client'],
      requiredFeatureIds: [],
      requiredFeatures: [],
      runtimeGates: [
        'WordPress AI Client: wordpress-core-feature WordPress AI Client',
      ],
    });

    const requiredPolicy = resolveScaffoldCompatibilityPolicy(
      REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
    );
    expect(requiredPolicy.pluginHeader).toEqual({
      requiresAtLeast: '7.0',
      requiresPhp: '8.0',
      testedUpTo: '7.0',
    });
    expect(createScaffoldCompatibilityConfig(requiredPolicy)).toMatchObject({
      hardMinimums: {
        wordpress: '7.0',
      },
      mode: 'required',
      optionalFeatureIds: [],
      optionalFeatures: [],
      requiredFeatureIds: [
        'wordpress-server-abilities',
        'wordpress-core-abilities',
      ],
      requiredFeatures: [
        'WordPress Abilities API',
        '@wordpress/core-abilities',
      ],
    });
  });

  test('updates generated plugin headers from scaffold compatibility policy', () => {
    const source = [
      '<?php',
      '/**',
      ' * Plugin Name: Demo',
      ' * Requires at least: 6.7',
      ' * Tested up to:      6.9',
      ' * Requires PHP:      8.0',
      ' */',
      '',
    ].join('\n');

    expect(
      updatePluginHeaderCompatibility(
        source,
        resolveScaffoldCompatibilityPolicy(
          OPTIONAL_WORDPRESS_AI_CLIENT_COMPATIBILITY,
        ),
      ),
    ).toContain(' * Requires at least: 6.7');
    expect(
      updatePluginHeaderCompatibility(
        source,
        resolveScaffoldCompatibilityPolicy(
          REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
        ),
      ),
    ).toContain(' * Requires at least: 7.0');
    expect(
      updatePluginHeaderCompatibility(
        source,
        resolveScaffoldCompatibilityPolicy(
          REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
        ),
      ),
    ).toContain(' * Tested up to:      7.0');
  });

  test('does not lower custom plugin headers that already exceed the policy floor', () => {
    const source = [
      '<?php',
      '/**',
      ' * Plugin Name: Demo',
      ' * Requires at least: 7.1',
      ' * Tested up to:      7.2',
      ' * Requires PHP:      8.1',
      ' */',
      '',
    ].join('\n');
    const nextSource = updatePluginHeaderCompatibility(
      source,
      resolveScaffoldCompatibilityPolicy(
        REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
      ),
    );

    expect(nextSource).toContain(' * Requires at least: 7.1');
    expect(nextSource).toContain(' * Tested up to:      7.2');
    expect(nextSource).toContain(' * Requires PHP:      8.1');
  });

  test('preserves CRLF plugin header line endings when updating compatibility floors', () => {
    const source = [
      '<?php',
      '/**',
      ' * Plugin Name: Demo',
      ' * Requires at least: 6.7',
      ' * Tested up to:      6.9',
      ' * Requires PHP:      8.0',
      ' */',
      '',
    ].join('\r\n');
    const nextSource = updatePluginHeaderCompatibility(
      source,
      resolveScaffoldCompatibilityPolicy(
        REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
      ),
    );

    expect(nextSource).toContain(' * Requires at least: 7.0\r\n');
    expect(nextSource).toContain(' * Tested up to:      7.0\r\n');
    expect(nextSource).toContain(' * Requires PHP:      8.0\r\n');
    const linesBeforeTerminalNewline = nextSource.split('\n').slice(0, -1);
    expect(
      linesBeforeTerminalNewline.every((line) => line.endsWith('\r')),
    ).toBe(true);
  });

  test('updates empty plugin header values without consuming following header lines', () => {
    const source = [
      '<?php',
      '/**',
      ' * Plugin Name: Demo',
      ' * Requires at least:',
      ' * Tested up to:',
      ' * Requires PHP:',
      ' */',
      '',
    ].join('\n');
    const nextSource = updatePluginHeaderCompatibility(
      source,
      resolveScaffoldCompatibilityPolicy(
        REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
      ),
    );

    expect(nextSource).toContain(' * Requires at least: 7.0\n');
    expect(nextSource).toContain(' * Tested up to: 7.0\n');
    expect(nextSource).toContain(' * Requires PHP: 8.0\n');
    expect(nextSource).toContain(' */');
  });

  test('surfaces invalid user-authored plugin header floors as warnings', () => {
    const source = [
      '<?php',
      '/**',
      ' * Plugin Name: Demo',
      ' * Requires at least: 6.x',
      ' * Tested up to:      6.9',
      ' * Requires PHP:      8.x',
      ' */',
      '',
    ].join('\n');
    const warnings: string[] = [];
    const nextSource = updatePluginHeaderCompatibility(
      source,
      resolveScaffoldCompatibilityPolicy(
        REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
      ),
      {
        onWarning: (warning) => {
          warnings.push(warning);
        },
      },
    );

    expect(nextSource).toContain(' * Requires at least: 7.0\n');
    expect(nextSource).toContain(' * Tested up to:      7.0\n');
    expect(nextSource).toContain(' * Requires PHP:      8.0\n');
    expect(warnings).toEqual([
      'Invalid plugin header version floor for Requires at least: "6.x". Expected dotted numeric segments such as "6.7" or "8.1.2". Replacing it with compatibility policy value "7.0".',
      'Invalid plugin header version floor for Requires PHP: "8.x". Expected dotted numeric segments such as "6.7" or "8.1.2". Replacing it with compatibility policy value "8.0".',
    ]);
  });

  test('rejects invalid user-authored plugin header floors without a warning handler', () => {
    const source = [
      '<?php',
      '/**',
      ' * Plugin Name: Demo',
      ' * Requires at least: 6.x',
      ' * Tested up to:      6.9',
      ' * Requires PHP:      8.0',
      ' */',
      '',
    ].join('\n');

    expect(() =>
      updatePluginHeaderCompatibility(
        source,
        resolveScaffoldCompatibilityPolicy(
          REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY,
        ),
      ),
    ).toThrow(
      /Invalid plugin header version floor for Requires at least: "6\.x"/,
    );
  });

  test('rejects invalid scaffold compatibility baseline floors', () => {
    expect(() =>
      resolveScaffoldCompatibilityPolicy([], {
        baseline: {
          requiresAtLeast: '6.x',
          requiresPhp: '8.0',
          testedUpTo: '6.9',
        },
      }),
    ).toThrow(/invalid version floor "6\.x"/);
  });

  test('rejects invalid version floor segments instead of silently comparing them', () => {
    expect(() =>
      resolveAiFeatureCapabilityPlan(
        [
          {
            featureId: 'invalid-feature',
            mode: 'optional',
          },
        ],
        {
          'invalid-feature': {
            description: 'Invalid optional floor',
            id: 'invalid-feature',
            label: 'Invalid optional floor',
            minimumVersions: {
              wordpress: '6.x',
            },
          },
        },
      ),
    ).toThrow(
      /parseVersionFloorParts received an invalid version floor "6\.x"/,
    );

    expect(() =>
      resolveAiFeatureCapabilityPlan(
        [
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
              wordpress: '6.x',
            },
          },
        },
      ),
    ).toThrow(
      /parseVersionFloorParts received an invalid version floor "6\.x"/,
    );

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
    ).toThrow(
      /parseVersionFloorParts received an invalid version floor "7\.x"/,
    );
  });
});
