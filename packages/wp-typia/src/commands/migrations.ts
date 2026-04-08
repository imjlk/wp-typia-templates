import { defineCommand, defineGroup } from "@bunli/core";

import { runPreparationOnlyCommand } from "../preparation-handler";

function defineMigrationSubcommand(name: string, description: string) {
	return defineCommand({
		description,
		handler: async () => runPreparationOnlyCommand(`migrations ${name}`),
		name,
	});
}

export const migrationsCommand = defineGroup({
	commands: [
		defineMigrationSubcommand("init", "Initialize migration config for a project."),
		defineMigrationSubcommand("snapshot", "Capture the current migration snapshot."),
		defineMigrationSubcommand("diff", "Inspect migration deltas between versions."),
		defineMigrationSubcommand("scaffold", "Generate migration files for the next version."),
		defineMigrationSubcommand("plan", "Plan migration work before applying changes."),
		defineMigrationSubcommand("wizard", "Launch the guided migration workflow."),
		defineMigrationSubcommand("verify", "Verify migration fixtures and outputs."),
		defineMigrationSubcommand("doctor", "Diagnose migration workspace issues."),
		defineMigrationSubcommand("fixtures", "Manage migration fixture snapshots."),
		defineMigrationSubcommand("fuzz", "Run migration fuzz coverage."),
	],
	description: "Run migration workflows.",
	name: "migrations",
});

export default migrationsCommand;
