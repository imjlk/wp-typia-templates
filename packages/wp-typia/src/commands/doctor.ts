import { defineCommand } from "@bunli/core";

import { runPreparationOnlyCommand } from "../preparation-handler";

export const doctorCommand = defineCommand({
	description: "Run repository and project diagnostics.",
	handler: async () => runPreparationOnlyCommand("doctor"),
	name: "doctor",
});

export default doctorCommand;
