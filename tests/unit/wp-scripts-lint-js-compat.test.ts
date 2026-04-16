import { describe, expect, test } from 'bun:test';

import {
  LINT_CONFIG_FILES,
  hasExplicitLintTargets,
} from '../../scripts/run-wp-scripts-lint-js-compat.mjs';

describe('run-wp-scripts-lint-js-compat', () => {
  test('tracks supported project config filenames for the wp-scripts compat lane', () => {
    expect(LINT_CONFIG_FILES).toContain('.eslintrc.cjs');
  });

  test('treats bare positional args as explicit lint targets', () => {
    expect(hasExplicitLintTargets(['src/index.ts'])).toBe(true);
    expect(hasExplicitLintTargets(['--max-warnings', '0', 'src/index.ts'])).toBe(
      true,
    );
    expect(hasExplicitLintTargets(['--', 'src/index.ts'])).toBe(true);
  });

  test('ignores option values when deciding whether to append the default target', () => {
    expect(hasExplicitLintTargets([])).toBe(false);
    expect(hasExplicitLintTargets(['--max-warnings', '0'])).toBe(false);
    expect(hasExplicitLintTargets(['--cache-location', '.cache/eslint'])).toBe(
      false,
    );
    expect(
      hasExplicitLintTargets(['--cache-location=.cache/eslint']),
    ).toBe(false);
  });
});
