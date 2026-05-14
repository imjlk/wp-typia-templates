import {
  readOptionalDashedOrCamelStringFlag,
  readOptionalPairedStrictStringFlags,
} from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_BLOCK_ATTRIBUTE_POST_META_VISIBLE_FIELDS,
  requireAddKindName,
  type AddBindingSourceResult,
} from '../add-kind-registry-shared';

const BINDING_SOURCE_MISSING_NAME_MESSAGE =
  '`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--from-post-meta <post-meta> --meta-path <field>].';

export const bindingSourceAddKindEntry =
  defineAddKindRegistryEntry<AddBindingSourceResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/bindings/${values.bindingSourceSlug}/server.php and src/bindings/${values.bindingSourceSlug}/editor.ts.`,
        ...(values.blockSlug && values.attributeName
          ? [
              `Review src/blocks/${values.blockSlug}/block.json for the ${values.attributeName} bindable attribute.`,
            ]
          : []),
        ...(values.postMetaSlug
          ? [
              `Run wp-typia sync-rest --check after editing ${values.schemaFile}.`,
            ]
          : []),
        'Run your workspace build or dev command to verify the binding source hooks and editor registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Binding source: ${values.bindingSourceSlug}`,
        ...(values.blockSlug && values.attributeName
          ? [`Target: ${values.blockSlug}.${values.attributeName}`]
          : []),
        ...(values.postMetaSlug
          ? [
              `Post meta: ${values.postMetaSlug}`,
              `Meta field: ${values.metaPath}`,
            ]
          : []),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added binding source',
    },
    description: 'Add a shared block bindings source',
    nameLabel: 'Binding source name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        BINDING_SOURCE_MISSING_NAME_MESSAGE,
      );
      const [blockName, attributeName] = readOptionalPairedStrictStringFlags(
        context.flags,
        'block',
        'attribute',
        '`wp-typia add binding-source` requires --block and --attribute to be provided together.',
      );
      const postMetaName =
        readOptionalDashedOrCamelStringFlag(
          context.flags,
          'from-post-meta',
          'fromPostMeta',
        ) ??
        readOptionalDashedOrCamelStringFlag(
          context.flags,
          'post-meta',
          'postMeta',
        );
      const metaPath = readOptionalDashedOrCamelStringFlag(
        context.flags,
        'meta-path',
        'metaPath',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddBindingSourceCommand({
            attributeName,
            bindingSourceName: name,
            blockName,
            cwd,
            metaPath,
            postMetaName,
          }),
        getValues: (result) => ({
          ...(result.attributeName
            ? { attributeName: result.attributeName }
            : {}),
          ...(result.blockSlug ? { blockSlug: result.blockSlug } : {}),
          bindingSourceSlug: result.bindingSourceSlug,
          ...(result.metaKey ? { metaKey: result.metaKey } : {}),
          ...(result.metaPath ? { metaPath: result.metaPath } : {}),
          ...(result.postMetaSlug ? { postMetaSlug: result.postMetaSlug } : {}),
          ...(result.postType ? { postType: result.postType } : {}),
          ...(result.schemaFile ? { schemaFile: result.schemaFile } : {}),
        }),
        missingNameMessage: BINDING_SOURCE_MISSING_NAME_MESSAGE,
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 70,
    supportsDryRun: true,
    usage:
      'wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--from-post-meta|--post-meta <post-meta> [--meta-path <field>]] [--dry-run]',
    visibleFieldNames: () => NAME_BLOCK_ATTRIBUTE_POST_META_VISIBLE_FIELDS,
  });
