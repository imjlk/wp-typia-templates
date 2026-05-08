import { formatAddKindUsagePlaceholder } from './add-kind-registry';

const MISSING_CREATE_PROJECT_DIR_DETAIL_LINES = [
  '`wp-typia create` requires <project-dir>.',
  '`--dry-run` still needs a logical project directory name because wp-typia derives slugs, package names, and planned file paths from it.',
];

export function formatMissingAddKindDetailLine(): string {
  return `\`wp-typia add\` requires <kind>. Usage: wp-typia add ${formatAddKindUsagePlaceholder()} ...`;
}

export function buildMissingAddKindDetailLines(): string[] {
  return [formatMissingAddKindDetailLine()];
}

export function buildMissingCreateProjectDirDetailLines(): string[] {
  return [...MISSING_CREATE_PROJECT_DIR_DETAIL_LINES];
}
