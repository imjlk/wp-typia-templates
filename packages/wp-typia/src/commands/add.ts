import { createElement } from 'react';

import { defineCommand } from '@bunli/core';
import type { AddKindId } from '../add-kind-registry';

import {
  ADD_OPTION_METADATA,
  buildCommandOptions,
  resolveCommandOptionValues,
} from '../command-option-metadata';
import {
  emitCliDiagnosticFailure,
  prefersStructuredCliOutput,
} from '../cli-diagnostic-output';
import { getAddBlockDefaults } from '../config';
import { resolveCommandOutputAdapters } from './output-adapters';
import { resolveBundledModuleHref } from '../render-loader';
import { executeAddCommand } from '../runtime-bridge';
import {
  buildStructuredCompletionSuccessPayload,
  extractCompletionProjectDir,
} from '../runtime-bridge-output';
import { supportsInteractiveTui } from '../runtime-capabilities';
import type { WpTypiaRenderArgs } from './render-types';
import { LazyFlow } from '../ui/lazy-flow';

function loadAddFlow() {
  return import(
    resolveBundledModuleHref(
      import.meta.url,
      ['./ui/add-flow.js', '../ui/add-flow.js', '../ui/add-flow.tsx'],
      {
        moduleLabel: 'the add-flow UI',
      },
    )
  ).then((module) => ({ default: module.AddFlow }));
}

const addOptions = buildCommandOptions(ADD_OPTION_METADATA);

export const addCommand = defineCommand({
  defaultFormat: 'toon',
  description:
    'Extend an official wp-typia workspace with blocks, integration envs, variations, block styles, transforms, patterns, binding sources, standalone contracts, plugin-level REST resources, post meta contracts, workflow abilities, server-only AI features, editor plugins, or hooked blocks.',
  handler: async (args) => {
    const prefersStructuredOutput = prefersStructuredCliOutput(args);
    const { printLine, warnLine } = resolveCommandOutputAdapters(args);

    try {
      if (prefersStructuredOutput) {
        const completion = await executeAddCommand({
          cwd: args.cwd,
          emitOutput: false,
          flags: args.flags as Record<string, unknown>,
          interactive: false,
          kind: args.positional[0],
          name: args.positional[1],
          printLine,
          warnLine,
        });
        args.output(
          buildStructuredCompletionSuccessPayload('add', completion, {
            dryRun: Boolean(args.flags['dry-run']),
            kind: args.positional[0],
            name: args.positional[1],
            projectDir: extractCompletionProjectDir(completion) ?? args.cwd,
          }),
        );
        return;
      }

      await executeAddCommand({
        cwd: args.cwd,
        flags: args.flags as Record<string, unknown>,
        kind: args.positional[0],
        name: args.positional[1],
        printLine,
        warnLine,
      });
    } catch (error) {
      emitCliDiagnosticFailure(args, {
        command: 'add',
        error,
      });
    }
  },
  name: 'add',
  options: addOptions,
  ...(supportsInteractiveTui()
    ? {
        render: (args: WpTypiaRenderArgs) => {
          const config =
            args.context?.store?.wpTypiaUserConfig &&
            typeof args.context.store.wpTypiaUserConfig === 'object'
              ? getAddBlockDefaults(args.context.store.wpTypiaUserConfig)
              : {};
          const initialValues = resolveCommandOptionValues(
            ADD_OPTION_METADATA,
            {
              defaults: config,
              flags: args.flags as Record<string, unknown>,
              optionNames: Object.keys(ADD_OPTION_METADATA).filter(
                (optionName) => optionName !== 'dry-run',
              ),
            },
          );
          return createElement(LazyFlow, {
            loader: loadAddFlow,
            props: {
              cwd: args.cwd,
              initialValues: {
                ...initialValues,
                kind: (args.positional[0] as AddKindId | undefined) ?? 'block',
                name: args.positional[1] ?? '',
                position: initialValues.position ?? 'after',
                slot: initialValues.slot ?? 'sidebar',
              },
            },
          });
        },
        tui: {
          renderer: {
            bufferMode: 'alternate' as const,
          },
        },
      }
    : {}),
});

export default addCommand;
