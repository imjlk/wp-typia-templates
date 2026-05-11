import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_NAMESPACE_METHODS_VISIBLE_FIELDS,
  requireAddKindName,
  type AddRestResourceResult,
} from '../add-kind-registry-shared';

const REST_RESOURCE_MISSING_NAME_MESSAGE =
  '`wp-typia add rest-resource` requires <name>. Usage: wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>].';

export const restResourceAddKindEntry =
  defineAddKindRegistryEntry<AddRestResourceResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/rest/${values.restResourceSlug}/ and inc/rest/${values.restResourceSlug}.php.`,
        'Run your workspace build or dev command to verify the generated REST resource contract.',
      ],
      summaryLines: (values, projectDir) => [
        `REST resource: ${values.restResourceSlug}`,
        `Namespace: ${values.namespace}`,
        `Methods: ${values.methods}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added plugin-level REST resource',
    },
    description: 'Add a plugin-level typed REST resource',
    nameLabel: 'REST resource name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        REST_RESOURCE_MISSING_NAME_MESSAGE,
      );
      const methods = readOptionalStrictStringFlag(context.flags, 'methods');
      const namespace = readOptionalStrictStringFlag(context.flags, 'namespace');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddRestResourceCommand({
            cwd,
            methods,
            namespace,
            restResourceName: name,
          }),
        getValues: (result) => ({
          methods: result.methods.join(', '),
          namespace: result.namespace,
          restResourceSlug: result.restResourceSlug,
        }),
        missingNameMessage: REST_RESOURCE_MISSING_NAME_MESSAGE,
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 80,
    supportsDryRun: true,
    usage:
      'wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] [--dry-run]',
    visibleFieldNames: () => NAME_NAMESPACE_METHODS_VISIBLE_FIELDS,
  });
