import { beforeAll, describe, expect, test } from 'bun:test';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

type ManifestAttribute = {
  typia: {
    constraints: {
      format: string | null;
      maxLength: number | null;
      maximum: number | null;
      minLength: number | null;
      minimum: number | null;
      pattern: string | null;
      typeTag: string | null;
    };
    default: unknown;
  };
  ts: {
    kind: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
  };
  wp: {
    default: unknown;
    enum: unknown[] | null;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  };
};

type ContractManifest = {
  attributes: Record<string, ManifestAttribute>;
};

type BlockJsonContract = {
  attributes: Record<
    string,
    {
      default?: unknown;
      enum?: unknown[];
      type: string;
    }
  >;
};

type ValidationResult = {
  errors: string[];
  valid: boolean;
};

const UUID_V4_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadExampleContract() {
  const testTemplateDir = path.join(import.meta.dir, '../../test-template/my-typia-block');
  const blockJson = JSON.parse(
    fs.readFileSync(path.join(testTemplateDir, 'src/my-typia-block/block.json'), 'utf8'),
  ) as BlockJsonContract;
  const manifest = JSON.parse(
    fs.readFileSync(path.join(testTemplateDir, 'src/my-typia-block/typia.manifest.json'), 'utf8'),
  ) as ContractManifest;

  return { blockJson, manifest };
}

function validatePayload(
  manifest: ContractManifest,
  payload: Record<string, unknown>,
): ValidationResult {
  const errors: string[] = [];

  for (const [attributeName, attribute] of Object.entries(manifest.attributes)) {
    const value = payload[attributeName];

    if (value === undefined) {
      if (attribute.ts.required && attribute.typia.default == null && attribute.wp.default == null) {
        errors.push(`${attributeName} is required`);
      }
      continue;
    }

    if (value === null) {
      errors.push(`${attributeName} must be ${attribute.ts.kind}`);
      continue;
    }

    if (attribute.ts.kind === 'string' && typeof value !== 'string') {
      errors.push(`${attributeName} must be string`);
      continue;
    }

    if (attribute.ts.kind === 'number' && typeof value !== 'number') {
      errors.push(`${attributeName} must be number`);
      continue;
    }

    if (attribute.ts.kind === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${attributeName} must be boolean`);
      continue;
    }

    if (attribute.wp.enum && !attribute.wp.enum.includes(value)) {
      errors.push(`${attributeName} must be one of ${attribute.wp.enum.join(', ')}`);
    }

    if (typeof value === 'string') {
      if (attribute.typia.constraints.minLength !== null && value.length < attribute.typia.constraints.minLength) {
        errors.push(`${attributeName} must be at least ${attribute.typia.constraints.minLength} characters`);
      }

      if (attribute.typia.constraints.maxLength !== null && value.length > attribute.typia.constraints.maxLength) {
        errors.push(`${attributeName} must be at most ${attribute.typia.constraints.maxLength} characters`);
      }

      if (attribute.typia.constraints.format === 'uuid' && !UUID_V4_LIKE.test(value)) {
        errors.push(`${attributeName} must be a uuid`);
      }

      if (attribute.typia.constraints.pattern !== null) {
        const regex = new RegExp(attribute.typia.constraints.pattern);
        if (!regex.test(value)) {
          errors.push(`${attributeName} does not match ${attribute.typia.constraints.pattern}`);
        }
      }
    }

    if (typeof value === 'number') {
      if (attribute.typia.constraints.minimum !== null && value < attribute.typia.constraints.minimum) {
        errors.push(`${attributeName} must be >= ${attribute.typia.constraints.minimum}`);
      }

      if (attribute.typia.constraints.maximum !== null && value > attribute.typia.constraints.maximum) {
        errors.push(`${attributeName} must be <= ${attribute.typia.constraints.maximum}`);
      }

      if (attribute.typia.constraints.typeTag === 'uint32' && (!Number.isInteger(value) || value < 0)) {
        errors.push(`${attributeName} must be an unsigned integer`);
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

describe('Typia block attribute contract', () => {
  beforeAll(() => {
    const testTemplateDir = path.join(import.meta.dir, '../../test-template/my-typia-block');
    execSync('bun run sync-types', { cwd: testTemplateDir });
  });

  test('keeps block.json defaults aligned with typia.manifest defaults', () => {
    const { blockJson, manifest } = loadExampleContract();

    expect(blockJson.attributes.version.default).toBe(manifest.attributes.version.typia.default);
    expect(blockJson.attributes.content.default).toBe(manifest.attributes.content.typia.default);
    expect(blockJson.attributes.alignment.default).toBe(manifest.attributes.alignment.typia.default);
    expect(blockJson.attributes.isVisible.default).toBe(manifest.attributes.isVisible.typia.default);
  });

  test('accepts a valid payload that matches metadata projection and typia constraints', () => {
    const { manifest } = loadExampleContract();

    const result = validatePayload(manifest, {
      id: '00000000-0000-4000-8000-000000000000',
      version: 1,
      className: 'hero-callout',
      content: 'Hello Typia',
      alignment: 'center',
      isVisible: false,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('rejects invalid null and enum payloads', () => {
    const { manifest } = loadExampleContract();

    const result = validatePayload(manifest, {
      content: null,
      alignment: 'invalid',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('content must be string');
    expect(result.errors).toContain('alignment must be one of left, center, right, justify');
  });

  test('rejects manifest-only format and length constraint violations', () => {
    const { manifest } = loadExampleContract();

    const result = validatePayload(manifest, {
      id: 'not-a-uuid',
      className: 'x'.repeat(101),
      content: 'y'.repeat(1001),
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id must be a uuid');
    expect(result.errors).toContain('className must be at most 100 characters');
    expect(result.errors).toContain('content must be at most 1000 characters');
  });
});
