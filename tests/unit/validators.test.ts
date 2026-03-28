import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { syncBlockMetadata } from '../../scripts/lib/typia-metadata-core';

function createFixture(files: Record<string, string>) {
  const baseDir = path.resolve(import.meta.dir, '../../test-template/my-typia-block/.tmp-metadata-fixtures');
  fs.mkdirSync(baseDir, { recursive: true });

  const fixtureDir = fs.mkdtempSync(path.join(baseDir, 'fixture-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const targetPath = path.join(fixtureDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
  }

  return fixtureDir;
}

function hasPhpBinary() {
  try {
    execFileSync('php', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('Typia metadata generator', () => {
  afterAll(() => {
    const baseDir = path.resolve(import.meta.dir, '../../test-template/my-typia-block/.tmp-metadata-fixtures');
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
    expect(result.lossyProjectionWarnings).toContain('BlockAttributes.items: items');
    expect(result.lossyProjectionWarnings).toContain('BlockAttributes.seo: properties');
  });

  test('generated php validator distinguishes arrays from objects for nested safe-subset attributes', async () => {
    if (!hasPhpBinary()) {
      return;
    }

    const fixtureDir = createFixture({
      'block.json': JSON.stringify({ attributes: {}, example: { attributes: {} }, name: 'create-block/php-validator' }, null, 2),
      'src/types.ts': `export interface BlockAttributes {
  seo: {
    slug: string;
  };
  items: Array<{
    label: string;
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

    await syncBlockMetadata({
      blockJsonFile: 'block.json',
      manifestFile: 'typia.manifest.json',
      projectRoot: fixtureDir,
      sourceTypeName: 'BlockAttributes',
      typesFile: 'src/types.ts',
    });

    const phpValidatorPath = path.join(fixtureDir, 'typia-validator.php');
    execFileSync('php', ['-l', phpValidatorPath], { stdio: 'ignore' });

    const invalidArrayPayload = JSON.stringify({
      items: { label: 'wrong-shape' },
      seo: { slug: 'valid' },
    }).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const invalidObjectPayload = JSON.stringify({
      items: [{ label: 'valid' }],
      seo: [{ slug: 'wrong-shape' }],
    }).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const arrayResult = JSON.parse(execFileSync('php', [
      '-r',
      `$validator = require '${phpValidatorPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'; $payload = json_decode('${invalidArrayPayload}', true); echo json_encode($validator->validate($payload), JSON_UNESCAPED_SLASHES);`,
    ], { encoding: 'utf8' }));
    const objectResult = JSON.parse(execFileSync('php', [
      '-r',
      `$validator = require '${phpValidatorPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'; $payload = json_decode('${invalidObjectPayload}', true); echo json_encode($validator->validate($payload), JSON_UNESCAPED_SLASHES);`,
    ], { encoding: 'utf8' }));

    expect(arrayResult.valid).toBe(false);
    expect(arrayResult.errors).toContain('items must be array');
    expect(objectResult.valid).toBe(false);
    expect(objectResult.errors).toContain('seo must be object');
  });

  test('manifest v2 schema distinguishes explicit null defaults from missing defaults', () => {
    const withoutDefault = {
      typia: {
        constraints: {},
        defaultValue: null,
        hasDefault: false,
      },
      ts: {
        items: null,
        kind: 'string',
        properties: null,
        required: false,
        union: null,
      },
      wp: {
        defaultValue: null,
        enum: null,
        hasDefault: false,
        type: 'string',
      },
    };
    const withExplicitNullDefault = {
      ...withoutDefault,
      typia: {
        ...withoutDefault.typia,
        hasDefault: true,
      },
      wp: {
        ...withoutDefault.wp,
        hasDefault: true,
      },
    };

    expect(withoutDefault.typia.hasDefault).toBe(false);
    expect(withoutDefault.typia.defaultValue).toBeNull();
    expect(withExplicitNullDefault.typia.hasDefault).toBe(true);
    expect(withExplicitNullDefault.typia.defaultValue).toBeNull();
  });

  test('emits discriminated union metadata and validates union branches in php', async () => {
    if (!hasPhpBinary()) {
      return;
    }

    const fixtureDir = createFixture({
      'block.json': JSON.stringify({ attributes: {}, example: { attributes: {} } }, null, 2),
      'src/types.ts': `export type LinkTarget =
  | { kind: "post"; postId: number }
  | { kind: "url"; href: string };

export interface BlockAttributes {
  link: LinkTarget;
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

    await syncBlockMetadata({
      blockJsonFile: 'block.json',
      manifestFile: 'typia.manifest.json',
      projectRoot: fixtureDir,
      sourceTypeName: 'BlockAttributes',
      typesFile: 'src/types.ts',
    });

    const blockJson = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'block.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'typia.manifest.json'), 'utf8'));
    const phpValidatorPath = path.join(fixtureDir, 'typia-validator.php');

    expect(blockJson.attributes.link).toEqual({ type: 'object' });
    expect(manifest.attributes.link.ts.kind).toBe('union');
    expect(manifest.attributes.link.ts.union.discriminator).toBe('kind');
    expect(Object.keys(manifest.attributes.link.ts.union.branches)).toEqual(['post', 'url']);

    const validResult = JSON.parse(execFileSync('php', [
      '-r',
      `$validator = require '${phpValidatorPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'; echo json_encode($validator->validate(["link" => ["kind" => "post", "postId" => 12]]), JSON_UNESCAPED_SLASHES);`,
    ], { encoding: 'utf8' }));
    const invalidResult = JSON.parse(execFileSync('php', [
      '-r',
      `$validator = require '${phpValidatorPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'; echo json_encode($validator->validate(["link" => ["kind" => "missing", "href" => "https://example.com"]]), JSON_UNESCAPED_SLASHES);`,
    ], { encoding: 'utf8' }));

    expect(validResult.valid).toBe(true);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain('link.kind must be one of post, url');
  });
});
