import {
  OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
  isBuiltInTemplateId,
} from './template-registry.js'
import { resolveBuiltInTemplateSource } from './template-builtins.js'
import type {
  ResolvedTemplateSource,
  SeedSource,
} from './template-source-contracts.js'
import {
  parseTemplateLocator,
} from './template-source-locators.js'
import {
  detectTemplateSourceFormat,
  getTemplateProjectType,
  getDefaultCategory,
  getTemplateVariableContext,
  normalizeCreateBlockSubset,
  normalizeWpTypiaTemplateSeed,
  renderCreateBlockExternalTemplate,
} from './template-source-normalization.js'
import {
  isOfficialWorkspaceTemplateSeed,
  resolveTemplateSeed,
} from './template-source-seeds.js'

export type {
  GitHubTemplateLocator,
  NpmTemplateLocator,
  RemoteTemplateLocator,
  ResolvedTemplateSource,
  TemplateSourceFormat,
  TemplateVariableContext,
} from './template-source-contracts.js'
export {
  parseGitHubTemplateLocator,
  parseNpmTemplateLocator,
  parseTemplateLocator,
} from './template-source-locators.js'
export { resolveTemplateSeed } from './template-source-seeds.js'

export async function resolveTemplateSource(
  templateId: string,
  cwd: string,
  variables: { [key: string]: string },
  variant?: string,
): Promise<ResolvedTemplateSource> {
  if (isBuiltInTemplateId(templateId)) {
    if (variant) {
      throw new Error(
        `--variant is only supported for official external template configs. Received variant "${variant}" for built-in template "${templateId}".`,
      )
    }
    return resolveBuiltInTemplateSource(templateId, {
      persistenceEnabled: variables.compoundPersistenceEnabled === 'true',
      persistencePolicy:
        variables.persistencePolicy === 'public' ? 'public' : 'authenticated',
    })
  }

  const locator = parseTemplateLocator(templateId)
  const context = getTemplateVariableContext(variables)
  const seed = await resolveTemplateSeed(locator, cwd)
  const isOfficialWorkspaceTemplate =
    templateId === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE ||
    isOfficialWorkspaceTemplateSeed(seed)
  let normalizedSeed: SeedSource | null = null

  try {
    const format = await detectTemplateSourceFormat(seed.blockDir)
    if (format === 'wp-typia') {
      if (variant) {
        throw new Error(
          `--variant is only supported for official external template configs. Received variant "${variant}" for "${templateId}".`,
        )
      }
      normalizedSeed = await normalizeWpTypiaTemplateSeed(seed)
      const supportsMigrationUi =
        getTemplateProjectType(seed.blockDir) === 'workspace'
      return {
        id: templateId,
        defaultCategory: getDefaultCategory(seed.blockDir),
        description: 'A remote wp-typia template source',
        features: ['Remote source', 'wp-typia format'],
        format,
        isOfficialWorkspaceTemplate,
        supportsMigrationUi,
        templateDir: normalizedSeed.blockDir,
        cleanup: normalizedSeed.cleanup,
      }
    }

    normalizedSeed =
      format === 'create-block-external'
        ? await renderCreateBlockExternalTemplate(
            seed.blockDir,
            context,
            variant,
          )
        : variant
          ? (() => {
              throw new Error(
                `--variant is only supported for official external template configs. Received variant "${variant}" for "${templateId}".`,
              )
            })()
          : seed

    if (format === 'create-block-external') {
      const renderedFormat =
        normalizedSeed.formatHint ??
        (await detectTemplateSourceFormat(normalizedSeed.blockDir))
      if (renderedFormat === 'wp-typia') {
        const normalized = await normalizeWpTypiaTemplateSeed(normalizedSeed)
        const supportsMigrationUi =
          getTemplateProjectType(normalizedSeed.blockDir) === 'workspace'
        return {
          cleanup: async () => {
            await normalized.cleanup?.()
            await seed.cleanup?.()
          },
          defaultCategory: getDefaultCategory(normalizedSeed.blockDir),
          description:
            'A wp-typia scaffold normalized from an official external template config',
          features: [
            'Remote source',
            'official external template',
            'wp-typia format',
            ...(supportsMigrationUi ? ['workspace-capable scaffold'] : []),
          ],
          format,
          id: 'remote:create-block-external',
          isOfficialWorkspaceTemplate,
          selectedVariant: normalizedSeed.selectedVariant ?? null,
          supportsMigrationUi,
          templateDir: normalized.blockDir,
          warnings: normalizedSeed.warnings ?? [],
        }
      }

      const normalized = await normalizeCreateBlockSubset(
        normalizedSeed,
        context,
      )
      return {
        ...normalized,
        cleanup: async () => {
          await normalized.cleanup?.()
          await seed.cleanup?.()
        },
        description:
          'A wp-typia scaffold normalized from an official create-block external template',
        features: [
          'Remote source',
          'official external template',
          'Typia metadata pipeline',
        ],
        format,
        id: 'remote:create-block-external',
        isOfficialWorkspaceTemplate,
        selectedVariant: normalizedSeed.selectedVariant ?? null,
        warnings: normalizedSeed.warnings ?? [],
      }
    }

    const normalized = await normalizeCreateBlockSubset(
      normalizedSeed,
      context,
    )
    return {
      ...normalized,
      isOfficialWorkspaceTemplate,
    }
  } catch (error) {
    if (normalizedSeed?.cleanup && normalizedSeed !== seed) {
      await normalizedSeed.cleanup()
    }
    if (seed.cleanup) {
      await seed.cleanup()
    }
    throw error
  }
}
