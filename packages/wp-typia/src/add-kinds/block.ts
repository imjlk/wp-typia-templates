import {
  readOptionalStrictStringFlag,
} from '../cli-string-flags';
import { toExternalLayerPromptOptions } from '../external-layer-prompt-options';
import {
  assertAddBlockTemplateId,
  BLOCK_VISIBLE_FIELD_ORDER,
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  isAddPersistenceTemplate,
  requireAddKindName,
  type AddBlockResult,
} from '../add-kind-registry-shared';

export const blockAddKindEntry = defineAddKindRegistryEntry<AddBlockResult>({
  completion: {
    nextSteps: () => [
      'Review the generated sources under src/blocks/ and the updated scripts/block-config.ts entry.',
      'Run your workspace build or dev command to verify the new scaffolded block family.',
    ],
    summaryLines: (values, projectDir) => [
      `Blocks: ${values.blockSlugs}`,
      `Template family: ${values.templateId}`,
      `Project directory: ${projectDir}`,
    ],
    title: 'Added workspace block',
  },
  description: 'Add a real block slice',
  hiddenStringSubmitFields: ['external-layer-id', 'external-layer-source'],
  nameLabel: 'Block name',
  async prepareExecution(context) {
    const name = requireAddKindName(
      context,
      '`wp-typia add block` requires <name>. Usage: wp-typia add block <name> [--template <basic|interactivity|persistence|compound>]',
    );
    const externalLayerId = readOptionalStrictStringFlag(
      context.flags,
      'external-layer-id',
    );
    const externalLayerSource = readOptionalStrictStringFlag(
      context.flags,
      'external-layer-source',
    );
    const shouldPromptForLayerSelection =
      Boolean(externalLayerSource) &&
      !Boolean(externalLayerId) &&
      context.isInteractiveSession;
    const selectPrompt = shouldPromptForLayerSelection
      ? await context.getOrCreatePrompt()
      : undefined;
    const alternateRenderTargets = readOptionalStrictStringFlag(
      context.flags,
      'alternate-render-targets',
    );
    const dataStorageMode = readOptionalStrictStringFlag(
      context.flags,
      'data-storage',
    );
    const innerBlocksPreset = readOptionalStrictStringFlag(
      context.flags,
      'inner-blocks-preset',
    );
    const persistencePolicy = readOptionalStrictStringFlag(
      context.flags,
      'persistence-policy',
    );
    const requestedTemplateId = readOptionalStrictStringFlag(
      context.flags,
      'template',
    );
    let resolvedTemplateId = requestedTemplateId
      ? assertAddBlockTemplateId(context, requestedTemplateId)
      : undefined;
    if (!resolvedTemplateId && context.isInteractiveSession) {
      const templatePrompt = await context.getOrCreatePrompt();
      resolvedTemplateId = await templatePrompt.select(
        'Select a block template',
        context.addRuntime.ADD_BLOCK_TEMPLATE_IDS.map((templateId) => ({
          hint: `Scaffold the ${templateId} block family`,
          label: templateId,
          value: templateId,
        })),
        1,
      );
    }
    resolvedTemplateId ??= 'basic';

    return createNamedExecutionPlan(context, {
      execute: ({ cwd, name }) =>
        context.addRuntime.runAddBlockCommand({
          alternateRenderTargets,
          blockName: name,
          cwd,
          dataStorageMode,
          externalLayerId,
          externalLayerSource,
          innerBlocksPreset,
          persistencePolicy,
          selectExternalLayerId: selectPrompt
            ? (options) =>
                selectPrompt.select(
                  'Select an external layer',
                  toExternalLayerPromptOptions(options),
                  1,
                )
            : undefined,
          templateId: resolvedTemplateId,
        }),
      getValues: (result) => ({
        blockSlugs: result.blockSlugs.join(', '),
        templateId: result.templateId,
      }),
      getWarnings: (result) => result.warnings,
      missingNameMessage:
        '`wp-typia add block` requires <name>. Usage: wp-typia add block <name> [--template <basic|interactivity|persistence|compound>]',
      name,
      warnLine: context.warnLine,
    });
  },
  sortOrder: 20,
  supportsDryRun: true,
  usage:
    'wp-typia add block <name> [--template <basic|interactivity|persistence|compound>] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--dry-run]',
  visibleFieldNames: ({ template }) =>
    BLOCK_VISIBLE_FIELD_ORDER.filter((fieldName) => {
      if (fieldName === 'alternate-render-targets') {
        return isAddPersistenceTemplate(template);
      }
      if (fieldName === 'inner-blocks-preset') {
        return template === 'compound';
      }
      if (fieldName === 'data-storage' || fieldName === 'persistence-policy') {
        return isAddPersistenceTemplate(template);
      }
      return true;
    }),
});
