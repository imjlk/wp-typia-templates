import { afterAll, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  assertScaffoldDoesNotExist,
} from '../src/runtime/cli-add-shared.js';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-typia-add-shared-'));

afterAll(() => {
  fs.rmSync(tempRoot, { force: true, recursive: true });
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
