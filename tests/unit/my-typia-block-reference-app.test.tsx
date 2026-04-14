import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

import { ValidationErrorSummary } from '../../examples/my-typia-block/src/components/ValidationErrorSummary';
import { isNonArrayObject } from '../../examples/my-typia-block/src/migrations/plain-object';

describe('my-typia-block reference app helpers', () => {
  test('reference app package scripts and textdomain follow current CLI conventions', () => {
    const exampleDir = path.join(
      import.meta.dir,
      '../../examples/my-typia-block',
    );
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(exampleDir, 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>;
    };
    const blockJson = JSON.parse(
      fs.readFileSync(path.join(exampleDir, 'block.json'), 'utf8'),
    ) as {
      textdomain: string;
    };
    const snapshotBlockJson = JSON.parse(
      fs.readFileSync(
        path.join(exampleDir, 'src/migrations/versions/v1/block.json'),
        'utf8',
      ),
    ) as {
      textdomain: string;
    };
    const pluginBootstrap = fs.readFileSync(
      path.join(exampleDir, 'my-typia-block.php'),
      'utf8',
    );
    const wpTypiaPackage = JSON.parse(
      fs.readFileSync(
        path.join(import.meta.dir, '../../packages/wp-typia/package.json'),
        'utf8',
      ),
    ) as {
      version: string;
    };

    expect(packageJson.scripts['migration:init']).toBe(
      `npx --yes wp-typia@${wpTypiaPackage.version} migrate init --current-migration-version v1`,
    );
    expect(packageJson.scripts['migration:scaffold']).toBe(
      `npx --yes wp-typia@${wpTypiaPackage.version} migrate scaffold`,
    );
    expect(packageJson.scripts['migration:verify']).toBe(
      `npx --yes wp-typia@${wpTypiaPackage.version} migrate verify --all`,
    );
    expect(blockJson.textdomain).toBe('my-typia-block');
    expect(snapshotBlockJson.textdomain).toBe('my-typia-block');
    expect(pluginBootstrap).toContain('Text Domain:       my-typia-block');
    expect(pluginBootstrap).toContain("'my-typia-block'");
  });

  test('migration object helper preserves the example semantics', () => {
    class ExampleValue {}

    expect(isNonArrayObject({})).toBe(true);
    expect(isNonArrayObject(Object.create(null))).toBe(true);
    expect(isNonArrayObject(new ExampleValue())).toBe(true);
    expect(isNonArrayObject([])).toBe(false);
    expect(isNonArrayObject(null)).toBe(false);
  });

  test('ValidationErrorSummary renders the shared heading and list items', () => {
    const rendered = renderToStaticMarkup(
      <ValidationErrorSummary
        errors={['content: string', 'padding.top: number']}
      />,
    );

    expect(rendered).toContain('Validation Errors:');
    expect(rendered).toContain('content: string');
    expect(rendered).toContain('padding.top: number');
    expect(rendered).toContain('<ul');
  });

  test('migration-detector keeps the expected facade exports after the module split', () => {
    const migrationDetectorSource = fs.readFileSync(
      path.join(
        import.meta.dir,
        '../../examples/my-typia-block/src/migration-detector.ts',
      ),
      'utf8',
    );

    expect(migrationDetectorSource).toContain('BatchMigrationResult');
    expect(migrationDetectorSource).toContain('BlockScanResult');
    expect(migrationDetectorSource).toContain('MigrationAnalysis');
    expect(migrationDetectorSource).toContain('batchMigrateScanResults');
    expect(migrationDetectorSource).toContain('detectBlockMigration');
    expect(migrationDetectorSource).toContain('generateMigrationReport');
    expect(migrationDetectorSource).toContain('scanSiteForMigrations');
  });

  test('reference app imports the shared runtime identifier helper instead of a local UUID utility', () => {
    const editSource = fs.readFileSync(
      path.join(import.meta.dir, '../../examples/my-typia-block/src/edit.tsx'),
      'utf8',
    );
    const hooksSource = fs.readFileSync(
      path.join(import.meta.dir, '../../examples/my-typia-block/src/hooks.ts'),
      'utf8',
    );
    const validatorsSource = fs.readFileSync(
      path.join(
        import.meta.dir,
        '../../examples/my-typia-block/src/validators.ts',
      ),
      'utf8',
    );

    expect(editSource).toContain('@wp-typia/block-runtime/identifiers');
    expect(hooksSource).toContain('@wp-typia/block-runtime/identifiers');
    expect(validatorsSource).toContain('@wp-typia/block-runtime/identifiers');
    expect(
      fs.existsSync(
        path.join(
          import.meta.dir,
          '../../examples/my-typia-block/src/utils/uuid.ts',
        ),
      ),
    ).toBe(false);
  });

  test('reference app registration uses the generic-preserving scaffold helper without metadata casts', () => {
    const indexSource = fs.readFileSync(
      path.join(import.meta.dir, '../../examples/my-typia-block/src/index.tsx'),
      'utf8',
    );

    expect(indexSource).toContain('parseScaffoldBlockMetadata');
    expect(indexSource).toContain('buildScaffoldBlockRegistration(');
    expect(indexSource).not.toContain('type ScaffoldBlockMetadata');
    expect(indexSource).not.toContain('metadata as ScaffoldBlockMetadata');
    expect(indexSource).toContain('BlockConfiguration');
  });

  test('reference app validator wiring uses the current validator toolkit pattern', () => {
    const exampleDir = path.join(
      import.meta.dir,
      '../../examples/my-typia-block/src',
    );
    const validatorToolkitSource = fs.readFileSync(
      path.join(exampleDir, 'validator-toolkit.ts'),
      'utf8',
    );
    const validatorsSource = fs.readFileSync(
      path.join(exampleDir, 'validators.ts'),
      'utf8',
    );
    const fixturesReadme = fs.readFileSync(
      path.join(
        import.meta.dir,
        '../../examples/my-typia-block/src/migrations/fixtures/README.md',
      ),
      'utf8',
    );

    expect(validatorToolkitSource).toContain('createTemplateValidatorToolkit');
    expect(validatorsSource).toMatch(/from\s+['"]\.\/validator-toolkit['"]/);
    expect(validatorsSource).toContain('createTemplateValidatorToolkit');
    expect(validatorsSource).not.toContain('applyTemplateDefaultsFromManifest');
    expect(validatorsSource).not.toContain('createScaffoldValidatorToolkit');
    expect(fixturesReadme).toContain('wp-typia migrate verify');
    expect(fixturesReadme).toContain('wp-typia migrate fuzz');
  });
});
