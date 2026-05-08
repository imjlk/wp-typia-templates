import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_ONLY_VISIBLE_FIELDS,
  type AddAbilityResult,
} from '../add-kind-registry-shared';

export const abilityAddKindEntry =
  defineAddKindRegistryEntry<AddAbilityResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/abilities/${values.abilitySlug}/ and inc/abilities/${values.abilitySlug}.php.`,
        'Run `wp-typia sync` or `npm run sync-abilities -- --check` and then your workspace build/dev command to verify the generated workflow ability.',
      ],
      summaryLines: (values, projectDir) => [
        `Ability: ${values.abilitySlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workflow ability',
    },
    description: 'Add a typed server/client workflow ability scaffold',
    nameLabel: 'Ability name',
    async prepareExecution(context) {
      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddAbilityCommand({
            abilityName: name,
            cwd,
          }),
        getValues: (result) => ({
          abilitySlug: result.abilitySlug,
        }),
        getWarnings: (result) => result.warnings,
        missingNameMessage:
          '`wp-typia add ability` requires <name>. Usage: wp-typia add ability <name>.',
        warnLine: context.warnLine,
      });
    },
    sortOrder: 90,
    supportsDryRun: true,
    usage: 'wp-typia add ability <name> [--dry-run]',
    visibleFieldNames: () => NAME_ONLY_VISIBLE_FIELDS,
  });
