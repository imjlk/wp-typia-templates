import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_NAMESPACE_METHODS_VISIBLE_FIELDS,
  requireAddKindName,
  type AddRestResourceResult,
} from '../add-kind-registry-shared';

const REST_RESOURCE_MISSING_NAME_MESSAGE =
  '`wp-typia add rest-resource` requires <name>. Usage: wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] or wp-typia add rest-resource <name> --manual [--method GET] [--path /external].';

export const restResourceAddKindEntry =
  defineAddKindRegistryEntry<AddRestResourceResult>({
    completion: {
      nextSteps: (values) =>
        values.mode === 'manual'
          ? [
              `Review src/rest/${values.restResourceSlug}/ and edit the manual contract types to match the external route owner.`,
              'Run sync-rest --check after changing the contract types to verify schemas, OpenAPI, and client artifacts.',
            ]
          : [
              `Review src/rest/${values.restResourceSlug}/ and inc/rest/${values.restResourceSlug}.php.`,
              'Run your workspace build or dev command to verify the generated REST resource contract.',
            ],
      summaryLines: (values, projectDir) => [
        `REST resource: ${values.restResourceSlug}`,
        `Mode: ${values.mode}`,
        `Namespace: ${values.namespace}`,
        ...(values.mode === 'manual'
          ? [
              `Route: ${values.method} /${values.namespace}${values.pathPattern}`,
              `Auth: ${values.auth}`,
            ]
          : [`Methods: ${values.methods}`]),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added REST resource contract',
    },
    description: 'Add a generated or type-only REST resource contract',
    hiddenBooleanSubmitFields: ['manual'],
    hiddenStringSubmitFields: [
      'auth',
      'body-type',
      'method',
      'path',
      'query-type',
      'response-type',
    ],
    nameLabel: 'REST resource name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        REST_RESOURCE_MISSING_NAME_MESSAGE,
      );
      const auth = readOptionalStrictStringFlag(context.flags, 'auth');
      const bodyTypeName = readOptionalStrictStringFlag(
        context.flags,
        'body-type',
      );
      const manual = Boolean(context.flags.manual);
      const method = readOptionalStrictStringFlag(context.flags, 'method');
      const methods = readOptionalStrictStringFlag(context.flags, 'methods');
      const namespace = readOptionalStrictStringFlag(context.flags, 'namespace');
      const pathPattern = readOptionalStrictStringFlag(context.flags, 'path');
      const queryTypeName = readOptionalStrictStringFlag(
        context.flags,
        'query-type',
      );
      const responseTypeName = readOptionalStrictStringFlag(
        context.flags,
        'response-type',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddRestResourceCommand({
            auth,
            bodyTypeName,
            cwd,
            manual,
            method,
            methods,
            namespace,
            pathPattern,
            queryTypeName,
            restResourceName: name,
            responseTypeName,
          }),
        getValues: (result) => ({
          auth: result.auth ?? '',
          method: result.method ?? '',
          methods: result.methods.join(', '),
          mode: result.mode,
          namespace: result.namespace,
          pathPattern: result.pathPattern ?? '',
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
      'wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] [--manual --method <GET|POST|PUT|PATCH|DELETE> --auth <public|authenticated|public-write-protected> --path <route-pattern> --query-type <Type> --body-type <Type> --response-type <Type>] [--dry-run]',
    visibleFieldNames: () => NAME_NAMESPACE_METHODS_VISIBLE_FIELDS,
  });
