import { expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dir, '..');
const sourceRoot = path.join(packageRoot, 'src');

test('runtime bridge delegates output and sync helpers to focused modules', () => {
  const bridgeSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge.ts'),
    'utf8',
  );
  const outputSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-output.ts'),
    'utf8',
  );
  const syncSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-sync.ts'),
    'utf8',
  );

  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-output['"]/);
  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-sync['"]/);
  expect(bridgeSource).toMatch(
    /export\s*\{[\s\S]*printCompletionPayload[\s\S]*\}\s*from\s*["']\.\/runtime-bridge-output["']/,
  );
  expect(bridgeSource).toMatch(
    /export\s*\{[\s\S]*executeSyncCommand[\s\S]*\}\s*from\s*["']\.\/runtime-bridge-sync["']/,
  );
  expect(bridgeSource).not.toContain('export function printCompletionPayload(');
  expect(bridgeSource).not.toContain(
    'export function buildCreateCompletionPayload(',
  );
  expect(bridgeSource).not.toContain('function buildAddCompletionPayload(');
  expect(bridgeSource).not.toContain('function resolveSyncProjectContext(');
  expect(bridgeSource).not.toContain(
    'export async function executeSyncCommand(',
  );
  expect(outputSource).toContain('export function printCompletionPayload(');
  expect(outputSource).toContain(
    'export function buildCreateCompletionPayload(',
  );
  expect(outputSource).toContain(
    'export function buildMigrationCompletionPayload(',
  );
  expect(syncSource).toContain('export async function executeSyncCommand(');
  expect(syncSource).toContain('function resolveSyncProjectContext(');
});
