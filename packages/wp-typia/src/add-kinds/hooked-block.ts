import { requireStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_ANCHOR_POSITION_VISIBLE_FIELDS,
  requireAddKindName,
  type AddHookedBlockResult,
} from '../add-kind-registry-shared';

export const hookedBlockAddKindEntry =
  defineAddKindRegistryEntry<AddHookedBlockResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/block.json for the new blockHooks entry.`,
        'Run your workspace build or dev command to verify the updated hooked-block metadata.',
      ],
      summaryLines: (values, projectDir) => [
        `Block: ${values.blockSlug}`,
        `Anchor: ${values.anchorBlockName}`,
        `Position: ${values.position}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added blockHooks metadata',
    },
    description: 'Add block.json hook metadata to an existing block',
    nameLabel: 'Target block',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        '`wp-typia add hooked-block` requires <block-slug>. Usage: wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>.',
      );
      const anchorBlockName = requireStrictStringFlag(
        context.flags,
        'anchor',
        '`wp-typia add hooked-block` requires --anchor <anchor-block-name>.',
      );
      const position = requireStrictStringFlag(
        context.flags,
        'position',
        '`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.',
      );

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddHookedBlockCommand({
            anchorBlockName,
            blockName: name,
            cwd,
            position,
          }),
        getValues: (result) => ({
          anchorBlockName: result.anchorBlockName,
          blockSlug: result.blockSlug,
          position: result.position,
        }),
        missingNameMessage:
          '`wp-typia add hooked-block` requires <block-slug>. Usage: wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>.',
        name,
      });
    },
    sortOrder: 110,
    supportsDryRun: true,
    usage:
      'wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild> [--dry-run]',
    visibleFieldNames: () => NAME_ANCHOR_POSITION_VISIBLE_FIELDS,
  });
