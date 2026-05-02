import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadWpTypiaUserConfig,
  loadWpTypiaUserConfigFromSource,
  mergeWpTypiaUserConfig,
  type WpTypiaUserConfig,
} from '../src/config';
import { extractWpTypiaConfigOverride } from '../src/config-override';

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

describe('wp-typia user config loading', () => {
  test('deep merges objects while replacing arrays from later config sources', () => {
    const base: WpTypiaUserConfig = {
      create: {
        namespace: 'base-space',
        template: 'basic',
        yes: true,
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
    expect(merged.mcp?.schemaSources).toEqual([
      {
        namespace: 'incoming',
        path: './incoming.ts',
      },
    ]);
    expect(merged.mcp?.schemaSources).not.toBe(incoming.mcp?.schemaSources);
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
