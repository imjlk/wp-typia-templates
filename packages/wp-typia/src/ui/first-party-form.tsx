import {
	createElement,
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from "react";

import { useScopedKeyboard } from "@bunli/runtime/app";
import {
	Spinner,
	type SelectOption,
	createKeyMatcher,
	useFormContext,
	useFormField,
	useTuiTheme,
} from "@bunli/tui";

import {
	FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	FIRST_PARTY_FIELD_GAP,
	FIRST_PARTY_SELECT_FIELD_CONTROL_HEIGHT,
	FIRST_PARTY_SELECT_FIELD_LABEL_GAP,
} from "./first-party-form-model";
import type { AlternateBufferCompletionPayload } from "./alternate-buffer-lifecycle";

const checkboxKeymap = createKeyMatcher({
	toggle: ["space", "enter"],
});

const navigationKeymap = createKeyMatcher({
	nextField: ["tab"],
	previousField: ["shift+tab"],
});

const submitShortcutKeymap = createKeyMatcher({
	submitShortcut: ["ctrl+s"],
});

const selectKeymap = createKeyMatcher({
	next: ["down", "enter", "right", "space"],
	previous: ["left", "up"],
});

function isNextFieldKey(key: Parameters<typeof navigationKeymap.match>[1]) {
	return (
		navigationKeymap.match("nextField", key) ||
		key.sequence === "\t" ||
		(key.ctrl === true && key.name === "i" && key.shift !== true)
	);
}

function isPreviousFieldKey(key: Parameters<typeof navigationKeymap.match>[1]) {
	return (
		navigationKeymap.match("previousField", key) ||
		key.sequence === "\u001b[Z" ||
		(key.name === "tab" && key.shift === true)
	);
}

function isSubmitShortcutKey(key: Parameters<typeof submitShortcutKeymap.match>[1]) {
	return (
		submitShortcutKeymap.match("submitShortcut", key) ||
		key.sequence === "\x13" ||
		(key.ctrl === true && key.name === "s")
	);
}

function isSelectNextKey(key: Parameters<typeof selectKeymap.match>[1]) {
	return (
		selectKeymap.match("next", key) ||
		key.sequence === "\x1b[B" ||
		key.sequence === "\x1b[C" ||
		key.name === "down" ||
		key.name === "right" ||
		key.sequence === " "
	);
}

function isSelectPreviousKey(key: Parameters<typeof selectKeymap.match>[1]) {
	return (
		selectKeymap.match("previous", key) ||
		key.sequence === "\x1b[A" ||
		key.sequence === "\x1b[D" ||
		key.name === "up" ||
		key.name === "left"
	);
}

function isCheckboxToggleKey(key: Parameters<typeof checkboxKeymap.match>[1]) {
	return (
		checkboxKeymap.match("toggle", key) ||
		key.sequence === " " ||
		key.sequence === "\r" ||
		key.sequence === "\n"
	);
}

function useFirstPartyFieldNavigation(options: {
	focused: boolean;
	keyboardScopeId: string;
	nextFieldName?: string;
	previousFieldName?: string;
}) {
	const { focusField, submit } = useFormContext();
	const { focused, keyboardScopeId, nextFieldName, previousFieldName } = options;

	useScopedKeyboard(
		keyboardScopeId,
		(key) => {
			if (!focused) {
				return false;
			}

			if (isSubmitShortcutKey(key)) {
				submit();
				return true;
			}

			if (isNextFieldKey(key) && nextFieldName) {
				focusField(nextFieldName);
				return true;
			}

			if (isPreviousFieldKey(key) && previousFieldName) {
				focusField(previousFieldName);
				return true;
			}

			return false;
		},
		{ active: focused },
	);
}

export function FirstPartyTextField({
	defaultValue = "",
	description,
	label,
	name,
	nextFieldName,
	placeholder,
	previousFieldName,
	required,
}: {
	defaultValue?: string;
	description?: string;
	label: string;
	name: string;
	nextFieldName?: string;
	placeholder?: string;
	previousFieldName?: string;
	required?: boolean;
}) {
	const { tokens } = useTuiTheme();
	const reactScopeId = useId();
	const field = useFormField<string>(name, {
		defaultValue,
		submitOnEnter: true,
	});
	const keyboardScopeId = `first-party-text:${name}:${reactScopeId}`;

	useFirstPartyFieldNavigation({
		focused: field.focused,
		keyboardScopeId,
		nextFieldName,
		previousFieldName,
	});

	return createElement(
		"box",
		{ style: { flexDirection: "column", marginBottom: FIRST_PARTY_FIELD_GAP, gap: 1 } },
		createElement("text", {
			content: `${field.focused ? ">" : " "} ${label}${required ? " *" : ""}`,
			fg: field.focused ? tokens.accent : tokens.textPrimary,
		}),
		description
			? createElement("text", {
					content: description,
					fg: tokens.textMuted,
				})
			: null,
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
			createElement("input", {
				focused: field.focused,
				onInput: (nextValue: string) => {
					field.setValue(nextValue);
				},
				onSubmit: (submittedValue: string) => {
					field.setValue(submittedValue);
					field.blur();
				},
				placeholder,
				style: {
					focusedBackgroundColor: tokens.backgroundMuted,
				},
				value: field.value ?? "",
			}),
		),
		field.error
			? createElement("text", { content: field.error, fg: tokens.textDanger })
			: null,
	);
}

export function FirstPartySelectField({
	defaultValue,
	label,
	name,
	nextFieldName,
	options,
	previousFieldName,
}: {
	defaultValue?: string;
	label: string;
	name: string;
	nextFieldName?: string;
	options: SelectOption[];
	previousFieldName?: string;
}) {
	const { tokens } = useTuiTheme();
	const reactScopeId = useId();
	const field = useFormField<string>(name, {
		defaultValue: defaultValue ?? String(options[0]?.value ?? ""),
		submitOnEnter: false,
	});

	const matchingIndex = useMemo(
		() => options.findIndex((option) => option.value === field.value),
		[field.value, options],
	);
	const selectedIndex = matchingIndex >= 0 ? matchingIndex : 0;

	const selectedOption = options[selectedIndex] ?? options[0];
	const keyboardScopeId = `first-party-select:${name}:${reactScopeId}`;

	useEffect(() => {
		const fallbackOption = options[0];
		if (!fallbackOption || matchingIndex >= 0) {
			return;
		}

		const fallbackValue = String(fallbackOption.value);
		if (field.value === fallbackValue) {
			return;
		}

		field.setValue(fallbackValue);
	}, [field, matchingIndex, options]);

	useFirstPartyFieldNavigation({
		focused: field.focused,
		keyboardScopeId,
		nextFieldName,
		previousFieldName,
	});

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

			if (isSelectNextKey(key)) {
				moveSelection(1);
				return true;
			}

			if (isSelectPreviousKey(key)) {
				moveSelection(-1);
				return true;
			}

			return false;
		},
		{ active: field.focused },
	);

	return createElement(
		"box",
		{
			style: {
				flexDirection: "column",
				gap: FIRST_PARTY_SELECT_FIELD_LABEL_GAP,
				marginBottom: FIRST_PARTY_FIELD_GAP,
			},
		},
		createElement("text", {
			content: `${field.focused ? ">" : " "} ${label}`,
			fg: field.focused ? tokens.accent : tokens.textPrimary,
		}),
		createElement(
			"box",
			{
				border: true,
				height: FIRST_PARTY_SELECT_FIELD_CONTROL_HEIGHT,
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

export function FirstPartyCheckboxField({
	label,
	name,
	nextFieldName,
	previousFieldName,
}: {
	label: string;
	name: string;
	nextFieldName?: string;
	previousFieldName?: string;
}) {
	const { tokens } = useTuiTheme();
	const reactScopeId = useId();
	const field = useFormField<boolean>(name, {
		defaultValue: false,
		submitOnEnter: false,
	});
	const keyboardScopeId = `first-party-checkbox:${name}:${reactScopeId}`;

	useFirstPartyFieldNavigation({
		focused: field.focused,
		keyboardScopeId,
		nextFieldName,
		previousFieldName,
	});

	const toggle = useCallback(() => {
		field.setValue(!field.value);
	}, [field]);

	useScopedKeyboard(
		keyboardScopeId,
		(key) => {
			if (!field.focused) {
				return false;
			}

			if (isCheckboxToggleKey(key)) {
				toggle();
				return true;
			}

			return false;
		},
		{ active: field.focused },
	);

	return createElement(
		"box",
		{
			style: {
				flexDirection: "column",
				height: FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
				marginBottom: FIRST_PARTY_FIELD_GAP,
			},
		},
		createElement("text", {
			content: `${field.focused ? ">" : " "} ${field.value ? "[x]" : "[ ]"} ${label}`,
			fg: field.focused ? tokens.accent : tokens.textPrimary,
		}),
		field.error
			? createElement("text", { content: field.error, fg: tokens.textDanger })
			: null,
	);
}

export function FirstPartyScrollBox({
	children,
	scrollTop,
	viewportHeight,
}: {
	children?: ReactNode;
	scrollTop: number;
	viewportHeight: number;
}) {
	const { tokens } = useTuiTheme();
	const bodyRef = useRef<{ scrollTop: number } | null>(null);

	useEffect(() => {
		if (!bodyRef.current) {
			return;
		}

		bodyRef.current.scrollTop = scrollTop;
	}, [scrollTop]);

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
			children,
		),
	);
}

export function FirstPartySubmittingSurface({
	description = "Please wait while wp-typia finishes this command.",
	title = "Submitting...",
	viewportHeight,
}: {
	description?: string;
	title?: string;
	viewportHeight: number;
}) {
	const { tokens } = useTuiTheme();

	return createElement(
		"box",
		{
			border: true,
			height: viewportHeight,
			width: "100%",
			"data-form-surface": "submitting",
			style: {
				alignItems: "center",
				borderColor: tokens.borderMuted,
				flexDirection: "column",
				gap: 1,
				justifyContent: "center",
			},
		},
		createElement(Spinner, {
			title,
			variant: "dot",
		}),
		createElement("text", {
			content: description,
			fg: tokens.textMuted,
		}),
	);
}

export function FirstPartyFormViewport({
	children,
	isSubmitting = false,
	scrollTop,
	submittingDescription,
	submittingTitle,
	viewportHeight,
}: {
	children?: ReactNode;
	isSubmitting?: boolean;
	scrollTop: number;
	submittingDescription?: string;
	submittingTitle?: string;
	viewportHeight: number;
}) {
	if (isSubmitting) {
		return createElement(FirstPartySubmittingSurface, {
			description: submittingDescription,
			title: submittingTitle,
			viewportHeight,
		});
	}

	return createElement(FirstPartyScrollBox, {
		scrollTop,
		viewportHeight,
		children,
	});
}

export function FirstPartyCompletionViewport({
	completion,
	viewportHeight,
}: {
	completion: AlternateBufferCompletionPayload;
	viewportHeight: number;
}) {
	const { tokens } = useTuiTheme();
	const bodyHeight = Math.max(4, viewportHeight - 3);

	return createElement(
		"box",
		{
			border: true,
			height: viewportHeight,
			width: "100%",
			"data-form-surface": "completed",
			style: {
				borderColor: tokens.borderMuted,
				flexDirection: "column",
			},
		},
		createElement(
			"scrollbox",
			{
				height: bodyHeight,
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
				{
					width: "100%",
					style: {
						flexDirection: "column",
						gap: 1,
					},
				},
				createElement("text", {
					content: completion.title,
					fg: tokens.accent,
				}),
				...(completion.preambleLines ?? []).map((line, index) =>
					createElement("text", {
						content: line,
						fg: tokens.textMuted,
						key: `preamble:${index}`,
					}),
				),
				...(completion.warningLines ?? []).map((line, index) =>
					createElement("text", {
						content: `⚠️ ${line}`,
						fg: tokens.textWarning,
						key: `warning:${index}`,
					}),
				),
				...(completion.summaryLines ?? []).map((line, index) =>
					createElement("text", {
						content: line,
						fg: tokens.textPrimary,
						key: `summary:${index}`,
					}),
				),
				(completion.nextSteps?.length ?? 0) > 0
					? createElement("text", {
							content: "Next steps:",
							fg: tokens.textPrimary,
							key: "next-steps:title",
						})
					: null,
				...(completion.nextSteps ?? []).map((line, index) =>
					createElement("text", {
						content: `  ${line}`,
						fg: tokens.textPrimary,
						key: `next-step:${index}`,
					}),
				),
				(completion.optionalLines?.length ?? 0) > 0
					? createElement("text", {
							content: completion.optionalTitle ?? "Optional:",
							fg: tokens.textPrimary,
							key: "optional:title",
						})
					: null,
				...(completion.optionalLines ?? []).map((line, index) =>
					createElement("text", {
						content: `  ${line}`,
						fg: tokens.textMuted,
						key: `optional:${index}`,
					}),
				),
				completion.optionalNote
					? createElement("text", {
							content: `Note: ${completion.optionalNote}`,
							fg: tokens.textMuted,
							key: "optional:note",
						})
					: null,
			),
		),
		createElement("text", {
			content: "Enter: close | q: exit | Ctrl+C: quit",
			fg: tokens.textMuted,
		}),
	);
}
