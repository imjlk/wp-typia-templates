import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_NAMESPACE_VISIBLE_FIELDS,
  requireAddKindName,
  type AddAiFeatureResult,
} from '../add-kind-registry-shared';

const AI_FEATURE_MISSING_NAME_MESSAGE =
  '`wp-typia add ai-feature` requires <name>. Usage: wp-typia add ai-feature <name> [--namespace <vendor/v1>].';

export const aiFeatureAddKindEntry =
  defineAddKindRegistryEntry<AddAiFeatureResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/ai-features/${values.aiFeatureSlug}/ and inc/ai-features/${values.aiFeatureSlug}.php.`,
        'Run `wp-typia sync-rest` and `wp-typia sync ai` or your workspace build/dev command to verify the generated REST artifacts and AI schema.',
      ],
      summaryLines: (values, projectDir) => [
        `AI feature: ${values.aiFeatureSlug}`,
        `Namespace: ${values.namespace}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added server-only AI feature',
    },
    description: 'Add a server-owned WordPress AI feature endpoint',
    nameLabel: 'AI feature name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        AI_FEATURE_MISSING_NAME_MESSAGE,
      );
      const namespace = readOptionalStrictStringFlag(context.flags, 'namespace');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddAiFeatureCommand({
            aiFeatureName: name,
            cwd,
            namespace,
          }),
        getValues: (result) => ({
          aiFeatureSlug: result.aiFeatureSlug,
          namespace: result.namespace,
        }),
        getWarnings: (result) => result.warnings,
        missingNameMessage: AI_FEATURE_MISSING_NAME_MESSAGE,
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 100,
    supportsDryRun: true,
    usage:
      'wp-typia add ai-feature <name> [--namespace <vendor/v1>] [--dry-run]',
    visibleFieldNames: () => NAME_NAMESPACE_VISIBLE_FIELDS,
  });
