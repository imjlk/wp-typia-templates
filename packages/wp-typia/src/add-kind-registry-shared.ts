import {
  CLI_DIAGNOSTIC_CODES,
  createCliDiagnosticCodeError,
} from '@wp-typia/project-tools/cli-diagnostics';
import type * as CliAddRuntime from '@wp-typia/project-tools/cli-add';
import type { ReadlinePrompt } from '@wp-typia/project-tools/cli-prompt';
import type { AddKindId } from './add-kind-ids';
import type { PrintLine } from './print-line';

export type AddRuntime = typeof CliAddRuntime;
export type AddKindExecutionResultBase = {
  projectDir: string;
};

export type AddFieldName =
  | 'kind'
  | 'name'
  | 'source'
  | 'type'
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

export type AddKindRegistryEntry<
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

export type AddAdminViewResult = Awaited<
  ReturnType<AddRuntime['runAddAdminViewCommand']>
>;
export type AddAbilityResult = Awaited<
  ReturnType<AddRuntime['runAddAbilityCommand']>
>;
export type AddBindingSourceResult = Awaited<
  ReturnType<AddRuntime['runAddBindingSourceCommand']>
>;
export type AddContractResult = Awaited<
  ReturnType<AddRuntime['runAddContractCommand']>
>;
export type AddBlockResult = Awaited<ReturnType<AddRuntime['runAddBlockCommand']>>;
export type AddEditorPluginResult = Awaited<
  ReturnType<AddRuntime['runAddEditorPluginCommand']>
>;
export type AddIntegrationEnvResult = Awaited<
  ReturnType<AddRuntime['runAddIntegrationEnvCommand']>
>;
export type AddAiFeatureResult = Awaited<
  ReturnType<AddRuntime['runAddAiFeatureCommand']>
>;
export type AddHookedBlockResult = Awaited<
  ReturnType<AddRuntime['runAddHookedBlockCommand']>
>;
export type AddPatternResult = Awaited<
  ReturnType<AddRuntime['runAddPatternCommand']>
>;
export type AddRestResourceResult = Awaited<
  ReturnType<AddRuntime['runAddRestResourceCommand']>
>;
export type AddBlockStyleResult = Awaited<
  ReturnType<AddRuntime['runAddBlockStyleCommand']>
>;
export type AddBlockTransformResult = Awaited<
  ReturnType<AddRuntime['runAddBlockTransformCommand']>
>;
export type AddVariationResult = Awaited<
  ReturnType<AddRuntime['runAddVariationCommand']>
>;

export type AddKindExecutionResultById = {
  'admin-view': AddAdminViewResult;
  ability: AddAbilityResult;
  'ai-feature': AddAiFeatureResult;
  'binding-source': AddBindingSourceResult;
  block: AddBlockResult;
  contract: AddContractResult;
  'editor-plugin': AddEditorPluginResult;
  'hooked-block': AddHookedBlockResult;
  'integration-env': AddIntegrationEnvResult;
  pattern: AddPatternResult;
  'rest-resource': AddRestResourceResult;
  style: AddBlockStyleResult;
  transform: AddBlockTransformResult;
  variation: AddVariationResult;
};

export type AddKindRegistry = {
  [TKey in AddKindId]: AddKindRegistryEntry<
    AddKindExecutionResultById[TKey]
  >;
};

export const BLOCK_VISIBLE_FIELD_ORDER = [
  'kind',
  'name',
  'template',
  'alternate-render-targets',
  'inner-blocks-preset',
  'data-storage',
  'persistence-policy',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_ONLY_VISIBLE_FIELDS = [
  'kind',
  'name',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_SOURCE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'source',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_TYPE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'type',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_BLOCK_ATTRIBUTE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'block',
  'attribute',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_BLOCK_VISIBLE_FIELDS = [
  'kind',
  'name',
  'block',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_SLOT_VISIBLE_FIELDS = [
  'kind',
  'name',
  'slot',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_ANCHOR_POSITION_VISIBLE_FIELDS = [
  'kind',
  'name',
  'anchor',
  'position',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_FROM_TO_VISIBLE_FIELDS = [
  'kind',
  'name',
  'from',
  'to',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_NAMESPACE_METHODS_VISIBLE_FIELDS = [
  'kind',
  'name',
  'namespace',
  'methods',
] as const satisfies ReadonlyArray<AddFieldName>;
export const NAME_NAMESPACE_VISIBLE_FIELDS = [
  'kind',
  'name',
  'namespace',
] as const satisfies ReadonlyArray<AddFieldName>;

export function requireAddKindName(
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

export function defineAddKindRegistryEntry<
  TResult extends AddKindExecutionResultBase,
>(entry: AddKindRegistryEntry<TResult>): AddKindRegistryEntry<TResult> {
  return entry;
}

export function createNamedExecutionPlan<
  TResult extends AddKindExecutionResultBase,
>(
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

function getMistypedAddBlockTemplateMessage(
  addRuntime: AddRuntime,
  templateId: string,
): string | null {
  const suggestion = addRuntime.suggestAddBlockTemplateId(templateId);
  if (!suggestion) {
    return null;
  }

  return `Unknown add-block template "${templateId}". Did you mean "${suggestion}"? Use \`--template ${suggestion}\`, or run \`wp-typia templates list\` to inspect available templates.`;
}

export function assertAddBlockTemplateId(
  context: AddKindExecutionContext,
  templateId: string,
): CliAddRuntime.AddBlockTemplateId {
  if (templateId === 'query-loop') {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
      '`wp-typia add block --template query-loop` is not supported. Query Loop is a create-time `core/query` variation scaffold, so use `wp-typia create <project-dir> --template query-loop` instead.',
    );
  }

  if (context.addRuntime.isAddBlockTemplateId(templateId)) {
    return templateId;
  }

  const mistypedAddBlockTemplateMessage = getMistypedAddBlockTemplateMessage(
    context.addRuntime,
    templateId,
  );
  if (mistypedAddBlockTemplateMessage) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
      mistypedAddBlockTemplateMessage,
    );
  }

  throw createCliDiagnosticCodeError(
    CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
    `Unknown add-block template "${templateId}". Expected one of: ${formatAddBlockTemplateIds(context.addRuntime)}. Run \`wp-typia templates list\` to inspect available templates.`,
  );
}
