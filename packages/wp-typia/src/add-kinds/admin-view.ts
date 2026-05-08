import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_SOURCE_VISIBLE_FIELDS,
  requireAddKindName,
  type AddAdminViewResult,
} from '../add-kind-registry-shared';

export const adminViewAddKindEntry =
  defineAddKindRegistryEntry<AddAdminViewResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/admin-views/${values.adminViewSlug}/ and inc/admin-views/${values.adminViewSlug}.php.`,
        'Run your workspace build or dev command to verify the generated DataViews admin screen.',
      ],
      summaryLines: (values, projectDir) => [
        `Admin view: ${values.adminViewSlug}`,
        ...(values.source ? [`Source: ${values.source}`] : []),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added DataViews admin screen',
    },
    description: 'Add an opt-in DataViews-powered admin screen',
    nameLabel: 'Admin view name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add admin-view` requires <name>. Usage: wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>].',
      );
      const source = readOptionalStrictStringFlag(context.flags, 'source');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddAdminViewCommand({
            adminViewName: name,
            cwd,
            source,
          }),
        getValues: (result) => ({
          adminViewSlug: result.adminViewSlug,
          ...(result.source ? { source: result.source } : {}),
        }),
        missingNameMessage:
          '`wp-typia add admin-view` requires <name>. Usage: wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>].',
        name,
      });
    },
    sortOrder: 10,
    supportsDryRun: true,
    usage:
      'wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>] [--dry-run]',
    visibleFieldNames: () => NAME_SOURCE_VISIBLE_FIELDS,
  });
