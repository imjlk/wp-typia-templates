import type { Command } from '@bunli/core';

import { addCommand } from './commands/add';
import { createCommand } from './commands/create';
import { doctorCommand } from './commands/doctor';
import { initCommand } from './commands/init';
import { mcpCommand } from './commands/mcp';
import { migrateCommand } from './commands/migrate';
import { syncCommand } from './commands/sync';
import { templatesCommand } from './commands/templates';
import {
  type WpTypiaTopLevelCommandName,
  WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
} from './command-registry';

const WP_TYPIA_COMMANDS_BY_NAME = {
  add: addCommand,
  create: createCommand,
  doctor: doctorCommand,
  init: initCommand,
  mcp: mcpCommand,
  migrate: migrateCommand,
  sync: syncCommand,
  templates: templatesCommand,
} satisfies Record<WpTypiaTopLevelCommandName, Command<any, any>>;

export const wpTypiaCommands: Command<any, any>[] =
  WP_TYPIA_TOP_LEVEL_COMMAND_NAMES.map(
    (commandName) => WP_TYPIA_COMMANDS_BY_NAME[commandName],
  );
