import { afterAll, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  assertScaffoldDoesNotExist,
} from '../src/runtime/cli-add-shared.js';

const runtimeRoot = path.join(import.meta.dir, '..', 'src', 'runtime');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-typia-add-shared-'));

afterAll(() => {
  fs.rmSync(tempRoot, { force: true, recursive: true });
});

function readRuntimeSource(fileName: string): string {
  return fs.readFileSync(path.join(runtimeRoot, fileName), 'utf8');
}

test('shared add runtime keeps compatibility exports around focused modules', () => {
  const sharedSource = readRuntimeSource('cli-add-shared.ts');

  expect(sharedSource).toContain('export * from "./cli-add-types.js";');
  expect(sharedSource).toContain('export * from "./cli-add-validation.js";');
  expect(sharedSource).toContain('export * from "./cli-add-filesystem.js";');
  expect(sharedSource).toContain('export * from "./cli-add-block-json.js";');
  expect(sharedSource).toContain('export * from "./cli-add-collision.js";');
  expect(sharedSource).toContain('export * from "./cli-add-help.js";');
  expect(sharedSource).toContain('from "./scaffold-identifiers.js"');
  expect(sharedSource).not.toContain('export interface RunAddBlockCommandOptions');
  expect(sharedSource).not.toContain('export function assertValidGeneratedSlug');
  expect(sharedSource).not.toContain('export async function patchFile');
  expect(sharedSource).not.toContain('export function assertScaffoldDoesNotExist');
  expect(sharedSource).not.toContain('export function formatAddHelpText');
});

test('focused add runtime modules own their helper categories', () => {
  const typesSource = readRuntimeSource('cli-add-types.ts');
  const validationSource = readRuntimeSource('cli-add-validation.ts');
  const filesystemSource = readRuntimeSource('cli-add-filesystem.ts');
  const blockJsonSource = readRuntimeSource('cli-add-block-json.ts');
  const collisionSource = readRuntimeSource('cli-add-collision.ts');
  const helpSource = readRuntimeSource('cli-add-help.ts');

  expect(typesSource).toContain('export interface RunAddBlockCommandOptions');
  expect(typesSource).toContain('export const ADD_KIND_IDS');
  expect(validationSource).toContain('export function assertValidGeneratedSlug');
  expect(validationSource).toContain('export function assertValidRestResourceMethods');
  expect(validationSource).toContain('export function assertValidEditorPluginSlot');
  expect(filesystemSource).toContain('export async function snapshotWorkspaceFiles');
  expect(filesystemSource).toContain('export async function rollbackWorkspaceMutation');
  expect(blockJsonSource).toContain('export function readWorkspaceBlockJson');
  expect(blockJsonSource).toContain('export function getMutableBlockHooks');
  expect(collisionSource).toContain('export function assertScaffoldDoesNotExist');
  expect(collisionSource).toContain('export function assertEditorPluginDoesNotExist');
  expect(helpSource).toContain('export function formatAddHelpText');
});

test('shared add collision helper allows missing filesystem paths and inventory entries', () => {
  expect(() =>
    assertScaffoldDoesNotExist({
      filesystemCollisions: [
        {
          label: 'A pattern',
          relativePath: 'src/patterns/hero.php',
        },
      ],
      inventoryCollision: {
        entries: [],
        exists: () => false,
        message: 'inventory collision',
      },
      projectDir: tempRoot,
    }),
  ).not.toThrow();
});

test('shared add collision helper preserves filesystem collision messages', () => {
  const projectDir = path.join(tempRoot, 'filesystem-collision');
  const patternPath = path.join(projectDir, 'src', 'patterns', 'hero.php');
  fs.mkdirSync(path.dirname(patternPath), { recursive: true });
  fs.writeFileSync(patternPath, '<?php\n', 'utf8');

  expect(() =>
    assertScaffoldDoesNotExist({
      filesystemCollisions: [
        {
          label: 'A pattern',
          relativePath: path.join('src', 'patterns', 'hero.php'),
        },
      ],
      projectDir,
    }),
  ).toThrow(
    'A pattern already exists at src/patterns/hero.php. Choose a different name.',
  );
});

test('shared add collision helper preserves inventory collision messages', () => {
  expect(() =>
    assertScaffoldDoesNotExist({
      inventoryCollision: {
        entries: [{ slug: 'hero' }],
        exists: (entry) => entry.slug === 'hero',
        message: 'A pattern inventory entry already exists for hero. Choose a different name.',
      },
      filesystemCollisions: [],
      projectDir: tempRoot,
    }),
  ).toThrow(
    'A pattern inventory entry already exists for hero. Choose a different name.',
  );
});
