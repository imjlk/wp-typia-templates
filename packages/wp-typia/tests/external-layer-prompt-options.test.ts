import { expect, test } from 'bun:test';

import {
  formatExternalLayerSelectHint,
  toExternalLayerPromptOptions,
} from '../src/external-layer-prompt-options';

test('formats external layer hints from descriptions and extends lists', () => {
  expect(
    formatExternalLayerSelectHint({
      description: 'Workspace-ready metrics layer',
      extends: ['acme/base', 'acme/tokens'],
      id: 'acme/metrics',
    }),
  ).toBe('Workspace-ready metrics layer · extends acme/base, acme/tokens');
  expect(
    formatExternalLayerSelectHint({
      extends: [],
      id: 'acme/minimal',
    }),
  ).toBeUndefined();
});

test('maps external layer options into prompt-compatible labels and hints', () => {
  expect(
    toExternalLayerPromptOptions([
      {
        description: 'Workspace-ready metrics layer',
        extends: ['acme/base'],
        id: 'acme/metrics',
      },
      {
        extends: [],
        id: 'acme/minimal',
      },
    ]),
  ).toEqual([
    {
      hint: 'Workspace-ready metrics layer · extends acme/base',
      label: 'acme/metrics',
      value: 'acme/metrics',
    },
    {
      hint: undefined,
      label: 'acme/minimal',
      value: 'acme/minimal',
    },
  ]);
});
