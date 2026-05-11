import { describe, expect, test } from 'bun:test';

import { escapeRegExp } from '../src/string-utils';

describe('string utilities', () => {
  test('escapes regular expression metacharacters for dynamic patterns', () => {
    const source = '[ok] .*+?^${}()|\\';
    const escaped = escapeRegExp(source);

    expect(new RegExp(`^${escaped}$`, 'u').test(source)).toBe(true);
    expect(escaped).toBe('\\[ok\\] \\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\\\');
  });
});
