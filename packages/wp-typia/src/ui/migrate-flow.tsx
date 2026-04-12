import { createElement, useMemo } from "react";

import {
	Form,
	type SelectOption,
	useFormContext,
	useTerminalDimensions,
} from "@bunli/tui";

import { executeMigrateCommand } from "../runtime-bridge";
import { useAlternateBufferLifecycle } from "./alternate-buffer-lifecycle";
import {
	type MigrateFlowValues,
	getMigrateScrollTop,
	getMigrateViewportHeight,
	getVisibleMigrateFieldNames,
	migrateFlowSchema,
	sanitizeMigrateSubmitValues,
} from "./migrate-flow-model";
import {
	FirstPartyCheckboxField,
	FirstPartyFormViewport,
	FirstPartySelectField,
	FirstPartyTextField,
} from "./first-party-form";
import { getWrappedFieldNeighbors } from "./first-party-form-model";

const migrateCommandOptions: SelectOption[] = [
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
];

type MigrateFlowProps = {
	cwd: string;
	initialValues: Partial<MigrateFlowValues>;
};

type MigrateSelectFieldName = {
	[K in keyof MigrateFlowValues]-?: MigrateFlowValues[K] extends string | undefined ? K : never;
}[keyof MigrateFlowValues];

type MigrateCheckboxFieldName = {
	[K in keyof MigrateFlowValues]-?: MigrateFlowValues[K] extends boolean | undefined ? K : never;
}[keyof MigrateFlowValues];

function MigrateFlowFields() {
	const { activeFieldName, isSubmitting, values } = useFormContext();
	const { height: terminalHeight = 24 } = useTerminalDimensions();
	const migrateValues = values as Partial<MigrateFlowValues>;
	const command = migrateValues.command ?? "plan";
	const viewportHeight = getMigrateViewportHeight(terminalHeight);
	const scrollValues = useMemo(() => ({ command }), [command]);
	const scrollTop = useMemo(
		() =>
			getMigrateScrollTop({
				activeFieldName,
				values: scrollValues,
				viewportHeight,
			}),
		[activeFieldName, scrollValues, viewportHeight],
	);
	const visibleFields = new Set(getVisibleMigrateFieldNames(migrateValues));
	const orderedVisibleFields = useMemo(
		() => getVisibleMigrateFieldNames(migrateValues),
		[migrateValues],
	);

	return createElement(
		FirstPartyFormViewport,
		{
			isSubmitting,
			scrollTop,
			submittingDescription: "Running the selected migration workflow...",
			submittingTitle: "Running migration...",
			viewportHeight,
		},
		[
			createElement(FirstPartySelectField, {
				...getWrappedFieldNeighbors(orderedVisibleFields, "command"),
				key: "command",
				label: "Migration command",
				name: "command" satisfies MigrateSelectFieldName,
				options: migrateCommandOptions,
			}),
			visibleFields.has("current-migration-version")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(
							orderedVisibleFields,
							"current-migration-version",
						),
						key: "current-migration-version",
						label: "Current migration version",
						name: "current-migration-version",
					})
				: null,
			visibleFields.has("migration-version")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "migration-version"),
						key: "migration-version",
						label: "Migration version",
						name: "migration-version",
					})
				: null,
			visibleFields.has("from-migration-version")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "from-migration-version"),
						key: "from-migration-version",
						label: "From migration version",
						name: "from-migration-version",
					})
				: null,
			visibleFields.has("to-migration-version")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "to-migration-version"),
						key: "to-migration-version",
						label: "To migration version",
						name: "to-migration-version",
					})
				: null,
			visibleFields.has("all")
				? createElement(FirstPartyCheckboxField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "all"),
						key: "all",
						label: "All configured migration versions",
						name: "all" satisfies MigrateCheckboxFieldName,
					})
				: null,
			visibleFields.has("force")
				? createElement(FirstPartyCheckboxField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "force"),
						key: "force",
						label: "Force overwrite",
						name: "force" satisfies MigrateCheckboxFieldName,
					})
				: null,
			visibleFields.has("iterations")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "iterations"),
						key: "iterations",
						label: "Iterations",
						name: "iterations",
					})
				: null,
			visibleFields.has("seed")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "seed"),
						key: "seed",
						label: "Seed",
						name: "seed",
					})
				: null,
		],
	);
}

export function MigrateFlow({ cwd, initialValues }: MigrateFlowProps) {
	const { handleCancel, handleSubmit } = useAlternateBufferLifecycle("wp-typia migrate failed");

	return (
		<Form
			initialValues={initialValues}
			onCancel={handleCancel}
			onSubmit={async (values) =>
				handleSubmit(async () => {
					const flags = sanitizeMigrateSubmitValues(values);
					await executeMigrateCommand({
						command: values.command,
						cwd,
						flags,
					});
				})
			}
			schema={migrateFlowSchema}
			title="Run wp-typia migration workflows"
		>
			<MigrateFlowFields />
		</Form>
	);
}
