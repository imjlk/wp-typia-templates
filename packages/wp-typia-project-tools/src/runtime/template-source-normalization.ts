/// <reference path="./external-template-modules.d.ts" />

import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  getBuiltInTemplateLayerDirs,
  isOmittableBuiltInTemplateLayerDir,
} from './template-builtins.js'
import { loadExternalTemplateLayerManifest } from './template-layers.js'
import { getPackageVersions } from './package-versions.js'
import { isPlainObject, type UnknownRecord } from './object-utils.js'
import { toSegmentPascalCase } from './string-case.js'
import { copyRawDirectory, copyRenderedDirectory } from './template-render.js'
import type {
  ExternalTemplateConfig,
  ResolvedTemplateSource,
  SeedSource,
  TemplateSourceFormat,
  TemplateVariableContext,
} from './template-source-contracts.js'

const EXTERNAL_TEMPLATE_ENTRY_CANDIDATES = [
  'index.js',
  'index.cjs',
  'index.mjs',
] as const
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

function getExternalTemplateEntry(sourceDir: string): string | null {
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

  const moduleUrl = `${pathToFileURL(entryPath).href}?mtime=${fs.statSync(entryPath).mtimeMs}`
  const loadedModule = (await import(moduleUrl)) as Record<string, unknown>
  const loadedConfig = loadedModule.default ?? loadedModule
  if (!isPlainObject(loadedConfig)) {
    throw new Error(
      `External template config must export an object: ${entryPath}`,
    )
  }

  const warnings: string[] = []
  for (const ignoredKey of [
    'pluginTemplatesPath',
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
  delete values.transformer
  return values
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

  const transformed = await config.transformer(mergedView)
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

  const blockTemplatesPath =
    (typeof variantConfig.blockTemplatesPath === 'string'
      ? variantConfig.blockTemplatesPath
      : config.blockTemplatesPath) ?? null
  if (!blockTemplatesPath) {
    throw new Error('External template config must define blockTemplatesPath.')
  }

  const tempRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), 'wp-typia-create-block-external-'),
  )
  const cleanup = async () => {
    await fsp.rm(tempRoot, { force: true, recursive: true })
  }

  try {
    const renderedRoot = path.join(tempRoot, 'rendered')
    const folderName =
      (typeof variantConfig.folderName === 'string'
        ? variantConfig.folderName
        : config.folderName) || '.'
    const blockDir = resolveSourceSubpath(renderedRoot, folderName)
    const view = await buildExternalTemplateView(
      context,
      config,
      selectedVariant,
      variantConfig,
    )
    const blockTemplateDir = resolveSourceSubpath(
      sourceDir,
      blockTemplatesPath,
    )
    await copyRenderedDirectory(blockTemplateDir, blockDir, view)

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
      rootDir: tempRoot,
      selectedVariant,
      warnings,
    }
  } catch (error) {
    await cleanup()
    throw error
  }
}

export function getTemplateVariableContext(variables: {
  [key: string]: string
}): TemplateVariableContext {
  const {
    apiClientPackageVersion,
    blockRuntimePackageVersion,
    blockTypesPackageVersion,
    projectToolsPackageVersion,
    restPackageVersion,
  } = getPackageVersions()
  return {
    ...variables,
    apiClientPackageVersion:
      variables.apiClientPackageVersion ?? apiClientPackageVersion,
    blockRuntimePackageVersion:
      variables.blockRuntimePackageVersion ?? blockRuntimePackageVersion,
    blockTypesPackageVersion:
      variables.blockTypesPackageVersion ?? blockTypesPackageVersion,
    projectToolsPackageVersion:
      variables.projectToolsPackageVersion ?? projectToolsPackageVersion,
    description: variables.description,
    keyword: variables.keyword,
    namespace: variables.namespace,
    pascalCase: variables.pascalCase,
    phpPrefix: variables.phpPrefix,
    restPackageVersion: variables.restPackageVersion ?? restPackageVersion,
    slug: variables.slug,
    textDomain: variables.textDomain,
    title: variables.title,
  }
}

export async function detectTemplateSourceFormat(
  sourceDir: string,
): Promise<TemplateSourceFormat> {
  if (fs.existsSync(path.join(sourceDir, 'package.json.mustache'))) {
    return 'wp-typia'
  }

  if (await loadExternalTemplateLayerManifest(sourceDir)) {
    throw new Error(
      `Template source at ${sourceDir} is an external layer package. External layers currently compose only through built-in scaffolds via the runtime API, not as standalone template ids.`,
    )
  }

  if (getExternalTemplateEntry(sourceDir)) {
    return 'create-block-external'
  }

  const sourceRoot = fs.existsSync(path.join(sourceDir, 'src'))
    ? path.join(sourceDir, 'src')
    : sourceDir
  const blockJsonCandidates = [
    path.join(sourceDir, 'block.json'),
    path.join(sourceRoot, 'block.json'),
  ]
  const hasBlockJson = blockJsonCandidates.some((candidate) =>
    fs.existsSync(candidate),
  )
  const hasIndexFile = ['index.js', 'index.jsx', 'index.ts', 'index.tsx'].some(
    (filename) => fs.existsSync(path.join(sourceRoot, filename)),
  )
  const hasEditFile = ['edit.js', 'edit.jsx', 'edit.ts', 'edit.tsx'].some(
    (filename) => fs.existsSync(path.join(sourceRoot, filename)),
  )
  const hasSaveFile = ['save.js', 'save.jsx', 'save.ts', 'save.tsx'].some(
    (filename) => fs.existsSync(path.join(sourceRoot, filename)),
  )

  if (hasBlockJson && hasIndexFile && hasEditFile && hasSaveFile) {
    return 'create-block-subset'
  }

  throw new Error(
    `Unsupported template source at ${sourceDir}. Expected a wp-typia template directory, an official create-block external template config, or a create-block subset with block.json and src/index/edit/save files.`,
  )
}

function getDefaultCategoryFromBlockJson(
  blockJson: Record<string, unknown>,
): string {
  return typeof blockJson.category === 'string' &&
    blockJson.category.trim().length > 0
    ? blockJson.category.trim()
    : 'widgets'
}

export function getDefaultCategory(sourceDir: string): string {
  try {
    const blockJson = readRemoteBlockJson(sourceDir)
    return getDefaultCategoryFromBlockJson(blockJson)
  } catch {
    return 'widgets'
  }
}

export async function normalizeWpTypiaTemplateSeed(
  seed: SeedSource,
): Promise<SeedSource> {
  const tempRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), 'wp-typia-template-source-'),
  )
  const normalizedDir = path.join(tempRoot, 'template')
  try {
    await copyRawDirectory(seed.blockDir, normalizedDir, {
      filter: (sourcePath, _targetPath, entry) => {
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
  } catch (error) {
    await fsp.rm(tempRoot, { force: true, recursive: true })
    throw error
  }

  return {
    blockDir: normalizedDir,
    cleanup: async () => {
      await fsp.rm(tempRoot, { force: true, recursive: true })
      await seed.cleanup?.()
    },
    rootDir: normalizedDir,
    selectedVariant: seed.selectedVariant,
    warnings: seed.warnings,
  }
}

function renderTypeScriptLiteral(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return 'undefined'
}

function renderTagsForAttribute(attribute: Record<string, unknown>): string[] {
  const tags: string[] = []
  if (
    typeof attribute.default === 'string' ||
    typeof attribute.default === 'number' ||
    typeof attribute.default === 'boolean'
  ) {
    tags.push(`tags.Default<${renderTypeScriptLiteral(attribute.default)}>`)
  }
  return tags
}

function renderAttributeBaseType(
  attributeName: string,
  attribute: Record<string, unknown>,
): string {
  if (Array.isArray(attribute.enum) && attribute.enum.length > 0) {
    return attribute.enum
      .map((item) => renderTypeScriptLiteral(item))
      .join(' | ')
  }

  switch (attribute.type) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return 'unknown[]'
    case 'object':
      return 'Record<string, unknown>'
    default:
      if (
        typeof attributeName === 'string' &&
        attributeName.toLowerCase().includes('class')
      ) {
        return 'string'
      }
      return 'unknown'
  }
}

function buildRemoteTypesSource(
  blockJson: Record<string, unknown>,
  context: TemplateVariableContext,
): string {
  const attributes = (blockJson.attributes ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  const lines = [
    'import { tags } from "typia";',
    '',
    `export interface ${context.pascalCase}Attributes {`,
  ]

  for (const [name, attribute] of Object.entries(attributes)) {
    const baseType = renderAttributeBaseType(name, attribute)
    const tagList = renderTagsForAttribute(attribute)
    const baseTypeWithGrouping =
      tagList.length > 0 && baseType.includes(' | ')
        ? `(${baseType})`
        : baseType
    const renderedType = [baseTypeWithGrouping, ...tagList].join(' & ')
    lines.push(`  ${JSON.stringify(name)}?: ${renderedType};`)
  }

  lines.push('}', '')
  return lines.join('\n')
}

function buildRemoteBlockJsonTemplate(
  blockJson: Record<string, unknown>,
): string {
  const merged: Record<string, unknown> = {
    ...blockJson,
    description: '{{description}}',
    name: '{{namespace}}/{{slug}}',
    textdomain: '{{textDomain}}',
    title: '{{title}}',
  }

  if (!Array.isArray(merged.keywords) || merged.keywords.length === 0) {
    merged.keywords = ['{{keyword}}', 'typia', 'block']
  }

  return `${JSON.stringify(merged, null, '\t')}\n`
}

async function rewriteBlockJsonImports(directory: string): Promise<void> {
  const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx'])
  const targetBlockJsonPath = path.join(directory, 'block.json')

  async function visit(currentPath: string): Promise<void> {
    const stats = await fsp.stat(currentPath)
    if (stats.isDirectory()) {
      const entries = await fsp.readdir(currentPath)
      for (const entry of entries) {
        await visit(path.join(currentPath, entry))
      }
      return
    }

    if (!textExtensions.has(path.extname(currentPath))) {
      return
    }

    const content = await fsp.readFile(currentPath, 'utf8')
    const relativeSpecifier = path
      .relative(path.dirname(currentPath), targetBlockJsonPath)
      .replace(/\\/g, '/')
    const normalizedSpecifier = relativeSpecifier.startsWith('.')
      ? relativeSpecifier
      : `./${relativeSpecifier}`
    const next = content.replace(
      /(['"])\.{1,2}\/[^'"]*block\.json\1/g,
      `$1${normalizedSpecifier}$1`,
    )
    if (next !== content) {
      await fsp.writeFile(currentPath, next, 'utf8')
    }
  }

  await visit(directory)
}

async function patchRemotePackageJson(
  templateDir: string,
  needsInteractivity: boolean,
): Promise<void> {
  const packageJsonPath = path.join(templateDir, 'package.json.mustache')
  const packageJson = JSON.parse(
    await fsp.readFile(packageJsonPath, 'utf8'),
  ) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const existingDependencies = { ...(packageJson.dependencies ?? {}) }
  const existingDevDependencies = { ...(packageJson.devDependencies ?? {}) }

  delete existingDependencies['@wp-typia/project-tools']
  delete existingDevDependencies['@wp-typia/project-tools']

  packageJson.devDependencies = {
    '@wp-typia/block-runtime': '{{blockRuntimePackageVersion}}',
    '@wp-typia/block-types': '{{blockTypesPackageVersion}}',
    ...existingDevDependencies,
  }

  if (needsInteractivity) {
    packageJson.dependencies = {
      ...existingDependencies,
      '@wordpress/interactivity': '^6.29.0',
    }
  } else if (Object.keys(existingDependencies).length > 0) {
    packageJson.dependencies = existingDependencies
  } else {
    delete packageJson.dependencies
  }

  await fsp.writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    'utf8',
  )
}

function getSeedSourceRoot(blockDir: string): string {
  return fs.existsSync(path.join(blockDir, 'src'))
    ? path.join(blockDir, 'src')
    : blockDir
}

function findSeedRenderPhp(seed: SeedSource): string | null {
  for (const candidate of [
    path.join(seed.blockDir, 'render.php'),
    path.join(seed.rootDir, 'render.php'),
  ]) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

async function removeSeedEntryConflicts(templateDir: string): Promise<void> {
  for (const filename of [
    'block.json',
    'block.json.mustache',
    'edit.js',
    'edit.jsx',
    'edit.ts',
    'edit.tsx',
    'edit.tsx.mustache',
    'hooks.ts',
    'hooks.ts.mustache',
    'index.js',
    'index.jsx',
    'index.ts',
    'index.tsx',
    'index.tsx.mustache',
    'save.js',
    'save.jsx',
    'save.ts',
    'save.tsx',
    'save.tsx.mustache',
    'style.css',
    'style.scss',
    'style.scss.mustache',
    'types.ts',
    'types.ts.mustache',
    'validators.ts',
    'validators.ts.mustache',
    'view.js',
    'view.jsx',
    'view.ts',
    'view.tsx',
  ]) {
    await fsp.rm(path.join(templateDir, 'src', filename), { force: true })
  }
}

function readRemoteBlockJson(blockDir: string): Record<string, unknown> {
  const sourceRoot = fs.existsSync(path.join(blockDir, 'src'))
    ? path.join(blockDir, 'src')
    : blockDir
  for (const candidate of [
    path.join(blockDir, 'block.json'),
    path.join(sourceRoot, 'block.json'),
  ]) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8')) as Record<
        string,
        unknown
      >
    }
  }

  throw new Error(`Unable to locate block.json in ${blockDir}`)
}

export async function normalizeCreateBlockSubset(
  seed: SeedSource,
  context: TemplateVariableContext,
): Promise<ResolvedTemplateSource> {
  const tempRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), 'wp-typia-remote-template-'),
  )
  const templateDir = path.join(tempRoot, 'template')
  const blockJson = readRemoteBlockJson(seed.blockDir)
  const sourceRoot = getSeedSourceRoot(seed.blockDir)

  await fsp.mkdir(templateDir, { recursive: true })
  for (const layerDir of getBuiltInTemplateLayerDirs('basic')) {
    if (!fs.existsSync(layerDir)) {
      if (isOmittableBuiltInTemplateLayerDir('basic', layerDir)) {
        continue
      }
      throw new Error(`Built-in template layer is missing: ${layerDir}`)
    }
    await fsp.cp(layerDir, templateDir, {
      recursive: true,
      force: true,
    })
  }
  await removeSeedEntryConflicts(templateDir)
  await fsp.cp(sourceRoot, path.join(templateDir, 'src'), {
    recursive: true,
    force: true,
  })

  const remoteRenderPath = findSeedRenderPhp(seed)
  if (remoteRenderPath) {
    await fsp.copyFile(remoteRenderPath, path.join(templateDir, 'render.php'))
  }

  if (seed.assetsDir && fs.existsSync(seed.assetsDir)) {
    await fsp.cp(seed.assetsDir, path.join(templateDir, 'assets'), {
      recursive: true,
      force: true,
    })
  }

  await fsp.writeFile(
    path.join(templateDir, 'src', 'types.ts'),
    buildRemoteTypesSource(blockJson, context),
    'utf8',
  )
  await fsp.writeFile(
    path.join(templateDir, 'src', 'block.json'),
    buildRemoteBlockJsonTemplate(blockJson),
    'utf8',
  )
  await rewriteBlockJsonImports(path.join(templateDir, 'src'))

  const needsInteractivity =
    typeof blockJson.viewScriptModule === 'string' ||
    typeof blockJson.viewScript === 'string' ||
    fs.existsSync(path.join(templateDir, 'src', 'view.js')) ||
    fs.existsSync(path.join(templateDir, 'src', 'view.ts')) ||
    fs.existsSync(path.join(templateDir, 'src', 'view.tsx')) ||
    fs.existsSync(path.join(templateDir, 'src', 'interactivity.js')) ||
    fs.existsSync(path.join(templateDir, 'src', 'interactivity.ts'))

  await patchRemotePackageJson(templateDir, needsInteractivity)

  return {
    id: 'remote:create-block-subset',
    defaultCategory: getDefaultCategoryFromBlockJson(blockJson),
    description:
      'A wp-typia scaffold normalized from a create-block subset source',
    features: [
      'Remote source',
      'create-block adapter',
      'Typia metadata pipeline',
    ],
    format: 'create-block-subset',
    selectedVariant: seed.selectedVariant ?? null,
    templateDir,
    warnings: seed.warnings ?? [],
    cleanup: async () => {
      await fsp.rm(tempRoot, { force: true, recursive: true })
      if (seed.cleanup) {
        await seed.cleanup()
      }
    },
  }
}
