import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { EndpointManifestDefinition } from '@wp-typia/block-runtime/metadata-core';
import type { ILlmSchema } from 'typia';
import {
  buildTypiaLlmEndpointMethodDescriptors,
  projectTypiaLlmApplicationArtifact,
  projectTypiaLlmStructuredOutputArtifact,
  renderTypiaLlmModule,
  syncTypiaLlmAdapterModule,
} from '@wp-typia/project-tools/typia-llm';

const COUNTER_MANIFEST = {
  contracts: {
    CounterQuery: {
      sourceTypeName: 'CounterQuery',
    },
    CounterResponse: {
      sourceTypeName: 'CounterResponse',
    },
    CounterUpdateRequest: {
      sourceTypeName: 'CounterUpdateRequest',
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
      summary: 'Read the counter.',
      tags: ['Counter'],
    },
    {
      auth: 'public-write-protected',
      bodyContract: 'CounterUpdateRequest',
      method: 'POST',
      operationId: 'incrementCounter',
      path: '/demo/v1/counter',
      responseContract: 'CounterResponse',
      summary: 'Increment the counter.',
      tags: ['Counter'],
      wordpressAuth: {
        mechanism: 'public-signed-token',
        publicTokenField: 'publicWriteToken',
      },
    },
  ],
} as const satisfies EndpointManifestDefinition;

const EMPTY_LLM_PARAMETERS: ILlmSchema.IParameters = {
  $defs: {},
  additionalProperties: false,
  properties: {},
  required: [],
  type: 'object',
};

describe('typia.llm adapter emitter', () => {
  test('projects endpoint manifests into controller method descriptors', () => {
    expect(buildTypiaLlmEndpointMethodDescriptors(COUNTER_MANIFEST)).toEqual([
      {
        authIntent: 'public',
        authMode: 'public-read',
        description: 'Read the counter.',
        inputTypeName: 'CounterQuery',
        method: 'GET',
        operationId: 'getCounter',
        outputTypeName: 'CounterResponse',
        path: '/demo/v1/counter',
        tags: ['Counter'],
      },
      {
        authIntent: 'public-write-protected',
        authMode: 'public-signed-token',
        description: 'Increment the counter.',
        inputTypeName: 'CounterUpdateRequest',
        method: 'POST',
        operationId: 'incrementCounter',
        outputTypeName: 'CounterResponse',
        path: '/demo/v1/counter',
        tags: ['Counter'],
        wordpressAuth: {
          mechanism: 'public-signed-token',
          publicTokenField: 'publicWriteToken',
        },
      },
    ]);
  });

  test('renders a build-time typia.llm module from canonical contracts', () => {
    const source = renderTypiaLlmModule({
      applicationExportName: 'counterLlmApplication',
      interfaceName: 'CounterRestToolController',
      manifest: COUNTER_MANIFEST,
      structuredOutputExportName: 'counterStructuredOutput',
      structuredOutputTypeName: 'CounterResponse',
      typesImportPath: '../counter/api-types',
    });

    expect(source).toContain('import typia from "typia";');
    expect(source).toContain('} from "../counter/api-types";');
    expect(source).toContain('export interface CounterRestToolController');
    expect(source).toContain('getCounter(input: CounterQuery): CounterResponse;');
    expect(source).toContain(
      'incrementCounter(input: CounterUpdateRequest): CounterResponse;',
    );
    expect(source).toContain(
      'WordPress auth: public-signed-token (field: publicWriteToken)',
    );
    expect(source).toContain(
      'typia.llm.application<CounterRestToolController>();',
    );
    expect(source).toContain('typia.llm.structuredOutput<CounterResponse>();');
  });

  test('renders multiline endpoint summaries as valid JSDoc lines', () => {
    const source = renderTypiaLlmModule({
      applicationExportName: 'counterLlmApplication',
      interfaceName: 'CounterRestToolController',
      manifest: {
        ...COUNTER_MANIFEST,
        endpoints: [
          {
            ...COUNTER_MANIFEST.endpoints[0],
            summary: 'Read the counter.\nIncludes generated adapter context.',
          },
        ],
      },
      structuredOutputExportName: 'counterStructuredOutput',
      structuredOutputTypeName: 'CounterResponse',
      typesImportPath: '../counter/api-types',
    });

    expect(source).toContain(
      [
        '\t/**',
        '\t * Read the counter.',
        '\t * Includes generated adapter context.',
        '\t *',
      ].join('\n'),
    );
  });

  test('writes and checks the generated adapter module', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wp-typia-llm-'));
    const sourceFile = path.join(tempRoot, 'counter.llm.generated.ts');

    try {
      const written = await syncTypiaLlmAdapterModule({
        applicationExportName: 'counterLlmApplication',
        generatedSourceFile: sourceFile,
        interfaceName: 'CounterRestToolController',
        manifest: COUNTER_MANIFEST,
        structuredOutputExportName: 'counterStructuredOutput',
        structuredOutputTypeName: 'CounterResponse',
        typesImportPath: '../counter/api-types',
      });

      expect(written.check).toBe(false);
      expect(written.methodDescriptors).toHaveLength(2);

      const checked = await syncTypiaLlmAdapterModule({
        applicationExportName: 'counterLlmApplication',
        check: true,
        generatedSourceFile: sourceFile,
        interfaceName: 'CounterRestToolController',
        manifest: COUNTER_MANIFEST,
        structuredOutputExportName: 'counterStructuredOutput',
        structuredOutputTypeName: 'CounterResponse',
        typesImportPath: '../counter/api-types',
      });

      expect(checked.source).toBe(written.source);

      await writeFile(sourceFile, '// stale\n', 'utf8');
      await expect(
        syncTypiaLlmAdapterModule({
          applicationExportName: 'counterLlmApplication',
          check: true,
          generatedSourceFile: sourceFile,
          interfaceName: 'CounterRestToolController',
          manifest: COUNTER_MANIFEST,
          structuredOutputExportName: 'counterStructuredOutput',
          structuredOutputTypeName: 'CounterResponse',
          typesImportPath: '../counter/api-types',
        }),
      ).rejects.toThrow(/typia\.llm artifacts are missing or stale/);
      expect(await readFile(sourceFile, 'utf8')).toBe('// stale\n');
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  test('projects compiled typia.llm outputs into JSON-friendly artifacts', () => {
    const applicationArtifact = projectTypiaLlmApplicationArtifact({
      application: {
        functions: [
          {
            description: 'Read the counter.',
            name: 'getCounter',
            output: EMPTY_LLM_PARAMETERS,
            parameters: EMPTY_LLM_PARAMETERS,
            tags: ['Counter'],
          },
        ],
      },
      generatedFrom: {
        baselineOpenApiPath: 'src/blocks/counter/api.openapi.json',
        blockSlug: 'counter',
        manifestSource: 'endpoint-manifest+typescript',
      },
    });

    expect(applicationArtifact).toEqual({
      functions: [
        {
          description: 'Read the counter.',
          name: 'getCounter',
          output: EMPTY_LLM_PARAMETERS,
          parameters: EMPTY_LLM_PARAMETERS,
          tags: ['Counter'],
        },
      ],
      generatedFrom: {
        baselineOpenApiPath: 'src/blocks/counter/api.openapi.json',
        blockSlug: 'counter',
        manifestSource: 'endpoint-manifest+typescript',
      },
    });

    expect(
      projectTypiaLlmStructuredOutputArtifact({
        generatedFrom: {
          aiSchemaPath: 'src/blocks/counter/wordpress-ai/counter.ai.schema.json',
          blockSlug: 'counter',
          outputTypeName: 'CounterResponse',
        },
        structuredOutput: {
          parameters: EMPTY_LLM_PARAMETERS,
        },
      }),
    ).toEqual({
      generatedFrom: {
        aiSchemaPath: 'src/blocks/counter/wordpress-ai/counter.ai.schema.json',
        blockSlug: 'counter',
        outputTypeName: 'CounterResponse',
      },
      parameters: EMPTY_LLM_PARAMETERS,
    });
  });

  test('rejects mixed query/body endpoint inputs until adapter mapping is designed', () => {
    const mixedInputManifest = {
      contracts: {
        CounterQuery: {
          sourceTypeName: 'CounterQuery',
        },
        CounterResponse: {
          sourceTypeName: 'CounterResponse',
        },
        CounterUpdateRequest: {
          sourceTypeName: 'CounterUpdateRequest',
        },
      },
      endpoints: [
        {
          auth: 'authenticated',
          bodyContract: 'CounterUpdateRequest',
          method: 'POST',
          operationId: 'updateCounter',
          path: '/demo/v1/counter',
          queryContract: 'CounterQuery',
          responseContract: 'CounterResponse',
          tags: ['Counter'],
        },
      ],
    } as const satisfies EndpointManifestDefinition;

    expect(() =>
      buildTypiaLlmEndpointMethodDescriptors(mixedInputManifest),
    ).toThrow(/typia\.llm input mapping is ambiguous/);
  });
});
