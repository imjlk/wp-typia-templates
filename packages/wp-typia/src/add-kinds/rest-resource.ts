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

function readOptionalDashedOrCamelStringFlag(
  flags: Record<string, unknown>,
  dashedName: string,
  camelName: string,
): string | undefined {
  return (
    readOptionalStrictStringFlag(flags, dashedName) ??
    readOptionalStrictStringFlag(flags, camelName)
  );
}

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
              ...(values.secretFieldName
                ? [
                    `Secret field: ${values.secretFieldName} -> ${values.secretStateFieldName}`,
                  ]
                : []),
            ]
          : [
              `Methods: ${values.methods}`,
              ...(values.routePattern
                ? [`Item route: /${values.namespace}${values.routePattern}`]
                : []),
              ...(values.permissionCallback
                ? [`Permission callback: ${values.permissionCallback}`]
                : []),
              ...(values.controllerClass
                ? [`Controller class: ${values.controllerClass}`]
                : []),
            ]),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added REST resource contract',
    },
    description: 'Add a generated or type-only REST resource contract',
    hiddenBooleanSubmitFields: ['manual'],
    hiddenStringSubmitFields: [
      'auth',
      'body-type',
      'controller-class',
      'controller-extends',
      'method',
      'path',
      'permission-callback',
      'query-type',
      'response-type',
      'route-pattern',
      'secret-field',
      'secret-state-field',
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
      const controllerClass = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'controller-class',
        'controllerClass',
      );
      const controllerExtends = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'controller-extends',
        'controllerExtends',
      );
      const manual = Boolean(context.flags.manual);
      const method = readOptionalStrictStringFlag(context.flags, 'method');
      const methods = readOptionalStrictStringFlag(context.flags, 'methods');
      const namespace = readOptionalStrictStringFlag(context.flags, 'namespace');
      const permissionCallback = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'permission-callback',
        'permissionCallback',
      );
      const pathPattern = readOptionalStrictStringFlag(context.flags, 'path');
      const queryTypeName = readOptionalStrictStringFlag(
        context.flags,
        'query-type',
      );
      const responseTypeName = readOptionalStrictStringFlag(
        context.flags,
        'response-type',
      );
      const routePattern = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'route-pattern',
        'routePattern',
      );
      const secretFieldName = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'secret-field',
        'secretField',
      );
      const secretStateFieldName = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'secret-state-field',
        'secretStateField',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddRestResourceCommand({
            auth,
            bodyTypeName,
            controllerClass,
            controllerExtends,
            cwd,
            manual,
            method,
            methods,
            namespace,
            permissionCallback,
            pathPattern,
            queryTypeName,
            restResourceName: name,
            responseTypeName,
            routePattern,
            secretFieldName,
            secretStateFieldName,
          }),
        getValues: (result) => ({
          auth: result.auth ?? '',
          controllerClass: result.controllerClass ?? '',
          method: result.method ?? '',
          methods: result.methods.join(', '),
          mode: result.mode,
          namespace: result.namespace,
          pathPattern: result.pathPattern ?? '',
          permissionCallback: result.permissionCallback ?? '',
          restResourceSlug: result.restResourceSlug,
          routePattern: result.routePattern ?? '',
          secretFieldName: result.secretFieldName ?? '',
          secretStateFieldName: result.secretStateFieldName ?? '',
        }),
        missingNameMessage: REST_RESOURCE_MISSING_NAME_MESSAGE,
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 80,
    supportsDryRun: true,
    usage:
      'wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] [--route-pattern <route-pattern>] [--permission-callback <callback>] [--controller-class <ClassName>] [--controller-extends <BaseClass>] [--manual --method <GET|POST|PUT|PATCH|DELETE> --auth <public|authenticated|public-write-protected> --path <route-pattern> --query-type <Type> --body-type <Type> --response-type <Type> --secret-field <field> --secret-state-field <field>] [--dry-run]',
    visibleFieldNames: () => NAME_NAMESPACE_METHODS_VISIBLE_FIELDS,
  });
