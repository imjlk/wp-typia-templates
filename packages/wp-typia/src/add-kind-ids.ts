import { ADD_KIND_IDS } from '@wp-typia/project-tools/cli-add-kind-ids';
export { ADD_KIND_IDS } from '@wp-typia/project-tools/cli-add-kind-ids';
export type { AddKindId } from '@wp-typia/project-tools/cli-add-kind-ids';

// Keep display helpers in this leaf module so shared CLI diagnostics do not
// need to import the execution registry and risk future circular dependencies.
export function formatAddKindList(): string {
  return ADD_KIND_IDS.join(', ');
}

export function formatAddKindUsagePlaceholder(): string {
  return `<${ADD_KIND_IDS.join('|')}>`;
}
