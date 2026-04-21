import { createElement, useMemo } from "react";

import {
	Form,
	type SelectOption,
	useFormContext,
	useTerminalDimensions,
} from "@bunli/tui";
import {
	COMPOUND_INNER_BLOCKS_PRESET_IDS,
	getCompoundInnerBlocksPresetDefinition,
} from "@wp-typia/project-tools";

import { executeCreateCommand } from "../runtime-bridge";
import { useAlternateBufferLifecycle } from "./alternate-buffer-lifecycle";
import {
	type CreateFlowValues,
	CREATE_CHECKBOX_FIELD_NAMES,
	createFlowSchema,
	getCreateScrollTop,
	getCreateViewportHeight,
	getVisibleCreateFieldNames,
	isCreatePersistenceTemplate,
	isCreateQueryLoopTemplate,
	sanitizeCreateSubmitValues,
} from "./create-flow-model";
import {
	FirstPartyCheckboxField,
	FirstPartyCompletionViewport,
	FirstPartyFormViewport,
	FirstPartySelectField,
	FirstPartyTextField,
} from "./first-party-form";
import { getWrappedFieldNeighbors } from "./first-party-form-model";

const templateOptions: SelectOption[] = [
	{ description: "Basic block scaffold", name: "basic", value: "basic" },
	{ description: "Interactivity API block scaffold", name: "interactivity", value: "interactivity" },
	{ description: "Persistence-enabled block scaffold", name: "persistence", value: "persistence" },
	{ description: "Compound parent + child scaffold", name: "compound", value: "compound" },
	{ description: "core/query variation scaffold", name: "query-loop", value: "query-loop" },
	{ description: "Official empty workspace template", name: "workspace", value: "workspace" },
];

const packageManagerOptions: SelectOption[] = [
	{ description: "Use npm", name: "npm", value: "npm" },
	{ description: "Use pnpm", name: "pnpm", value: "pnpm" },
	{ description: "Use yarn", name: "yarn", value: "yarn" },
	{ description: "Use bun", name: "bun", value: "bun" },
];

const dataStorageOptions: SelectOption[] = [
	{ description: "Dedicated custom table storage", name: "custom-table", value: "custom-table" },
	{ description: "Persist through post meta", name: "post-meta", value: "post-meta" },
];

const persistencePolicyOptions: SelectOption[] = [
	{ description: "Authenticated write policy", name: "authenticated", value: "authenticated" },
	{ description: "Public token policy", name: "public", value: "public" },
];

const compoundInnerBlocksPresetOptions: SelectOption[] =
	COMPOUND_INNER_BLOCKS_PRESET_IDS.map((value) => ({
		description: getCompoundInnerBlocksPresetDefinition(value).description,
		name: value,
		value,
	}));

const checkboxLabels: Record<(typeof CREATE_CHECKBOX_FIELD_NAMES)[number], string> = {
	"dry-run": "Preview only (dry run)",
	"no-install": "Skip dependency install",
	yes: "Use defaults without prompts",
	"with-wp-env": "Add wp-env preset",
	"with-test-preset": "Add test preset",
	"with-migration-ui": "Add migration UI",
};

type CreateFlowProps = {
	cwd: string;
	initialValues: Partial<CreateFlowValues>;
};

type CreateSelectFieldName = {
	[K in keyof CreateFlowValues]-?: CreateFlowValues[K] extends string | undefined ? K : never;
}[keyof CreateFlowValues];

function CreateFlowFields({
	progressDescription,
	progressTitle,
}: {
	progressDescription?: string;
	progressTitle?: string;
}) {
	const { activeFieldName, isSubmitting, values } = useFormContext();
	const { height: terminalHeight = 24 } = useTerminalDimensions();
	const createValues = values as Partial<CreateFlowValues>;
	const template = createValues.template;
	const viewportHeight = getCreateViewportHeight(terminalHeight);
	const visibleFields = useMemo(() => getVisibleCreateFieldNames(createValues), [createValues]);
	const scrollValues = useMemo(() => ({ template }), [template]);
	const scrollTop = useMemo(
		() =>
			getCreateScrollTop({
				activeFieldName,
				values: scrollValues,
				viewportHeight,
			}),
		[activeFieldName, scrollValues, viewportHeight],
	);

	return createElement(
		FirstPartyFormViewport,
		{
			isSubmitting,
			scrollTop,
			submittingDescription:
				progressDescription ?? "Preparing your wp-typia project files...",
			submittingTitle: progressTitle ?? "Creating project...",
			viewportHeight,
		},
		[
			createElement(FirstPartyTextField, {
				...getWrappedFieldNeighbors(visibleFields, "project-dir"),
				key: "project-dir",
				label: "Project directory",
				name: "project-dir",
				required: true,
			}),
			createElement(FirstPartySelectField, {
				...getWrappedFieldNeighbors(visibleFields, "template"),
				key: "template",
				label: "Template",
				name: "template" satisfies CreateSelectFieldName,
				options: templateOptions,
			}),
			createElement(FirstPartySelectField, {
				...getWrappedFieldNeighbors(visibleFields, "package-manager"),
				key: "package-manager",
				label: "Package manager",
				name: "package-manager" satisfies CreateSelectFieldName,
				options: packageManagerOptions,
			}),
			createElement(FirstPartyTextField, {
				...getWrappedFieldNeighbors(visibleFields, "namespace"),
				key: "namespace",
				label: "Namespace",
				name: "namespace",
			}),
			createElement(FirstPartyTextField, {
				...getWrappedFieldNeighbors(visibleFields, "text-domain"),
				key: "text-domain",
				label: "Text domain",
				name: "text-domain",
			}),
			createElement(FirstPartyTextField, {
				...getWrappedFieldNeighbors(visibleFields, "php-prefix"),
				key: "php-prefix",
				label: "PHP prefix",
				name: "php-prefix",
			}),
			isCreateQueryLoopTemplate(template)
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(visibleFields, "query-post-type"),
						key: "query-post-type",
						label: "Query post type",
						name: "query-post-type",
					})
				: null,
			isCreatePersistenceTemplate(template)
				? createElement(FirstPartyTextField, {
						...getWrappedFieldNeighbors(
							visibleFields,
							"alternate-render-targets",
						),
						key: "alternate-render-targets",
						label: "Alternate render targets",
						name: "alternate-render-targets",
					})
				: null,
			template === "compound"
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(visibleFields, "inner-blocks-preset"),
						key: "inner-blocks-preset",
						label: "InnerBlocks preset",
						name: "inner-blocks-preset" satisfies CreateSelectFieldName,
						options: compoundInnerBlocksPresetOptions,
					})
				: null,
			isCreatePersistenceTemplate(template)
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(visibleFields, "data-storage"),
						key: "data-storage",
						label: "Data storage",
						name: "data-storage" satisfies CreateSelectFieldName,
						options: dataStorageOptions,
					})
				: null,
			isCreatePersistenceTemplate(template)
				? createElement(FirstPartySelectField, {
						...getWrappedFieldNeighbors(visibleFields, "persistence-policy"),
						key: "persistence-policy",
						label: "Persistence policy",
						name: "persistence-policy" satisfies CreateSelectFieldName,
						options: persistencePolicyOptions,
					})
				: null,
			...CREATE_CHECKBOX_FIELD_NAMES.map((name) =>
				createElement(FirstPartyCheckboxField, {
					...getWrappedFieldNeighbors(visibleFields, name),
					key: name,
					label: checkboxLabels[name],
					name,
				}),
			),
		],
	);
}

export function CreateFlow({ cwd, initialValues }: CreateFlowProps) {
	const { completion, handleCancel, handleSubmit, progress, reportProgress, status } =
		useAlternateBufferLifecycle(
		"wp-typia create failed",
	);
	const { height: terminalHeight = 24 } = useTerminalDimensions();
	const defaultPrompt = {
		close() {},
		select<T extends string>(_message: string, options: Array<{ value: T }>, defaultValue = 1) {
			const fallback = options[Math.max(0, defaultValue - 1)] ?? options[0];
			return Promise.resolve(fallback.value);
		},
		text(_message: string, defaultValue: string) {
			return Promise.resolve(defaultValue);
		},
	};

	if (status === "completed" && completion) {
		return createElement(FirstPartyCompletionViewport, {
			completion,
			viewportHeight: getCreateViewportHeight(terminalHeight),
		});
	}

	return (
		<Form
			initialValues={initialValues}
			onCancel={handleCancel}
			onSubmit={async (values) =>
				handleSubmit(async () => {
					const flags = sanitizeCreateSubmitValues(values);
					return executeCreateCommand({
						cwd,
						emitOutput: false,
						flags,
						interactive: true,
						onProgress: ({ detail, title }) =>
							reportProgress({
								description: detail,
								title,
							}),
						projectDir: values["project-dir"],
						prompt: defaultPrompt,
					});
				})
			}
			schema={createFlowSchema}
			title="Create a wp-typia project"
		>
			<CreateFlowFields
				progressDescription={progress?.description}
				progressTitle={progress?.title}
			/>
		</Form>
	);
}
