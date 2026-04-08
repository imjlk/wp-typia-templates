import { useState } from "react";

import { useRuntime } from "@bunli/runtime/app";
import { Alert, SchemaForm } from "@bunli/tui";
import { z } from "zod";

import { executeMigrateCommand } from "../runtime-bridge";

const migrateFlowSchema = z.object({
	all: z.boolean().default(false),
	command: z.enum([
		"init",
		"snapshot",
		"plan",
		"wizard",
		"diff",
		"scaffold",
		"verify",
		"doctor",
		"fixtures",
		"fuzz",
	]),
	"current-migration-version": z.string().optional(),
	force: z.boolean().default(false),
	"from-migration-version": z.string().optional(),
	iterations: z.string().optional(),
	"migration-version": z.string().optional(),
	seed: z.string().optional(),
	"to-migration-version": z.string().optional(),
});

type MigrateFlowValues = z.infer<typeof migrateFlowSchema>;

type MigrateFlowProps = {
	cwd: string;
	initialValues: Partial<MigrateFlowValues>;
};

function sanitizeMigrateValues(values: MigrateFlowValues): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(values).flatMap(([key, value]) => {
			if (typeof value === "string" && value.trim().length === 0) {
				return [];
			}
			return [[key, value]];
		}),
	);
}

export function MigrateFlow({ cwd, initialValues }: MigrateFlowProps) {
	const runtime = useRuntime();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	return (
		<>
			{errorMessage ? (
				<Alert message={errorMessage} title="Migrate failed" tone="danger" />
			) : null}
			<SchemaForm
				fields={[
					{
						kind: "select",
						label: "Migration command",
						name: "command",
						options: [
							{ name: "init", description: "Initialize migration config", value: "init" },
							{
								name: "snapshot",
								description: "Capture the current schema snapshot",
								value: "snapshot",
							},
							{ name: "plan", description: "Preview migration work", value: "plan" },
							{
								name: "wizard",
								description: "Guided migration preview",
								value: "wizard",
							},
							{ name: "diff", description: "Diff migration snapshots", value: "diff" },
							{
								name: "scaffold",
								description: "Generate migration rules and artifacts",
								value: "scaffold",
							},
							{
								name: "verify",
								description: "Verify generated migration fixtures",
								value: "verify",
							},
							{
								name: "doctor",
								description: "Diagnose migration workspace health",
								value: "doctor",
							},
							{
								name: "fixtures",
								description: "Refresh migration fixtures",
								value: "fixtures",
							},
							{ name: "fuzz", description: "Run migration fuzzing", value: "fuzz" },
						],
						required: true,
					},
					{
						kind: "text",
						label: "Current migration version",
						name: "current-migration-version",
						visibleWhen: (values) => values.command === "init",
					},
					{
						kind: "text",
						label: "Migration version",
						name: "migration-version",
						visibleWhen: (values) => values.command === "snapshot",
					},
					{
						kind: "text",
						label: "From migration version",
						name: "from-migration-version",
						visibleWhen: (values) =>
							values.command === "plan" ||
							values.command === "diff" ||
							values.command === "scaffold" ||
							values.command === "verify" ||
							values.command === "doctor" ||
							values.command === "fixtures" ||
							values.command === "fuzz",
					},
					{
						kind: "text",
						label: "To migration version",
						name: "to-migration-version",
						visibleWhen: (values) =>
							values.command === "plan" ||
							values.command === "diff" ||
							values.command === "scaffold" ||
							values.command === "fixtures",
					},
					{
						kind: "checkbox",
						label: "All configured migration versions",
						name: "all",
						visibleWhen: (values) =>
							values.command === "verify" ||
							values.command === "doctor" ||
							values.command === "fixtures" ||
							values.command === "fuzz",
					},
					{
						kind: "checkbox",
						label: "Force overwrite",
						name: "force",
						visibleWhen: (values) => values.command === "fixtures",
					},
					{
						kind: "text",
						label: "Iterations",
						name: "iterations",
						visibleWhen: (values) => values.command === "fuzz",
					},
					{
						kind: "text",
						label: "Seed",
						name: "seed",
						visibleWhen: (values) => values.command === "fuzz",
					},
				]}
				initialValues={initialValues}
				onCancel={() => runtime.exit()}
				onSubmit={async (values) => {
					try {
						setErrorMessage(null);
						await executeMigrateCommand({
							command: values.command,
							cwd,
							flags: sanitizeMigrateValues(values),
						});
						runtime.exit();
					} catch (error) {
						setErrorMessage(error instanceof Error ? error.message : String(error));
					}
				}}
				schema={migrateFlowSchema}
				title="Run wp-typia migration workflows"
			/>
		</>
	);
}
