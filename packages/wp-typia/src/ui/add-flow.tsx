import { createElement, useEffect, useMemo, useState } from "react";

import {
	Form,
	type SelectOption,
	useFormContext,
	useTerminalDimensions,
} from "@bunli/tui";
import {
	COMPOUND_INNER_BLOCKS_PRESET_IDS,
	getCompoundInnerBlocksPresetDefinition,
} from "@wp-typia/project-tools/compound-inner-blocks";
import { EDITOR_PLUGIN_SLOT_IDS } from "@wp-typia/project-tools/cli-add";
import { HOOKED_BLOCK_POSITION_IDS } from "@wp-typia/project-tools/hooked-blocks";

import { executeAddCommand, loadAddWorkspaceBlockOptions } from "../runtime-bridge";
import { useAlternateBufferLifecycle } from "./alternate-buffer-lifecycle";
import {
	type AddFlowValues,
	addFlowSchema,
	getAddScrollTop,
	getAddViewportHeight,
	getVisibleAddFieldNames,
	isAddPersistenceTemplate,
	sanitizeAddSubmitValues,
} from "./add-flow-model";
import {
	FirstPartyCompletionViewport,
	FirstPartyFormViewport,
	FirstPartySelectField,
	FirstPartyTextField,
} from "./first-party-form";
import { getWrappedFieldNeighbors } from "./first-party-form-model";

const kindOptions: SelectOption[] = [
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
		name: "rest-resource",
		description: "Add a plugin-level typed REST resource",
		value: "rest-resource",
	},
	{
		name: "editor-plugin",
		description: "Add a document-level editor extension shell",
		value: "editor-plugin",
	},
	{
		name: "hooked-block",
		description: "Add block.json hook metadata to an existing block",
		value: "hooked-block",
	},
];

const templateOptions: SelectOption[] = [
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
];

const dataStorageOptions: SelectOption[] = [
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
];

const persistencePolicyOptions: SelectOption[] = [
	{
		name: "authenticated",
		description: "Authenticated write policy",
		value: "authenticated",
	},
	{ name: "public", description: "Public token policy", value: "public" },
];

const compoundInnerBlocksPresetOptions: SelectOption[] =
	COMPOUND_INNER_BLOCKS_PRESET_IDS.map((value) => ({
		description: getCompoundInnerBlocksPresetDefinition(value).description,
		name: value,
		value,
	}));

const EDITOR_PLUGIN_SLOT_DESCRIPTIONS: Record<string, string> = {
	PluginSidebar: "Register a document sidebar and more-menu entry",
};

const editorPluginSlotOptions: SelectOption[] = EDITOR_PLUGIN_SLOT_IDS.map((slot) => ({
	description:
		EDITOR_PLUGIN_SLOT_DESCRIPTIONS[slot] ?? "Editor plugin shell slot",
	name: slot,
	value: slot,
}));

const HOOKED_BLOCK_POSITION_DESCRIPTIONS: Record<
	(typeof HOOKED_BLOCK_POSITION_IDS)[number],
	string
> = {
	after: "Insert after the anchor block",
	before: "Insert before the anchor block",
	firstChild: "Insert as the first child of the anchor block",
	lastChild: "Insert as the last child of the anchor block",
};

type AddFlowProps = {
	cwd: string;
	initialValues: Partial<AddFlowValues>;
};

type WorkspaceBlockOption = {
	description: string;
	name: string;
	value: string;
};

type AddSelectFieldName = {
	[K in keyof AddFlowValues]-?: AddFlowValues[K] extends string | undefined ? K : never;
}[keyof AddFlowValues];

function getAddNameLabel(kind?: string): string {
	switch (kind) {
		case "variation":
			return "Variation name";
		case "pattern":
			return "Pattern name";
		case "binding-source":
			return "Binding source name";
		case "rest-resource":
			return "REST resource name";
		case "editor-plugin":
			return "Editor plugin name";
		case "hooked-block":
			return "Target block";
		case "block":
		default:
			return "Block name";
	}
}

function AddFlowFields({
	workspaceBlockOptions,
}: {
	workspaceBlockOptions: WorkspaceBlockOption[];
}) {
	const { activeFieldName, isSubmitting, values } = useFormContext();
	const { height: terminalHeight = 24 } = useTerminalDimensions();
	const addValues = values as Partial<AddFlowValues>;
	const kind = addValues.kind ?? "block";
	const template = addValues.template;
	const viewportHeight = getAddViewportHeight(terminalHeight);
	const scrollValues = useMemo(() => ({ kind, template }), [kind, template]);
	const scrollTop = useMemo(
		() =>
			getAddScrollTop({
				activeFieldName,
				values: scrollValues,
				viewportHeight,
			}),
		[activeFieldName, scrollValues, viewportHeight],
	);

	const visibleFields = new Set(getVisibleAddFieldNames(addValues));
	const orderedVisibleFields = useMemo(() => getVisibleAddFieldNames(addValues), [addValues]);
	const hookedBlockNameUsesSelect = kind === "hooked-block" && workspaceBlockOptions.length > 0;
	const variationBlockUsesSelect = kind === "variation" && workspaceBlockOptions.length > 0;

	return createElement(
		FirstPartyFormViewport,
		{
			isSubmitting,
			scrollTop,
			submittingDescription: "Applying your workspace changes...",
			submittingTitle: "Updating workspace...",
			viewportHeight,
		},
		[
			createElement(FirstPartySelectField, {
				...getWrappedFieldNeighbors(orderedVisibleFields, "kind"),
				key: "kind",
				label: "Kind",
				name: "kind" satisfies AddSelectFieldName,
				options: kindOptions,
			}),
			visibleFields.has("name") && !hookedBlockNameUsesSelect
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "name"),
						key: `name-text:${kind}`,
						label: getAddNameLabel(kind),
						name: "name",
					})
				: null,
			hookedBlockNameUsesSelect
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "name"),
						key: "name-select:hooked-block",
						label: getAddNameLabel(kind),
						name: "name" satisfies AddSelectFieldName,
						options: workspaceBlockOptions,
					})
				: null,
			visibleFields.has("template")
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "template"),
						key: "template",
						label: "Template family",
						name: "template" satisfies AddSelectFieldName,
						options: templateOptions,
					})
				: null,
			visibleFields.has("alternate-render-targets")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(
							orderedVisibleFields,
							"alternate-render-targets",
						),
						key: "alternate-render-targets",
						label: "Alternate render targets",
						name: "alternate-render-targets",
					})
				: null,
			visibleFields.has("inner-blocks-preset")
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(
							orderedVisibleFields,
							"inner-blocks-preset",
						),
						key: "inner-blocks-preset",
						label: "InnerBlocks preset",
						name: "inner-blocks-preset" satisfies AddSelectFieldName,
						options: compoundInnerBlocksPresetOptions,
					})
				: null,
			visibleFields.has("block") && !variationBlockUsesSelect
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "block"),
						key: "block-text",
						label: "Target block",
						name: "block",
					})
				: null,
			variationBlockUsesSelect
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "block"),
						key: "block-select",
						label: "Target block",
						name: "block" satisfies AddSelectFieldName,
						options: workspaceBlockOptions,
					})
				: null,
			visibleFields.has("namespace")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "namespace"),
						key: "namespace",
						label: "REST namespace",
						name: "namespace",
					})
				: null,
			visibleFields.has("methods")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "methods"),
						key: "methods",
						label: "Methods (comma-separated: list, read, create, update, delete)",
						name: "methods",
					})
				: null,
			visibleFields.has("anchor")
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "anchor"),
						key: "anchor",
						label: "Anchor block name",
						name: "anchor",
					})
				: null,
			visibleFields.has("position")
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "position"),
						key: "position",
						label: "Hook position",
						name: "position" satisfies AddSelectFieldName,
						options: HOOKED_BLOCK_POSITION_IDS.map((position) => ({
							description: HOOKED_BLOCK_POSITION_DESCRIPTIONS[position],
							name: position,
							value: position,
						})),
					})
				: null,
			visibleFields.has("slot")
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "slot"),
						key: "slot",
						label: "Editor shell slot",
						name: "slot" satisfies AddSelectFieldName,
						options: editorPluginSlotOptions,
					})
				: null,
			visibleFields.has("data-storage") && isAddPersistenceTemplate(template)
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "data-storage"),
						key: "data-storage",
						label: "Data storage",
						name: "data-storage" satisfies AddSelectFieldName,
						options: dataStorageOptions,
					})
				: null,
			visibleFields.has("persistence-policy") && isAddPersistenceTemplate(template)
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(orderedVisibleFields, "persistence-policy"),
						key: "persistence-policy",
						label: "Persistence policy",
						name: "persistence-policy" satisfies AddSelectFieldName,
						options: persistencePolicyOptions,
					})
				: null,
		],
	);
}

export function AddFlow({ cwd, initialValues }: AddFlowProps) {
	const { completion, handleCancel, handleFailure, handleSubmit, status } =
		useAlternateBufferLifecycle(
		"wp-typia add failed",
		);
	const { height: terminalHeight = 24 } = useTerminalDimensions();
	const [workspaceBlockOptions, setWorkspaceBlockOptions] = useState<WorkspaceBlockOption[]>([]);

	useEffect(() => {
		let disposed = false;
		setWorkspaceBlockOptions([]);

		void loadAddWorkspaceBlockOptions(cwd)
			.then((options) => {
				if (!disposed) {
					setWorkspaceBlockOptions(options);
				}
			})
			.catch((error) => {
				if (!disposed) {
					handleFailure(error);
				}
			});

		return () => {
			disposed = true;
		};
	}, [cwd, handleFailure]);

	if (status === "completed" && completion) {
		return createElement(FirstPartyCompletionViewport, {
			completion,
			viewportHeight: getAddViewportHeight(terminalHeight),
		});
	}

	return (
		<Form
			initialValues={initialValues}
			onCancel={handleCancel}
			onSubmit={async (values) =>
				handleSubmit(async () => {
					const flags = sanitizeAddSubmitValues(values);
					return executeAddCommand({
						cwd,
						emitOutput: false,
						flags,
						interactive: false,
						kind: values.kind,
						name: typeof flags.name === "string" ? flags.name : undefined,
					});
				})
			}
			schema={addFlowSchema}
			title="Extend a wp-typia workspace"
		>
			<AddFlowFields workspaceBlockOptions={workspaceBlockOptions} />
		</Form>
	);
}
