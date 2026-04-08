import { useState } from "react";

import { useRuntime } from "@bunli/runtime/app";
import { Alert, SchemaForm } from "@bunli/tui";
import { HOOKED_BLOCK_POSITION_IDS } from "@wp-typia/project-tools";
import { z } from "zod";

import { executeAddCommand } from "../runtime-bridge";

const addFlowSchema = z.object({
	anchor: z.string().optional(),
	block: z.string().optional(),
	"data-storage": z.string().optional(),
	kind: z.enum(["block", "variation", "pattern", "binding-source", "hooked-block"]).default("block"),
	name: z.string().optional(),
	"persistence-policy": z.string().optional(),
	position: z.string().optional(),
	template: z.string().optional(),
});

type AddFlowValues = z.infer<typeof addFlowSchema>;

type AddFlowProps = {
	cwd: string;
	initialValues: Partial<AddFlowValues>;
	workspaceBlockOptions: Array<{
		description: string;
		name: string;
		value: string;
	}>;
};

const HOOKED_BLOCK_POSITION_DESCRIPTIONS: Record<
	(typeof HOOKED_BLOCK_POSITION_IDS)[number],
	string
> = {
	after: "Insert after the anchor block",
	before: "Insert before the anchor block",
	firstChild: "Insert as the first child of the anchor block",
	lastChild: "Insert as the last child of the anchor block",
};

export function AddFlow({ cwd, initialValues, workspaceBlockOptions }: AddFlowProps) {
	const runtime = useRuntime();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	return (
		<>
			{errorMessage ? (
				<Alert message={errorMessage} title="Add failed" tone="danger" />
			) : null}
			<SchemaForm
				fields={[
					{
						kind: "select",
						label: "Kind",
						name: "kind",
						options: [
							{ name: "block", description: "Add a real block slice", value: "block" },
							{
								name: "variation",
								description: "Add a variation to an existing block",
								value: "variation",
							},
							{
								name: "pattern",
								description: "Add a PHP block pattern shell",
								value: "pattern",
							},
							{
								name: "binding-source",
								description: "Add a shared block bindings source",
								value: "binding-source",
							},
							{
								name: "hooked-block",
								description: "Add block.json hook metadata to an existing block",
								value: "hooked-block",
							},
						],
					},
					{
						kind: "text",
						label: "Block name",
						name: "name",
						visibleWhen: (values) => values.kind === "block",
					},
					{
						kind: "select",
						label: "Template family",
						name: "template",
						options: [
							{ name: "basic", description: "Basic block scaffold", value: "basic" },
							{
								name: "interactivity",
								description: "Interactivity API block scaffold",
								value: "interactivity",
							},
							{
								name: "persistence",
								description: "Persistence-enabled block scaffold",
								value: "persistence",
							},
							{
								name: "compound",
								description: "Compound parent + child scaffold",
								value: "compound",
							},
						],
						visibleWhen: (values) => values.kind === "block",
					},
					{
						kind: "text",
						label: "Variation name",
						name: "name",
						visibleWhen: (values) => values.kind === "variation",
					},
					{
						kind: workspaceBlockOptions.length > 0 ? "select" : "text",
						label: "Target block",
						name: "block",
						options: workspaceBlockOptions,
						visibleWhen: (values) => values.kind === "variation",
					},
					{
						kind: "text",
						label: "Pattern name",
						name: "name",
						visibleWhen: (values) => values.kind === "pattern",
					},
					{
						kind: "text",
						label: "Binding source name",
						name: "name",
						visibleWhen: (values) => values.kind === "binding-source",
					},
					{
						kind: workspaceBlockOptions.length > 0 ? "select" : "text",
						label: "Target block",
						name: "name",
						options: workspaceBlockOptions,
						visibleWhen: (values) => values.kind === "hooked-block",
					},
					{
						kind: "text",
						label: "Anchor block name",
						name: "anchor",
						visibleWhen: (values) => values.kind === "hooked-block",
					},
					{
						kind: "select",
						label: "Hook position",
						name: "position",
						options: HOOKED_BLOCK_POSITION_IDS.map((position) => ({
							name: position,
							description: HOOKED_BLOCK_POSITION_DESCRIPTIONS[position],
							value: position,
						})),
						visibleWhen: (values) => values.kind === "hooked-block",
					},
					{
						kind: "select",
						label: "Data storage",
						name: "data-storage",
						options: [
							{
								name: "custom-table",
								description: "Dedicated custom table storage",
								value: "custom-table",
							},
							{
								name: "post-meta",
								description: "Persist through post meta",
								value: "post-meta",
							},
						],
						visibleWhen: (values) =>
							values.kind === "block" &&
							(values.template === "persistence" || values.template === "compound"),
					},
					{
						kind: "select",
						label: "Persistence policy",
						name: "persistence-policy",
						options: [
							{
								name: "authenticated",
								description: "Authenticated write policy",
								value: "authenticated",
							},
							{ name: "public", description: "Public token policy", value: "public" },
						],
						visibleWhen: (values) =>
							values.kind === "block" &&
							(values.template === "persistence" || values.template === "compound"),
					},
				]}
				initialValues={initialValues}
				onCancel={() => runtime.exit()}
				onSubmit={async (values) => {
					try {
						setErrorMessage(null);
						await executeAddCommand({
							cwd,
							flags: values,
							kind: values.kind,
							name: values.name,
						});
						runtime.exit();
					} catch (error) {
						setErrorMessage(error instanceof Error ? error.message : String(error));
					}
				}}
				schema={addFlowSchema}
				title="Extend a wp-typia workspace"
			/>
		</>
	);
}
