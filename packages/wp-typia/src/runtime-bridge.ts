import type { ReadlinePrompt } from '@wp-typia/project-tools/cli-prompt';
import {
  type AddKindId,
  formatAddKindList,
  formatAddKindUsagePlaceholder,
  isAddKindId,
} from './add-kind-registry';
import { simulateWorkspaceAddDryRun } from './runtime-bridge-add-dry-run';
import type { AlternateBufferCompletionPayload } from './ui/alternate-buffer-lifecycle';
import {
  buildAddCompletionPayload,
  buildAddDryRunPayload,
  buildCreateCompletionPayload,
  buildCreateDryRunPayload,
  buildInitCompletionPayload,
  buildMigrationCompletionPayload,
  formatCreateProgressLine,
  printBlock,
  printCompletionPayload,
  toExternalLayerPromptOptions,
} from './runtime-bridge-output';
import { isInteractiveTerminal } from './runtime-capabilities';
export {
  buildCreateCompletionPayload,
  buildCreateDryRunPayload,
  buildInitCompletionPayload,
  buildMigrationCompletionPayload,
  formatCreateProgressLine,
  printCompletionPayload,
} from './runtime-bridge-output';
export { executeSyncCommand } from './runtime-bridge-sync';

type CreateProgressPayload = {
  detail: string;
  title: string;
};

type CreateExecutionInput = {
  projectDir: string;
  cwd: string;
  emitOutput?: boolean;
  flags: Record<string, unknown>;
  interactive?: boolean;
  onProgress?: (payload: CreateProgressPayload) => void;
  printLine?: PrintLine;
  prompt?: ReadlinePrompt;
  warnLine?: PrintLine;
};

type AddExecutionInput = {
  cwd: string;
  emitOutput?: boolean;
  flags: Record<string, unknown>;
  interactive?: boolean;
  kind?: string;
  name?: string;
  printLine?: PrintLine;
  prompt?: ReadlinePrompt;
  warnLine?: PrintLine;
};

type TemplatesExecutionInput = {
  flags: {
    id?: string;
    subcommand?: string;
  };
};

type InitExecutionInput = {
  cwd: string;
  projectDir?: string;
};

type MigrateExecutionInput = {
  command?: string;
  cwd: string;
  flags: Record<string, unknown>;
  prompt?: ReadlinePrompt;
  renderLine?: (line: string) => void;
};

type PrintLine = (line: string) => void;
type CliCommandId = 'add' | 'create' | 'doctor' | 'init' | 'migrate';

const loadCliAddRuntime = () => import('@wp-typia/project-tools/cli-add');
const loadCliDiagnosticsRuntime = () =>
  import('@wp-typia/project-tools/cli-diagnostics');
const loadCliDoctorRuntime = () => import('@wp-typia/project-tools/cli-doctor');
const loadCliInitRuntime = () => import('@wp-typia/project-tools/cli-init');
const loadCliPromptRuntime = () => import('@wp-typia/project-tools/cli-prompt');
const loadCliScaffoldRuntime = () =>
  import('@wp-typia/project-tools/cli-scaffold');
const loadCliTemplatesRuntime = () =>
  import('@wp-typia/project-tools/cli-templates');
const loadWorkspaceProjectRuntime = () =>
  import('@wp-typia/project-tools/workspace-project');
const loadMigrationsRuntime = () =>
  import('@wp-typia/project-tools/migrations');

type AddRuntime = Awaited<ReturnType<typeof loadCliAddRuntime>>;
type AddBindingSourceResult = Awaited<
  ReturnType<AddRuntime['runAddBindingSourceCommand']>
>;
type AddBlockResult = Awaited<ReturnType<AddRuntime['runAddBlockCommand']>>;
type AddEditorPluginResult = Awaited<
  ReturnType<AddRuntime['runAddEditorPluginCommand']>
>;
type AddAiFeatureResult = Awaited<
  ReturnType<AddRuntime['runAddAiFeatureCommand']>
>;
type AddHookedBlockResult = Awaited<
  ReturnType<AddRuntime['runAddHookedBlockCommand']>
>;
type AddPatternResult = Awaited<ReturnType<AddRuntime['runAddPatternCommand']>>;
type AddRestResourceResult = Awaited<
  ReturnType<AddRuntime['runAddRestResourceCommand']>
>;
type AddVariationResult = Awaited<
  ReturnType<AddRuntime['runAddVariationCommand']>
>;
type RegisteredAddKindPlan<TResult> = {
  buildCompletion: (
    result: TResult,
  ) => ReturnType<typeof buildAddCompletionPayload>;
  execute: (cwd: string) => Promise<TResult>;
  warnLine?: PrintLine;
};
type AddKindHandlerContext = {
  addRuntime: AddRuntime;
  cwd: string;
  dryRun: boolean;
  emitOutput: boolean | undefined;
  flags: Record<string, unknown>;
  getOrCreatePrompt: () => Promise<ReadlinePrompt>;
  isInteractiveSession: boolean;
  name?: string;
  printLine: PrintLine;
  warnLine: PrintLine;
};

async function wrapCliCommandError(command: CliCommandId, error: unknown) {
  const { createCliCommandError } = await loadCliDiagnosticsRuntime();
  return createCliCommandError({ command, error });
}

function shouldWrapCliCommandError(options: {
  emitOutput?: boolean;
  renderLine?: ((line: string) => void) | undefined;
}): boolean {
  if (options.emitOutput === false) {
    return false;
  }

  if (options.renderLine) {
    return false;
  }

  return true;
}

function readOptionalStringFlag(
  flags: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = flags[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`\`--${name}\` requires a value.`);
  }
  return value;
}

function readOptionalLooseStringFlag(
  flags: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = flags[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`\`--${name}\` requires a value.`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pushFlag(argv: string[], name: string, value: unknown): void {
  if (value === undefined || value === null || value === false) {
    return;
  }
  if (value === true) {
    argv.push(`--${name}`);
    return;
  }
  argv.push(`--${name}`, String(value));
}

function requireAddKindName(
  context: AddKindHandlerContext,
  message: string,
): string {
  if (!context.name) {
    throw new Error(message);
  }

  return context.name;
}

function runRegisteredAddKind<TResult>(
  context: AddKindHandlerContext,
  plan: RegisteredAddKindPlan<TResult>,
): Promise<AlternateBufferCompletionPayload | void> {
  return executeWorkspaceAddWithOptionalDryRun({
    buildCompletion: plan.buildCompletion,
    cwd: context.cwd,
    dryRun: context.dryRun,
    emitOutput: context.emitOutput,
    execute: plan.execute,
    printLine: context.printLine,
    warnLine: plan.warnLine,
  });
}

const ADD_KIND_EXECUTION_REGISTRY: Record<
  AddKindId,
  (
    context: AddKindHandlerContext,
  ) => Promise<AlternateBufferCompletionPayload | void>
> = {
  'binding-source': async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name>.',
    );

    return runRegisteredAddKind<AddBindingSourceResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'binding-source',
          projectDir: result.projectDir,
          values: {
            bindingSourceSlug: result.bindingSourceSlug,
          },
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddBindingSourceCommand({
          bindingSourceName: name,
          cwd: targetCwd,
        }),
    });
  },
  block: async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add block` requires <name>. Usage: wp-typia add block <name> [--template <basic|interactivity|persistence|compound>]',
    );

    if (!context.flags.template && context.isInteractiveSession) {
      throw new Error(
        '`wp-typia add block` requires --template <basic|interactivity|persistence|compound> in interactive terminals. Non-interactive runs default to --template basic.',
      );
    }

    const externalLayerId = readOptionalStringFlag(
      context.flags,
      'external-layer-id',
    );
    const externalLayerSource = readOptionalStringFlag(
      context.flags,
      'external-layer-source',
    );
    const shouldPromptForLayerSelection =
      Boolean(externalLayerSource) &&
      !Boolean(externalLayerId) &&
      context.isInteractiveSession;
    const selectPrompt = shouldPromptForLayerSelection
      ? await context.getOrCreatePrompt()
      : undefined;
    const alternateRenderTargets = readOptionalStringFlag(
      context.flags,
      'alternate-render-targets',
    );
    const dataStorageMode = readOptionalStringFlag(
      context.flags,
      'data-storage',
    );
    const innerBlocksPreset = readOptionalStringFlag(
      context.flags,
      'inner-blocks-preset',
    );
    const persistencePolicy = readOptionalStringFlag(
      context.flags,
      'persistence-policy',
    );
    const resolvedTemplateId =
      (readOptionalStringFlag(context.flags, 'template') as
        | 'basic'
        | 'interactivity'
        | 'persistence'
        | 'compound'
        | undefined) ?? 'basic';

    return runRegisteredAddKind<AddBlockResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'block',
          projectDir: result.projectDir,
          values: {
            blockSlugs: result.blockSlugs.join(', '),
            templateId: result.templateId,
          },
          warnings: result.warnings,
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddBlockCommand({
          alternateRenderTargets,
          blockName: name,
          cwd: targetCwd,
          dataStorageMode,
          externalLayerId,
          externalLayerSource,
          innerBlocksPreset,
          persistencePolicy,
          selectExternalLayerId: selectPrompt
            ? (options) =>
                selectPrompt.select(
                  'Select an external layer',
                  toExternalLayerPromptOptions(options),
                  1,
                )
            : undefined,
          templateId: resolvedTemplateId,
        }),
      warnLine: context.warnLine,
    });
  },
  'editor-plugin': async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add editor-plugin` requires <name>. Usage: wp-typia add editor-plugin <name> [--slot <PluginSidebar>].',
    );
    const slot = readOptionalStringFlag(context.flags, 'slot');

    return runRegisteredAddKind<AddEditorPluginResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'editor-plugin',
          projectDir: result.projectDir,
          values: {
            editorPluginSlug: result.editorPluginSlug,
            slot: result.slot,
          },
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddEditorPluginCommand({
          cwd: targetCwd,
          editorPluginName: name,
          slot,
        }),
    });
  },
  'ai-feature': async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add ai-feature` requires <name>. Usage: wp-typia add ai-feature <name> [--namespace <vendor/v1>].',
    );
    const namespace = readOptionalStringFlag(context.flags, 'namespace');

    return runRegisteredAddKind<AddAiFeatureResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'ai-feature',
          projectDir: result.projectDir,
          values: {
            aiFeatureSlug: result.aiFeatureSlug,
            namespace: result.namespace,
          },
          warnings: result.warnings,
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddAiFeatureCommand({
          aiFeatureName: name,
          cwd: targetCwd,
          namespace,
        }),
    });
  },
  'hooked-block': async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add hooked-block` requires <block-slug>. Usage: wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>.',
    );
    const anchorBlockName = readOptionalStringFlag(context.flags, 'anchor');
    if (!anchorBlockName) {
      throw new Error(
        '`wp-typia add hooked-block` requires --anchor <anchor-block-name>.',
      );
    }
    const position = readOptionalStringFlag(context.flags, 'position');
    if (!position) {
      throw new Error(
        '`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.',
      );
    }

    return runRegisteredAddKind<AddHookedBlockResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'hooked-block',
          projectDir: result.projectDir,
          values: {
            anchorBlockName: result.anchorBlockName,
            blockSlug: result.blockSlug,
            position: result.position,
          },
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddHookedBlockCommand({
          anchorBlockName,
          blockName: name,
          cwd: targetCwd,
          position,
        }),
    });
  },
  pattern: async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.',
    );

    return runRegisteredAddKind<AddPatternResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'pattern',
          projectDir: result.projectDir,
          values: {
            patternSlug: result.patternSlug,
          },
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddPatternCommand({
          cwd: targetCwd,
          patternName: name,
        }),
    });
  },
  'rest-resource': async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add rest-resource` requires <name>. Usage: wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create>].',
    );
    const methods = readOptionalStringFlag(context.flags, 'methods');
    const namespace = readOptionalStringFlag(context.flags, 'namespace');

    return runRegisteredAddKind<AddRestResourceResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'rest-resource',
          projectDir: result.projectDir,
          values: {
            methods: result.methods.join(', '),
            namespace: result.namespace,
            restResourceSlug: result.restResourceSlug,
          },
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddRestResourceCommand({
          cwd: targetCwd,
          methods,
          namespace,
          restResourceName: name,
        }),
    });
  },
  variation: async (context) => {
    const name = requireAddKindName(
      context,
      '`wp-typia add variation` requires <name>. Usage: wp-typia add variation <name> --block <block-slug>',
    );
    const blockSlug = readOptionalStringFlag(context.flags, 'block');
    if (!blockSlug) {
      throw new Error(
        '`wp-typia add variation` requires --block <block-slug>.',
      );
    }

    return runRegisteredAddKind<AddVariationResult>(context, {
      buildCompletion: (result) =>
        buildAddCompletionPayload({
          kind: 'variation',
          projectDir: result.projectDir,
          values: {
            blockSlug: result.blockSlug,
            variationSlug: result.variationSlug,
          },
        }),
      execute: (targetCwd) =>
        context.addRuntime.runAddVariationCommand({
          blockName: blockSlug,
          cwd: targetCwd,
          variationName: name,
        }),
    });
  },
};

async function executeWorkspaceAddWithOptionalDryRun<TResult>(options: {
  buildCompletion: (
    result: TResult,
  ) => ReturnType<typeof buildAddCompletionPayload>;
  cwd: string;
  dryRun: boolean;
  emitOutput: boolean | undefined;
  execute: (cwd: string) => Promise<TResult>;
  printLine: PrintLine;
  warnLine?: PrintLine;
}): Promise<AlternateBufferCompletionPayload | void> {
  const simulated = options.dryRun
    ? await simulateWorkspaceAddDryRun({
        cwd: options.cwd,
        execute: options.execute,
      })
    : null;
  const result = simulated?.result ?? (await options.execute(options.cwd));
  const completion = options.buildCompletion(result);

  if (!options.dryRun) {
    return emitCompletion(completion, {
      emitOutput: options.emitOutput ?? true,
      printLine: options.printLine,
      warnLine: options.warnLine,
    });
  }

  return emitCompletion(
    buildAddDryRunPayload({
      completion,
      fileOperations: simulated!.fileOperations,
    }),
    {
      emitOutput: options.emitOutput ?? true,
      printLine: options.printLine,
      warnLine: options.warnLine,
    },
  );
}

const PACKAGE_MANAGER_PROMPT_OPTIONS = [
  { label: 'npm', value: 'npm', hint: 'Use npm' },
  { label: 'pnpm', value: 'pnpm', hint: 'Use pnpm' },
  { label: 'yarn', value: 'yarn', hint: 'Use yarn' },
  { label: 'bun', value: 'bun', hint: 'Use bun' },
] as const;

const DATA_STORAGE_PROMPT_OPTIONS = [
  {
    label: 'custom-table',
    value: 'custom-table',
    hint: 'Dedicated custom table storage',
  },
  { label: 'post-meta', value: 'post-meta', hint: 'Persist through post meta' },
] as const;

const PERSISTENCE_POLICY_PROMPT_OPTIONS = [
  {
    label: 'authenticated',
    value: 'authenticated',
    hint: 'Authenticated write policy',
  },
  { label: 'public', value: 'public', hint: 'Public token policy' },
] as const;

const BOOLEAN_PROMPT_OPTIONS = [
  { label: 'Yes', value: 'yes', hint: 'Enable this option' },
  { label: 'No', value: 'no', hint: 'Keep the default disabled state' },
] as const;

function emitCompletion(
  payload: AlternateBufferCompletionPayload,
  options: {
    emitOutput: boolean;
    printLine: PrintLine;
    warnLine?: PrintLine;
  },
): AlternateBufferCompletionPayload {
  if (options.emitOutput) {
    printCompletionPayload(payload, {
      printLine: options.printLine,
      warnLine: options.warnLine,
    });
  }

  return payload;
}

export async function executeCreateCommand({
  projectDir,
  cwd,
  emitOutput = true,
  flags,
  interactive,
  onProgress,
  printLine = console.log as PrintLine,
  prompt,
  warnLine = console.warn as PrintLine,
}: CreateExecutionInput): Promise<AlternateBufferCompletionPayload> {
  const [
    { createReadlinePrompt },
    { runScaffoldFlow },
    { getTemplateSelectOptions },
  ] = await Promise.all([
    loadCliPromptRuntime(),
    loadCliScaffoldRuntime(),
    loadCliTemplatesRuntime(),
  ]);
  const shouldPrompt =
    interactive ?? (!Boolean(flags.yes) && isInteractiveTerminal());
  const activePrompt = shouldPrompt
    ? (prompt ?? createReadlinePrompt())
    : undefined;
  const shouldPromptForExternalLayerSelection =
    Boolean(activePrompt) && activePrompt !== prompt;
  const effectiveYes =
    Boolean(flags.yes) || (Boolean(flags['dry-run']) && !Boolean(activePrompt));

  try {
    const flow = await runScaffoldFlow({
      alternateRenderTargets: readOptionalLooseStringFlag(
        flags,
        'alternate-render-targets',
      ),
      cwd,
      dataStorageMode: readOptionalLooseStringFlag(flags, 'data-storage'),
      dryRun: Boolean(flags['dry-run']),
      externalLayerId: readOptionalLooseStringFlag(flags, 'external-layer-id'),
      externalLayerSource: readOptionalLooseStringFlag(
        flags,
        'external-layer-source',
      ),
      innerBlocksPreset: readOptionalLooseStringFlag(
        flags,
        'inner-blocks-preset',
      ),
      isInteractive: Boolean(activePrompt),
      namespace: readOptionalLooseStringFlag(flags, 'namespace'),
      noInstall: Boolean(flags['no-install']),
      packageManager: readOptionalLooseStringFlag(flags, 'package-manager'),
      persistencePolicy: readOptionalLooseStringFlag(
        flags,
        'persistence-policy',
      ),
      phpPrefix: readOptionalLooseStringFlag(flags, 'php-prefix'),
      projectInput: projectDir,
      onProgress: async (progress) => {
        const payload = {
          detail: progress.detail,
          title: progress.title,
        };
        onProgress?.(payload);
        if (emitOutput) {
          printLine(formatCreateProgressLine(payload));
        }
      },
      promptText: activePrompt
        ? (message, defaultValue, validate) =>
            activePrompt.text(message, defaultValue, validate)
        : undefined,
      queryPostType: readOptionalLooseStringFlag(flags, 'query-post-type'),
      selectDataStorage: activePrompt
        ? () =>
            activePrompt.select(
              'Select a data storage mode',
              [...DATA_STORAGE_PROMPT_OPTIONS],
              1,
            )
        : undefined,
      selectExternalLayerId:
        shouldPromptForExternalLayerSelection && activePrompt
          ? (options) =>
              activePrompt.select(
                'Select an external layer',
                toExternalLayerPromptOptions(options),
                1,
              )
          : undefined,
      selectPackageManager: activePrompt
        ? () =>
            activePrompt.select(
              'Select a package manager',
              [...PACKAGE_MANAGER_PROMPT_OPTIONS],
              1,
            )
        : undefined,
      selectPersistencePolicy: activePrompt
        ? () =>
            activePrompt.select(
              'Select a persistence policy',
              [...PERSISTENCE_POLICY_PROMPT_OPTIONS],
              1,
            )
        : undefined,
      selectTemplate: activePrompt
        ? () =>
            activePrompt.select(
              'Select a template',
              getTemplateSelectOptions(),
              1,
            )
        : undefined,
      selectWithMigrationUi: activePrompt
        ? async () =>
            (await activePrompt.select(
              'Enable migration UI support?',
              [...BOOLEAN_PROMPT_OPTIONS],
              2,
            )) === 'yes'
        : undefined,
      selectWithTestPreset: activePrompt
        ? async () =>
            (await activePrompt.select(
              'Include the Playwright test preset?',
              [...BOOLEAN_PROMPT_OPTIONS],
              2,
            )) === 'yes'
        : undefined,
      selectWithWpEnv: activePrompt
        ? async () =>
            (await activePrompt.select(
              'Include a local wp-env preset?',
              [...BOOLEAN_PROMPT_OPTIONS],
              2,
            )) === 'yes'
        : undefined,
      templateId: readOptionalLooseStringFlag(flags, 'template'),
      textDomain: readOptionalLooseStringFlag(flags, 'text-domain'),
      variant: readOptionalLooseStringFlag(flags, 'variant'),
      withMigrationUi: flags['with-migration-ui'] as boolean | undefined,
      withTestPreset: flags['with-test-preset'] as boolean | undefined,
      withWpEnv: flags['with-wp-env'] as boolean | undefined,
      yes: effectiveYes,
    });

    const payload =
      flow.dryRun && flow.plan
        ? buildCreateDryRunPayload({
            packageManager: flow.packageManager,
            plan: flow.plan,
            projectDir: flow.projectDir,
            result: flow.result,
          })
        : buildCreateCompletionPayload(flow);
    return emitCompletion(payload, { emitOutput, printLine, warnLine });
  } catch (error) {
    if (!shouldWrapCliCommandError({ emitOutput })) {
      throw error;
    }
    throw await wrapCliCommandError('create', error);
  } finally {
    if (activePrompt && activePrompt !== prompt) {
      activePrompt.close();
    }
  }
}

export async function executeAddCommand({
  cwd,
  emitOutput = true,
  flags,
  interactive,
  kind,
  name,
  printLine = console.log as PrintLine,
  prompt,
  warnLine = console.warn as PrintLine,
}: AddExecutionInput): Promise<AlternateBufferCompletionPayload | void> {
  let activePrompt: ReadlinePrompt | undefined;
  const dryRun = Boolean(flags['dry-run']);

  try {
    const addRuntime = await loadCliAddRuntime();
    const isInteractiveSession = interactive ?? isInteractiveTerminal();

    if (!kind) {
      if (emitOutput) {
        printLine(addRuntime.formatAddHelpText());
      }
      throw new Error(
        `\`wp-typia add\` requires <kind>. Usage: wp-typia add ${formatAddKindUsagePlaceholder()} ...`,
      );
    }
    if (!isAddKindId(kind)) {
      throw new Error(
        `Unknown add kind "${kind}". Expected one of: ${formatAddKindList()}.`,
      );
    }

    return await ADD_KIND_EXECUTION_REGISTRY[kind]({
      addRuntime,
      cwd,
      dryRun,
      emitOutput,
      flags,
      getOrCreatePrompt: async () => {
        if (activePrompt) {
          return activePrompt;
        }

        const { createReadlinePrompt } = await loadCliPromptRuntime();
        activePrompt = prompt ?? createReadlinePrompt();
        return activePrompt;
      },
      isInteractiveSession,
      name,
      printLine,
      warnLine,
    });
  } catch (error) {
    if (!shouldWrapCliCommandError({ emitOutput })) {
      throw error;
    }
    throw await wrapCliCommandError('add', error);
  } finally {
    if (activePrompt && activePrompt !== prompt) {
      activePrompt.close();
    }
  }
}

export async function executeTemplatesCommand(
  { flags }: TemplatesExecutionInput,
  printLine: PrintLine = console.log,
): Promise<void> {
  const {
    formatTemplateDetails,
    formatTemplateFeatures,
    formatTemplateSummary,
    getTemplateById,
    listTemplates,
  } = await loadCliTemplatesRuntime();
  const subcommand = flags.subcommand ?? 'list';

  if (subcommand === 'list') {
    for (const template of listTemplates()) {
      printBlock(
        [formatTemplateSummary(template), formatTemplateFeatures(template)],
        printLine,
      );
    }
    return;
  }

  if (subcommand === 'inspect') {
    if (!flags.id) {
      throw new Error('`wp-typia templates inspect` requires <template-id>.');
    }
    const template = getTemplateById(flags.id);
    if (!template) {
      throw new Error(`Unknown template "${flags.id}".`);
    }
    printBlock([formatTemplateDetails(template)], printLine);
    return;
  }

  throw new Error(
    `Unknown templates subcommand "${subcommand}". Expected list or inspect.`,
  );
}

export async function executeInitCommand(
  { cwd, projectDir }: InitExecutionInput,
  options: {
    emitOutput?: boolean;
    printLine?: PrintLine;
    warnLine?: PrintLine;
  } = {},
) {
  try {
    const { getInitPlan } = await loadCliInitRuntime();
    const resolvedProjectDir = projectDir
      ? (await import('node:path')).resolve(cwd, projectDir)
      : cwd;
    const plan = getInitPlan(resolvedProjectDir);
    const completion = buildInitCompletionPayload(plan);

    if (options.emitOutput ?? true) {
      printCompletionPayload(completion, {
        printLine: options.printLine,
        warnLine: options.warnLine,
      });
    }

    return plan;
  } catch (error) {
    throw await wrapCliCommandError('init', error);
  }
}

export async function executeDoctorCommand(cwd: string): Promise<void> {
  try {
    const { runDoctor } = await loadCliDoctorRuntime();
    await runDoctor(cwd);
  } catch (error) {
    throw await wrapCliCommandError('doctor', error);
  }
}

export async function loadAddWorkspaceBlockOptions(cwd: string) {
  const { tryResolveWorkspaceProject } = await loadWorkspaceProjectRuntime();
  const workspace = tryResolveWorkspaceProject(cwd);
  if (!workspace) {
    return [];
  }

  const { getWorkspaceBlockSelectOptions } = await loadCliAddRuntime();
  return getWorkspaceBlockSelectOptions(workspace.projectDir);
}

export async function executeMigrateCommand({
  command,
  cwd,
  flags,
  prompt,
  renderLine,
}: MigrateExecutionInput): Promise<AlternateBufferCompletionPayload | void> {
  const { formatMigrationHelpText, parseMigrationArgs, runMigrationCommand } =
    await loadMigrationsRuntime();
  if (!command) {
    console.log(formatMigrationHelpText());
    return;
  }

  try {
    const argv = [command];
    pushFlag(argv, 'all', flags.all);
    pushFlag(argv, 'force', flags.force);
    pushFlag(
      argv,
      'current-migration-version',
      readOptionalLooseStringFlag(flags, 'current-migration-version'),
    );
    pushFlag(
      argv,
      'migration-version',
      readOptionalLooseStringFlag(flags, 'migration-version'),
    );
    pushFlag(
      argv,
      'from-migration-version',
      readOptionalLooseStringFlag(flags, 'from-migration-version'),
    );
    pushFlag(
      argv,
      'to-migration-version',
      readOptionalLooseStringFlag(flags, 'to-migration-version'),
    );
    pushFlag(
      argv,
      'iterations',
      readOptionalLooseStringFlag(flags, 'iterations'),
    );
    pushFlag(argv, 'seed', readOptionalLooseStringFlag(flags, 'seed'));

    const parsed = parseMigrationArgs(argv);
    const lines: string[] | null = renderLine ? [] : null;
    const captureLine = (line: string) => {
      lines?.push(line);
      if (renderLine) {
        renderLine(line);
        return;
      }
      console.log(line);
    };
    const result = await runMigrationCommand(parsed, cwd, {
      prompt,
      renderLine: captureLine,
    });
    if (renderLine) {
      return result &&
        typeof result === 'object' &&
        'cancelled' in result &&
        result.cancelled === true
        ? undefined
        : buildMigrationCompletionPayload({
            command: parsed.command ?? 'plan',
            lines: lines ?? [],
          });
    }

    if (
      result &&
      typeof result === 'object' &&
      'cancelled' in result &&
      result.cancelled === true
    ) {
      return;
    }
  } catch (error) {
    if (!shouldWrapCliCommandError({ renderLine })) {
      throw error;
    }
    throw await wrapCliCommandError('migrate', error);
  }
}

export async function listTemplatesForRuntime() {
  const { listTemplates } = await loadCliTemplatesRuntime();
  return listTemplates();
}
