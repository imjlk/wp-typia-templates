import packageJson from '../../package.json';
import {
  PACKAGE_MANAGER_IDS,
  formatPackageExecCommand,
  parsePackageManagerField,
  type PackageManagerId,
} from '@wp-typia/project-tools/package-managers';
import {
  CLI_DIAGNOSTIC_CODES,
  createCliDiagnosticCodeError,
} from '@wp-typia/project-tools/cli-diagnostics';
import type { AlternateBufferCompletionPayload } from '../ui/alternate-buffer-lifecycle';
import {
  formatOutputMarker,
  type OutputMarkerOptions,
} from '../output-markers';
import type { CreateProgressPayload } from './types';

function resolveCreateCompletionPackageManager(
  packageManager: string,
): PackageManagerId {
  const parsedPackageManager = parsePackageManagerField(packageManager);
  if (parsedPackageManager) {
    return parsedPackageManager;
  }

  throw createCliDiagnosticCodeError(
    CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
    `Unsupported package manager "${packageManager}" in create completion payload. Expected one of: ${PACKAGE_MANAGER_IDS.join(', ')}.`,
  );
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
  const packageManager = resolveCreateCompletionPackageManager(
    flow.packageManager,
  );
  const verificationSteps = [
    formatPackageExecCommand(
      packageManager,
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
