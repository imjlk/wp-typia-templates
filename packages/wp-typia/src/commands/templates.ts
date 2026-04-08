import { defineCommand, defineGroup } from "@bunli/core";

import { runPreparationOnlyCommand } from "../preparation-handler";

const templatesListCommand = defineCommand({
	description: "List the available scaffold templates.",
	handler: async () => runPreparationOnlyCommand("templates list"),
	name: "list",
});

const templatesInspectCommand = defineCommand({
	description: "Inspect one scaffold template in detail.",
	handler: async () => runPreparationOnlyCommand("templates inspect"),
	name: "inspect",
});

export const templatesCommand = defineGroup({
	commands: [templatesListCommand, templatesInspectCommand],
	description: "Inspect scaffold templates.",
	name: "templates",
});

export default templatesCommand;
