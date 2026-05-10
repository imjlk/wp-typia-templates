import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_ONLY_VISIBLE_FIELDS,
  type AddPatternResult,
} from '../add-kind-registry-shared';

const PATTERN_MISSING_NAME_MESSAGE =
  '`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.';

export const patternAddKindEntry =
  defineAddKindRegistryEntry<AddPatternResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/patterns/${values.patternSlug}.php.`,
        'Run your workspace build or dev command to verify the new pattern registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Pattern: ${values.patternSlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace pattern',
    },
    description: 'Add a PHP block pattern shell',
    nameLabel: 'Pattern name',
    async prepareExecution(context) {
      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddPatternCommand({
            cwd,
            patternName: name,
          }),
        getValues: (result) => ({
          patternSlug: result.patternSlug,
        }),
        missingNameMessage: PATTERN_MISSING_NAME_MESSAGE,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 60,
    supportsDryRun: true,
    usage: 'wp-typia add pattern <name> [--dry-run]',
    visibleFieldNames: () => NAME_ONLY_VISIBLE_FIELDS,
  });
