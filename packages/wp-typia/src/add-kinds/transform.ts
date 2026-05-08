import { requireStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_FROM_TO_VISIBLE_FIELDS,
  requireAddKindName,
  type AddBlockTransformResult,
} from '../add-kind-registry-shared';

export const transformAddKindEntry =
  defineAddKindRegistryEntry<AddBlockTransformResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/transforms/${values.transformSlug}.ts.`,
        'Run your workspace build or dev command to verify the new block transform registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Block transform: ${values.transformSlug}`,
        `From: ${values.fromBlockName}`,
        `To: ${values.toBlockName}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added block transform',
    },
    description: 'Add a block-to-block transform into a workspace block',
    nameLabel: 'Transform name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add transform` requires <name>. Usage: wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug>.',
      );
      const fromBlockName = requireStrictStringFlag(
        context.flags,
        'from',
        '`wp-typia add transform` requires --from <namespace/block>.',
      );
      const toBlockName = requireStrictStringFlag(
        context.flags,
        'to',
        '`wp-typia add transform` requires --to <block-slug|namespace/block-slug>.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddBlockTransformCommand({
            cwd,
            fromBlockName,
            toBlockName,
            transformName: name,
          }),
        getValues: (result) => ({
          blockSlug: result.blockSlug,
          fromBlockName: result.fromBlockName,
          toBlockName: result.toBlockName,
          transformSlug: result.transformSlug,
        }),
        missingNameMessage:
          '`wp-typia add transform` requires <name>. Usage: wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug>.',
        name,
      });
    },
    sortOrder: 50,
    supportsDryRun: true,
    usage:
      'wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug> [--dry-run]',
    visibleFieldNames: () => NAME_FROM_TO_VISIBLE_FIELDS,
  });
