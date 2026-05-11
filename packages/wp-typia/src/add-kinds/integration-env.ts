import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_ONLY_VISIBLE_FIELDS,
  type AddIntegrationEnvResult,
} from '../add-kind-registry-shared';

const INTEGRATION_ENV_MISSING_NAME_MESSAGE =
  '`wp-typia add integration-env` requires <name>. Usage: wp-typia add integration-env <name> [--wp-env] [--service <none|docker-compose>].';

export const integrationEnvAddKindEntry =
  defineAddKindRegistryEntry<AddIntegrationEnvResult>({
    completion: {
      nextSteps: (values) => [
        `Review scripts/integration-smoke/${values.integrationEnvSlug}.mjs and docs/integration-env/${values.integrationEnvSlug}.md.`,
        'Copy `.env.example` to `.env`, adjust local URLs or credentials, then run the generated smoke script.',
        ...(values.withWpEnv === 'true'
          ? ['Run `npm run wp-env:start` before the smoke check when using the generated wp-env preset.']
          : []),
      ],
      summaryLines: (values, projectDir) => [
        `Integration env: ${values.integrationEnvSlug}`,
        `wp-env preset: ${values.withWpEnv}`,
        `Service starter: ${values.service}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added integration environment starter',
    },
    description:
      'Add an opt-in local WordPress integration smoke environment starter',
    nameLabel: 'Integration env name',
    async prepareExecution(context) {
      const service = readOptionalStrictStringFlag(context.flags, 'service');
      const withWpEnv = Boolean(context.flags['wp-env']);

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddIntegrationEnvCommand({
            cwd,
            integrationEnvName: name,
            service,
            withWpEnv,
          }),
        getValues: (result) => ({
          integrationEnvSlug: result.integrationEnvSlug,
          service: result.service,
          withWpEnv: String(result.withWpEnv),
        }),
        getWarnings: (result) => result.warnings,
        missingNameMessage: INTEGRATION_ENV_MISSING_NAME_MESSAGE,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 25,
    supportsDryRun: true,
    usage:
      'wp-typia add integration-env <name> [--wp-env] [--service <none|docker-compose>] [--dry-run]',
    visibleFieldNames: () => NAME_ONLY_VISIBLE_FIELDS,
  });
