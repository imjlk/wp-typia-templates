import {
  CLI_DIAGNOSTIC_CODES,
  createCliCommandError,
} from '@wp-typia/project-tools/cli-diagnostics';
import { executeDoctorCommand } from '../runtime-bridge';
import type { PrintLine } from '../print-line';
import type { NodeFallbackDispatchContext } from './types';

async function renderNodeFallbackDoctorJson(
  cwd: string,
  printLine: PrintLine,
): Promise<void> {
  const [{ getDoctorChecks }, { getDoctorFailureDetailLines }] =
    await Promise.all([
      import('@wp-typia/project-tools/cli-doctor'),
      import('@wp-typia/project-tools/cli-diagnostics'),
    ]);
  const checks = await getDoctorChecks(cwd);
  printLine(
    JSON.stringify(
      {
        checks,
      },
      null,
      2,
    ),
  );
  if (checks.some((check) => check.status === 'fail')) {
    throw createCliCommandError({
      code: CLI_DIAGNOSTIC_CODES.DOCTOR_CHECK_FAILED,
      command: 'doctor',
      detailLines: getDoctorFailureDetailLines(checks),
      summary: 'One or more doctor checks failed.',
    });
  }
}

export async function dispatchNodeFallbackDoctor({
  cwd,
  mergedFlags,
  printLine,
}: NodeFallbackDispatchContext): Promise<void> {
  if (mergedFlags.format === 'json') {
    await renderNodeFallbackDoctorJson(cwd, printLine);
    return;
  }
  await executeDoctorCommand(cwd);
}
