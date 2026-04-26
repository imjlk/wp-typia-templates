import { describe, expect, test } from 'bun:test';

import {
  formatOutputMarker,
  getOutputMarker,
  prefersAsciiOutput,
  stripLeadingOutputMarker,
} from '../src/output-markers';

describe('output marker helpers', () => {
  test('prefers ASCII markers for explicit overrides and non-UTF locales', () => {
    expect(prefersAsciiOutput({ forceAscii: true })).toBe(true);
    expect(prefersAsciiOutput({ env: { NO_COLOR: '1' } })).toBe(true);
    expect(prefersAsciiOutput({ env: { LANG: 'C' } })).toBe(true);
    expect(prefersAsciiOutput({ env: { TERM: 'dumb' } })).toBe(true);
    expect(prefersAsciiOutput({ env: { LANG: 'en_US.ISO-8859-1' } })).toBe(
      true,
    );
  });

  test('keeps Unicode markers for UTF-8 locales and modern default Windows', () => {
    expect(prefersAsciiOutput({ env: { LANG: 'en_US.UTF-8' } })).toBe(false);
    expect(prefersAsciiOutput({ env: { WP_TYPIA_ASCII: '0' } })).toBe(false);
    expect(
      prefersAsciiOutput({
        env: { NO_COLOR: '1', WP_TYPIA_ASCII: '0' },
      }),
    ).toBe(false);
    expect(getOutputMarker('success', { forceAscii: true })).toBe('[ok]');
    expect(getOutputMarker('success', { env: { LANG: 'en_US.UTF-8' } })).toBe(
      '✅',
    );
  });

  test('documents marker precedence through TERM and locale fallbacks', () => {
    expect(
      prefersAsciiOutput({
        env: { LANG: 'en_US.UTF-8', NO_COLOR: '' },
      }),
    ).toBe(true);
    expect(
      prefersAsciiOutput({
        env: { LANG: 'en_US.UTF-8', NO_COLOR: undefined },
      }),
    ).toBe(false);
    expect(
      prefersAsciiOutput({
        env: { LANG: 'en_US.UTF-8', TERM: 'dumb' },
      }),
    ).toBe(true);
    expect(
      prefersAsciiOutput({
        env: { LANG: 'C', WP_TYPIA_ASCII: '0' },
      }),
    ).toBe(false);
    expect(
      prefersAsciiOutput({
        env: { LANG: 'C', WP_TYPIA_ASCII: '1' },
      }),
    ).toBe(true);
  });

  test('formats and strips status markers across Unicode and ASCII styles', () => {
    expect(
      formatOutputMarker('warning', 'Needs attention', { forceAscii: true }),
    ).toBe('[!] Needs attention');
    expect(
      stripLeadingOutputMarker('✅ Added workspace block', 'success'),
    ).toBe('Added workspace block');
    expect(
      stripLeadingOutputMarker('[ok] Added workspace block', 'success'),
    ).toBe('Added workspace block');
  });
});
