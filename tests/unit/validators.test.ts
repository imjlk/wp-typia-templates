import * as fs from 'node:fs';
import * as path from 'node:path';
import { syncBlockMetadata } from '../../scripts/lib/typia-metadata-core';

function createFixture(files: Record<string, string>) {
  const baseDir = path.resolve(__dirname, '../../test-template/my-typia-block/.tmp-metadata-fixtures');
  fs.mkdirSync(baseDir, { recursive: true });

  const fixtureDir = fs.mkdtempSync(path.join(baseDir, 'fixture-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const targetPath = path.join(fixtureDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
  }

  return fixtureDir;
}

describe('Typia metadata generator', () => {
  afterAll(() => {
    const baseDir = path.resolve(__dirname, '../../test-template/my-typia-block/.tmp-metadata-fixtures');
    fs.rmSync(baseDir, { force: true, recursive: true });
  });

  test('preserves imported nested constraints in typia.manifest while keeping block.json minimal', async () => {
    const fixtureDir = createFixture({
      'block.json': JSON.stringify({ attributes: {}, example: { attributes: {} } }, null, 2),
      'src/shared.ts': `import { tags } from "typia";

export interface SeoSettings {
  slug: string & tags.Pattern<"^[a-z0-9-]+$">;
  canonicalUrl?: string & tags.Format<"uri">;
}
`,
      'src/types.ts': `import { tags } from "typia";
import type { SeoSettings } from "./shared";

export interface BlockAttributes {
  variant: ("hero" | "inline") & tags.Default<"hero">;
  seo: SeoSettings;
  items: Array<{
    label: string & tags.MinLength<1>;
  }>;
}
`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          resolveJsonModule: true,
          strict: true,
          target: 'ES2022',
        },
        include: ['src/**/*.ts'],
      }, null, 2),
    });

    const result = await syncBlockMetadata({
      blockJsonFile: 'block.json',
      manifestFile: 'typia.manifest.json',
      projectRoot: fixtureDir,
      sourceTypeName: 'BlockAttributes',
      typesFile: 'src/types.ts',
    });

    const blockJson = JSON.parse(
      fs.readFileSync(path.join(fixtureDir, 'block.json'), 'utf8'),
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(fixtureDir, 'typia.manifest.json'), 'utf8'),
    );

    expect(blockJson.attributes.variant.enum).toEqual(['hero', 'inline']);
    expect(blockJson.attributes.seo).toEqual({
      type: 'object',
    });
    expect(blockJson.attributes.items).toEqual({
      type: 'array',
    });

    expect(manifest.attributes.seo.ts.kind).toBe('object');
    expect(manifest.attributes.seo.ts.properties.slug.typia.constraints.pattern).toBe('^[a-z0-9-]+$');
    expect(manifest.attributes.seo.ts.properties.canonicalUrl.typia.constraints.format).toBe('uri');
    expect(manifest.attributes.items.ts.items.ts.properties.label.typia.constraints.minLength).toBe(1);
    expect(result.lossyProjectionWarnings).toEqual(
      expect.arrayContaining([
        'BlockAttributes.items: items',
        'BlockAttributes.seo: properties',
      ]),
    );
  });
});
