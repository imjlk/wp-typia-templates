import { describe, expect, test } from 'bun:test';

import { cloneJsonValue } from '../../packages/wp-typia-project-tools/src/runtime/json-utils';
import {
  deleteValueAtPath,
  getValueAtPath,
  setValueAtPath,
} from '../../packages/wp-typia-project-tools/src/runtime/migration-utils';
import { isPlainObject } from '../../packages/wp-typia-project-tools/src/runtime/object-utils';
import { buildBlockCssClassName } from '../../packages/wp-typia-project-tools/src/runtime/scaffold';
import {
  toKebabCase,
  toPascalCase,
  toSegmentPascalCase,
  toSnakeCase,
  toTitleCase,
} from '../../packages/wp-typia-project-tools/src/runtime/string-case';

describe('shared create runtime helpers', () => {
  test('normalizes case conversions across slugs, camelCase, and repeated separators', () => {
    expect(toKebabCase(' DemoBlock Value ')).toBe('demo-block-value');
    expect(toKebabCase('demo---block__value')).toBe('demo-block-value');
    expect(toKebabCase('demo-block-value')).toBe('demo-block-value');

    expect(toSnakeCase('DemoBlock Value')).toBe('demo_block_value');
    expect(toPascalCase('demo-block_value')).toBe('DemoBlockValue');
    expect(toSegmentPascalCase('ABTest')).toBe('ABTest');
    expect(toSegmentPascalCase('v2HTML')).toBe('V2HTML');
    expect(toTitleCase('demoBlock-value')).toBe('Demo Block Value');
  });

  test('identifies plain objects and rejects arrays, primitives, and null', () => {
    class DemoRecord {
      value = true;
    }

    expect(isPlainObject({ nested: { value: true } })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('demo')).toBe(false);
    expect(isPlainObject(3)).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
    expect(isPlainObject(new DemoRecord())).toBe(false);
  });

  test('clones JSON-compatible values without retaining nested references', () => {
    const source = {
      attributes: {
        content: 'demo',
        items: ['a', { count: 1 }],
      },
    };

    const clone = cloneJsonValue(source);
    expect(clone).toEqual(source);
    expect(clone).not.toBe(source);
    expect(clone.attributes).not.toBe(source.attributes);
    expect(clone.attributes.items).not.toBe(source.attributes.items);

    (clone.attributes.items[1] as { count: number }).count = 2;
    expect((source.attributes.items[1] as { count: number }).count).toBe(1);
  });

  test('builds namespace-aware block wrapper classes with an empty-namespace fallback', () => {
    expect(buildBlockCssClassName('demo-space', 'demo-block')).toBe(
      'wp-block-demo-space-demo-block',
    );
    expect(buildBlockCssClassName('', 'demo-block')).toBe(
      'wp-block-demo-block',
    );
    expect(buildBlockCssClassName('demo-block', 'demo-block')).toBe(
      'wp-block-demo-block-block',
    );
    expect(buildBlockCssClassName('paragraph', 'paragraph')).toBe(
      'wp-block-paragraph-block',
    );
  });

  test('migration path helpers preserve the caller record shape while mutating nested values', () => {
    const fixture = {
      nested: {
        count: 1,
      },
      title: 'Demo',
    };

    const returnedFixture = setValueAtPath(fixture, 'nested.title', 'Updated');
    const returnedAfterDelete = deleteValueAtPath(fixture, 'nested.count');
    const nestedTitle = getValueAtPath(fixture, 'nested.title');
    const topLevelTitle: string = returnedFixture.title;

    void topLevelTitle;

    expect(returnedFixture).toBe(fixture);
    expect(returnedAfterDelete).toBe(fixture);
    expect(nestedTitle).toBe('Updated');
    expect(getValueAtPath(fixture, 'nested.count')).toBeUndefined();
  });
});
