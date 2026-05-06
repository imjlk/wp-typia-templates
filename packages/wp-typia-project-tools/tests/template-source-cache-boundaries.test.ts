import { expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

const runtimeRoot = path.join(import.meta.dir, '..', 'src', 'runtime')

test('template source cache delegates environment policy to a focused module', () => {
  const cacheSource = fs.readFileSync(
    path.join(runtimeRoot, 'template-source-cache.ts'),
    'utf8',
  )
  const policySource = fs.readFileSync(
    path.join(runtimeRoot, 'template-source-cache-policy.ts'),
    'utf8',
  )

  expect(cacheSource).toContain("from './template-source-cache-policy.js'")
  expect(cacheSource).toContain(
    'EXTERNAL_TEMPLATE_CACHE_PRUNE_INTERVAL_MS_ENV',
  )
  expect(cacheSource).not.toContain(
    "const DISABLED_CACHE_VALUES = new Set(['0', 'false', 'no', 'off'])",
  )
  expect(cacheSource).not.toMatch(
    /export\s+function\s+isExternalTemplateCacheEnabled\s*\(/,
  )
  expect(policySource).toContain(
    "export const EXTERNAL_TEMPLATE_CACHE_ENV = 'WP_TYPIA_EXTERNAL_TEMPLATE_CACHE'",
  )
  expect(policySource).toMatch(
    /export\s+function\s+isExternalTemplateCacheEnabled\s*\(/,
  )
  expect(policySource).toMatch(
    /export\s+function\s+resolveExternalTemplateCacheTtlMs\s*\(/,
  )
})
