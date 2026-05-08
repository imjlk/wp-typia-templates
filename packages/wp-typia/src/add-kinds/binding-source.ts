import { readOptionalPairedStrictStringFlags } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_BLOCK_ATTRIBUTE_VISIBLE_FIELDS,
  requireAddKindName,
  type AddBindingSourceResult,
} from '../add-kind-registry-shared';

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
        'Run your workspace build or dev command to verify the binding source hooks and editor registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Binding source: ${values.bindingSourceSlug}`,
        ...(values.blockSlug && values.attributeName
          ? [`Target: ${values.blockSlug}.${values.attributeName}`]
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
        '`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>].',
      );
      const [blockName, attributeName] = readOptionalPairedStrictStringFlags(
        context.flags,
        'block',
        'attribute',
        '`wp-typia add binding-source` requires --block and --attribute to be provided together.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddBindingSourceCommand({
            attributeName,
            bindingSourceName: name,
            blockName,
            cwd,
          }),
        getValues: (result) => ({
          ...(result.attributeName
            ? { attributeName: result.attributeName }
            : {}),
          ...(result.blockSlug ? { blockSlug: result.blockSlug } : {}),
          bindingSourceSlug: result.bindingSourceSlug,
        }),
        missingNameMessage:
          '`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>].',
        name,
      });
    },
    sortOrder: 70,
    supportsDryRun: true,
    usage:
      'wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--dry-run]',
    visibleFieldNames: () => NAME_BLOCK_ATTRIBUTE_VISIBLE_FIELDS,
  });
