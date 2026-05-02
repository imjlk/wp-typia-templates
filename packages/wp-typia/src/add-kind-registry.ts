import {
  CLI_DIAGNOSTIC_CODES,
  createCliDiagnosticCodeError,
} from '@wp-typia/project-tools/cli-diagnostics';
import type * as CliAddRuntime from '@wp-typia/project-tools/cli-add';
import type { ReadlinePrompt } from '@wp-typia/project-tools/cli-prompt';
import { ADD_KIND_IDS, type AddKindId } from './add-kind-ids';
import {
  readOptionalPairedStrictStringFlags,
  readOptionalStrictStringFlag,
  requireStrictStringFlag,
} from './cli-string-flags';
import {
  toExternalLayerPromptOptions,
  type ExternalLayerSelectOption,
} from './external-layer-prompt-options';
import type { PrintLine } from './print-line';

export { ADD_KIND_IDS } from './add-kind-ids';
export type { AddKindId } from './add-kind-ids';

type AddRuntime = typeof CliAddRuntime;
type AddKindExecutionResultBase = {
  projectDir: string;
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
const NAME_ONLY_VISIBLE_FIELDS = [
  'kind',
  'name',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_SOURCE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'source',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_BLOCK_ATTRIBUTE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'block',
  'attribute',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_BLOCK_VISIBLE_FIELDS = [
  'kind',
  'name',
  'block',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_SLOT_VISIBLE_FIELDS = [
  'kind',
  'name',
  'slot',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_ANCHOR_POSITION_VISIBLE_FIELDS = [
  'kind',
  'name',
  'anchor',
  'position',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_FROM_TO_VISIBLE_FIELDS = [
  'kind',
  'name',
  'from',
  'to',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_NAMESPACE_METHODS_VISIBLE_FIELDS = [
  'kind',
  'name',
  'namespace',
  'methods',
] as const satisfies ReadonlyArray<AddFieldName>;
const NAME_NAMESPACE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'namespace',
] as const satisfies ReadonlyArray<AddFieldName>;

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

function defineAddKindRegistryEntry<TResult extends AddKindExecutionResultBase>(
  entry: AddKindRegistryEntry<TResult>,
) {
  return entry;
}

function createNamedExecutionPlan<TResult extends AddKindExecutionResultBase>(
  context: AddKindExecutionContext,
  options: {
    execute: (params: { cwd: string; name: string }) => Promise<TResult>;
    getValues: (result: TResult) => Record<string, string>;
    getWarnings?: (result: TResult) => string[] | undefined;
    missingNameMessage: string;
    name?: string;
    warnLine?: PrintLine;
  },
): AddKindExecutionPlan<TResult> {
  const name =
    options.name ?? requireAddKindName(context, options.missingNameMessage);

  return {
    execute: (cwd) => options.execute({ cwd, name }),
    getValues: options.getValues,
    ...(options.getWarnings ? { getWarnings: options.getWarnings } : {}),
    ...(options.warnLine ? { warnLine: options.warnLine } : {}),
  };
}

export function isAddPersistenceTemplate(template?: string): boolean {
  return template === 'persistence' || template === 'compound';
}

function formatAddBlockTemplateIds(addRuntime: AddRuntime): string {
  return addRuntime.ADD_BLOCK_TEMPLATE_IDS.join(', ');
}

function assertAddBlockTemplateId(
  context: AddKindExecutionContext,
  templateId: string,
): CliAddRuntime.AddBlockTemplateId {
  if (context.addRuntime.isAddBlockTemplateId(templateId)) {
    return templateId;
  }

  if (templateId === 'query-loop') {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
      '`wp-typia add block --template query-loop` is not supported. Query Loop is a create-time `core/query` variation scaffold, so use `wp-typia create <project-dir> --template query-loop` instead.',
    );
  }

  throw createCliDiagnosticCodeError(
    CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
    `Unknown add-block template "${templateId}". Expected one of: ${formatAddBlockTemplateIds(context.addRuntime)}. Run \`wp-typia templates list\` to inspect available templates.`,
  );
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
        '`wp-typia add admin-view` requires <name>. Usage: wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>].',
      );
      const source = readOptionalStrictStringFlag(context.flags, 'source');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddAdminViewCommand({
            adminViewName: name,
            cwd,
            source,
          }),
        getValues: (result) => ({
          adminViewSlug: result.adminViewSlug,
          ...(result.source ? { source: result.source } : {}),
        }),
        missingNameMessage:
          '`wp-typia add admin-view` requires <name>. Usage: wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>].',
        name,
      });
    },
    sortOrder: 10,
    supportsDryRun: true,
    usage:
      'wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>] [--dry-run]',
    visibleFieldNames: () => NAME_SOURCE_VISIBLE_FIELDS,
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
      const [blockName, attributeName] = readOptionalPairedStrictStringFlags(
        context.flags,
        'block',
        'attribute',
        '`wp-typia add binding-source` requires --block and --attribute to be provided together.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddBindingSourceCommand({
            attributeName,
            bindingSourceName: name,
            blockName,
            cwd,
          }),
        getValues: (result) => ({
          ...(result.attributeName
            ? { attributeName: result.attributeName }
            : {}),
          ...(result.blockSlug ? { blockSlug: result.blockSlug } : {}),
          bindingSourceSlug: result.bindingSourceSlug,
        }),
        missingNameMessage:
          '`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>].',
        name,
      });
    },
    sortOrder: 70,
    supportsDryRun: true,
    usage:
      'wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--dry-run]',
    visibleFieldNames: () => NAME_BLOCK_ATTRIBUTE_VISIBLE_FIELDS,
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
      const externalLayerId = readOptionalStrictStringFlag(
        context.flags,
        'external-layer-id',
      );
      const externalLayerSource = readOptionalStrictStringFlag(
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
      const alternateRenderTargets = readOptionalStrictStringFlag(
        context.flags,
        'alternate-render-targets',
      );
      const dataStorageMode = readOptionalStrictStringFlag(
        context.flags,
        'data-storage',
      );
      const innerBlocksPreset = readOptionalStrictStringFlag(
        context.flags,
        'inner-blocks-preset',
      );
      const persistencePolicy = readOptionalStrictStringFlag(
        context.flags,
        'persistence-policy',
      );
      const requestedTemplateId = readOptionalStrictStringFlag(
        context.flags,
        'template',
      );
      let resolvedTemplateId = requestedTemplateId
        ? assertAddBlockTemplateId(context, requestedTemplateId)
        : undefined;
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

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
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
        getValues: (result) => ({
          blockSlugs: result.blockSlugs.join(', '),
          templateId: result.templateId,
        }),
        getWarnings: (result) => result.warnings,
        missingNameMessage:
          '`wp-typia add block` requires <name>. Usage: wp-typia add block <name> [--template <basic|interactivity|persistence|compound>]',
        name,
        warnLine: context.warnLine,
      });
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
      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddAbilityCommand({
            abilityName: name,
            cwd,
          }),
        getValues: (result) => ({
          abilitySlug: result.abilitySlug,
        }),
        missingNameMessage:
          '`wp-typia add ability` requires <name>. Usage: wp-typia add ability <name>.',
      });
    },
    sortOrder: 90,
    supportsDryRun: true,
    usage: 'wp-typia add ability <name> [--dry-run]',
    visibleFieldNames: () => NAME_ONLY_VISIBLE_FIELDS,
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
      const slot = readOptionalStrictStringFlag(context.flags, 'slot');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddEditorPluginCommand({
            cwd,
            editorPluginName: name,
            slot,
          }),
        getValues: (result) => ({
          editorPluginSlug: result.editorPluginSlug,
          slot: result.slot,
        }),
        missingNameMessage:
          '`wp-typia add editor-plugin` requires <name>. Usage: wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>].',
        name,
      });
    },
    sortOrder: 120,
    supportsDryRun: true,
    usage:
      'wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>] [--dry-run]',
    visibleFieldNames: () => NAME_SLOT_VISIBLE_FIELDS,
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
      const anchorBlockName = requireStrictStringFlag(
        context.flags,
        'anchor',
        '`wp-typia add hooked-block` requires --anchor <anchor-block-name>.',
      );
      const position = requireStrictStringFlag(
        context.flags,
        'position',
        '`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddHookedBlockCommand({
            anchorBlockName,
            blockName: name,
            cwd,
            position,
          }),
        getValues: (result) => ({
          anchorBlockName: result.anchorBlockName,
          blockSlug: result.blockSlug,
          position: result.position,
        }),
        missingNameMessage:
          '`wp-typia add hooked-block` requires <block-slug>. Usage: wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>.',
        name,
      });
    },
    sortOrder: 110,
    supportsDryRun: true,
    usage:
      'wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild> [--dry-run]',
    visibleFieldNames: () => NAME_ANCHOR_POSITION_VISIBLE_FIELDS,
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
      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddPatternCommand({
            cwd,
            patternName: name,
          }),
        getValues: (result) => ({
          patternSlug: result.patternSlug,
        }),
        missingNameMessage:
          '`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.',
      });
    },
    sortOrder: 60,
    supportsDryRun: true,
    usage: 'wp-typia add pattern <name> [--dry-run]',
    visibleFieldNames: () => NAME_ONLY_VISIBLE_FIELDS,
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
      const blockSlug = requireStrictStringFlag(
        context.flags,
        'block',
        '`wp-typia add style` requires --block <block-slug>.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddBlockStyleCommand({
            blockName: blockSlug,
            cwd,
            styleName: name,
          }),
        getValues: (result) => ({
          blockSlug: result.blockSlug,
          styleSlug: result.styleSlug,
        }),
        missingNameMessage:
          '`wp-typia add style` requires <name>. Usage: wp-typia add style <name> --block <block-slug>.',
        name,
      });
    },
    sortOrder: 40,
    supportsDryRun: true,
    usage: 'wp-typia add style <name> --block <block-slug> [--dry-run]',
    visibleFieldNames: () => NAME_BLOCK_VISIBLE_FIELDS,
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
      const fromBlockName = requireStrictStringFlag(
        context.flags,
        'from',
        '`wp-typia add transform` requires --from <namespace/block>.',
      );
      const toBlockName = requireStrictStringFlag(
        context.flags,
        'to',
        '`wp-typia add transform` requires --to <block-slug|namespace/block-slug>.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddBlockTransformCommand({
            cwd,
            fromBlockName,
            toBlockName,
            transformName: name,
          }),
        getValues: (result) => ({
          blockSlug: result.blockSlug,
          fromBlockName: result.fromBlockName,
          toBlockName: result.toBlockName,
          transformSlug: result.transformSlug,
        }),
        missingNameMessage:
          '`wp-typia add transform` requires <name>. Usage: wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug>.',
        name,
      });
    },
    sortOrder: 50,
    supportsDryRun: true,
    usage:
      'wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug> [--dry-run]',
    visibleFieldNames: () => NAME_FROM_TO_VISIBLE_FIELDS,
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
      const methods = readOptionalStrictStringFlag(context.flags, 'methods');
      const namespace = readOptionalStrictStringFlag(context.flags, 'namespace');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddRestResourceCommand({
            cwd,
            methods,
            namespace,
            restResourceName: name,
          }),
        getValues: (result) => ({
          methods: result.methods.join(', '),
          namespace: result.namespace,
          restResourceSlug: result.restResourceSlug,
        }),
        missingNameMessage:
          '`wp-typia add rest-resource` requires <name>. Usage: wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create>].',
        name,
      });
    },
    sortOrder: 80,
    supportsDryRun: true,
    usage:
      'wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] [--dry-run]',
    visibleFieldNames: () => NAME_NAMESPACE_METHODS_VISIBLE_FIELDS,
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
      const namespace = readOptionalStrictStringFlag(context.flags, 'namespace');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddAiFeatureCommand({
            aiFeatureName: name,
            cwd,
            namespace,
          }),
        getValues: (result) => ({
          aiFeatureSlug: result.aiFeatureSlug,
          namespace: result.namespace,
        }),
        getWarnings: (result) => result.warnings,
        missingNameMessage:
          '`wp-typia add ai-feature` requires <name>. Usage: wp-typia add ai-feature <name> [--namespace <vendor/v1>].',
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 100,
    supportsDryRun: true,
    usage:
      'wp-typia add ai-feature <name> [--namespace <vendor/v1>] [--dry-run]',
    visibleFieldNames: () => NAME_NAMESPACE_VISIBLE_FIELDS,
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
      const blockSlug = requireStrictStringFlag(
        context.flags,
        'block',
        '`wp-typia add variation` requires --block <block-slug>.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddVariationCommand({
            blockName: blockSlug,
            cwd,
            variationName: name,
          }),
        getValues: (result) => ({
          blockSlug: result.blockSlug,
          variationSlug: result.variationSlug,
        }),
        missingNameMessage:
          '`wp-typia add variation` requires <name>. Usage: wp-typia add variation <name> --block <block-slug>',
        name,
      });
    },
    sortOrder: 30,
    supportsDryRun: true,
    usage: 'wp-typia add variation <name> --block <block-slug> [--dry-run]',
    visibleFieldNames: () => NAME_BLOCK_VISIBLE_FIELDS,
  }),
} as const satisfies AddKindRegistry;

export type AddKindExecutionPlanFor<TKey extends AddKindId> = Awaited<
  ReturnType<(typeof ADD_KIND_REGISTRY)[TKey]['prepareExecution']>
>;

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
