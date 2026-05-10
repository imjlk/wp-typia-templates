import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_SLOT_VISIBLE_FIELDS,
  requireAddKindName,
  type AddEditorPluginResult,
} from '../add-kind-registry-shared';

const EDITOR_PLUGIN_MISSING_NAME_MESSAGE =
  '`wp-typia add editor-plugin` requires <name>. Usage: wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>].';

export const editorPluginAddKindEntry =
  defineAddKindRegistryEntry<AddEditorPluginResult>({
    completion: {
      nextSteps: (values) => [
        `Review src/editor-plugins/${values.editorPluginSlug}/.`,
        'Run your workspace build or dev command to verify the new editor plugin registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Editor plugin: ${values.editorPluginSlug}`,
        `Slot: ${values.slot}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added editor plugin',
    },
    description: 'Add a slot-aware document editor extension shell',
    nameLabel: 'Editor plugin name',
    async prepareExecution(context) {
      const name = requireAddKindName(
        context,
        EDITOR_PLUGIN_MISSING_NAME_MESSAGE,
      );
      const slot = readOptionalStrictStringFlag(context.flags, 'slot');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddEditorPluginCommand({
            cwd,
            editorPluginName: name,
            slot,
          }),
        getValues: (result) => ({
          editorPluginSlug: result.editorPluginSlug,
          slot: result.slot,
        }),
        missingNameMessage: EDITOR_PLUGIN_MISSING_NAME_MESSAGE,
        name,
      });
    },
    sortOrder: 120,
    supportsDryRun: true,
    usage:
      'wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>] [--dry-run]',
    visibleFieldNames: () => NAME_SLOT_VISIBLE_FIELDS,
  });
