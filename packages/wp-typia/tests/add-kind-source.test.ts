import { expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { ADD_KIND_IDS as PROJECT_TOOLS_ADD_KIND_IDS } from '@wp-typia/project-tools/cli-add-kind-ids';
import { ADD_KIND_IDS } from '../src/add-kind-registry';
import { WP_TYPIA_COMMAND_REGISTRY } from '../src/command-registry';

const packageRoot = path.resolve(import.meta.dir, '..');

test('single-sources add-kind ids from project-tools metadata', () => {
  const cliAddKindIdsSource = fs.readFileSync(
    path.join(packageRoot, 'src', 'add-kind-ids.ts'),
    'utf8',
  );
  const addCommand = WP_TYPIA_COMMAND_REGISTRY.find(
    (command) => command.name === 'add',
  );

  expect(cliAddKindIdsSource).toContain(
    "'@wp-typia/project-tools/cli-add-kind-ids'",
  );
  expect(cliAddKindIdsSource).not.toContain('export const ADD_KIND_IDS = [');
  expect(ADD_KIND_IDS).toEqual([...PROJECT_TOOLS_ADD_KIND_IDS]);
  expect(addCommand?.subcommands).toEqual([...PROJECT_TOOLS_ADD_KIND_IDS]);
});
