/// <reference path="./external-template-modules.d.ts" />

import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  assertExternalTemplateFileSize,
  getExternalTemplateConfigMaxBytes,
  withExternalTemplateTimeout,
} from './external-template-guards.js'
import { isPlainObject, type UnknownRecord } from './object-utils.js'
import { toSegmentPascalCase } from './string-case.js'
import { createManagedTempRoot } from './temp-roots.js'
import { copyRawDirectory, copyRenderedDirectory } from './template-render.js'
import type {
  ExternalTemplateConfig,
  SeedSource,
  TemplateVariableContext,
} from './template-source-contracts.js'

/**
 * Candidate filenames for official external template config entrypoints.
 */
export const EXTERNAL_TEMPLATE_ENTRY_CANDIDATES = [
  'index.js',
  'index.cjs',
  'index.mjs',
] as const
export const EXTERNAL_TEMPLATE_TRUST_WARNING =
  'External template configs execute trusted JavaScript during scaffolding. Review the template source before using local paths, GitHub repos, or npm packages you do not already trust.'
const TEMPLATE_WARNING_MESSAGE =
  'wp-typia owns package/tooling/sync setup for generated projects, so this external template setting is ignored.'

function getTemplateWarning(key: string): string {
  return `Ignoring external template config key "${key}": ${TEMPLATE_WARNING_MESSAGE}`
}

function resolveSourceSubpath(sourceDir: string, relativePath: string): string {
  const targetPath = path.resolve(sourceDir, relativePath)
  const relativeTarget = path.relative(sourceDir, targetPath)
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    throw new Error(
      `Template path "${relativePath}" must stay within ${sourceDir}.`,
    )
  }
  return targetPath
}

/**
 * Search a source directory for the first supported external template entry.
 *
 * @param sourceDir Directory that may contain an external template config entry.
 * @returns The first matching entry path, or null when no supported entry exists.
 */
export function getExternalTemplateEntry(sourceDir: string): string | null {
  for (const filename of EXTERNAL_TEMPLATE_ENTRY_CANDIDATES) {
    const candidate = path.join(sourceDir, filename)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

async function loadExternalTemplateConfig<
  TView extends UnknownRecord = TemplateVariableContext,
>(
  sourceDir: string,
): Promise<{
  config: ExternalTemplateConfig<TView>
  warnings: string[]
}> {
  const entryPath = getExternalTemplateEntry(sourceDir)
  if (!entryPath) {
    throw new Error(`No external template config entry found in ${sourceDir}.`)
  }

  assertExternalTemplateFileSize(entryPath, {
    label: `External template config "${entryPath}"`,
    maxBytes: getExternalTemplateConfigMaxBytes(),
  })
  const moduleUrl = `${pathToFileURL(entryPath).href}?mtime=${fs.statSync(entryPath).mtimeMs}`
  const loadedModule = (await withExternalTemplateTimeout(
    `loading external template config "${entryPath}"`,
    import(moduleUrl),
  )) as Record<string, unknown>
  const loadedConfig = loadedModule.default ?? loadedModule
  if (!isPlainObject(loadedConfig)) {
    throw new Error(
      `External template config must export an object: ${entryPath}`,
    )
  }

  const warnings: string[] = [EXTERNAL_TEMPLATE_TRUST_WARNING]
  for (const ignoredKey of [
    'wpScripts',
    'wpEnv',
    'customScripts',
    'npmDependencies',
    'npmDevDependencies',
    'customPackageJSON',
    'pluginReadme',
    'pluginHeader',
  ]) {
    if (ignoredKey in loadedConfig) {
      warnings.push(getTemplateWarning(ignoredKey))
    }
  }

  return {
    config: loadedConfig as ExternalTemplateConfig<TView>,
    warnings,
  }
}

function getVariantFlagName(variantName: string): string {
  return `is${toSegmentPascalCase(variantName)}Variant`
}

function getVariantKeys<TView extends UnknownRecord>(
  config: ExternalTemplateConfig<TView>,
): string[] {
  return isPlainObject(config.variants) ? Object.keys(config.variants) : []
}

function getVariantConfig<TView extends UnknownRecord>(
  config: ExternalTemplateConfig<TView>,
  requestedVariant?: string,
): {
  selectedVariant: string | null
  variantConfig: Partial<TView>
} {
  const variantKeys = getVariantKeys(config)
  if (variantKeys.length === 0) {
    if (requestedVariant) {
      throw new Error(
        `Variant "${requestedVariant}" was requested, but the external template does not define any variants.`,
      )
    }

    return {
      selectedVariant: null,
      variantConfig: {},
    }
  }

  const selectedVariant = requestedVariant ?? variantKeys[0]
  if (!selectedVariant || !isPlainObject(config.variants?.[selectedVariant])) {
    throw new Error(
      `Unknown template variant "${requestedVariant}". Expected one of: ${variantKeys.join(', ')}`,
    )
  }

  return {
    selectedVariant,
    variantConfig: config.variants?.[selectedVariant] ?? {},
  }
}

function extractVariantRenderValues<TView extends UnknownRecord>(
  variantConfig: Partial<TView>,
): Partial<TView> {
  const values = { ...variantConfig }
  delete values.assetsPath
  delete values.blockTemplatesPath
  delete values.folderName
  delete values.pluginTemplatesPath
  delete values.transformer
  return values
}

function resolveConfiguredTemplatePath<TView extends UnknownRecord>(
  config: ExternalTemplateConfig<TView>,
  variantConfig: Partial<TView>,
): {
  folderName: string
  formatHint: 'create-block-subset' | 'wp-typia'
  templatePath: string
} {
  const variantPluginTemplatesPath =
    typeof variantConfig.pluginTemplatesPath === 'string'
      ? variantConfig.pluginTemplatesPath
      : null
  const variantBlockTemplatesPath =
    typeof variantConfig.blockTemplatesPath === 'string'
      ? variantConfig.blockTemplatesPath
      : null
  const configBlockTemplatesPath =
    typeof config.blockTemplatesPath === 'string'
      ? config.blockTemplatesPath
      : null
  const configPluginTemplatesPath =
    typeof config.pluginTemplatesPath === 'string'
      ? config.pluginTemplatesPath
      : null

  const templatePath =
    variantPluginTemplatesPath ??
    variantBlockTemplatesPath ??
    configBlockTemplatesPath ??
    configPluginTemplatesPath
  if (!templatePath) {
    throw new Error(
      'External template config must define blockTemplatesPath or pluginTemplatesPath.',
    )
  }

  const configuredFolderName =
    (typeof variantConfig.folderName === 'string'
      ? variantConfig.folderName
      : config.folderName) ?? null

  return {
    folderName: configuredFolderName || '.',
    formatHint:
      templatePath === variantPluginTemplatesPath ||
      templatePath === configPluginTemplatesPath
        ? 'wp-typia'
        : 'create-block-subset',
    templatePath,
  }
}

async function buildExternalTemplateView(
  context: TemplateVariableContext,
  config: ExternalTemplateConfig<TemplateVariableContext>,
  selectedVariant: string | null,
  variantConfig: Partial<TemplateVariableContext>,
): Promise<TemplateVariableContext> {
  const mergedView: TemplateVariableContext = {
    ...(config.defaultValues ?? {}),
    ...extractVariantRenderValues(variantConfig),
    ...context,
  }

  if (selectedVariant) {
    mergedView.variant = selectedVariant
    mergedView[getVariantFlagName(selectedVariant)] = true
  }

  if (!config.transformer) {
    return mergedView
  }

  const transformed = await withExternalTemplateTimeout(
    `running external template transformer for "${context.slug}"`,
    Promise.resolve(config.transformer(mergedView)),
  )
  if (!isPlainObject(transformed)) {
    throw new Error(
      'External template transformer(view) must return an object.',
    )
  }

  return {
    ...mergedView,
    ...transformed,
  }
}

/**
 * Load an official external template config and render its seed.
 *
 * @param sourceDir Source directory that contains the external template config.
 * @param context Template render context used for the selected variant.
 * @param requestedVariant Optional explicit variant override.
 * @returns A rendered temporary seed directory with optional assets and cleanup.
 */
export async function renderCreateBlockExternalTemplate(
  sourceDir: string,
  context: TemplateVariableContext,
  requestedVariant?: string,
): Promise<SeedSource> {
  const { config, warnings } = await loadExternalTemplateConfig(sourceDir)
  const { selectedVariant, variantConfig } = getVariantConfig(
    config,
    requestedVariant,
  )

  const { folderName, formatHint, templatePath } = resolveConfiguredTemplatePath(
    config,
    variantConfig,
  )

  const { path: tempRoot, cleanup } = await createManagedTempRoot(
    'wp-typia-create-block-external-',
  )

  try {
    const renderedRoot = path.join(tempRoot, 'rendered')
    const blockDir = resolveSourceSubpath(renderedRoot, folderName)
    const view = await buildExternalTemplateView(
      context,
      config,
      selectedVariant,
      variantConfig,
    )
    const blockTemplateDir = resolveSourceSubpath(sourceDir, templatePath)
    await copyRenderedDirectory(blockTemplateDir, blockDir, view, {
      filter: (sourcePath, _destinationPath, entry) => {
        const mustacheVariantPath = path.join(
          path.dirname(sourcePath),
          `${entry.name}.mustache`,
        )
        return !(
          entry.isFile() &&
          (entry.name === 'package.json' || entry.name === 'README.md') &&
          fs.existsSync(mustacheVariantPath)
        )
      },
    })

    const assetsPath =
      typeof variantConfig.assetsPath === 'string'
        ? variantConfig.assetsPath
        : config.assetsPath
    if (typeof assetsPath === 'string' && assetsPath.trim().length > 0) {
      await copyRawDirectory(
        resolveSourceSubpath(sourceDir, assetsPath),
        path.join(tempRoot, 'assets'),
      )
    }

    return {
      assetsDir: fs.existsSync(path.join(tempRoot, 'assets'))
        ? path.join(tempRoot, 'assets')
        : undefined,
      blockDir,
      cleanup,
      formatHint,
      rootDir: tempRoot,
      selectedVariant,
      warnings,
    }
  } catch (error) {
    await cleanup()
    throw error
  }
}
