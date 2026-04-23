import fs from 'node:fs';
import path from 'node:path';

import packageJson from '../package.json';
import { formatPackageExecCommand } from '@wp-typia/project-tools/package-managers';
import {
  buildAddKindCompletionDetails,
  type AddKindId,
} from './add-kind-registry';
import type { AlternateBufferCompletionPayload } from './ui/alternate-buffer-lifecycle';
import {
  formatOutputMarker,
  type OutputMarkerOptions,
  stripLeadingOutputMarker,
} from './output-markers';

type PrintLine = (line: string) => void;
type PackageManagerId = 'bun' | 'npm' | 'pnpm' | 'yarn';

export type CreateProgressPayload = {
  detail: string;
  title: string;
};

type ExternalLayerSelectOption = {
  description?: string;
  extends: string[];
  id: string;
};

/**
 * Prints a formatted alternate-buffer completion payload to the provided writers.
 *
 * @param payload Structured completion payload to render.
 * @param options Optional line printers for normal output and warnings.
 * @returns Nothing.
 */
export function printCompletionPayload(
  payload: AlternateBufferCompletionPayload,
  options: {
    markerOptions?: OutputMarkerOptions;
    printLine?: PrintLine;
    warnLine?: PrintLine;
  } = {},
): void {
  const printLine = options.printLine ?? (console.log as PrintLine);
  const warnLine = options.warnLine ?? printLine;

  for (const line of payload.preambleLines ?? []) {
    printLine(line);
  }
  for (const warning of payload.warningLines ?? []) {
    warnLine(formatOutputMarker('warning', warning, options.markerOptions));
  }

  const hasDetails =
    (payload.summaryLines?.length ?? 0) > 0 ||
    (payload.nextSteps?.length ?? 0) > 0 ||
    (payload.optionalLines?.length ?? 0) > 0 ||
    Boolean(payload.optionalNote);
  const hasLeadingContext =
    (payload.preambleLines?.length ?? 0) > 0 ||
    (payload.warningLines?.length ?? 0) > 0;

  printLine(
    hasLeadingContext && hasDetails ? `\n${payload.title}` : payload.title,
  );
  for (const line of payload.summaryLines ?? []) {
    printLine(line);
  }
  if ((payload.nextSteps?.length ?? 0) > 0) {
    printLine('Next steps:');
    for (const step of payload.nextSteps ?? []) {
      printLine(`  ${step}`);
    }
  }
  if ((payload.optionalLines?.length ?? 0) > 0) {
    printLine(`\n${payload.optionalTitle ?? 'Optional:'}`);
    for (const step of payload.optionalLines ?? []) {
      printLine(`  ${step}`);
    }
  }
  if (payload.optionalNote) {
    printLine(`Note: ${payload.optionalNote}`);
  }
}

/**
 * Formats a lightweight create-progress line for fallback CLI output.
 *
 * @param payload User-facing scaffold progress payload.
 * @returns A single readable status line.
 */
export function formatCreateProgressLine(
  payload: CreateProgressPayload,
  markerOptions?: OutputMarkerOptions,
): string {
  return formatOutputMarker(
    'progress',
    `${payload.title}: ${payload.detail}`,
    markerOptions,
  );
}

/**
 * Builds the completion payload shown after a create flow succeeds.
 *
 * @param flow Resolved create-flow data including onboarding steps and warnings.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildCreateCompletionPayload(
  flow: {
    nextSteps: string[];
    optionalOnboarding: {
      note: string;
      steps: string[];
    };
    packageManager: string;
    projectDir: string;
    result: {
      selectedVariant?: string | null;
      variables: {
        title: string;
      };
      warnings: string[];
    };
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  const verificationSteps = [
    formatPackageExecCommand(
      flow.packageManager as 'bun' | 'npm' | 'pnpm' | 'yarn',
      `wp-typia@${packageJson.version}`,
      'doctor',
    ),
    ...flow.optionalOnboarding.steps,
  ];

  return {
    nextSteps: flow.nextSteps,
    optionalLines: verificationSteps,
    optionalNote: flow.optionalOnboarding.note,
    optionalTitle: 'Verify and sync (optional):',
    preambleLines: flow.result.selectedVariant
      ? [`Template variant: ${flow.result.selectedVariant}`]
      : undefined,
    summaryLines: [`Project directory: ${flow.projectDir}`],
    title: formatOutputMarker(
      'success',
      `Created ${flow.result.variables.title} in ${flow.projectDir}`,
      markerOptions,
    ),
    warningLines: flow.result.warnings,
  };
}

/**
 * Builds the completion payload shown after a dry-run create flow succeeds.
 *
 * @param flow Resolved create-flow data including the non-mutating scaffold plan.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildCreateDryRunPayload(
  flow: {
    packageManager: string;
    plan: {
      dependencyInstall: 'skipped-by-flag' | 'would-install';
      files: string[];
    };
    projectDir: string;
    result: {
      selectedVariant?: string | null;
      templateId: string;
      variables: {
        title: string;
      };
      warnings: string[];
    };
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  let dependencyInstallLine: string;
  switch (flow.plan.dependencyInstall) {
    case 'skipped-by-flag':
      dependencyInstallLine =
        'Dependency install: already skipped via --no-install';
      break;
    case 'would-install':
      dependencyInstallLine =
        'Dependency install: would run during a real scaffold';
      break;
  }

  return {
    optionalLines: flow.plan.files.map(
      (relativePath) => `write ${relativePath}`,
    ),
    optionalNote:
      'No files were written because --dry-run was enabled. Re-run without --dry-run to materialize this scaffold.',
    optionalTitle: `Planned files (${flow.plan.files.length}):`,
    preambleLines: flow.result.selectedVariant
      ? [`Template variant: ${flow.result.selectedVariant}`]
      : undefined,
    summaryLines: [
      `Project directory: ${flow.projectDir}`,
      `Template: ${flow.result.templateId}`,
      `Package manager: ${flow.packageManager}`,
      dependencyInstallLine,
    ],
    title: formatOutputMarker(
      'dryRun',
      `Dry run for ${flow.result.variables.title} at ${flow.projectDir}`,
      markerOptions,
    ),
    warningLines: flow.result.warnings,
  };
}

function inferProjectPackageManager(projectDir: string): PackageManagerId {
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const manifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        packageManager?: string;
      };
      if (manifest.packageManager?.startsWith('bun@')) return 'bun';
      if (manifest.packageManager?.startsWith('pnpm@')) return 'pnpm';
      if (manifest.packageManager?.startsWith('yarn@')) return 'yarn';
      if (manifest.packageManager?.startsWith('npm@')) return 'npm';
    }
  } catch {}

  if (
    fs.existsSync(path.join(projectDir, 'bun.lock')) ||
    fs.existsSync(path.join(projectDir, 'bun.lockb'))
  ) {
    return 'bun';
  }
  if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (
    fs.existsSync(path.join(projectDir, 'yarn.lock')) ||
    fs.existsSync(path.join(projectDir, '.yarnrc.yml'))
  ) {
    return 'yarn';
  }

  return 'npm';
}

/**
 * Builds the completion payload shown after a migrate command succeeds.
 *
 * @param options Completed migrate command metadata plus rendered lines.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildMigrationCompletionPayload(
  options: {
    command: string;
    lines: string[];
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  const summaryLines = options.lines.filter((line) => line.trim().length > 0);

  return {
    summaryLines,
    title: formatOutputMarker(
      'success',
      `Completed wp-typia migrate ${options.command}`,
      markerOptions,
    ),
  };
}

/**
 * Builds the completion payload shown after an add flow succeeds.
 *
 * @param options Add-flow kind plus normalized values to summarize.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildAddCompletionPayload(
  options: {
    kind: AddKindId;
    packageManager?: PackageManagerId;
    projectDir: string;
    values: Record<string, string>;
    warnings?: string[];
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  const verificationLines = [
    formatPackageExecCommand(
      options.packageManager ?? inferProjectPackageManager(options.projectDir),
      `wp-typia@${packageJson.version}`,
      'doctor',
    ),
  ];
  const verificationNote =
    'Run doctor via your package manager for a quick inventory and generated-artifact check after the add workflow.';
  const completion = buildAddKindCompletionDetails(options.kind, {
    projectDir: options.projectDir,
    values: options.values,
  });

  return {
    nextSteps: completion.nextSteps,
    optionalLines: verificationLines,
    optionalNote: verificationNote,
    optionalTitle: 'Verify workspace health (optional):',
    summaryLines: completion.summaryLines,
    title: formatOutputMarker('success', completion.title, markerOptions),
    warningLines: options.warnings,
  };
}

/**
 * Builds the completion payload shown after a dry-run add flow succeeds.
 *
 * @param options Existing add completion metadata plus the planned file updates.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildAddDryRunPayload(
  options: {
    completion: AlternateBufferCompletionPayload;
    fileOperations: string[];
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  const normalizedTitle = stripLeadingOutputMarker(
    options.completion.title,
    'success',
  ).replace(/^Added\s*/u, '');

  return {
    optionalLines: options.fileOperations,
    optionalNote:
      'No workspace files were changed because --dry-run was enabled. Re-run without --dry-run to apply this add command.',
    optionalTitle: `Planned workspace updates (${options.fileOperations.length}):`,
    preambleLines: options.completion.preambleLines,
    summaryLines: options.completion.summaryLines,
    title: formatOutputMarker(
      'dryRun',
      `Dry run for ${normalizedTitle || 'workspace add command'}`,
      markerOptions,
    ),
    warningLines: options.completion.warningLines,
  };
}

/**
 * Builds the completion payload shown after a dry-run sync preview.
 *
 * @param options Planned sync execution metadata plus the preview command list.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildSyncDryRunPayload(
  options: {
    check: boolean;
    packageManager: PackageManagerId;
    plannedCommands: Array<{
      displayCommand: string;
    }>;
    projectDir: string;
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  return {
    optionalLines: options.plannedCommands.map(
      (command) => command.displayCommand,
    ),
    optionalNote: options.check
      ? 'No sync scripts were executed because --dry-run was enabled. Re-run `wp-typia sync --check` to verify generated artifacts without rewriting them.'
      : 'No sync scripts were executed because --dry-run was enabled. Re-run without --dry-run to apply generated-file updates, or add --check to verify without rewriting.',
    optionalTitle: `Planned sync commands (${options.plannedCommands.length}):`,
    summaryLines: [
      `Project directory: ${options.projectDir}`,
      `Package manager: ${options.packageManager}`,
      options.check
        ? 'Execution mode: would run generated sync scripts in verification mode.'
        : 'Execution mode: would run generated sync scripts in apply mode.',
    ],
    title: formatOutputMarker(
      'dryRun',
      'Dry run for wp-typia sync',
      markerOptions,
    ),
  };
}

/**
 * Prints a block of text lines using a shared line printer.
 *
 * @param lines Lines to print in order.
 * @param printLine Line printer to use.
 * @returns Nothing.
 */
export function printBlock(lines: string[], printLine: PrintLine): void {
  for (const line of lines) {
    printLine(line);
  }
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

/**
 * Converts external layer options into prompt-compatible select items.
 *
 * @param options External layer options returned by the block generator.
 * @returns Prompt select options with labels and hints.
 */
export function toExternalLayerPromptOptions(
  options: ExternalLayerSelectOption[],
) {
  return options.map((option) => ({
    hint: formatExternalLayerSelectHint(option),
    label: option.id,
    value: option.id,
  }));
}
