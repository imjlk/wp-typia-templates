import packageJson from '../package.json';
import {
  formatPackageExecCommand,
  inferPackageManagerId,
  type PackageManagerId,
} from '@wp-typia/project-tools/package-managers';
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
import type { PrintLine } from './print-line';

export type CreateProgressPayload = {
  detail: string;
  title: string;
};

export type StructuredCompletionSuccessPayload = {
  ok: true;
  data: {
    command: string;
    completion?: SerializableCompletionPayload;
    files?: string[];
  } & Record<string, unknown>;
};

type InitPlanLayoutKind =
  | 'generated-project'
  | 'multi-block'
  | 'official-workspace'
  | 'single-block'
  | 'unsupported';

type StructuredInitPlan = {
  commandMode: 'apply' | 'preview-only';
  detectedLayout: {
    blockNames: string[];
    description: string;
    kind: InitPlanLayoutKind;
  };
  generatedArtifacts: string[];
  nextSteps: string[];
  notes: string[];
  packageChanges: {
    addDevDependencies: Array<{
      action: 'add' | 'update';
      name: string;
      requiredValue: string;
    }>;
    packageManagerField?: {
      action: 'add' | 'update';
      requiredValue: string;
    };
    scripts: Array<{
      action: 'add' | 'update';
      name: string;
      requiredValue: string;
    }>;
  };
  plannedFiles: Array<{
    action: 'add' | 'update';
    path: string;
    purpose: string;
  }>;
  packageManager: PackageManagerId;
  projectDir: string;
  projectName: string;
  status: 'already-initialized' | 'applied' | 'preview';
  summary: string;
};

export type StructuredInitSuccessPayload = {
  ok: true;
  data: {
    command: 'init';
    completion: SerializableCompletionPayload;
    detectedLayout: StructuredInitPlan['detectedLayout'];
    files?: string[];
    mode: 'apply' | 'preview';
    packageManager: PackageManagerId;
    plan: StructuredInitPlan;
    projectDir: string;
    status: StructuredInitPlan['status'];
    summary: string;
  };
};

export type SerializableCompletionPayload = {
  nextSteps?: string[];
  optionalLines?: string[];
  optionalNote?: string;
  optionalTitle?: string;
  preambleLines?: string[];
  summaryLines?: string[];
  title: string;
  warningLines?: string[];
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

function toNonEmptyArray(values: string[] | undefined): string[] | undefined {
  return values && values.length > 0 ? values : undefined;
}

function extractPlannedFiles(
  payload: SerializableCompletionPayload,
): string[] | undefined {
  const files = payload.optionalLines
    ?.map((line) => line.match(/^(?:delete|update|write)\s+(.+)$/u)?.[1])
    .filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );

  return toNonEmptyArray(files);
}

const PROJECT_DIRECTORY_SUMMARY_PREFIX = 'Project directory: ';

/**
 * Reads the normalized workspace path from a completion summary when present.
 *
 * @param completion Completion payload returned by an add/create runtime.
 * @returns The runtime-resolved project directory, or undefined when absent.
 */
export function extractCompletionProjectDir(
  completion: AlternateBufferCompletionPayload | void,
): string | undefined {
  const projectDir = completion?.summaryLines
    ?.find((line) => line.startsWith(PROJECT_DIRECTORY_SUMMARY_PREFIX))
    ?.slice(PROJECT_DIRECTORY_SUMMARY_PREFIX.length)
    .trim();

  return projectDir && projectDir.length > 0 ? projectDir : undefined;
}

/**
 * Converts a completion payload into a JSON-safe shape without terminal markers.
 *
 * @param payload Human-readable completion payload.
 * @returns A marker-free payload suitable for structured CLI success output.
 */
export function serializeCompletionPayload(
  payload: AlternateBufferCompletionPayload,
): SerializableCompletionPayload {
  return {
    nextSteps: toNonEmptyArray(payload.nextSteps),
    optionalLines: toNonEmptyArray(payload.optionalLines),
    optionalNote: payload.optionalNote,
    optionalTitle: payload.optionalTitle,
    preambleLines: toNonEmptyArray(payload.preambleLines),
    summaryLines: toNonEmptyArray(payload.summaryLines),
    title: stripLeadingOutputMarker(payload.title),
    warningLines: toNonEmptyArray(payload.warningLines),
  };
}

/**
 * Wraps structured completion data in the same success envelope used by JSON CLI output.
 *
 * @param command Command name that produced the completion payload.
 * @param completion Completion payload returned by the runtime bridge.
 * @param metadata Additional command-specific fields for automation.
 * @returns JSON-serializable success payload.
 */
export function buildStructuredCompletionSuccessPayload(
  command: string,
  completion: AlternateBufferCompletionPayload | void,
  metadata: Record<string, unknown> = {},
): StructuredCompletionSuccessPayload {
  const serializedCompletion = completion
    ? serializeCompletionPayload(completion)
    : undefined;

  return {
    ok: true,
    data: {
      ...metadata,
      command,
      ...(serializedCompletion
        ? {
            completion: serializedCompletion,
            files: extractPlannedFiles(serializedCompletion),
          }
        : {}),
    },
  };
}

export function buildStructuredInitSuccessPayload(
  plan: StructuredInitPlan,
): StructuredInitSuccessPayload {
  const completion = serializeCompletionPayload(
    buildInitCompletionPayload(plan),
  );
  const files = Array.from(
    new Set([
      ...plan.plannedFiles.map((filePlan) => filePlan.path),
      ...(plan.commandMode === 'preview-only' ? plan.generatedArtifacts : []),
    ]),
  );

  return {
    ok: true,
    data: {
      command: 'init',
      completion,
      detectedLayout: plan.detectedLayout,
      files: toNonEmptyArray(files),
      mode: plan.commandMode === 'apply' ? 'apply' : 'preview',
      packageManager: plan.packageManager,
      plan,
      projectDir: plan.projectDir,
      status: plan.status,
      summary: plan.summary,
    },
  };
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
      shortNote?: string;
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
    optionalNote:
      flow.optionalOnboarding.shortNote ?? flow.optionalOnboarding.note,
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

/**
 * Builds the completion payload shown after an init preview or apply succeeds.
 *
 * @param plan Retrofit init plan for one project directory.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildInitCompletionPayload(
  plan: StructuredInitPlan,
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  const changeLines = [
    ...plan.packageChanges.addDevDependencies.map(
      (dependency) =>
        `devDependency ${dependency.action} ${dependency.name} -> ${dependency.requiredValue}`,
    ),
    ...(plan.packageChanges.packageManagerField
      ? [
          `packageManager ${plan.packageChanges.packageManagerField.action} -> ${plan.packageChanges.packageManagerField.requiredValue}`,
        ]
      : []),
    ...plan.packageChanges.scripts.map(
      (script) =>
        `script ${script.action} ${script.name} -> ${script.requiredValue}`,
    ),
    ...plan.plannedFiles.map(
      (filePlan) =>
        `file ${filePlan.action} ${filePlan.path} (${filePlan.purpose})`,
    ),
    ...(plan.commandMode === 'preview-only'
      ? plan.generatedArtifacts.map(
          (artifactPath) => `generated artifact ${artifactPath}`,
        )
      : []),
  ];
  const modeLine =
    plan.commandMode === 'apply'
      ? plan.status === 'already-initialized'
        ? 'Mode: apply requested; no files were written because the retrofit surface already existed.'
        : 'Mode: apply; package.json and retrofit helper files were written.'
      : 'Mode: preview only; no files were written.';
  const optionalTitle =
    plan.commandMode === 'apply'
      ? `Applied adoption changes (${changeLines.length}):`
      : `Planned adoption changes (${changeLines.length}):`;
  const title =
    plan.status === 'already-initialized'
      ? formatOutputMarker(
          'success',
          `wp-typia init: ${plan.projectName} is already initialized`,
          markerOptions,
        )
      : plan.commandMode === 'apply'
        ? formatOutputMarker(
            'success',
            `Applied retrofit init for ${plan.projectName}`,
            markerOptions,
          )
        : formatOutputMarker(
            'dryRun',
            `Retrofit init plan for ${plan.projectName}`,
            markerOptions,
          );

  return {
    nextSteps: plan.nextSteps,
    optionalLines: changeLines,
    optionalNote: plan.summary,
    optionalTitle,
    summaryLines: [
      `Project directory: ${plan.projectDir}`,
      `Detected layout: ${plan.detectedLayout.description}`,
      ...(plan.detectedLayout.blockNames.length > 0
        ? [`Block targets: ${plan.detectedLayout.blockNames.join(', ')}`]
        : []),
      `Package manager: ${plan.packageManager}`,
      modeLine,
    ],
    title,
    warningLines: plan.notes,
  };
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
      options.packageManager ?? inferPackageManagerId(options.projectDir),
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
    target?: 'ai' | 'default';
  },
  markerOptions?: OutputMarkerOptions,
): AlternateBufferCompletionPayload {
  const targetSuffix = options.target === 'ai' ? ' ai' : '';
  const targetSummary =
    options.target === 'ai'
      ? 'Sync target: AI artifacts only.'
      : options.target === 'default'
        ? 'Sync target: generated project defaults.'
        : undefined;

  return {
    optionalLines: options.plannedCommands.map(
      (command) => command.displayCommand,
    ),
    optionalNote: options.check
      ? `No sync scripts were executed because --dry-run was enabled. Re-run \`wp-typia sync${targetSuffix} --check\` to verify generated artifacts without rewriting them.`
      : `No sync scripts were executed because --dry-run was enabled. Re-run \`wp-typia sync${targetSuffix}\` without --dry-run to apply generated-file updates, or add --check to verify without rewriting.`,
    optionalTitle: `Planned sync commands (${options.plannedCommands.length}):`,
    summaryLines: [
      `Project directory: ${options.projectDir}`,
      `Package manager: ${options.packageManager}`,
      ...(targetSummary ? [targetSummary] : []),
      options.check
        ? 'Execution mode: would run generated sync scripts in verification mode.'
        : 'Execution mode: would run generated sync scripts in apply mode.',
    ],
    title: formatOutputMarker(
      'dryRun',
      `Dry run for wp-typia sync${targetSuffix}`,
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

/**
 * Converts external layer options into prompt-compatible select items.
 *
 * @param options External layer options returned by the block generator.
 * @returns Prompt select options with labels and hints.
 */
export { toExternalLayerPromptOptions } from './external-layer-prompt-options';
