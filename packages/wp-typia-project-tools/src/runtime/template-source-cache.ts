import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const EXTERNAL_TEMPLATE_CACHE_ENV = 'WP_TYPIA_EXTERNAL_TEMPLATE_CACHE'
export const EXTERNAL_TEMPLATE_CACHE_DIR_ENV =
  'WP_TYPIA_EXTERNAL_TEMPLATE_CACHE_DIR'

const CACHE_MARKER_FILE = 'wp-typia-template-cache.json'
const DISABLED_CACHE_VALUES = new Set(['0', 'false', 'no', 'off'])

type ExternalTemplateCacheMetadata = Record<string, string | null>

export interface ExternalTemplateCacheDescriptor {
  keyParts: readonly string[]
  metadata: ExternalTemplateCacheMetadata
  namespace: string
}

export interface ExternalTemplateCacheResolution {
  cacheHit: boolean
  sourceDir: string
}

export function isExternalTemplateCacheEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const rawValue = env[EXTERNAL_TEMPLATE_CACHE_ENV]
  if (rawValue === undefined) {
    return true
  }

  return !DISABLED_CACHE_VALUES.has(rawValue.trim().toLowerCase())
}

export function getExternalTemplateCacheRoot(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configuredCacheDir = env[EXTERNAL_TEMPLATE_CACHE_DIR_ENV]?.trim()
  if (configuredCacheDir) {
    return path.resolve(configuredCacheDir)
  }

  return path.join(os.tmpdir(), 'wp-typia-template-source-cache')
}

export function createExternalTemplateCacheKey(
  keyParts: readonly string[],
): string {
  return createHash('sha256')
    .update(JSON.stringify(keyParts))
    .digest('hex')
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

function getCacheEntryPaths(
  descriptor: ExternalTemplateCacheDescriptor,
): {
  cacheKey: string
  entryDir: string
  markerPath: string
  namespaceDir: string
  sourceDir: string
} {
  const cacheKey = createExternalTemplateCacheKey(descriptor.keyParts)
  const namespaceDir = path.join(
    getExternalTemplateCacheRoot(),
    descriptor.namespace,
  )
  const entryDir = path.join(namespaceDir, cacheKey)

  return {
    cacheKey,
    entryDir,
    markerPath: path.join(entryDir, CACHE_MARKER_FILE),
    namespaceDir,
    sourceDir: path.join(entryDir, 'source'),
  }
}

async function isReusableCacheEntry(
  markerPath: string,
  sourceDir: string,
): Promise<boolean> {
  return (await pathExists(markerPath)) && (await pathExists(sourceDir))
}

export async function resolveExternalTemplateSourceCache(
  descriptor: ExternalTemplateCacheDescriptor,
  populateSourceDir: (sourceDir: string) => Promise<void>,
): Promise<ExternalTemplateCacheResolution | null> {
  if (!isExternalTemplateCacheEnabled()) {
    return null
  }

  const { cacheKey, entryDir, markerPath, namespaceDir, sourceDir } =
    getCacheEntryPaths(descriptor)
  if (await isReusableCacheEntry(markerPath, sourceDir)) {
    return {
      cacheHit: true,
      sourceDir,
    }
  }

  await fsp.mkdir(namespaceDir, { recursive: true })
  if (await pathExists(entryDir)) {
    await fsp.rm(entryDir, { force: true, recursive: true })
  }

  const temporaryEntryDir = path.join(
    namespaceDir,
    `.tmp-${cacheKey}-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
  )
  const temporarySourceDir = path.join(temporaryEntryDir, 'source')

  try {
    await fsp.mkdir(temporarySourceDir, { recursive: true })
    await populateSourceDir(temporarySourceDir)
    await fsp.writeFile(
      path.join(temporaryEntryDir, CACHE_MARKER_FILE),
      `${JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          key: cacheKey,
          keyParts: descriptor.keyParts,
          metadata: descriptor.metadata,
          namespace: descriptor.namespace,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    await fsp.rename(temporaryEntryDir, entryDir)

    return {
      cacheHit: false,
      sourceDir,
    }
  } catch (error) {
    await fsp.rm(temporaryEntryDir, { force: true, recursive: true })
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : ''
    if (
      (errorCode === 'EEXIST' || errorCode === 'ENOTEMPTY') &&
      (await isReusableCacheEntry(markerPath, sourceDir))
    ) {
      return {
        cacheHit: true,
        sourceDir,
      }
    }
    throw error
  }
}
