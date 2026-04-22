import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'

import {
  getBuiltInTemplateLayerDirs,
  isOmittableBuiltInTemplateLayerDir,
} from './template-builtins.js'
import { copyRawDirectory } from './template-render.js'
import { createManagedTempRoot } from './temp-roots.js'
import type {
  ResolvedTemplateSource,
  SeedSource,
  TemplateVariableContext,
} from './template-source-contracts.js'

async function cleanupSeedRootPair(
  cleanup: () => Promise<void>,
  seedCleanup?: (() => Promise<void>) | undefined,
): Promise<void> {
  let cleanupError: unknown

  try {
    await cleanup()
  } catch (error) {
    cleanupError = error
  }

  try {
    await seedCleanup?.()
  } catch (error) {
    cleanupError ??= error
  }

  if (cleanupError !== undefined) {
    throw cleanupError
  }
}

function getDefaultCategoryFromBlockJson(
  blockJson: Record<string, unknown>,
): string {
  return typeof blockJson.category === 'string' &&
    blockJson.category.trim().length > 0
    ? blockJson.category.trim()
    : 'widgets'
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

/**
 * Read a remote block source and return its default block category.
 *
 * @param sourceDir Block source directory that may contain a block.json file.
 * @returns The declared block category, or "widgets" when detection fails.
 */
export function getDefaultCategory(sourceDir: string): string {
  try {
    const blockJson = readRemoteBlockJson(sourceDir)
    return getDefaultCategoryFromBlockJson(blockJson)
  } catch {
    return 'widgets'
  }
}

function readTemplatePackageJson(
  sourceDir: string,
): { wpTypia?: { projectType?: string } } | null {
  for (const candidate of [
    path.join(sourceDir, 'package.json.mustache'),
    path.join(sourceDir, 'package.json'),
  ]) {
    if (!fs.existsSync(candidate)) {
      continue
    }

    try {
      return JSON.parse(fs.readFileSync(candidate, 'utf8')) as {
        wpTypia?: { projectType?: string }
      }
    } catch {
      continue
    }
  }

  return null
}

/**
 * Read `wpTypia.projectType` from a rendered or source template package
 * manifest and return it when present.
 */
export function getTemplateProjectType(sourceDir: string): string | null {
  const packageJson = readTemplatePackageJson(sourceDir)
  return typeof packageJson?.wpTypia?.projectType === 'string'
    ? packageJson.wpTypia.projectType
    : null
}

/**
 * Copy a wp-typia seed into a normalized temporary template directory.
 *
 * @param seed Seed source whose files should be normalized into a temp root.
 * @returns A cloned seed whose cleanup removes the temp root and original seed.
 */
export async function normalizeWpTypiaTemplateSeed(
  seed: SeedSource,
): Promise<SeedSource> {
  const { path: tempRoot, cleanup } = await createManagedTempRoot(
    'wp-typia-template-source-',
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
    if (seed.assetsDir && fs.existsSync(seed.assetsDir)) {
      await fsp.cp(seed.assetsDir, path.join(normalizedDir, 'assets'), {
        recursive: true,
        force: true,
      })
    }
  } catch (error) {
    await Promise.allSettled([cleanup(), seed.cleanup?.()])
    throw error
  }

  return {
    blockDir: normalizedDir,
    cleanup: async () => cleanupSeedRootPair(cleanup, seed.cleanup),
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

/**
 * Convert a create-block subset seed into a normalized wp-typia template source.
 *
 * @param seed Seed source produced from a remote create-block subset.
 * @param context Template variable context used for generated artifacts.
 * @returns A normalized template source rooted in a temporary directory.
 */
export async function normalizeCreateBlockSubset(
  seed: SeedSource,
  context: TemplateVariableContext,
): Promise<ResolvedTemplateSource> {
  const { path: tempRoot, cleanup } = await createManagedTempRoot(
    'wp-typia-remote-template-',
  )
  try {
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
      cleanup: async () => cleanupSeedRootPair(cleanup, seed.cleanup),
    }
  } catch (error) {
    await Promise.allSettled([cleanup(), seed.cleanup?.()])
    throw error
  }
}
