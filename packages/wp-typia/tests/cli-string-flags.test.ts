import { expect, test } from 'bun:test';

import { CLI_DIAGNOSTIC_CODES } from '@wp-typia/project-tools/cli-diagnostics';

import {
  readOptionalLooseStringFlag,
  readOptionalPairedStrictStringFlags,
  readOptionalStrictStringFlag,
  requireStrictStringFlag,
} from '../src/cli-string-flags';

test('strict optional string flags preserve values and reject empty strings', () => {
  expect(readOptionalStrictStringFlag({ template: ' basic ' }, 'template')).toBe(
    ' basic ',
  );

  try {
    readOptionalStrictStringFlag({ template: '   ' }, 'template');
    throw new Error('Expected strict flag reader to throw.');
  } catch (error) {
    expect((error as { code?: string }).code).toBe(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
    );
    expect((error as Error).message).toContain('`--template` requires a value.');
  }
});

test('loose optional string flags trim values and collapse empty strings to undefined', () => {
  expect(readOptionalLooseStringFlag({ namespace: ' demo-space/v1 ' }, 'namespace')).toBe(
    'demo-space/v1',
  );
  expect(readOptionalLooseStringFlag({ namespace: '   ' }, 'namespace')).toBeUndefined();
  expect(readOptionalLooseStringFlag({}, 'namespace')).toBeUndefined();
});

test('paired and required strict string flags keep current missing-argument diagnostics', () => {
  expect(
    readOptionalPairedStrictStringFlags(
      { block: 'counter-card', attribute: 'hero' },
      'block',
      'attribute',
      'paired flag message',
    ),
  ).toEqual(['counter-card', 'hero']);
  expect(
    requireStrictStringFlag(
      { anchor: 'core/post-content' },
      'anchor',
      'missing anchor message',
    ),
  ).toBe('core/post-content');

  try {
    readOptionalPairedStrictStringFlags(
      { block: 'counter-card' },
      'block',
      'attribute',
      'paired flag message',
    );
    throw new Error('Expected paired strict flag reader to throw.');
  } catch (error) {
    expect((error as { code?: string }).code).toBe(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
    );
    expect((error as Error).message).toContain('paired flag message');
  }

  try {
    requireStrictStringFlag({}, 'anchor', 'missing anchor message');
    throw new Error('Expected required strict flag reader to throw.');
  } catch (error) {
    expect((error as { code?: string }).code).toBe(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
    );
    expect((error as Error).message).toContain('missing anchor message');
  }
});
