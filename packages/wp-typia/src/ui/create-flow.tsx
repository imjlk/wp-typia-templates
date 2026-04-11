import { createElement, useCallback, useEffect, useId, useMemo, useRef } from "react";

import { useScopedKeyboard } from "@bunli/runtime/app";
import {
	Form,
	FormField,
	type SelectOption,
	createKeyMatcher,
	useFormContext,
	useFormField,
	useTerminalDimensions,
	useTuiTheme,
} from "@bunli/tui";

import { executeCreateCommand } from "../runtime-bridge";
import { useAlternateBufferLifecycle } from "./alternate-buffer-lifecycle";
import {
	type CreateFlowValues,
	CREATE_CHECKBOX_FIELD_NAMES,
	createFlowSchema,
	getCreateScrollTop,
	getCreateViewportHeight,
	isCreatePersistenceTemplate,
	sanitizeCreateSubmitValues,
} from "./create-flow-model";

const templateOptions: SelectOption[] = [
	{ description: "Basic block scaffold", name: "basic", value: "basic" },
	{ description: "Interactivity API block scaffold", name: "interactivity", value: "interactivity" },
	{ description: "Persistence-enabled block scaffold", name: "persistence", value: "persistence" },
	{ description: "Compound parent + child scaffold", name: "compound", value: "compound" },
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

const checkboxLabels: Record<(typeof CREATE_CHECKBOX_FIELD_NAMES)[number], string> = {
	"no-install": "Skip dependency install",
	yes: "Use defaults without prompts",
	"with-wp-env": "Add wp-env preset",
	"with-test-preset": "Add test preset",
	"with-migration-ui": "Add migration UI",
};

const checkboxKeymap = createKeyMatcher({
	toggle: ["space", "enter"],
});

const selectKeymap = createKeyMatcher({
	next: ["down", "enter", "right", "space"],
	previous: ["left", "up"],
});

type CreateFlowProps = {
	cwd: string;
	initialValues: Partial<CreateFlowValues>;
};

type CreateSelectFieldProps = {
	defaultValue?: string;
	label: string;
	name: keyof CreateFlowValues;
	options: SelectOption[];
};

function CreateSelectField({
	defaultValue,
	label,
	name,
	options,
}: CreateSelectFieldProps) {
	const { tokens } = useTuiTheme();
	const field = useFormField<string>(name, {
		defaultValue: defaultValue ?? String(options[0]?.value ?? ""),
		submitOnEnter: false,
	});

	const selectedIndex = useMemo(() => {
		const index = options.findIndex((option) => option.value === field.value);
		return index >= 0 ? index : 0;
	}, [field.value, options]);

	const selectedOption = options[selectedIndex] ?? options[0];
	const keyboardScopeId = `create-select:${name}`;

	const moveSelection = useCallback(
		(delta: number) => {
			if (!selectedOption || options.length === 0) {
				return;
			}

			const nextIndex = (selectedIndex + delta + options.length) % options.length;
			const nextOption = options[nextIndex];
			if (!nextOption) {
				return;
			}

			field.setValue(String(nextOption.value));
		},
		[field, options, selectedIndex, selectedOption],
	);

	useScopedKeyboard(
		keyboardScopeId,
		(key) => {
			if (!field.focused) {
				return false;
			}

			if (selectKeymap.match("next", key)) {
				moveSelection(1);
				return true;
			}

			if (selectKeymap.match("previous", key)) {
				moveSelection(-1);
				return true;
			}

			return false;
		},
		{ active: field.focused },
	);

	return createElement(
		"box",
		{ style: { flexDirection: "column", gap: 1, marginBottom: 1 } },
		createElement("text", {
			content: `${field.focused ? ">" : " "} ${label}`,
			fg: field.focused ? tokens.accent : tokens.textPrimary,
		}),
		createElement(
			"box",
			{
				border: true,
				height: 3,
				style: {
					borderColor: field.error
						? tokens.textDanger
						: field.focused
							? tokens.accent
							: tokens.borderMuted,
				},
			},
			createElement("text", {
				content: `${field.focused ? "▶" : " "} ${selectedOption?.name ?? ""}`,
				fg: field.focused ? tokens.accent : tokens.textPrimary,
			}),
		),
		selectedOption?.description
			? createElement("text", {
					content: `  ${selectedOption.description}`,
					fg: tokens.textMuted,
				})
			: null,
		field.error
			? createElement("text", { content: field.error, fg: tokens.textDanger })
			: null,
	);
}

function CreateCheckboxField({
	label,
	name,
}: {
	label: string;
	name: (typeof CREATE_CHECKBOX_FIELD_NAMES)[number];
}) {
	const { tokens } = useTuiTheme();
	const reactScopeId = useId();
	const field = useFormField<boolean>(name, {
		defaultValue: false,
		submitOnEnter: false,
	});
	const keyboardScopeId = `create-checkbox:${name}:${reactScopeId}`;

	const toggle = useCallback(() => {
		field.setValue(!field.value);
	}, [field]);

	useScopedKeyboard(
		keyboardScopeId,
		(key) => {
			if (!field.focused) {
				return false;
			}

			if (checkboxKeymap.match("toggle", key)) {
				toggle();
				return true;
			}

			return false;
		},
		{ active: field.focused },
	);

	return createElement(
		"box",
		{ style: { flexDirection: "column", marginBottom: 1 } },
		createElement("text", {
			content: `${field.focused ? ">" : " "} ${field.value ? "[x]" : "[ ]"} ${label}`,
			fg: field.focused ? tokens.accent : tokens.textPrimary,
		}),
		field.error
			? createElement("text", { content: field.error, fg: tokens.textDanger })
			: null,
	);
}

function CreateFlowFields() {
	const { tokens } = useTuiTheme();
	const { activeFieldName, values } = useFormContext();
	const { height: terminalHeight = 24 } = useTerminalDimensions();
	const bodyRef = useRef<{ scrollTop: number } | null>(null);
	const createValues = values as Partial<CreateFlowValues>;
	const template = createValues.template;
	const viewportHeight = getCreateViewportHeight(terminalHeight);

	useEffect(() => {
		if (!bodyRef.current) {
			return;
		}

		bodyRef.current.scrollTop = getCreateScrollTop({
			activeFieldName,
			values: createValues,
			viewportHeight,
		});
	}, [activeFieldName, createValues, viewportHeight]);

	return createElement(
		"scrollbox",
		{
			ref: bodyRef,
			height: viewportHeight,
			scrollY: true,
			scrollbarOptions: {
				visible: true,
				trackOptions: {
					backgroundColor: tokens.backgroundMuted,
					foregroundColor: tokens.borderMuted,
				},
			},
			viewportOptions: { width: "100%" },
			contentOptions: { width: "100%" },
		},
		createElement(
			"box",
			{ width: "100%", style: { flexDirection: "column" } },
			<FormField label="Project directory" name="project-dir" required />,
			<CreateSelectField label="Template" name="template" options={templateOptions} />,
			<CreateSelectField
				label="Package manager"
				name="package-manager"
				options={packageManagerOptions}
			/>,
			<FormField label="Namespace" name="namespace" />,
			<FormField label="Text domain" name="text-domain" />,
			<FormField label="PHP prefix" name="php-prefix" />,
			isCreatePersistenceTemplate(template) ? (
				<CreateSelectField
					label="Data storage"
					name="data-storage"
					options={dataStorageOptions}
				/>
			) : null,
			isCreatePersistenceTemplate(template) ? (
				<CreateSelectField
					label="Persistence policy"
					name="persistence-policy"
					options={persistencePolicyOptions}
				/>
			) : null,
			...CREATE_CHECKBOX_FIELD_NAMES.map((name) => (
				<CreateCheckboxField key={name} label={checkboxLabels[name]} name={name} />
			)),
		),
	);
}

export function CreateFlow({ cwd, initialValues }: CreateFlowProps) {
	const { handleCancel, handleSubmit } = useAlternateBufferLifecycle("wp-typia create failed");
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

	return (
		<Form
			initialValues={initialValues}
			onCancel={handleCancel}
			onSubmit={async (values) =>
				handleSubmit(async () => {
					const flags = sanitizeCreateSubmitValues(values);
					await executeCreateCommand({
						cwd,
						flags,
						interactive: true,
						projectDir: values["project-dir"],
						prompt: defaultPrompt,
					});
				})
			}
			schema={createFlowSchema}
			title="Create a wp-typia project"
		>
			<CreateFlowFields />
		</Form>
	);
}
