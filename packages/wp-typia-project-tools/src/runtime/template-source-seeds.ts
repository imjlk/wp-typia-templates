import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import semver from 'semver'
import { x as extractTarball } from 'tar'

import {
  createExternalTemplateTimeoutError,
  fetchWithExternalTemplateTimeout,
  getExternalTemplateMetadataMaxBytes,
  getExternalTemplateTarballMaxBytes,
  getExternalTemplateTimeoutMs,
  readBufferResponseWithLimit,
  readJsonResponseWithLimit,
} from './external-template-guards.js'
import {
  OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
  PROJECT_TOOLS_PACKAGE_ROOT,
} from './template-registry.js'
import { isPlainObject } from './object-utils.js'
import { createManagedTempRoot } from './temp-roots.js'
import type {
  GitHubTemplateLocator,
  NpmTemplateLocator,
  RemoteTemplateLocator,
  SeedSource,
} from './template-source-contracts.js'

function selectRegistryVersion(
  metadata: Record<string, unknown>,
  locator: NpmTemplateLocator,
): string {
  const distTags = isPlainObject(metadata['dist-tags'])
    ? metadata['dist-tags']
    : {}
  const versions = isPlainObject(metadata.versions) ? metadata.versions : {}
  const versionKeys = Object.keys(versions)

  if (locator.type === 'version') {
    if (!versions[locator.fetchSpec]) {
      throw new Error(`npm template package version not found: ${locator.raw}`)
    }
    return locator.fetchSpec
  }

  if (locator.type === 'tag') {
    const taggedVersion = distTags[locator.fetchSpec]
    if (typeof taggedVersion !== 'string') {
      throw new Error(`npm template package tag not found: ${locator.raw}`)
    }
    return taggedVersion
  }

  const range = locator.fetchSpec.trim().length > 0 ? locator.fetchSpec : '*'
  const matchedVersion = semver.maxSatisfying(versionKeys, range)
  if (matchedVersion) {
    return matchedVersion
  }

  if (locator.fetchSpec.trim().length > 0) {
    throw new Error(
      `Unable to resolve npm template version for ${locator.raw}. Requested "${locator.fetchSpec}" but available versions are: ${versionKeys.join(', ') || '(none)'}.`,
    )
  }

  const latestVersion = distTags.latest
  if (typeof latestVersion === 'string' && versions[latestVersion]) {
    return latestVersion
  }

  throw new Error(
    `Unable to resolve a published npm template version for ${locator.raw}.`,
  )
}

async function fetchNpmTemplateSource(
  locator: NpmTemplateLocator,
): Promise<SeedSource> {
  const registryBase = (
    process.env.NPM_CONFIG_REGISTRY ?? 'https://registry.npmjs.org'
  ).replace(/\/$/, '')
  const metadataLabel = `fetching npm template metadata for ${locator.raw}`
  const metadataResponse = await fetchWithExternalTemplateTimeout(
    `${registryBase}/${encodeURIComponent(locator.name)}`,
    {
      label: metadataLabel,
    },
  )
  if (!metadataResponse.ok) {
    throw new Error(
      `Failed to fetch npm template metadata for ${locator.raw}: ${metadataResponse.status}`,
    )
  }

  const metadata = await readJsonResponseWithLimit(metadataResponse, {
    label: `npm template metadata for ${locator.raw}`,
    maxBytes: getExternalTemplateMetadataMaxBytes(),
  })
  const resolvedVersion = selectRegistryVersion(metadata, locator)
  const versions = isPlainObject(metadata.versions) ? metadata.versions : {}
  const versionMetadata = versions[resolvedVersion]
  if (!isPlainObject(versionMetadata) || !isPlainObject(versionMetadata.dist)) {
    throw new Error(
      `npm template metadata is missing dist information for ${locator.raw}@${resolvedVersion}.`,
    )
  }

  const tarballUrl = versionMetadata.dist.tarball
  if (typeof tarballUrl !== 'string' || tarballUrl.length === 0) {
    throw new Error(
      `npm template metadata is missing tarball URL for ${locator.raw}@${resolvedVersion}.`,
    )
  }

  const { path: tempRoot, cleanup } = await createManagedTempRoot(
    'wp-typia-template-source-',
  )

  try {
    const tarballResponse = await fetchWithExternalTemplateTimeout(tarballUrl, {
      label: `downloading npm template tarball for ${locator.raw}@${resolvedVersion}`,
    })
    if (!tarballResponse.ok) {
      throw new Error(
        `Failed to download npm template tarball for ${locator.raw}: ${tarballResponse.status}`,
      )
    }

    const tarballPath = path.join(tempRoot, 'template.tgz')
    const unpackDir = path.join(tempRoot, 'source')
    await fsp.mkdir(unpackDir, { recursive: true })
    await fsp.writeFile(
      tarballPath,
      await readBufferResponseWithLimit(tarballResponse, {
        label: `npm template tarball for ${locator.raw}@${resolvedVersion}`,
        maxBytes: getExternalTemplateTarballMaxBytes(),
      }),
    )
    await extractTarball({
      cwd: unpackDir,
      file: tarballPath,
      strip: 1,
    })
    await assertNoSymlinks(unpackDir)

    return {
      blockDir: unpackDir,
      cleanup,
      rootDir: unpackDir,
    }
  } catch (error) {
    await cleanup()
    throw error
  }
}

/**
 * Resolve a locally installed npm template package from the caller workspace.
 *
 * Bare package ids are preferred here so monorepo and offline workflows can
 * use an already-installed template without forcing a registry fetch.
 */
function resolveInstalledNpmTemplateSource(
  locator: NpmTemplateLocator,
  cwd: string,
): SeedSource | null {
  if (locator.rawSpec !== '' && locator.rawSpec !== '*') {
    return null
  }

  const workspacePackagesRoot = path.resolve(PROJECT_TOOLS_PACKAGE_ROOT, '..')
  if (fs.existsSync(workspacePackagesRoot)) {
    for (const entry of fs.readdirSync(workspacePackagesRoot, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) {
        continue
      }

      const packageDir = path.join(workspacePackagesRoot, entry.name)
      const packageJsonPath = path.join(packageDir, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        continue
      }

      const manifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        name?: string
      }
      if (manifest.name === locator.name) {
        return {
          blockDir: packageDir,
          rootDir: packageDir,
        }
      }
    }
  }

  const workspaceRequire = createRequire(
    path.join(path.resolve(cwd), '__wp_typia_template_resolver__.cjs'),
  )
  try {
    const packageJsonPath = fs.realpathSync(
      workspaceRequire.resolve(`${locator.name}/package.json`),
    )
    const sourceDir = path.dirname(packageJsonPath)
    return {
      blockDir: sourceDir,
      rootDir: sourceDir,
    }
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''
    if (
      errorCode === 'MODULE_NOT_FOUND' ||
      errorCode === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    ) {
      for (const basePath of workspaceRequire.resolve.paths(locator.name) ??
        []) {
        const packageJsonPath = path.join(
          basePath,
          locator.name,
          'package.json',
        )
        if (!fs.existsSync(packageJsonPath)) {
          continue
        }
        const sourceDir = path.dirname(fs.realpathSync(packageJsonPath))
        return {
          blockDir: sourceDir,
          rootDir: sourceDir,
        }
      }
      return null
    }
    throw error
  }
}

export function isOfficialWorkspaceTemplateSeed(seed: SeedSource): boolean {
  const packageJsonPath = path.join(seed.rootDir, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8'),
    ) as { name?: string }
    return packageJson.name === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
  } catch {
    return false
  }
}

export async function assertNoSymlinks(sourceDir: string): Promise<void> {
  const stats = await fsp.lstat(sourceDir)
  if (stats.isSymbolicLink()) {
    throw new Error(
      `Template sources may not include symbolic links: ${sourceDir}`,
    )
  }

  if (!stats.isDirectory()) {
    return
  }

  for (const entry of await fsp.readdir(sourceDir)) {
    await assertNoSymlinks(path.join(sourceDir, entry))
  }
}

async function resolveGitHubTemplateSource(
  locator: GitHubTemplateLocator,
): Promise<SeedSource> {
  const { path: remoteRoot, cleanup } = await createManagedTempRoot(
    'wp-typia-template-source-',
  )
  const checkoutDir = path.join(remoteRoot, 'source')

  try {
    const args = ['clone', '--depth', '1']
    if (locator.ref) {
      args.push('--branch', locator.ref)
    }
    args.push(
      `https://github.com/${locator.owner}/${locator.repo}.git`,
      checkoutDir,
    )
    const cloneTimeoutMs = getExternalTemplateTimeoutMs()
    const cloneResult = spawnSync('git', args, {
      stdio: 'ignore',
      timeout: cloneTimeoutMs,
    })
    if (cloneResult.error) {
      const errorCode =
        typeof cloneResult.error === 'object' &&
        cloneResult.error !== null &&
        'code' in cloneResult.error
          ? String((cloneResult.error as { code: unknown }).code)
          : ''
      if (errorCode === 'ETIMEDOUT') {
        throw createExternalTemplateTimeoutError(
          `cloning GitHub template ${locator.owner}/${locator.repo}`,
          cloneTimeoutMs,
        )
      }
      throw cloneResult.error
    }
    if (
      cloneResult.signal === 'SIGTERM' ||
      cloneResult.signal === 'SIGKILL'
    ) {
      throw createExternalTemplateTimeoutError(
        `cloning GitHub template ${locator.owner}/${locator.repo}`,
        cloneTimeoutMs,
      )
    }
    if (cloneResult.status !== 0) {
      throw new Error(
        `Failed to clone GitHub template source ${locator.owner}/${locator.repo}.`,
      )
    }

    const sourceDir = path.resolve(checkoutDir, locator.sourcePath)
    const relativeSourceDir = path.relative(checkoutDir, sourceDir)
    if (
      relativeSourceDir.startsWith('..') ||
      path.isAbsolute(relativeSourceDir)
    ) {
      throw new Error(
        'GitHub template path must stay within the cloned repository.',
      )
    }
    if (!fs.existsSync(sourceDir)) {
      throw new Error(
        `GitHub template path does not exist: ${locator.sourcePath}`,
      )
    }
    await assertNoSymlinks(sourceDir)

    return {
      blockDir: sourceDir,
      cleanup,
      rootDir: sourceDir,
    }
  } catch (error) {
    await cleanup()
    throw error
  }
}

/**
 * Resolves a template locator into a local seed source directory.
 *
 * @param locator Remote template locator describing a local path, GitHub source, or npm package.
 * @param cwd Current working directory used to resolve local template paths.
 * @returns A local seed source containing the resolved root and block directory, plus optional cleanup.
 * @throws When the locator is invalid, the source cannot be fetched, or filesystem validation fails.
 */
export async function resolveTemplateSeed(
  locator: RemoteTemplateLocator,
  cwd: string,
): Promise<SeedSource> {
  if (locator.kind === 'path') {
    const sourceDir = path.resolve(cwd, locator.templatePath)
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Template path does not exist: ${sourceDir}`)
    }
    await assertNoSymlinks(sourceDir)
    return {
      blockDir: sourceDir,
      rootDir: sourceDir,
    }
  }

  if (locator.kind === 'github') {
    return resolveGitHubTemplateSource(locator.locator)
  }

  const installedSource = resolveInstalledNpmTemplateSource(
    locator.locator,
    cwd,
  )
  if (installedSource) {
    await assertNoSymlinks(installedSource.blockDir)
    return installedSource
  }

  return fetchNpmTemplateSource(locator.locator)
}
