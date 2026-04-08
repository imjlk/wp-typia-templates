import { defineCommand } from "@bunli/core";

import { runPreparationOnlyCommand } from "../preparation-handler";

export const createCommand = defineCommand({
	description: "Scaffold a new wp-typia project.",
	handler: async () => runPreparationOnlyCommand("create"),
	name: "create",
});

export default createCommand;
