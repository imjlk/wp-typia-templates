import {
  CLI_DIAGNOSTIC_CODES,
  createCliDiagnosticCodeError,
} from '@wp-typia/project-tools/cli-diagnostics';
import type * as CliAddRuntime from '@wp-typia/project-tools/cli-add';
import type { ReadlinePrompt } from '@wp-typia/project-tools/cli-prompt';

type PrintLine = (line: string) => void;
type AddRuntime = typeof CliAddRuntime;
type AddKindExecutionResultBase = {
  projectDir: string;
};
type ExternalLayerSelectOption = {
  description?: string;
  extends: string[];
  id: string;
};

export type AddFieldName =
  | 'kind'
  | 'name'
  | 'source'
  | 'template'
  | 'block'
  | 'from'
  | 'attribute'
  | 'anchor'
  | 'methods'
  | 'namespace'
  | 'position'
  | 'slot'
  | 'to'
  | 'alternate-render-targets'
  | 'inner-blocks-preset'
  | 'data-storage'
  | 'persistence-policy';

export type AddKindExecutionContext = {
  addRuntime: AddRuntime;
  cwd: string;
  flags: Record<string, unknown>;
  getOrCreatePrompt: () => Promise<ReadlinePrompt>;
  isInteractiveSession: boolean;
  name?: string;
  warnLine: PrintLine;
};

export type AddKindExecutionPlan<
  TResult extends AddKindExecutionResultBase = AddKindExecutionResultBase,
> = {
  execute: (cwd: string) => Promise<TResult>;
  getValues: (result: TResult) => Record<string, string>;
  getWarnings?: (result: TResult) => string[] | undefined;
  warnLine?: PrintLine;
};

type AddKindRegistryEntry<
  TResult extends AddKindExecutionResultBase = AddKindExecutionResultBase,
> = {
  completion: {
    nextSteps: (values: Record<string, string>) => string[];
    summaryLines: (
      values: Record<string, string>,
      projectDir: string,
    ) => string[];
    title: string;
  };
  description: string;
  hiddenStringSubmitFields?: readonly string[];
  nameLabel: string;
  prepareExecution: (
    context: AddKindExecutionContext,
  ) => Promise<AddKindExecutionPlan<TResult>>;
  sortOrder: number;
  supportsDryRun: boolean;
  usage: string;
  visibleFieldNames: (options: {
    template?: string;
  }) => readonly AddFieldName[];
};

type AddAdminViewResult = Awaited<
  ReturnType<AddRuntime['runAddAdminViewCommand']>
>;
type AddAbilityResult = Awaited<ReturnType<AddRuntime['runAddAbilityCommand']>>;
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
type AddBlockStyleResult = Awaited<
  ReturnType<AddRuntime['runAddBlockStyleCommand']>
>;
type AddBlockTransformResult = Awaited<
  ReturnType<AddRuntime['runAddBlockTransformCommand']>
>;
type AddVariationResult = Awaited<
  ReturnType<AddRuntime['runAddVariationCommand']>
>;

type AddKindExecutionResultById = {
  'admin-view': AddAdminViewResult;
  ability: AddAbilityResult;
  'ai-feature': AddAiFeatureResult;
  'binding-source': AddBindingSourceResult;
  block: AddBlockResult;
  'editor-plugin': AddEditorPluginResult;
  'hooked-block': AddHookedBlockResult;
  pattern: AddPatternResult;
  'rest-resource': AddRestResourceResult;
  style: AddBlockStyleResult;
  transform: AddBlockTransformResult;
  variation: AddVariationResult;
};

type AddKindRegistry = {
  [TKey in CliAddRuntime.AddKindId]: AddKindRegistryEntry<
    AddKindExecutionResultById[TKey]
  >;
};

const BLOCK_VISIBLE_FIELD_ORDER = [
  'kind',
  'name',
  'template',
  'alternate-render-targets',
  'inner-blocks-preset',
  'data-storage',
  'persistence-policy',
] as const satisfies ReadonlyArray<AddFieldName>;

function readOptionalStringFlag(
  flags: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = flags[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      `\`--${name}\` requires a value.`,
    );
  }
  return value;
}

function requireAddKindName(
  context: AddKindExecutionContext,
  message: string,
): string {
  if (!context.name) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      message,
    );
  }

  return context.name;
}

function formatExternalLayerSelectHint(
  option: ExternalLayerSelectOption,
): string | undefined {
  const details = [
    option.description,
    option.extends.length > 0
      ? `extends ${option.extends.join(', ')}`
      : undefined,
  ].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  return details.length > 0 ? details.join(' · ') : undefined;
}

function toExternalLayerPromptOptions(options: ExternalLayerSelectOption[]) {
  return options.map((option) => ({
    hint: formatExternalLayerSelectHint(option),
    label: option.id,
    value: option.id,
  }));
}

function defineAddKindRegistryEntry<TResult extends AddKindExecutionResultBase>(
  entry: AddKindRegistryEntry<TResult>,
) {
  return entry;
}

export function isAddPersistenceTemplate(template?: string): boolean {
  return template === 'persistence' || template === 'compound';
}

export const ADD_KIND_REGISTRY = {
  'admin-view': defineAddKindRegistryEntry<AddAdminViewResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/admin-views/${values.adminViewSlug}/ and inc/admin-views/${values.adminViewSlug}.php.`,
        'Run your workspace build or dev command to verify the generated DataViews admin screen.',
      ],
      summaryLines: (values, projectDir) => [
        `Admin view: ${values.adminViewSlug}`,
        ...(values.source ? [`Source: ${values.source}`] : []),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added DataViews admin screen',
    },
    description: 'Add an opt-in DataViews-powered admin screen',
    nameLabel: 'Admin view name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add admin-view` requires <name>. Usage: wp-typia add admin-view <name> [--source <rest-resource:slug>].',
      );
      const source = readOptionalStringFlag(context.flags, 'source');

      return {
        execute: (cwd) =>
          context.addRuntime.runAddAdminViewCommand({
            adminViewName: name,
            cwd,
            source,
          }),
        getValues: (result: AddAdminViewResult) => ({
          adminViewSlug: result.adminViewSlug,
          ...(result.source ? { source: result.source } : {}),
        }),
      };
    },
    sortOrder: 10,
    supportsDryRun: true,
    usage:
      'wp-typia add admin-view <name> [--source <rest-resource:slug>] [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'source'],
  }),
  'binding-source': defineAddKindRegistryEntry<AddBindingSourceResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/bindings/${values.bindingSourceSlug}/server.php and src/bindings/${values.bindingSourceSlug}/editor.ts.`,
        ...(values.blockSlug && values.attributeName
          ? [
              `Review src/blocks/${values.blockSlug}/block.json for the ${values.attributeName} bindable attribute.`,
            ]
          : []),
        'Run your workspace build or dev command to verify the binding source hooks and editor registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Binding source: ${values.bindingSourceSlug}`,
        ...(values.blockSlug && values.attributeName
          ? [`Target: ${values.blockSlug}.${values.attributeName}`]
          : []),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added binding source',
    },
    description: 'Add a shared block bindings source',
    nameLabel: 'Binding source name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>].',
      );
      const blockName = readOptionalStringFlag(context.flags, 'block');
      const attributeName = readOptionalStringFlag(context.flags, 'attribute');
      if (Boolean(blockName) !== Boolean(attributeName)) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add binding-source` requires --block and --attribute to be provided together.',
        );
      }

      return {
        execute: (cwd) =>
          context.addRuntime.runAddBindingSourceCommand({
            attributeName,
            bindingSourceName: name,
            blockName,
            cwd,
          }),
        getValues: (result: AddBindingSourceResult) => ({
          ...(result.attributeName
            ? { attributeName: result.attributeName }
            : {}),
          ...(result.blockSlug ? { blockSlug: result.blockSlug } : {}),
          bindingSourceSlug: result.bindingSourceSlug,
        }),
      };
    },
    sortOrder: 70,
    supportsDryRun: true,
    usage:
      'wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'block', 'attribute'],
  }),
  block: defineAddKindRegistryEntry<AddBlockResult>({
    completion: {
      nextSteps: () => [
        'Review the generated sources under src/blocks/ and the updated scripts/block-config.ts entry.',
        'Run your workspace build or dev command to verify the new scaffolded block family.',
      ],
      summaryLines: (values, projectDir) => [
        `Blocks: ${values.blockSlugs}`,
        `Template family: ${values.templateId}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace block',
    },
    description: 'Add a real block slice',
    hiddenStringSubmitFields: ['external-layer-id', 'external-layer-source'],
    nameLabel: 'Block name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add block` requires <name>. Usage: wp-typia add block <name> [--template <basic|interactivity|persistence|compound>]',
      );
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
      let resolvedTemplateId = readOptionalStringFlag(
        context.flags,
        'template',
      ) as CliAddRuntime.AddBlockTemplateId | undefined;
      if (!resolvedTemplateId && context.isInteractiveSession) {
        const templatePrompt = await context.getOrCreatePrompt();
        resolvedTemplateId = await templatePrompt.select(
          'Select a block template',
          context.addRuntime.ADD_BLOCK_TEMPLATE_IDS.map((templateId) => ({
            hint: `Scaffold the ${templateId} block family`,
            label: templateId,
            value: templateId,
          })),
          1,
        );
      }
      resolvedTemplateId ??= 'basic';

      return {
        execute: (cwd) =>
          context.addRuntime.runAddBlockCommand({
            alternateRenderTargets,
            blockName: name,
            cwd,
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
        getValues: (result: AddBlockResult) => ({
          blockSlugs: result.blockSlugs.join(', '),
          templateId: result.templateId,
        }),
        getWarnings: (result: AddBlockResult) => result.warnings,
        warnLine: context.warnLine,
      };
    },
    sortOrder: 20,
    supportsDryRun: true,
    usage:
      'wp-typia add block <name> [--template <basic|interactivity|persistence|compound>] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--dry-run]',
    visibleFieldNames: ({ template }) =>
      BLOCK_VISIBLE_FIELD_ORDER.filter((fieldName) => {
        if (fieldName === 'alternate-render-targets') {
          return isAddPersistenceTemplate(template);
        }
        if (fieldName === 'inner-blocks-preset') {
          return template === 'compound';
        }
        if (
          fieldName === 'data-storage' ||
          fieldName === 'persistence-policy'
        ) {
          return isAddPersistenceTemplate(template);
        }
        return true;
      }),
  }),
  ability: defineAddKindRegistryEntry<AddAbilityResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/abilities/${values.abilitySlug}/ and inc/abilities/${values.abilitySlug}.php.`,
        'Run `wp-typia sync` or `npm run sync-abilities -- --check` and then your workspace build/dev command to verify the generated workflow ability.',
      ],
      summaryLines: (values, projectDir) => [
        `Ability: ${values.abilitySlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workflow ability',
    },
    description: 'Add a typed server/client workflow ability scaffold',
    nameLabel: 'Ability name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add ability` requires <name>. Usage: wp-typia add ability <name>.',
      );

      return {
        execute: (cwd) =>
          context.addRuntime.runAddAbilityCommand({
            abilityName: name,
            cwd,
          }),
        getValues: (result: AddAbilityResult) => ({
          abilitySlug: result.abilitySlug,
        }),
      };
    },
    sortOrder: 90,
    supportsDryRun: true,
    usage: 'wp-typia add ability <name> [--dry-run]',
    visibleFieldNames: () => ['kind', 'name'],
  }),
  'editor-plugin': defineAddKindRegistryEntry<AddEditorPluginResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/editor-plugins/${values.editorPluginSlug}/.`,
        'Run your workspace build or dev command to verify the new editor plugin registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Editor plugin: ${values.editorPluginSlug}`,
        `Slot: ${values.slot}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added editor plugin',
    },
    description: 'Add a slot-aware document editor extension shell',
    nameLabel: 'Editor plugin name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add editor-plugin` requires <name>. Usage: wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>].',
      );
      const slot = readOptionalStringFlag(context.flags, 'slot');

      return {
        execute: (cwd) =>
          context.addRuntime.runAddEditorPluginCommand({
            cwd,
            editorPluginName: name,
            slot,
          }),
        getValues: (result: AddEditorPluginResult) => ({
          editorPluginSlug: result.editorPluginSlug,
          slot: result.slot,
        }),
      };
    },
    sortOrder: 120,
    supportsDryRun: true,
    usage:
      'wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>] [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'slot'],
  }),
  'hooked-block': defineAddKindRegistryEntry<AddHookedBlockResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/block.json for the new blockHooks entry.`,
        'Run your workspace build or dev command to verify the updated hooked-block metadata.',
      ],
      summaryLines: (values, projectDir) => [
        `Block: ${values.blockSlug}`,
        `Anchor: ${values.anchorBlockName}`,
        `Position: ${values.position}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added blockHooks metadata',
    },
    description: 'Add block.json hook metadata to an existing block',
    nameLabel: 'Target block',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add hooked-block` requires <block-slug>. Usage: wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>.',
      );
      const anchorBlockName = readOptionalStringFlag(context.flags, 'anchor');
      if (!anchorBlockName) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add hooked-block` requires --anchor <anchor-block-name>.',
        );
      }
      const position = readOptionalStringFlag(context.flags, 'position');
      if (!position) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.',
        );
      }

      return {
        execute: (cwd) =>
          context.addRuntime.runAddHookedBlockCommand({
            anchorBlockName,
            blockName: name,
            cwd,
            position,
          }),
        getValues: (result: AddHookedBlockResult) => ({
          anchorBlockName: result.anchorBlockName,
          blockSlug: result.blockSlug,
          position: result.position,
        }),
      };
    },
    sortOrder: 110,
    supportsDryRun: true,
    usage:
      'wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild> [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'anchor', 'position'],
  }),
  pattern: defineAddKindRegistryEntry<AddPatternResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/patterns/${values.patternSlug}.php.`,
        'Run your workspace build or dev command to verify the new pattern registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Pattern: ${values.patternSlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace pattern',
    },
    description: 'Add a PHP block pattern shell',
    nameLabel: 'Pattern name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.',
      );

      return {
        execute: (cwd) =>
          context.addRuntime.runAddPatternCommand({
            cwd,
            patternName: name,
          }),
        getValues: (result: AddPatternResult) => ({
          patternSlug: result.patternSlug,
        }),
      };
    },
    sortOrder: 60,
    supportsDryRun: true,
    usage: 'wp-typia add pattern <name> [--dry-run]',
    visibleFieldNames: () => ['kind', 'name'],
  }),
  style: defineAddKindRegistryEntry<AddBlockStyleResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/styles/${values.styleSlug}.ts.`,
        'Run your workspace build or dev command to verify the new block style registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Block style: ${values.styleSlug}`,
        `Target block: ${values.blockSlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added block style',
    },
    description: 'Add a Block Styles registration to an existing block',
    nameLabel: 'Style name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add style` requires <name>. Usage: wp-typia add style <name> --block <block-slug>.',
      );
      const blockSlug = readOptionalStringFlag(context.flags, 'block');
      if (!blockSlug) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add style` requires --block <block-slug>.',
        );
      }

      return {
        execute: (cwd) =>
          context.addRuntime.runAddBlockStyleCommand({
            blockName: blockSlug,
            cwd,
            styleName: name,
          }),
        getValues: (result: AddBlockStyleResult) => ({
          blockSlug: result.blockSlug,
          styleSlug: result.styleSlug,
        }),
      };
    },
    sortOrder: 40,
    supportsDryRun: true,
    usage: 'wp-typia add style <name> --block <block-slug> [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'block'],
  }),
  transform: defineAddKindRegistryEntry<AddBlockTransformResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/transforms/${values.transformSlug}.ts.`,
        'Run your workspace build or dev command to verify the new block transform registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Block transform: ${values.transformSlug}`,
        `From: ${values.fromBlockName}`,
        `To: ${values.toBlockName}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added block transform',
    },
    description: 'Add a block-to-block transform into a workspace block',
    nameLabel: 'Transform name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add transform` requires <name>. Usage: wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug>.',
      );
      const fromBlockName = readOptionalStringFlag(context.flags, 'from');
      if (!fromBlockName) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add transform` requires --from <namespace/block>.',
        );
      }
      const toBlockName = readOptionalStringFlag(context.flags, 'to');
      if (!toBlockName) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add transform` requires --to <block-slug|namespace/block-slug>.',
        );
      }

      return {
        execute: (cwd) =>
          context.addRuntime.runAddBlockTransformCommand({
            cwd,
            fromBlockName,
            toBlockName,
            transformName: name,
          }),
        getValues: (result: AddBlockTransformResult) => ({
          blockSlug: result.blockSlug,
          fromBlockName: result.fromBlockName,
          toBlockName: result.toBlockName,
          transformSlug: result.transformSlug,
        }),
      };
    },
    sortOrder: 50,
    supportsDryRun: true,
    usage:
      'wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug> [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'from', 'to'],
  }),
  'rest-resource': defineAddKindRegistryEntry<AddRestResourceResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/rest/${values.restResourceSlug}/ and inc/rest/${values.restResourceSlug}.php.`,
        'Run your workspace build or dev command to verify the generated REST resource contract.',
      ],
      summaryLines: (values, projectDir) => [
        `REST resource: ${values.restResourceSlug}`,
        `Namespace: ${values.namespace}`,
        `Methods: ${values.methods}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added plugin-level REST resource',
    },
    description: 'Add a plugin-level typed REST resource',
    nameLabel: 'REST resource name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add rest-resource` requires <name>. Usage: wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create>].',
      );
      const methods = readOptionalStringFlag(context.flags, 'methods');
      const namespace = readOptionalStringFlag(context.flags, 'namespace');

      return {
        execute: (cwd) =>
          context.addRuntime.runAddRestResourceCommand({
            cwd,
            methods,
            namespace,
            restResourceName: name,
          }),
        getValues: (result: AddRestResourceResult) => ({
          methods: result.methods.join(', '),
          namespace: result.namespace,
          restResourceSlug: result.restResourceSlug,
        }),
      };
    },
    sortOrder: 80,
    supportsDryRun: true,
    usage:
      'wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'namespace', 'methods'],
  }),
  'ai-feature': defineAddKindRegistryEntry<AddAiFeatureResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/ai-features/${values.aiFeatureSlug}/ and inc/ai-features/${values.aiFeatureSlug}.php.`,
        'Run `wp-typia sync-rest` and `wp-typia sync ai` or your workspace build/dev command to verify the generated REST artifacts and AI schema.',
      ],
      summaryLines: (values, projectDir) => [
        `AI feature: ${values.aiFeatureSlug}`,
        `Namespace: ${values.namespace}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added server-only AI feature',
    },
    description: 'Add a server-owned WordPress AI feature endpoint',
    nameLabel: 'AI feature name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add ai-feature` requires <name>. Usage: wp-typia add ai-feature <name> [--namespace <vendor/v1>].',
      );
      const namespace = readOptionalStringFlag(context.flags, 'namespace');

      return {
        execute: (cwd) =>
          context.addRuntime.runAddAiFeatureCommand({
            aiFeatureName: name,
            cwd,
            namespace,
          }),
        getValues: (result: AddAiFeatureResult) => ({
          aiFeatureSlug: result.aiFeatureSlug,
          namespace: result.namespace,
        }),
        getWarnings: (result: AddAiFeatureResult) => result.warnings,
        warnLine: context.warnLine,
      };
    },
    sortOrder: 100,
    supportsDryRun: true,
    usage:
      'wp-typia add ai-feature <name> [--namespace <vendor/v1>] [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'namespace'],
  }),
  variation: defineAddKindRegistryEntry<AddVariationResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/variations/${values.variationSlug}.ts.`,
        'Run your workspace build or dev command to pick up the new variation.',
      ],
      summaryLines: (values, projectDir) => [
        `Variation: ${values.variationSlug}`,
        `Target block: ${values.blockSlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace variation',
    },
    description: 'Add a variation to an existing block',
    nameLabel: 'Variation name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add variation` requires <name>. Usage: wp-typia add variation <name> --block <block-slug>',
      );
      const blockSlug = readOptionalStringFlag(context.flags, 'block');
      if (!blockSlug) {
        throw createCliDiagnosticCodeError(
          CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
          '`wp-typia add variation` requires --block <block-slug>.',
        );
      }

      return {
        execute: (cwd) =>
          context.addRuntime.runAddVariationCommand({
            blockName: blockSlug,
            cwd,
            variationName: name,
          }),
        getValues: (result: AddVariationResult) => ({
          blockSlug: result.blockSlug,
          variationSlug: result.variationSlug,
        }),
      };
    },
    sortOrder: 30,
    supportsDryRun: true,
    usage: 'wp-typia add variation <name> --block <block-slug> [--dry-run]',
    visibleFieldNames: () => ['kind', 'name', 'block'],
  }),
} as const satisfies AddKindRegistry;

export type AddKindId = keyof typeof ADD_KIND_REGISTRY;
export type AddKindExecutionPlanFor<TKey extends AddKindId> = Awaited<
  ReturnType<(typeof ADD_KIND_REGISTRY)[TKey]['prepareExecution']>
>;
export const ADD_KIND_IDS = (
  Object.keys(ADD_KIND_REGISTRY) as AddKindId[]
).sort(
  (left, right) =>
    ADD_KIND_REGISTRY[left].sortOrder - ADD_KIND_REGISTRY[right].sortOrder,
);

export function isAddKindId(value?: string): value is AddKindId {
  return (
    typeof value === 'string' &&
    (ADD_KIND_IDS as readonly string[]).includes(value)
  );
}

export async function getAddKindExecutionPlan<TKey extends AddKindId>(
  kind: TKey,
  context: AddKindExecutionContext,
): Promise<AddKindExecutionPlanFor<TKey>> {
  return ADD_KIND_REGISTRY[kind].prepareExecution(context) as Promise<
    AddKindExecutionPlanFor<TKey>
  >;
}

export function buildAddKindCompletionDetails(
  kind: AddKindId,
  options: {
    projectDir: string;
    values: Record<string, string>;
  },
) {
  const descriptor = ADD_KIND_REGISTRY[kind].completion;

  return {
    nextSteps: descriptor.nextSteps(options.values),
    summaryLines: descriptor.summaryLines(options.values, options.projectDir),
    title: descriptor.title,
  };
}

export function formatAddKindList(): string {
  return ADD_KIND_IDS.join(', ');
}

export function formatAddKindUsagePlaceholder(): string {
  return `<${ADD_KIND_IDS.join('|')}>`;
}

export function getAddKindUsage(kind: AddKindId): string {
  return ADD_KIND_REGISTRY[kind].usage;
}

export function supportsAddKindDryRun(kind: AddKindId): boolean {
  return ADD_KIND_REGISTRY[kind].supportsDryRun;
}

export function getAddHiddenStringSubmitFieldNames(kind?: string): string[] {
  const resolvedKind = isAddKindId(kind) ? kind : 'block';
  const entry = ADD_KIND_REGISTRY[resolvedKind];
  const hiddenStringSubmitFields =
    'hiddenStringSubmitFields' in entry
      ? entry.hiddenStringSubmitFields
      : undefined;
  return [...(hiddenStringSubmitFields ?? [])];
}

export function getAddKindOptions() {
  return ADD_KIND_IDS.map((kind) => ({
    description: ADD_KIND_REGISTRY[kind].description,
    name: kind,
    value: kind,
  }));
}

export function getAddNameLabel(kind?: string): string {
  const resolvedKind = isAddKindId(kind) ? kind : 'block';
  return ADD_KIND_REGISTRY[resolvedKind].nameLabel;
}

export function getAddVisibleFieldNames(options: {
  kind?: string;
  template?: string;
}): AddFieldName[] {
  const resolvedKind = isAddKindId(options.kind) ? options.kind : 'block';
  return [
    ...ADD_KIND_REGISTRY[resolvedKind].visibleFieldNames({
      template: options.template,
    }),
  ];
}
