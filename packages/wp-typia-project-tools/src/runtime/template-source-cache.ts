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

/**
 * Checks whether remote external template source caching is enabled.
 *
 * Caching is enabled by default. Set `WP_TYPIA_EXTERNAL_TEMPLATE_CACHE` to
 * `0`, `false`, `no`, or `off` to force uncached resolution.
 *
 * @param env Environment object to inspect, defaulting to `process.env`.
 * @returns Whether external template source cache reads and writes are enabled.
 */
export function isExternalTemplateCacheEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const rawValue = env[EXTERNAL_TEMPLATE_CACHE_ENV]
  if (rawValue === undefined) {
    return true
  }

  return !DISABLED_CACHE_VALUES.has(rawValue.trim().toLowerCase())
}

/**
 * Resolves the external template source cache root directory.
 *
 * `WP_TYPIA_EXTERNAL_TEMPLATE_CACHE_DIR` overrides the location. Without an
 * override, wp-typia uses a `wp-typia-template-source-cache` directory inside
 * the operating system temp directory.
 *
 * @param env Environment object to inspect, defaulting to `process.env`.
 * @returns Absolute cache root directory path.
 */
export function getExternalTemplateCacheRoot(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configuredCacheDir = env[EXTERNAL_TEMPLATE_CACHE_DIR_ENV]?.trim()
  if (configuredCacheDir) {
    return path.resolve(configuredCacheDir)
  }

  return path.join(os.tmpdir(), 'wp-typia-template-source-cache')
}

/**
 * Creates a deterministic cache key from source identity and integrity parts.
 *
 * @param keyParts Ordered values that identify one cached template source.
 * @returns SHA-256 hex digest of the JSON-serialized key parts.
 */
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

/**
 * Resolves or populates a cached external template source directory.
 *
 * Returns `null` when caching is disabled. Cache misses populate a temporary
 * directory first and then atomically move it into place; concurrent writers
 * that lose the race reuse the completed marker/source pair.
 *
 * @param descriptor Namespace, key parts, and metadata for the cache entry.
 * @param populateSourceDir Callback that writes the guarded source on a miss.
 * @returns Cache resolution details, or `null` when caching is disabled.
 */
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
    if (errorCode === 'EEXIST' || errorCode === 'ENOTEMPTY') {
      return null
    }
    throw error
  }
}
