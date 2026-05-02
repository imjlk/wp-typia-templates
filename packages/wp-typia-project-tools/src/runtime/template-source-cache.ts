import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Environment variable that disables external template cache reads and writes.
 *
 * Set to `0`, `false`, `no`, or `off` to bypass the cache.
 */
export const EXTERNAL_TEMPLATE_CACHE_ENV = 'WP_TYPIA_EXTERNAL_TEMPLATE_CACHE'

/**
 * Environment variable that overrides the external template cache root.
 */
export const EXTERNAL_TEMPLATE_CACHE_DIR_ENV =
  'WP_TYPIA_EXTERNAL_TEMPLATE_CACHE_DIR'

/**
 * Environment variable that enables TTL-based external template cache pruning.
 *
 * Unset, empty, zero, negative, and non-numeric values keep pruning disabled.
 */
export const EXTERNAL_TEMPLATE_CACHE_TTL_DAYS_ENV =
  'WP_TYPIA_EXTERNAL_TEMPLATE_CACHE_TTL_DAYS'

/**
 * Marker file written after a cache entry is fully populated.
 */
const CACHE_MARKER_FILE = 'wp-typia-template-cache.json'

/**
 * Milliseconds in one TTL day.
 */
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Private directory mode used for cache roots and entries on POSIX platforms.
 */
const PRIVATE_CACHE_DIRECTORY_MODE = 0o700

/**
 * Marker value used when URL-like metadata cannot be safely normalized.
 */
const REDACTED_CACHE_METADATA_VALUE = '[redacted]'

/**
 * Normalized environment values that disable the cache.
 */
const DISABLED_CACHE_VALUES = new Set(['0', 'false', 'no', 'off'])

/**
 * Filesystem errors that mean another writer published the same cache entry.
 */
const CACHE_PUBLISH_RACE_ERROR_CODES = new Set(['EEXIST', 'ENOTEMPTY'])

/**
 * Filesystem errors that make the optional cache unavailable.
 */
const CACHE_UNAVAILABLE_ERROR_CODES = new Set([
  'EACCES',
  'ENOSPC',
  'ENOTDIR',
  'EPERM',
  'EROFS',
])

/**
 * Metadata fields that may contain credentialed or signed URLs.
 */
const URL_LIKE_METADATA_KEY = /(url|uri|registry|tarball)/iu

/**
 * Cache namespaces must stay within one path segment under the cache root.
 */
const SAFE_CACHE_NAMESPACE_SEGMENT = /^[A-Za-z0-9_.-]+$/u

/**
 * Cache entries are deterministic SHA-256 digest directory names.
 */
const SAFE_CACHE_ENTRY_SEGMENT = /^[a-f0-9]{64}$/u

/**
 * Serializable metadata recorded in the cache marker for diagnostics.
 */
type ExternalTemplateCacheMetadata = Record<string, string | null>

/**
 * Describes a deterministic external template cache entry.
 *
 * `namespace` scopes independent cache families, `keyParts` identify the exact
 * source/integrity tuple, and `metadata` is persisted to the marker file.
 */
export interface ExternalTemplateCacheDescriptor {
  /**
   * Ordered values that deterministically identify one cached template source.
   */
  keyParts: readonly string[]

  /**
   * Diagnostic values persisted to the cache marker after sanitization.
   */
  metadata: ExternalTemplateCacheMetadata

  /**
   * Cache family scope, stored as a single safe directory segment.
   */
  namespace: string
}

/**
 * Result returned when a cache entry is reused or populated.
 */
export interface ExternalTemplateCacheResolution {
  /**
   * Whether the returned source directory came from an existing cache entry.
   */
  cacheHit: boolean

  /**
   * Populated or reused template source directory.
   */
  sourceDir: string
}

/**
 * Metadata-only lookup descriptor for finding an existing reusable cache entry.
 */
export interface ExternalTemplateCacheLookupDescriptor {
  /**
   * Metadata fields that must match the sanitized marker metadata.
   */
  metadata: ExternalTemplateCacheMetadata

  /**
   * Cache family scope, stored as a single safe directory segment.
   */
  namespace: string
}

/**
 * Options for best-effort external template cache pruning.
 */
export interface ExternalTemplateCachePruneOptions {
  /**
   * Environment object to inspect, defaulting to `process.env`.
   */
  env?: NodeJS.ProcessEnv

  /**
   * Clock override for deterministic tests.
   */
  now?: Date | number

  /**
   * TTL override in days. When omitted, the TTL environment variable is used.
   */
  ttlDays?: number
}

/**
 * Summary returned after external template cache pruning.
 */
export interface ExternalTemplateCachePruneResult {
  /**
   * Absolute cache root inspected by the pruning helper.
   */
  cacheRoot: string

  /**
   * Entries removed because their marker timestamp exceeded the TTL.
   */
  prunedEntries: number

  /**
   * Candidate cache entry directories inspected.
   */
  scannedEntries: number

  /**
   * Candidate directories skipped because they were malformed or unsafe.
   */
  skippedEntries: number

  /**
   * Resolved TTL in milliseconds, or `null` when pruning was disabled.
   */
  ttlMs: number | null
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
 * override, wp-typia uses a per-user `wp-typia-template-source-cache-*`
 * directory inside the operating system temp directory.
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

  return path.join(
    os.tmpdir(),
    `wp-typia-template-source-cache-${getCurrentUserCacheSegment()}`,
  )
}

function parseExternalTemplateCacheTtlDays(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }

  const ttlDays = typeof value === 'number' ? value : Number(value.trim())
  if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
    return null
  }

  return ttlDays
}

function resolveExternalTemplateCacheTtlMs(
  options: Pick<ExternalTemplateCachePruneOptions, 'env' | 'ttlDays'> = {},
): number | null {
  const env = options.env ?? process.env
  const ttlDays =
    options.ttlDays === undefined
      ? parseExternalTemplateCacheTtlDays(
          env[EXTERNAL_TEMPLATE_CACHE_TTL_DAYS_ENV],
        )
      : parseExternalTemplateCacheTtlDays(options.ttlDays)
  if (ttlDays === null) {
    return null
  }

  const ttlMs = ttlDays * MILLISECONDS_PER_DAY
  return Number.isFinite(ttlMs) ? ttlMs : null
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

async function isDirectoryPath(directory: string): Promise<boolean> {
  try {
    const stats = await fsp.lstat(directory)
    return stats.isDirectory() && !stats.isSymbolicLink()
  } catch {
    return false
  }
}

function getNodeErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''
}

async function removeTemporaryCacheEntry(entryDir: string): Promise<void> {
  try {
    await fsp.rm(entryDir, { force: true, recursive: true })
  } catch {
    // Cache cleanup is best-effort; the caller can still continue uncached.
  }
}

function getCurrentUserCacheSegment(): string {
  if (typeof process.getuid === 'function') {
    return String(process.getuid())
  }

  try {
    const safeUsername = os
      .userInfo()
      .username.trim()
      .replace(/[^A-Za-z0-9._-]+/gu, '-')
    return safeUsername.length > 0 ? safeUsername : 'user'
  } catch {
    return 'user'
  }
}

function getCurrentUid(): number | null {
  return typeof process.getuid === 'function' ? process.getuid() : null
}

async function isPrivateCacheDirectory(directory: string): Promise<boolean> {
  try {
    const stats = await fsp.lstat(directory)
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      return false
    }

    const currentUid = getCurrentUid()
    if (currentUid !== null && stats.uid !== currentUid) {
      return false
    }

    if (process.platform !== 'win32' && (stats.mode & 0o077) !== 0) {
      return false
    }

    return true
  } catch {
    return false
  }
}

async function ensurePrivateCacheDirectory(directory: string): Promise<boolean> {
  try {
    await fsp.mkdir(directory, {
      mode: PRIVATE_CACHE_DIRECTORY_MODE,
      recursive: true,
    })
    const stats = await fsp.lstat(directory)
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      return false
    }

    const currentUid = getCurrentUid()
    if (currentUid !== null && stats.uid !== currentUid) {
      return false
    }

    if (process.platform !== 'win32') {
      if ((stats.mode & 0o077) !== 0) {
        await fsp.chmod(directory, PRIVATE_CACHE_DIRECTORY_MODE)
      }
    }
    return isPrivateCacheDirectory(directory)
  } catch {
    return false
  }
}

function sanitizeCacheMetadataValue(key: string, value: string): string {
  if (!URL_LIKE_METADATA_KEY.test(key)) {
    return value
  }

  try {
    const url = new URL(value)
    url.username = ''
    url.password = ''
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return REDACTED_CACHE_METADATA_VALUE
  }
}

function sanitizeCacheMetadata(
  metadata: ExternalTemplateCacheMetadata,
): ExternalTemplateCacheMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      value === null ? null : sanitizeCacheMetadataValue(key, value),
    ]),
  )
}

function resolveCacheNamespaceDir(
  cacheRoot: string,
  namespace: string,
): string | null {
  if (
    namespace === '.' ||
    namespace === '..' ||
    !SAFE_CACHE_NAMESPACE_SEGMENT.test(namespace)
  ) {
    return null
  }

  const namespaceDir = path.join(cacheRoot, namespace)
  const relativeNamespaceDir = path.relative(cacheRoot, namespaceDir)
  if (
    relativeNamespaceDir.length === 0 ||
    relativeNamespaceDir.startsWith('..') ||
    path.isAbsolute(relativeNamespaceDir)
  ) {
    return null
  }

  return namespaceDir
}

function getCacheEntryPaths(
  descriptor: ExternalTemplateCacheDescriptor,
): {
  cacheKey: string
  cacheRoot: string
  entryDir: string
  markerPath: string
  namespaceDir: string
  sourceDir: string
} | null {
  const cacheKey = createExternalTemplateCacheKey(descriptor.keyParts)
  const cacheRoot = getExternalTemplateCacheRoot()
  const namespaceDir = resolveCacheNamespaceDir(
    cacheRoot,
    descriptor.namespace,
  )
  if (!namespaceDir) {
    return null
  }

  const entryDir = path.join(namespaceDir, cacheKey)

  return {
    cacheKey,
    cacheRoot,
    entryDir,
    markerPath: path.join(entryDir, CACHE_MARKER_FILE),
    namespaceDir,
    sourceDir: path.join(entryDir, 'source'),
  }
}

async function isReusableCacheEntry(
  entryDir: string,
  markerPath: string,
  sourceDir: string,
): Promise<boolean> {
  return (
    (await isPrivateCacheDirectory(entryDir)) &&
    (await pathExists(markerPath)) &&
    (await isDirectoryPath(sourceDir))
  )
}

function parseCacheMarkerMetadata(
  markerText: string,
): { createdAtMs: number; metadata: ExternalTemplateCacheMetadata } | null {
  let marker: unknown
  try {
    marker = JSON.parse(markerText)
  } catch {
    return null
  }
  if (typeof marker !== 'object' || marker === null || Array.isArray(marker)) {
    return null
  }

  const rawMetadata = (marker as { metadata?: unknown }).metadata
  if (
    typeof rawMetadata !== 'object' ||
    rawMetadata === null ||
    Array.isArray(rawMetadata)
  ) {
    return null
  }

  const metadata: ExternalTemplateCacheMetadata = {}
  for (const [key, value] of Object.entries(rawMetadata)) {
    if (typeof value !== 'string' && value !== null) {
      return null
    }
    metadata[key] = value
  }

  const rawCreatedAt = (marker as { createdAt?: unknown }).createdAt
  const createdAtMs =
    typeof rawCreatedAt === 'string' ? Date.parse(rawCreatedAt) : 0

  return {
    createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
    metadata,
  }
}

function cacheMetadataMatches(
  actual: ExternalTemplateCacheMetadata,
  expected: ExternalTemplateCacheMetadata,
): boolean {
  return Object.entries(expected).every(([key, value]) => actual[key] === value)
}

function getExternalTemplateCacheNowMs(now: Date | number | undefined): number {
  const nowMs =
    now instanceof Date
      ? now.getTime()
      : typeof now === 'number'
        ? now
        : Date.now()

  return Number.isFinite(nowMs) ? nowMs : Date.now()
}

function isPathInsideDirectory(
  directory: string,
  candidatePath: string,
): boolean {
  const relativePath = path.relative(directory, candidatePath)
  return (
    relativePath.length > 0 &&
    !relativePath.startsWith('..') &&
    !path.isAbsolute(relativePath)
  )
}

async function removeCacheEntryWithinRoot(
  cacheRoot: string,
  entryDir: string,
): Promise<boolean> {
  if (!isPathInsideDirectory(cacheRoot, entryDir)) {
    return false
  }

  try {
    await fsp.rm(entryDir, { force: true, recursive: true })
    return true
  } catch {
    return false
  }
}

/**
 * Removes stale external template cache entries when a positive TTL is configured.
 *
 * The helper is best-effort: malformed cache directories are skipped, cache
 * roots must remain private and non-symlinked, and deletes are constrained to
 * deterministic entry directories under the configured cache root.
 *
 * @param options Optional TTL, clock, and environment overrides.
 * @returns Pruning summary with counts for inspected, skipped, and removed entries.
 */
export async function pruneExternalTemplateCache(
  options: ExternalTemplateCachePruneOptions = {},
): Promise<ExternalTemplateCachePruneResult> {
  const env = options.env ?? process.env
  const cacheRoot = getExternalTemplateCacheRoot(env)
  const ttlMs = resolveExternalTemplateCacheTtlMs({
    env,
    ttlDays: options.ttlDays,
  })
  const result: ExternalTemplateCachePruneResult = {
    cacheRoot,
    prunedEntries: 0,
    scannedEntries: 0,
    skippedEntries: 0,
    ttlMs,
  }

  if (ttlMs === null || !(await isPrivateCacheDirectory(cacheRoot))) {
    return result
  }

  let namespaceEntries: fs.Dirent[]
  try {
    namespaceEntries = await fsp.readdir(cacheRoot, { withFileTypes: true })
  } catch {
    return result
  }

  const expiresBeforeMs = getExternalTemplateCacheNowMs(options.now) - ttlMs
  for (const namespaceEntry of namespaceEntries) {
    if (!namespaceEntry.isDirectory()) {
      continue
    }

    const namespaceDir = resolveCacheNamespaceDir(
      cacheRoot,
      namespaceEntry.name,
    )
    if (!namespaceDir || !(await isPrivateCacheDirectory(namespaceDir))) {
      result.skippedEntries += 1
      continue
    }

    let cacheEntries: fs.Dirent[]
    try {
      cacheEntries = await fsp.readdir(namespaceDir, { withFileTypes: true })
    } catch {
      result.skippedEntries += 1
      continue
    }

    for (const cacheEntry of cacheEntries) {
      if (!cacheEntry.isDirectory()) {
        continue
      }
      if (!SAFE_CACHE_ENTRY_SEGMENT.test(cacheEntry.name)) {
        result.skippedEntries += 1
        continue
      }

      const entryDir = path.join(namespaceDir, cacheEntry.name)
      result.scannedEntries += 1
      if (!isPathInsideDirectory(cacheRoot, entryDir)) {
        result.skippedEntries += 1
        continue
      }

      const markerPath = path.join(entryDir, CACHE_MARKER_FILE)
      const sourceDir = path.join(entryDir, 'source')
      if (!(await isReusableCacheEntry(entryDir, markerPath, sourceDir))) {
        result.skippedEntries += 1
        continue
      }

      let markerText: string
      try {
        markerText = await fsp.readFile(markerPath, 'utf8')
      } catch {
        result.skippedEntries += 1
        continue
      }

      const marker = parseCacheMarkerMetadata(markerText)
      if (!marker) {
        result.skippedEntries += 1
        continue
      }

      if (marker.createdAtMs < expiresBeforeMs) {
        if (await removeCacheEntryWithinRoot(cacheRoot, entryDir)) {
          result.prunedEntries += 1
        } else {
          result.skippedEntries += 1
        }
      }
    }
  }

  return result
}

/**
 * Finds a reusable cache entry whose marker metadata includes the expected fields.
 *
 * This lookup is intended for resilient fallbacks where a caller cannot compute
 * the exact deterministic key but can safely reuse a previously validated local
 * cache entry for the same source identity.
 *
 * @param descriptor Cache namespace and marker metadata fields to match.
 * @returns Existing cache resolution details, or `null` when no safe entry exists.
 */
export async function findReusableExternalTemplateSourceCache(
  descriptor: ExternalTemplateCacheLookupDescriptor,
): Promise<ExternalTemplateCacheResolution | null> {
  if (!isExternalTemplateCacheEnabled()) {
    return null
  }

  const cacheRoot = getExternalTemplateCacheRoot()
  const namespaceDir = resolveCacheNamespaceDir(
    cacheRoot,
    descriptor.namespace,
  )
  if (!namespaceDir) {
    return null
  }
  if (
    !(await isPrivateCacheDirectory(cacheRoot)) ||
    !(await isPrivateCacheDirectory(namespaceDir))
  ) {
    return null
  }
  await pruneExternalTemplateCache()

  let entries: fs.Dirent[]
  try {
    entries = await fsp.readdir(namespaceDir, { withFileTypes: true })
  } catch {
    return null
  }

  let bestEntry: { createdAtMs: number; sourceDir: string } | null = null
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const entryDir = path.join(namespaceDir, entry.name)
    const markerPath = path.join(entryDir, CACHE_MARKER_FILE)
    const sourceDir = path.join(entryDir, 'source')
    if (!(await isReusableCacheEntry(entryDir, markerPath, sourceDir))) {
      continue
    }

    let markerText: string
    try {
      markerText = await fsp.readFile(markerPath, 'utf8')
    } catch {
      continue
    }

    const marker = parseCacheMarkerMetadata(markerText)
    if (!marker || !cacheMetadataMatches(marker.metadata, descriptor.metadata)) {
      continue
    }
    if (!bestEntry || marker.createdAtMs > bestEntry.createdAtMs) {
      bestEntry = {
        createdAtMs: marker.createdAtMs,
        sourceDir,
      }
    }
  }

  return bestEntry
    ? {
        cacheHit: true,
        sourceDir: bestEntry.sourceDir,
      }
    : null
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

  const cacheEntryPaths = getCacheEntryPaths(descriptor)
  if (!cacheEntryPaths) {
    return null
  }

  const { cacheKey, cacheRoot, entryDir, markerPath, namespaceDir, sourceDir } =
    cacheEntryPaths
  if (
    !(await ensurePrivateCacheDirectory(cacheRoot)) ||
    !(await ensurePrivateCacheDirectory(namespaceDir))
  ) {
    return null
  }
  await pruneExternalTemplateCache()

  if (await isReusableCacheEntry(entryDir, markerPath, sourceDir)) {
    return {
      cacheHit: true,
      sourceDir,
    }
  }

  const temporaryEntryDir = path.join(
    namespaceDir,
    `.tmp-${cacheKey}-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
  )
  const temporarySourceDir = path.join(temporaryEntryDir, 'source')
  let populateFailed = false

  try {
    await fsp.mkdir(temporarySourceDir, {
      mode: PRIVATE_CACHE_DIRECTORY_MODE,
      recursive: true,
    })
    if (process.platform !== 'win32') {
      await fsp.chmod(temporaryEntryDir, PRIVATE_CACHE_DIRECTORY_MODE)
    }
    try {
      await populateSourceDir(temporarySourceDir)
    } catch (error) {
      populateFailed = true
      throw error
    }
    await fsp.writeFile(
      path.join(temporaryEntryDir, CACHE_MARKER_FILE),
      `${JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          key: cacheKey,
          metadata: sanitizeCacheMetadata(descriptor.metadata),
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
    await removeTemporaryCacheEntry(temporaryEntryDir)
    if (populateFailed) {
      if (CACHE_UNAVAILABLE_ERROR_CODES.has(getNodeErrorCode(error))) {
        return null
      }
      throw error
    }

    const errorCode = getNodeErrorCode(error)
    if (
      CACHE_PUBLISH_RACE_ERROR_CODES.has(errorCode) &&
      (await isReusableCacheEntry(entryDir, markerPath, sourceDir))
    ) {
      return {
        cacheHit: true,
        sourceDir,
      }
    }
    if (
      CACHE_PUBLISH_RACE_ERROR_CODES.has(errorCode) ||
      CACHE_UNAVAILABLE_ERROR_CODES.has(errorCode)
    ) {
      return null
    }
    throw error
  }
}
