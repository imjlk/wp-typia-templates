import { ADD_KIND_IDS, type AddKindId } from './add-kind-ids';
import { abilityAddKindEntry } from './add-kinds/ability';
import { adminViewAddKindEntry } from './add-kinds/admin-view';
import { aiFeatureAddKindEntry } from './add-kinds/ai-feature';
import { bindingSourceAddKindEntry } from './add-kinds/binding-source';
import { blockAddKindEntry } from './add-kinds/block';
import { editorPluginAddKindEntry } from './add-kinds/editor-plugin';
import { hookedBlockAddKindEntry } from './add-kinds/hooked-block';
import { patternAddKindEntry } from './add-kinds/pattern';
import { restResourceAddKindEntry } from './add-kinds/rest-resource';
import { styleAddKindEntry } from './add-kinds/style';
import { transformAddKindEntry } from './add-kinds/transform';
import { variationAddKindEntry } from './add-kinds/variation';
import type {
  AddFieldName,
  AddKindExecutionContext,
  AddKindRegistry,
} from './add-kind-registry-shared';

export { ADD_KIND_IDS } from './add-kind-ids';
export type { AddKindId } from './add-kind-ids';
export {
  formatAddKindList,
  formatAddKindUsagePlaceholder,
} from './add-kind-ids';
export { isAddPersistenceTemplate } from './add-kind-registry-shared';
export type {
  AddFieldName,
  AddKindExecutionContext,
  AddKindExecutionPlan,
  AddKindExecutionResultBase,
} from './add-kind-registry-shared';

export const ADD_KIND_REGISTRY = {
  'admin-view': adminViewAddKindEntry,
  block: blockAddKindEntry,
  variation: variationAddKindEntry,
  style: styleAddKindEntry,
  transform: transformAddKindEntry,
  pattern: patternAddKindEntry,
  'binding-source': bindingSourceAddKindEntry,
  'rest-resource': restResourceAddKindEntry,
  ability: abilityAddKindEntry,
  'ai-feature': aiFeatureAddKindEntry,
  'hooked-block': hookedBlockAddKindEntry,
  'editor-plugin': editorPluginAddKindEntry,
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
