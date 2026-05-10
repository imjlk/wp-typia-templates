import { expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dir, '..');
const sourceRoot = path.join(packageRoot, 'src');

test('runtime bridge delegates command, output, and sync helpers to focused modules', () => {
  const bridgeSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge.ts'),
    'utf8',
  );
  const addSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-add.ts'),
    'utf8',
  );
  const createSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-create.ts'),
    'utf8',
  );
  const doctorSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-doctor.ts'),
    'utf8',
  );
  const initSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-init.ts'),
    'utf8',
  );
  const migrateSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-migrate.ts'),
    'utf8',
  );
  const outputSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-output.ts'),
    'utf8',
  );
  const sharedSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-shared.ts'),
    'utf8',
  );
  const syncSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-sync.ts'),
    'utf8',
  );
  const templatesSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-templates.ts'),
    'utf8',
  );

  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-add['"]/);
  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-create['"]/);
  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-doctor['"]/);
  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-init['"]/);
  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-migrate['"]/);
  expect(bridgeSource).toMatch(/from ['"]\.\/runtime-bridge-templates['"]/);
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
  expect(bridgeSource).not.toContain('formatMissingAddKindDetailLine');
  expect(bridgeSource).not.toContain('runScaffoldFlow');
  expect(bridgeSource).not.toContain('runInitCommand');
  expect(bridgeSource).not.toContain('runMigrationCommand');
  expect(addSource).toContain('export async function executeAddCommand(');
  expect(addSource).toContain('formatMissingAddKindDetailLine');
  expect(createSource).toContain('export async function executeCreateCommand(');
  expect(createSource).toContain('runScaffoldFlow');
  expect(doctorSource).toContain('export async function executeDoctorCommand(');
  expect(initSource).toContain('export async function executeInitCommand(');
  expect(migrateSource).toContain('export async function executeMigrateCommand(');
  expect(sharedSource).toContain('export async function wrapCliCommandError(');
  expect(templatesSource).toContain(
    'export async function executeTemplatesCommand(',
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

test('runtime bridge modules share the CLI print-line type', () => {
  const registrySharedSource = fs.readFileSync(
    path.join(sourceRoot, 'add-kind-registry-shared.ts'),
    'utf8',
  );
  const outputSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-output.ts'),
    'utf8',
  );
  const addSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-add.ts'),
    'utf8',
  );
  const createSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-create.ts'),
    'utf8',
  );
  const initSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-init.ts'),
    'utf8',
  );
  const sharedSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-shared.ts'),
    'utf8',
  );
  const templatesSource = fs.readFileSync(
    path.join(sourceRoot, 'runtime-bridge-templates.ts'),
    'utf8',
  );
  const printLineSource = fs.readFileSync(
    path.join(sourceRoot, 'print-line.ts'),
    'utf8',
  );

  for (const source of [
    registrySharedSource,
    outputSource,
    addSource,
    createSource,
    initSource,
    sharedSource,
    templatesSource,
  ]) {
    expect(source).toContain("import type { PrintLine } from './print-line';");
    expect(source).not.toContain('type PrintLine = (line: string) => void;');
  }
  expect(printLineSource).toContain(
    'export type PrintLine = (line: string) => void;',
  );
});
