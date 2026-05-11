import { readOptionalStrictStringFlag, requireStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_POST_TYPE_TYPE_VISIBLE_FIELDS,
  requireAddKindName,
  type AddPostMetaResult,
} from '../add-kind-registry-shared';

const POST_META_MISSING_NAME_MESSAGE =
  '`wp-typia add post-meta` requires <name>. Usage: wp-typia add post-meta <name> --post-type <post-type> [--type <ExportedTypeName>] [--meta-key <meta-key>].';
const POST_META_MISSING_POST_TYPE_MESSAGE =
  '`wp-typia add post-meta` requires --post-type <post-type>. Usage: wp-typia add post-meta <name> --post-type <post-type>.';

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

export const postMetaAddKindEntry =
  defineAddKindRegistryEntry<AddPostMetaResult>({
    completion: {
      nextSteps: (values) => [
        `Edit ${values.typesFile} when the post meta shape changes.`,
        'Run `wp-typia sync-rest --check` to verify the generated meta schema is current.',
        `Smoke test ${values.metaKey} on the ${values.postType} post type in WordPress.`,
      ],
      summaryLines: (values, projectDir) => [
        `Post meta contract: ${values.postMetaSlug}`,
        `Post type: ${values.postType}`,
        `Meta key: ${values.metaKey}`,
        `REST/editor exposure: ${values.showInRest}`,
        `Schema: ${values.schemaFile}`,
        `PHP: ${values.phpFile}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added post meta contract',
    },
    description: 'Add a typed WordPress post meta contract',
    hiddenBooleanSubmitFields: ['hide-from-rest'],
    hiddenStringSubmitFields: ['meta-key'],
    nameLabel: 'Post meta name',
    async prepareExecution(context) {
      const name = requireAddKindName(context, POST_META_MISSING_NAME_MESSAGE);
      const hideFromRest = Boolean(
        context.flags['hide-from-rest'] ?? context.flags.hideFromRest,
      );
      const metaKey = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'meta-key',
        'metaKey',
      );
      const postType =
        readOptionalDashedOrCamelStringFlag(
          context.flags,
          'post-type',
          'postType',
        ) ??
        requireStrictStringFlag(
          context.flags,
          'post-type',
          POST_META_MISSING_POST_TYPE_MESSAGE,
        );
      const typeName = readOptionalStrictStringFlag(context.flags, 'type');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddPostMetaCommand({
            cwd,
            hideFromRest,
            metaKey,
            postMetaName: name,
            postType,
            typeName,
          }),
        getValues: (result) => ({
          metaKey: result.metaKey,
          phpFile: result.phpFile,
          postMetaSlug: result.postMetaSlug,
          postType: result.postType,
          schemaFile: result.schemaFile,
          showInRest: result.showInRest ? 'enabled' : 'disabled',
          sourceTypeName: result.sourceTypeName,
          typesFile: result.typesFile,
        }),
        missingNameMessage: POST_META_MISSING_NAME_MESSAGE,
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 85,
    supportsDryRun: true,
    usage:
      'wp-typia add post-meta <name> --post-type <post-type> [--type <ExportedTypeName>] [--meta-key <meta-key>] [--hide-from-rest] [--dry-run]',
    visibleFieldNames: () => NAME_POST_TYPE_TYPE_VISIBLE_FIELDS,
  });
