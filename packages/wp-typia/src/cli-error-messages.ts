import { formatAddKindUsagePlaceholder } from './add-kind-ids';

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

export function shouldPrintMissingAddKindHelp(options: {
  emitOutput?: boolean;
  format?: unknown;
}): boolean {
  if (typeof options.emitOutput === 'boolean') {
    return options.emitOutput;
  }

  return options.format !== 'json';
}

export function buildMissingCreateProjectDirDetailLines(): string[] {
  return [...MISSING_CREATE_PROJECT_DIR_DETAIL_LINES];
}
