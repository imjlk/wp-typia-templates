import { afterAll, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { ReadlinePrompt } from '@wp-typia/project-tools/cli-prompt';
import { ADD_KIND_IDS, supportsAddKindDryRun } from '../src/add-kind-registry';
import { WP_TYPIA_COMMAND_REGISTRY } from '../src/command-registry';
import { executeAddCommand } from '../src/runtime-bridge';
import {
  linkWorkspaceNodeModules,
  scaffoldOfficialWorkspace,
} from '../../wp-typia-project-tools/tests/helpers/scaffold-test-harness.js';

describe('wp-typia add command bridge', () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'wp-typia-add-bridge-'),
  );

  afterAll(() => {
    fs.rmSync(tempRoot, { force: true, recursive: true });
  });

  test('defaults add block to the basic template in non-interactive runs', async () => {
    const projectDir = path.join(tempRoot, 'demo-add-basic-default');

    await scaffoldOfficialWorkspace(projectDir);
    linkWorkspaceNodeModules(projectDir);

    const payload = await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {},
      interactive: false,
      kind: 'block',
      name: 'promo-card',
    });

    expect(payload?.title).toContain('Added workspace block');
    expect(payload?.summaryLines).toContain('Template family: basic');
    expect(
      fs.existsSync(
        path.join(projectDir, 'src', 'blocks', 'promo-card', 'block.json'),
      ),
    ).toBe(true);
  });

  test('scaffolds interactivity block templates with typed store helpers', async () => {
    const projectDir = path.join(tempRoot, 'demo-add-interactivity-template');

    await scaffoldOfficialWorkspace(projectDir);
    linkWorkspaceNodeModules(projectDir);

    const payload = await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {
        template: 'interactivity',
      },
      interactive: false,
      kind: 'block',
      name: 'signal-board',
    });

    const blockDir = path.join(projectDir, 'src', 'blocks', 'signal-board');
    const generatedInteractivityStore = fs.readFileSync(
      path.join(blockDir, 'interactivity-store.ts'),
      'utf8',
    );
    const generatedInteractivityRuntime = fs.readFileSync(
      path.join(blockDir, 'interactivity.ts'),
      'utf8',
    );
    const generatedSave = fs.readFileSync(
      path.join(blockDir, 'save.tsx'),
      'utf8',
    );

    expect(payload?.summaryLines).toContain('Template family: interactivity');
    expect(fs.existsSync(path.join(blockDir, 'interactivity-store.ts'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(blockDir, 'interactivity.ts'))).toBe(true);
    expect(generatedInteractivityStore).toContain(
      'type InteractivityCallable = CallableFunction;',
    );
    expect(generatedInteractivityStore).not.toContain(
      'type InteractivityCallable = Function;',
    );
    expect(generatedInteractivityStore).not.toContain(
      'type InteractivityActionHandler = Function;',
    );
    expect(generatedInteractivityStore).toContain(
      'action<Key extends InteractivityMethodKey<Actions>>',
    );
    expect(generatedInteractivityStore).toContain(
      'callback<Key extends InteractivityMethodKey<Callbacks>>',
    );
    expect(generatedInteractivityStore).toContain(
      'context<Key extends InteractivityKey<Context>>',
    );
    expect(generatedInteractivityStore).toContain(
      'negate<Path extends string>(',
    );
    expect(generatedInteractivityStore).toContain(
      'export interface SignalBoardStoreActions',
    );
    expect(generatedInteractivityStore).toContain(
      'export interface SignalBoardStoreCallbacks {}',
    );
    expect(generatedInteractivityStore).toContain(
      'export const signalBoardStore = defineInteractivityStore({',
    );
    expect(generatedInteractivityRuntime).toContain(
      "import {\n  signalBoardStore,\n  type SignalBoardStoreActions,\n} from './interactivity-store';",
    );
    expect(generatedInteractivityRuntime).toContain(
      'const actions: SignalBoardStoreActions = {',
    );
    expect(generatedInteractivityRuntime).toContain(
      'store(signalBoardStore.namespace, {',
    );
    expect(generatedInteractivityRuntime).toContain(
      'callbacks: signalBoardStore.callbacks,',
    );
    expect(generatedSave).toContain(
      "const clickActionDirective = signalBoardStore.directive.action('handleClick');",
    );
    expect(generatedSave).toContain(
      'const visibilityHiddenDirective = signalBoardStore.directive.negate(',
    );
    expect(generatedSave).toContain(
      "signalBoardStore.directive.state('isVisible')",
    );
    expect(generatedSave).toContain(
      "const clampedClicksDirective = signalBoardStore.directive.state('clampedClicks');",
    );
    expect(generatedSave).toContain(
      "const resetActionDirective = signalBoardStore.directive.action('reset');",
    );
    expect(generatedSave).toContain(
      "'data-wp-interactive': signalBoardStore.directive.interactive,",
    );
    expect(generatedSave).toContain(
      'data-wp-bind--aria-valuenow={clampedClicksDirective}',
    );
    expect(generatedSave).toContain('data-wp-on--click={clickActionDirective}');
  }, 15_000);

  test('passes binding-source target flags through the add bridge', async () => {
    const projectDir = path.join(tempRoot, 'demo-add-binding-target');

    await scaffoldOfficialWorkspace(projectDir);
    linkWorkspaceNodeModules(projectDir);
    await expect(
      executeAddCommand({
        cwd: projectDir,
        emitOutput: false,
        flags: {
          block: 'counter-card',
        },
        interactive: false,
        kind: 'binding-source',
        name: 'hero-data',
      }),
    ).rejects.toThrow(
      '`wp-typia add binding-source` requires --block and --attribute to be provided together.',
    );
    await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {
        template: 'basic',
      },
      interactive: false,
      kind: 'block',
      name: 'counter-card',
    });

    const payload = await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {
        attribute: 'headline',
        block: 'counter-card',
      },
      interactive: false,
      kind: 'binding-source',
      name: 'hero-data',
    });

    expect(payload?.summaryLines).toContain('Target: counter-card.headline');
    expect(
      fs.existsSync(
        path.join(projectDir, 'src', 'bindings', 'hero-data', 'server.php'),
      ),
    ).toBe(true);
    const blockJson = JSON.parse(
      fs.readFileSync(
        path.join(projectDir, 'src', 'blocks', 'counter-card', 'block.json'),
        'utf8',
      ),
    );
    expect(blockJson.attributes.headline).toEqual({ type: 'string' });
  }, 15_000);

  test('passes block style and transform flags through the add bridge', async () => {
    const projectDir = path.join(tempRoot, 'demo-add-style-transform');

    await scaffoldOfficialWorkspace(projectDir);
    linkWorkspaceNodeModules(projectDir);
    await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {
        template: 'basic',
      },
      interactive: false,
      kind: 'block',
      name: 'counter-card',
    });
    await expect(
      executeAddCommand({
        cwd: projectDir,
        emitOutput: false,
        flags: {},
        interactive: false,
        kind: 'style',
        name: 'callout-emphasis',
      }),
    ).rejects.toThrow('`wp-typia add style` requires --block <block-slug>.');

    const stylePayload = await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {
        block: 'counter-card',
      },
      interactive: false,
      kind: 'style',
      name: 'callout-emphasis',
    });
    const transformPayload = await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {
        from: 'core/quote',
        to: 'counter-card',
      },
      interactive: false,
      kind: 'transform',
      name: 'quote-to-counter',
    });

    expect(stylePayload?.summaryLines).toContain(
      'Block style: callout-emphasis',
    );
    expect(transformPayload?.summaryLines).toContain(
      'Block transform: quote-to-counter',
    );
    expect(transformPayload?.summaryLines).toContain('From: core/quote');
    expect(transformPayload?.summaryLines).toContain(
      'To: demo-space/counter-card',
    );
    expect(
      fs.existsSync(
        path.join(
          projectDir,
          'src',
          'blocks',
          'counter-card',
          'styles',
          'callout-emphasis.ts',
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          projectDir,
          'src',
          'blocks',
          'counter-card',
          'transforms',
          'quote-to-counter.ts',
        ),
      ),
    ).toBe(true);
  }, 15_000);

  test('interactive add block can select a template when --template is omitted', async () => {
    const projectDir = path.join(
      tempRoot,
      'demo-add-interactive-template-prompt',
    );
    const selectedPrompts: string[] = [];
    const prompt: ReadlinePrompt = {
      close() {},
      async select<T extends string>(
        message: string,
        options: Array<{ value: T }>,
      ) {
        selectedPrompts.push(message);
        expect(options.map((option) => String(option.value))).toEqual([
          'basic',
          'interactivity',
          'persistence',
          'compound',
        ]);
        return 'compound' as T;
      },
      async text() {
        throw new Error('text() should not be called for template selection');
      },
    };

    await scaffoldOfficialWorkspace(projectDir);
    linkWorkspaceNodeModules(projectDir);

    const payload = await executeAddCommand({
      cwd: projectDir,
      emitOutput: false,
      flags: {},
      interactive: true,
      kind: 'block',
      name: 'faq-stack',
      prompt,
    });

    expect(selectedPrompts).toEqual(['Select a block template']);
    expect(payload?.summaryLines).toContain('Template family: compound');
    expect(
      fs.existsSync(
        path.join(projectDir, 'src', 'blocks', 'faq-stack', 'children.ts'),
      ),
    ).toBe(true);
  }, 15_000);

  test('every registered add kind currently advertises dry-run support', () => {
    expect(ADD_KIND_IDS.every((kind) => supportsAddKindDryRun(kind))).toBe(
      true,
    );
  });

  test('keeps the canonical add kind order stable', () => {
    expect(ADD_KIND_IDS).toEqual([
      'admin-view',
      'block',
      'variation',
      'style',
      'transform',
      'pattern',
      'binding-source',
      'rest-resource',
      'ability',
      'ai-feature',
      'hooked-block',
      'editor-plugin',
    ]);
  });

  test('derives add subcommands from the canonical add-kind registry', () => {
    expect(
      WP_TYPIA_COMMAND_REGISTRY.find((command) => command.name === 'add')
        ?.subcommands,
    ).toEqual([...ADD_KIND_IDS]);
  });
});
