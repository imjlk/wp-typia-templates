import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Type Sync Tests', () => {
  const testTemplateDir = path.join(__dirname, '../../test-template/my-typia-block');
  const blockJsonPath = path.join(testTemplateDir, 'src/my-typia-block/block.json');

  test('should sync types to block.json', () => {
    // Run the sync script
    execSync('npm run sync-types', { cwd: testTemplateDir });

    // Check if block.json exists and has correct structure
    expect(fs.existsSync(blockJsonPath)).toBe(true);

    const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8'));
    
    // Check for required attributes
    expect(blockJson.attributes).toBeDefined();
    expect(blockJson.attributes.id).toBeDefined();
    expect(blockJson.attributes.version).toBeDefined();
    expect(blockJson.attributes.content).toBeDefined();
    expect(blockJson.attributes.alignment).toBeDefined();
    expect(blockJson.attributes.isVisible).toBeDefined();
  });

  test('should have correct attribute types', () => {
    const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8'));
    
    // Type checks
    expect(blockJson.attributes.id.type).toBe('string');
    expect(blockJson.attributes.version.type).toBe('number');
    expect(blockJson.attributes.content.type).toBe('string');
    expect(blockJson.attributes.alignment.type).toBe('string');
    expect(blockJson.attributes.isVisible.type).toBe('boolean');
  });

  test('should have correct default values', () => {
    const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf8'));
    
    // Default value checks
    expect(blockJson.attributes.version.default).toBe(1);
    expect(blockJson.attributes.content.default).toBe('');
    expect(blockJson.attributes.alignment.default).toBe('left');
    expect(blockJson.attributes.isVisible.default).toBe(true);
  });
});