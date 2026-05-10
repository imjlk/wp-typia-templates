import { wrapCliCommandError } from './runtime-bridge-shared';

const loadCliDoctorRuntime = () => import('@wp-typia/project-tools/cli-doctor');

export async function executeDoctorCommand(cwd: string): Promise<void> {
  try {
    const { runDoctor } = await loadCliDoctorRuntime();
    await runDoctor(cwd);
  } catch (error) {
    throw await wrapCliCommandError('doctor', error);
  }
}
