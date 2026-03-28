import { beforeAll, describe, expect, test } from "bun:test";
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Type Sync Tests', () => {
  const testTemplateDir = path.join(import.meta.dir, '../../test-template/my-typia-block');
  const blockJsonPath = path.join(testTemplateDir, 'src/my-typia-block/block.json');
  const manifestPath = path.join(testTemplateDir, 'src/my-typia-block/typia.manifest.json');
  const phpValidatorPath = path.join(testTemplateDir, 'src/my-typia-block/typia-validator.php');
  const buildManifestPath = path.join(testTemplateDir, 'build/my-typia-block/typia.manifest.json');
  const buildPhpValidatorPath = path.join(testTemplateDir, 'build/my-typia-block/typia-validator.php');

  beforeAll(() => {
    execSync('bun run sync-types', { cwd: testTemplateDir });
  });

  test('should sync types to block.json and generate typia.manifest.json', () => {
    expect(fs.existsSync(blockJsonPath)).toBe(true);
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(phpValidatorPath)).toBe(true);

    const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(blockJson.attributes).toBeDefined();
    expect(blockJson.attributes.id).toBeDefined();
    expect(blockJson.attributes.version).toBeDefined();
    expect(blockJson.attributes.content).toBeDefined();
    expect(blockJson.attributes.alignment).toBeDefined();
    expect(blockJson.attributes.isVisible).toBeDefined();
    expect(manifest.manifestVersion).toBe(1);
    expect(manifest.sourceType).toBe('MyTypiaBlockAttributes');
  });

  test('should have correct block.json projection types and enums', () => {
    const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8'));
    
    expect(blockJson.attributes.id.type).toBe('string');
    expect(blockJson.attributes.version.type).toBe('number');
    expect(blockJson.attributes.content.type).toBe('string');
    expect(blockJson.attributes.alignment.type).toBe('string');
    expect(blockJson.attributes.isVisible.type).toBe('boolean');
    expect(blockJson.attributes.alignment.enum).toEqual(['left', 'center', 'right', 'justify']);
  });

  test('should preserve Typia-only constraints in typia.manifest.json', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.attributes.id.typia.constraints.format).toBe('uuid');
    expect(manifest.attributes.version.typia.constraints.typeTag).toBe('uint32');
    expect(manifest.attributes.content.typia.constraints.maxLength).toBe(1000);
    expect(manifest.attributes.content.typia.constraints.minLength).toBe(0);
  });

  test('should have correct default values', () => {
    const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8'));
    
    expect(blockJson.attributes.version.default).toBe(1);
    expect(blockJson.attributes.content.default).toBe('');
    expect(blockJson.attributes.alignment.default).toBe('left');
    expect(blockJson.attributes.isVisible.default).toBe(true);
  });

  test('should copy typia.manifest.json into the build output', () => {
    execSync('bun run build', { cwd: testTemplateDir });

    expect(fs.existsSync(buildManifestPath)).toBe(true);
    expect(fs.existsSync(buildPhpValidatorPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const builtManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    const phpValidatorSource = fs.readFileSync(phpValidatorPath, 'utf8');
    const builtPhpValidatorSource = fs.readFileSync(buildPhpValidatorPath, 'utf8');

    expect(builtManifest).toEqual(manifest);
    expect(builtPhpValidatorSource).toEqual(phpValidatorSource);
  }, { timeout: 30_000 });
});
