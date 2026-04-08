import type { Command } from "@bunli/core";

import { addCommand } from "./commands/add";
import { createCommand } from "./commands/create";
import { doctorCommand } from "./commands/doctor";
import { mcpCommand } from "./commands/mcp";
import { migrateCommand } from "./commands/migrate";
import { templatesCommand } from "./commands/templates";

export const wpTypiaCommands: Command<any, any>[] = [
	createCommand,
	addCommand,
	migrateCommand,
	templatesCommand,
	doctorCommand,
	mcpCommand,
];
