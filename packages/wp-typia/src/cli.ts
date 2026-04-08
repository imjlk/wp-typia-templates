import { createCLI, type CLI, type Command } from "@bunli/core";

import packageJson from "../package.json";
import { addCommand } from "./commands/add";
import { createCommand } from "./commands/create";
import { doctorCommand } from "./commands/doctor";
import { migrationsCommand } from "./commands/migrations";
import { templatesCommand } from "./commands/templates";

export const bunliPreparedCommands: Command<any, any>[] = [
	createCommand,
	addCommand,
	templatesCommand,
	migrationsCommand,
	doctorCommand,
];

/**
 * Create the future Bunli-owned `wp-typia` CLI without switching the active
 * published runtime in this release.
 *
 * The current `bin/wp-typia.js` entry remains authoritative until the next
 * migration round wires this CLI into the published package surface.
 *
 * @returns Prepared Bunli CLI instance for command-tree validation.
 */
export async function createPreparedWpTypiaCli(): Promise<CLI> {
	const cli = await createCLI({
		build: {
			entry: "./src/cli.ts",
			outdir: "./dist-bunli",
			sourcemap: true,
		},
		commands: {
			entry: "./src/cli.ts",
			directory: "./src/commands",
			generateReport: true,
		},
		description: packageJson.description,
		name: packageJson.name,
		test: {
			coverage: false,
			pattern: ["tests/*.test.ts"],
			watch: false,
		},
		version: packageJson.version,
	});

	for (const command of bunliPreparedCommands) {
		cli.command(command);
	}

	return cli;
}

export default createPreparedWpTypiaCli;
