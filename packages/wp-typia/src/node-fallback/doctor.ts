import {
  CLI_DIAGNOSTIC_CODES,
  createCliCommandError,
} from '@wp-typia/project-tools/cli-diagnostics';
import { executeDoctorCommand } from '../runtime-bridge';
import type { PrintLine } from '../print-line';
import type { NodeFallbackDispatchContext } from './types';

type DoctorExitPolicy = 'strict' | 'workspace-only';

async function renderNodeFallbackDoctorJson(
  cwd: string,
  exitPolicy: DoctorExitPolicy,
  printLine: PrintLine,
): Promise<void> {
  const {
    createDoctorRunSummary,
    getDoctorChecks,
    getDoctorExitFailureDetailLines,
  } = await import('@wp-typia/project-tools/cli-doctor');
  const checks = await getDoctorChecks(cwd);
  const summary = createDoctorRunSummary(checks, { exitPolicy });
  printLine(
    JSON.stringify(
      {
        checks,
        summary,
      },
      null,
      2,
    ),
  );
  if (summary.exitCode === 1) {
    throw createCliCommandError({
      code: CLI_DIAGNOSTIC_CODES.DOCTOR_CHECK_FAILED,
      command: 'doctor',
      detailLines: getDoctorExitFailureDetailLines(checks, { exitPolicy }),
      summary: 'One or more doctor checks failed.',
    });
  }
}

export async function dispatchNodeFallbackDoctor({
  cwd,
  mergedFlags,
  printLine,
}: NodeFallbackDispatchContext): Promise<void> {
  const exitPolicy = mergedFlags['workspace-only'] ? 'workspace-only' : 'strict';
  if (mergedFlags.format === 'json') {
    await renderNodeFallbackDoctorJson(cwd, exitPolicy, printLine);
    return;
  }
  await executeDoctorCommand(cwd, { exitPolicy });
}
