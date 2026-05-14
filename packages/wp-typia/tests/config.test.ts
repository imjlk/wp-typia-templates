import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { z } from 'zod';

import {
  loadWpTypiaUserConfig,
  loadWpTypiaUserConfigFromSource,
  mergeWpTypiaUserConfig,
  validateWpTypiaUserConfig,
  type getWordPressCompatibilitySettings,
  type getMcpSchemaSources,
  type WpTypiaSchemaSource,
  type WpTypiaUserConfig,
  type WpTypiaWordPressCompatibilitySettings,
  type wpTypiaUserConfigSchema,
} from '../src/config';
import { extractWpTypiaConfigOverride } from '../src/config-override';

type ExpectTrue<TValue extends true> = TValue;
type IsEqual<TLeft, TRight> =
  (<TValue>() => TValue extends TLeft ? 1 : 2) extends <
    TValue,
  >() => TValue extends TRight ? 1 : 2
    ? true
    : false;
type UserConfigSchemaCompatibility = ExpectTrue<
  IsEqual<z.infer<typeof wpTypiaUserConfigSchema>, WpTypiaUserConfig>
>;
type SchemaSourceReturnCompatibility = ExpectTrue<
  IsEqual<ReturnType<typeof getMcpSchemaSources>, WpTypiaSchemaSource[]>
>;
type WordPressCompatibilitySettingsReturnCompatibility = ExpectTrue<
  IsEqual<
    ReturnType<typeof getWordPressCompatibilitySettings>,
    WpTypiaWordPressCompatibilitySettings
  >
>;

const configTypeCompatibilityChecks = {
  schemaSources: true,
  userConfig: true,
  wordpressCompatibility: true,
} satisfies {
  schemaSources: SchemaSourceReturnCompatibility;
  userConfig: UserConfigSchemaCompatibility;
  wordpressCompatibility: WordPressCompatibilitySettingsReturnCompatibility;
};

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

describe('wp-typia user config loading', () => {
  test('keeps exported config types derived from the Zod schema', () => {
    expect(configTypeCompatibilityChecks).toEqual({
      schemaSources: true,
      userConfig: true,
      wordpressCompatibility: true,
    });
  });

  test('deep merges objects while replacing arrays from later config sources', () => {
    const base: WpTypiaUserConfig = {
      create: {
        namespace: 'base-space',
        template: 'basic',
        yes: true,
      },
      wordpress: {
        minVersion: '6.7',
        testedVersions: ['6.7', '6.8'],
      },
      mcp: {
        schemaSources: [
          {
            namespace: 'base',
            path: './base.ts',
          },
        ],
      },
    };
    const incoming: WpTypiaUserConfig = {
      create: {
        'package-manager': 'pnpm',
        template: 'persistence',
      },
      compatibility: {
        allowUnknownFutureKeys: true,
        strict: false,
      },
      wordpress: {
        testedVersions: ['6.9'],
      },
      mcp: {
        schemaSources: [
          {
            namespace: 'incoming',
            path: './incoming.ts',
          },
        ],
      },
    };

    const merged = mergeWpTypiaUserConfig(base, incoming);

    expect(merged.create).toEqual({
      namespace: 'base-space',
      'package-manager': 'pnpm',
      template: 'persistence',
      yes: true,
    });
    expect(merged.compatibility).toEqual({
      allowUnknownFutureKeys: true,
      strict: false,
    });
    expect(merged.wordpress).toEqual({
      minVersion: '6.7',
      testedVersions: ['6.9'],
    });
    expect(merged.mcp?.schemaSources).toEqual([
      {
        namespace: 'incoming',
        path: './incoming.ts',
      },
    ]);
    expect(merged.mcp?.schemaSources).not.toBe(incoming.mcp?.schemaSources);
  });

  test('validates in-memory config objects with the strict unknown-key policy', () => {
    expect(
      validateWpTypiaUserConfig(
        {
          create: {
            'dry-run': true,
            template: 'basic',
          },
          mcp: {
            schemaSources: [
              {
                namespace: 'demo',
                path: './mcp-tools.json',
              },
            ],
          },
          compatibility: {
            allowUnknownFutureKeys: false,
            strict: true,
          },
          wordpress: {
            minVersion: '6.5',
            testedVersions: ['6.5', '6.6', '6.7'],
          },
        },
        'test config',
      ),
    ).toEqual({
      create: {
        'dry-run': true,
        template: 'basic',
      },
      compatibility: {
        allowUnknownFutureKeys: false,
        strict: true,
      },
      mcp: {
        schemaSources: [
          {
            namespace: 'demo',
            path: './mcp-tools.json',
          },
        ],
      },
      wordpress: {
        minVersion: '6.5',
        testedVersions: ['6.5', '6.6', '6.7'],
      },
    });
  });

  test('rejects malformed WordPress compatibility versions', () => {
    let thrown: unknown;
    try {
      validateWpTypiaUserConfig(
        {
          wordpress: {
            minVersion: '6.x',
            testedVersions: ['6.7', 'trunk'],
          },
        },
        'test config',
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).toHaveProperty('code', 'invalid-argument');
    expect(String((thrown as Error).message)).toContain(
      'wordpress.minVersion',
    );
    expect(String((thrown as Error).message)).toContain(
      'expected dotted numeric WordPress version',
    );
    expect(String((thrown as Error).message)).toContain(
      'wordpress.testedVersions[1]',
    );
  });

  test('loads explicit config sources relative to the requested working directory', async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-config-source-'),
    );

    try {
      writeJson(path.join(tempRoot, 'nested', 'override.json'), {
        create: {
          'package-manager': 'yarn',
          template: 'compound',
        },
      });

      await expect(
        loadWpTypiaUserConfigFromSource(tempRoot, './nested/override.json'),
      ).resolves.toEqual({
        create: {
          'package-manager': 'yarn',
          template: 'compound',
        },
      });
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('rejects unknown keys in explicit config override sources', async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-config-unknown-'),
    );

    try {
      writeJson(path.join(tempRoot, 'override.json'), {
        create: {
          template: 'basic',
          typo: 'unexpected',
        },
        custom: true,
      });

      let thrown: unknown;
      try {
        await loadWpTypiaUserConfigFromSource(tempRoot, './override.json');
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect(thrown).toHaveProperty('code', 'invalid-argument');
      expect(String((thrown as Error).message)).toContain(
        'Invalid wp-typia config at',
      );
      expect(String((thrown as Error).message)).toContain(
        'create: unknown key "typo"',
      );
      expect(String((thrown as Error).message)).toContain(
        'config: unknown key "custom"',
      );
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('rejects invalid config value types with path-specific diagnostics', async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-config-invalid-type-'),
    );

    try {
      writeJson(path.join(tempRoot, 'override.json'), {
        create: {
          'dry-run': 'yes',
        },
        mcp: {
          schemaSources: [
            {
              namespace: 'demo',
              path: false,
            },
          ],
        },
      });

      let thrown: unknown;
      try {
        await loadWpTypiaUserConfigFromSource(tempRoot, './override.json');
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect(thrown).toHaveProperty('code', 'invalid-argument');
      expect(String((thrown as Error).message)).toContain('create.dry-run');
      expect(String((thrown as Error).message)).toContain('expected boolean');
      expect(String((thrown as Error).message)).toContain(
        'mcp.schemaSources[0].path',
      );
      expect(String((thrown as Error).message)).toContain('expected string');
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('rejects non-object config file roots instead of treating them as absent', async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-config-root-type-'),
    );
    const configPath = path.join(tempRoot, 'override.json');

    try {
      writeJson(configPath, null);

      let nullRootError: unknown;
      try {
        await loadWpTypiaUserConfigFromSource(tempRoot, './override.json');
      } catch (error) {
        nullRootError = error;
      }

      expect(nullRootError).toBeInstanceOf(Error);
      expect(nullRootError).toHaveProperty('code', 'invalid-argument');
      expect(String((nullRootError as Error).message)).toContain('config');
      expect(String((nullRootError as Error).message)).toContain(
        'expected object',
      );
      expect(String((nullRootError as Error).message)).toContain(
        'received null',
      );

      writeJson(configPath, []);

      let arrayRootError: unknown;
      try {
        await loadWpTypiaUserConfigFromSource(tempRoot, './override.json');
      } catch (error) {
        arrayRootError = error;
      }

      expect(arrayRootError).toBeInstanceOf(Error);
      expect(arrayRootError).toHaveProperty('code', 'invalid-argument');
      expect(String((arrayRootError as Error).message)).toContain(
        'expected object',
      );
      expect(String((arrayRootError as Error).message)).toContain(
        'received array',
      );
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('loads default config sources in precedence order', async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-config-precedence-'),
    );
    const cwd = path.join(tempRoot, 'project');

    try {
      writeJson(path.join(cwd, '.wp-typiarc'), {
        create: {
          namespace: 'project-space',
          'package-manager': 'npm',
          template: 'interactivity',
        },
        mcp: {
          schemaSources: [
            {
              namespace: 'rc',
              path: './rc.ts',
            },
          ],
        },
      });
      writeJson(path.join(cwd, '.wp-typiarc.json'), {
        create: {
          'data-storage': 'post-meta',
        },
        mcp: {
          schemaSources: [
            {
              namespace: 'project',
              path: './project.ts',
            },
          ],
        },
      });
      writeJson(path.join(cwd, 'package.json'), {
        name: 'demo-config-project',
        'wp-typia': {
          create: {
            template: 'persistence',
          },
          mcp: {
            schemaSources: [
              {
                namespace: 'package',
                path: './package.ts',
              },
            ],
          },
        },
      });

      const config = await loadWpTypiaUserConfig(cwd);

      expect(config).toEqual({
        create: {
          namespace: 'project-space',
          'package-manager': 'npm',
          'data-storage': 'post-meta',
          template: 'persistence',
        },
        mcp: {
          schemaSources: [
            {
              namespace: 'package',
              path: './package.ts',
            },
          ],
        },
      });
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('validates package.json#wp-typia with the same config schema', async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-package-config-invalid-'),
    );

    try {
      writeJson(path.join(tempRoot, 'package.json'), {
        name: 'demo-config-project',
        'wp-typia': {
          mcp: {
            schemaSources: 'not-an-array',
          },
        },
      });

      let thrown: unknown;
      try {
        await loadWpTypiaUserConfig(tempRoot);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect(thrown).toHaveProperty('code', 'invalid-argument');
      expect(String((thrown as Error).message)).toContain(
        'package.json#wp-typia',
      );
      expect(String((thrown as Error).message)).toContain(
        'mcp.schemaSources',
      );
      expect(String((thrown as Error).message)).toContain('expected array');
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });
});

describe('wp-typia config override argv extraction', () => {
  test('extracts long and short config overrides without disturbing command argv', () => {
    expect(
      extractWpTypiaConfigOverride([
        '--config',
        './override.json',
        'create',
        'demo',
        '--template',
        'basic',
      ]),
    ).toEqual({
      argv: ['create', 'demo', '--template', 'basic'],
      configOverridePath: './override.json',
    });

    expect(
      extractWpTypiaConfigOverride([
        'templates',
        '-c',
        './templates.json',
        'inspect',
        '--',
        '--config',
      ]),
    ).toEqual({
      argv: ['templates', 'inspect', '--', '--config'],
      configOverridePath: './templates.json',
    });
  });

  test('preserves missing-value diagnostics for config override flags', () => {
    expect(() => extractWpTypiaConfigOverride(['--config'])).toThrow(
      '`--config` requires a value.',
    );
    expect(() => extractWpTypiaConfigOverride(['-c'])).toThrow(
      '`-c` requires a value.',
    );
  });
});
