import { defineCommand, defineGroup } from "@bunli/core";

import { runPreparationOnlyCommand } from "../preparation-handler";

const addBlockCommand = defineCommand({
	description: "Add a block to an official wp-typia workspace.",
	handler: async () => runPreparationOnlyCommand("add block"),
	name: "block",
});

const addVariationCommand = defineCommand({
	description: "Reserved placeholder for future variation scaffolding.",
	handler: async () => runPreparationOnlyCommand("add variation"),
	name: "variation",
});

const addPatternCommand = defineCommand({
	description: "Reserved placeholder for future pattern scaffolding.",
	handler: async () => runPreparationOnlyCommand("add pattern"),
	name: "pattern",
});

export const addCommand = defineGroup({
	commands: [addBlockCommand, addVariationCommand, addPatternCommand],
	description: "Extend an official wp-typia workspace.",
	name: "add",
});

export default addCommand;
