import { createElement } from "react";

import { createCLI, defineCommand } from "@bunli/core";
import { useRuntime } from "@bunli/runtime/app";
import { SchemaForm, type SchemaField } from "@bunli/tui";
import { z } from "zod";

const diagnosticSchema = z.object({
	advanced: z.boolean().default(false),
	mode: z.enum(["basic", "advanced"]).default("basic"),
	name: z.string().optional(),
	target: z.string().optional(),
});

const diagnosticFields: SchemaField<typeof diagnosticSchema>[] = [
	{
		kind: "select",
		label: "Mode",
		name: "mode",
		options: [
			{ description: "Basic diagnostic mode", name: "basic", value: "basic" },
			{ description: "Advanced diagnostic mode", name: "advanced", value: "advanced" },
		],
		required: true,
	},
	{
		kind: "text",
		label: "Fixture name",
		name: "name",
	},
	{
		kind: "text",
		label: "Advanced target",
		name: "target",
		visibleWhen: (values) => values.mode === "advanced",
	},
	{
		kind: "checkbox",
		label: "Enable advanced toggle",
		name: "advanced",
		visibleWhen: (values) => values.mode === "advanced",
	},
];

function DiagnosticFlow() {
	const runtime = useRuntime();

	return createElement(SchemaForm<typeof diagnosticSchema>, {
		fields: diagnosticFields,
		initialValues: {
			advanced: false,
			mode: "advanced",
			name: "diagnostic-fixture",
			target: "",
		},
		onCancel: () => runtime.exit(),
		onSubmit: () => runtime.exit(),
		schema: diagnosticSchema,
		title: "Bunli diagnostic fixture",
	});
}

const diagnosticCommand = defineCommand({
	description: "Minimal Bunli baseline fixture for TUI interaction triage.",
	handler: async () => {},
	name: "diagnostic",
	render: () => createElement(DiagnosticFlow),
	tui: {
		renderer: {
			bufferMode: "alternate" as const,
		},
	},
});

const cli = await createCLI({
	name: "bunli-diagnostic",
	version: "0.0.0",
});

cli.command(diagnosticCommand);
await cli.run();
