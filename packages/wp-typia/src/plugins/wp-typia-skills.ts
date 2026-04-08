import type { BunliPlugin } from "@bunli/core/plugin";
import type { Command } from "@bunli/core";

export function createWpTypiaSkillsMetadataPlugin(commands: Command[]): BunliPlugin {
	return {
		name: "wp-typia-skills-metadata",
		setup(context) {
			context.store.set(
				"_skillsCommands",
				new Map(commands.map((command) => [command.name, command])),
			);
			context.store.set("_skillsCliName", "wp-typia");
		},
	};
}
