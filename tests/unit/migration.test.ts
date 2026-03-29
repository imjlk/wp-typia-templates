import { afterAll, describe, expect, test } from "bun:test";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { syncBlockMetadata } from '../../scripts/lib/typia-metadata-core';

function createFixture(files: Record<string, string>) {
  const baseDir = path.resolve(import.meta.dir, '../../examples/my-typia-block/.tmp-metadata-fixtures-errors');
  fs.mkdirSync(baseDir, { recursive: true });

  const fixtureDir = fs.mkdtempSync(path.join(baseDir, 'fixture-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const targetPath = path.join(fixtureDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
  }

  return fixtureDir;
}

describe('Typia metadata generator failure modes', () => {
  afterAll(() => {
    const baseDir = path.resolve(import.meta.dir, '../../examples/my-typia-block/.tmp-metadata-fixtures-errors');
    fs.rmSync(baseDir, { force: true, recursive: true });
  });

  test('rejects external non-serializable types', async () => {
    const fixtureDir = createFixture({
      'block.json': JSON.stringify({ attributes: {} }, null, 2),
      'src/types.ts': `import { tags } from "typia";

export interface BlockAttributes {
  registry: Map<string, string>;
  title: string & tags.Default<"hello">;
}
`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          target: 'ES2022',
        },
        include: ['src/**/*.ts'],
      }, null, 2),
    });

    await expect(syncBlockMetadata({
      blockJsonFile: 'block.json',
      manifestFile: 'typia.manifest.json',
      projectRoot: fixtureDir,
      sourceTypeName: 'BlockAttributes',
      typesFile: 'src/types.ts',
    })).rejects.toThrow(/not supported/i);
  });

  test('rejects recursive types', async () => {
    const fixtureDir = createFixture({
      'block.json': JSON.stringify({ attributes: {} }, null, 2),
      'src/types.ts': `export interface RecursiveNode {
  child?: RecursiveNode;
}

export interface BlockAttributes {
  tree: RecursiveNode;
}
`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          target: 'ES2022',
        },
        include: ['src/**/*.ts'],
      }, null, 2),
    });

    await expect(syncBlockMetadata({
      blockJsonFile: 'block.json',
      manifestFile: 'typia.manifest.json',
      projectRoot: fixtureDir,
      sourceTypeName: 'BlockAttributes',
      typesFile: 'src/types.ts',
    })).rejects.toThrow(/recursive/i);
  });
});
