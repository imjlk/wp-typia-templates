import type { Command } from "@bunli/core";

import { addCommand } from "./commands/add";
import { createCommand } from "./commands/create";
import { doctorCommand } from "./commands/doctor";
import { initCommand } from "./commands/init";
import { mcpCommand } from "./commands/mcp";
import { migrateCommand } from "./commands/migrate";
import { syncCommand } from "./commands/sync";
import { templatesCommand } from "./commands/templates";

export const wpTypiaCommands: Command<any, any>[] = [
	createCommand,
	initCommand,
	syncCommand,
	addCommand,
	migrateCommand,
	templatesCommand,
	doctorCommand,
	mcpCommand,
];
