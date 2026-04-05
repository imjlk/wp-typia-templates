import React, {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

import {
	createEditorModel,
	type EditorFieldDescriptor,
	type EditorFieldOption,
	type EditorModelOptions,
	type ManifestDocument,
} from "./editor.js";
import {
	createAttributeUpdater,
	createNestedAttributeUpdater,
	type ValidationResult,
} from "./validation.js";
import { isPlainObject as isRecord } from "./object-utils.js";

export type {
	EditorFieldDescriptor,
	EditorFieldOption,
	EditorModelOptions,
	ManifestAttribute,
	ManifestDocument,
} from "./editor.js";
export type { ValidationResult } from "./validation.js";

type UnknownRecord = Record<string, unknown>;

export interface InspectorSelectOption {
	label: string;
	value: string;
}

export interface PanelBodyLikeProps {
	children?: ReactNode;
	initialOpen?: boolean;
	title?: ReactNode;
}

export interface ToggleControlLikeProps {
	checked?: boolean;
	help?: ReactNode;
	label?: ReactNode;
	onChange?: (value: boolean) => void;
}

export interface SelectControlLikeProps {
	help?: ReactNode;
	label?: ReactNode;
	onChange?: (value: string) => void;
	options?: readonly InspectorSelectOption[];
	value?: string;
}

export interface RangeControlLikeProps {
	help?: ReactNode;
	label?: ReactNode;
	max?: number;
	min?: number;
	onChange?: (value?: number) => void;
	step?: number;
	value?: number;
}

export interface TextControlLikeProps {
	help?: ReactNode;
	label?: ReactNode;
	max?: number;
	min?: number;
	onBlur?: () => void;
	onChange?: (value: string) => void;
	step?: number;
	type?: string;
	value?: string;
}

export interface TextareaControlLikeProps {
	help?: ReactNode;
	label?: ReactNode;
	onChange?: (value: string) => void;
	value?: string;
}

export interface InspectorComponentMap {
	PanelBody?: React.ElementType<PanelBodyLikeProps>;
	RangeControl?: React.ElementType<RangeControlLikeProps>;
	SelectControl?: React.ElementType<SelectControlLikeProps>;
	TextControl?: React.ElementType<TextControlLikeProps>;
	TextareaControl?: React.ElementType<TextareaControlLikeProps>;
	ToggleControl?: React.ElementType<ToggleControlLikeProps>;
}

export interface UseEditorFieldsResult {
	fields: EditorFieldDescriptor[];
	fieldMap: Map<string, EditorFieldDescriptor>;
	getBooleanValue: (
		source: UnknownRecord,
		path: string,
		fallback: boolean,
	) => boolean;
	getField: (path: string) => EditorFieldDescriptor | undefined;
	getNumberValue: (
		source: UnknownRecord,
		path: string,
		fallback: number,
	) => number;
	getSelectOptions: (
		path: string,
		labelMap?: Record<string, string>,
	) => InspectorSelectOption[];
	getStringValue: (
		source: UnknownRecord,
		path: string,
		fallback: string,
	) => string;
	manualFields: EditorFieldDescriptor[];
	supportedFields: EditorFieldDescriptor[];
}

export interface TypedAttributeUpdater<T extends object> {
	updateAttribute: <K extends keyof T>(key: K, value: T[K]) => boolean;
	updateField: <K extends keyof T>(path: K | string, value: unknown) => boolean;
	updatePath: (path: string, value: unknown) => boolean;
}

export interface FieldControlRenderContext {
	components: InspectorComponentMap;
	field: EditorFieldDescriptor;
	help?: ReactNode;
	label?: ReactNode;
	max?: number;
	min?: number;
	onChange: (value: unknown) => void;
	options?: readonly InspectorSelectOption[];
	step?: number;
	value: unknown;
}

export interface FieldControlProps {
	components?: InspectorComponentMap;
	field: EditorFieldDescriptor;
	help?: ReactNode;
	label?: ReactNode;
	max?: number;
	min?: number;
	onChange: (value: unknown) => void;
	options?: readonly InspectorSelectOption[];
	render?: (context: FieldControlRenderContext) => ReactNode;
	renderUnsupported?: (context: FieldControlRenderContext) => ReactNode;
	step?: number;
	value: unknown;
}

export interface InspectorFieldOverride {
	help?: ReactNode;
	label?: ReactNode;
	max?: number;
	min?: number;
	options?: readonly InspectorSelectOption[];
	render?: (context: FieldControlRenderContext) => ReactNode;
	renderUnsupported?: (context: FieldControlRenderContext) => ReactNode;
	step?: number;
}

export interface InspectorFromManifestProps<T extends UnknownRecord> {
	attributes: T;
	children?: ReactNode;
	components?: InspectorComponentMap;
	fieldLookup: UseEditorFieldsResult;
	fieldOverrides?: Record<string, InspectorFieldOverride>;
	initialOpen?: boolean;
	onChange: (path: string, value: unknown) => void;
	paths: readonly string[];
	title?: ReactNode;
}

function getPathSegments(path: string): string[] {
	return path.split(".").filter(Boolean);
}

function getDefaultValue(
	field: EditorFieldDescriptor | undefined,
	fallback: unknown,
): unknown {
	if (field?.hasDefault) {
		return field.defaultValue;
	}

	return fallback;
}

function getValueAtPath(source: UnknownRecord, path: string): unknown {
	return getPathSegments(path).reduce<unknown>((current, segment) => {
		if (!isRecord(current)) {
			return undefined;
		}

		return current[segment];
	}, source);
}

function toStringValue(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function toSelectOptions(
	options: readonly EditorFieldOption[],
	labelMap?: Record<string, string>,
): InspectorSelectOption[] {
	return options.map((option) => ({
		label: labelMap?.[String(option.value)] ?? option.label,
		value: String(option.value),
	}));
}

function createValidationResult<T extends object>(value: T): ValidationResult<T> {
	return {
		data: value,
		errors: [],
		isValid: true,
	};
}

function asComponent<TProps>(
	value: unknown,
): React.ElementType<TProps> | undefined {
	if (
		typeof value === "function" ||
		(value !== null && typeof value === "object")
	) {
		return value as React.ElementType<TProps>;
	}

	return undefined;
}

function FallbackPanelBody({ children }: PanelBodyLikeProps) {
	return <>{children}</>;
}

function getGlobalInspectorComponents(): InspectorComponentMap {
	const globalScope = globalThis as {
		window?: { wp?: { components?: UnknownRecord } };
		wp?: { components?: UnknownRecord };
	};
	const componentRegistry =
		globalScope.wp?.components ?? globalScope.window?.wp?.components ?? {};

	return {
		PanelBody: asComponent<PanelBodyLikeProps>(componentRegistry.PanelBody),
		RangeControl: asComponent<RangeControlLikeProps>(
			componentRegistry.RangeControl,
		),
		SelectControl: asComponent<SelectControlLikeProps>(
			componentRegistry.SelectControl,
		),
		TextControl: asComponent<TextControlLikeProps>(componentRegistry.TextControl),
		TextareaControl: asComponent<TextareaControlLikeProps>(
			componentRegistry.TextareaControl,
		),
		ToggleControl: asComponent<ToggleControlLikeProps>(
			componentRegistry.ToggleControl,
		),
	};
}

function resolveInspectorComponents(
	components?: InspectorComponentMap,
): InspectorComponentMap {
	return {
		...getGlobalInspectorComponents(),
		...(components ?? {}),
	};
}

function getFieldValue(
	field: EditorFieldDescriptor,
	source: UnknownRecord,
): unknown {
	const currentValue = getValueAtPath(source, field.path);

	if (currentValue !== undefined) {
		return currentValue;
	}

	switch (field.control) {
		case "toggle":
			return getDefaultValue(field, false);
		case "number":
		case "range":
			return getDefaultValue(field, 0);
		case "select":
		case "text":
		case "textarea":
			return getDefaultValue(field, "");
		default:
			return getDefaultValue(field, undefined);
	}
}

function getFieldControlContext(
	field: EditorFieldDescriptor,
	props: Omit<FieldControlProps, "components" | "field">,
	resolvedComponents: InspectorComponentMap,
): FieldControlRenderContext {
	return {
		components: resolvedComponents,
		field,
		help: props.help,
		label: props.label ?? field.label,
		max: props.max ?? field.maximum ?? undefined,
		min: props.min ?? field.minimum ?? undefined,
		onChange: props.onChange,
		options: props.options,
		step: props.step ?? field.step ?? undefined,
		value: props.value,
	};
}

function parseSelectValue(
	field: EditorFieldDescriptor,
	value: string,
	overrideOptions?: readonly InspectorSelectOption[],
): string | number | boolean {
	const matchedOption = field.options.find(
		(option) => String(option.value) === value,
	);
	if (matchedOption) {
		return matchedOption.value;
	}

	if (overrideOptions?.some((option) => option.value === value)) {
		return value;
	}

	return value;
}

function formatNumberDraft(value: unknown): string {
	return String(toNumberValue(value, 0));
}

function parseNumberDraft(value: string): number | undefined {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}

	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : undefined;
}

interface StableEditorModelOptions {
	hidden: string[];
	labels: Record<string, string>;
	manual: string[];
	preferTextarea: string[];
}

interface NumberFieldControlProps {
	context: FieldControlRenderContext;
	onChange: (value: unknown) => void;
	value: unknown;
	TextControl: React.ElementType<TextControlLikeProps>;
}

function NumberFieldControl({
	context,
	onChange,
	value,
	TextControl,
}: NumberFieldControlProps) {
	const committedDraft = formatNumberDraft(value);
	const [draft, setDraft] = useState(committedDraft);

	useEffect(() => {
		setDraft(committedDraft);
	}, [committedDraft]);

	const commitDraft = useCallback(() => {
		const parsed = parseNumberDraft(draft);
		if (parsed === undefined) {
			setDraft(committedDraft);
			return;
		}

		onChange(parsed);
		setDraft(String(parsed));
	}, [committedDraft, draft, onChange]);

	return (
		<TextControl
			help={context.help}
			label={context.label}
			max={context.max}
			min={context.min}
			onBlur={commitDraft}
			onChange={setDraft}
			step={context.step}
			type="number"
			value={draft}
		/>
	);
}

export function useEditorFields(
	manifest: ManifestDocument,
	options: EditorModelOptions = {},
): UseEditorFieldsResult {
	const optionsKey = JSON.stringify({
		hidden: options.hidden ?? [],
		labels: options.labels ?? {},
		manual: options.manual ?? [],
		preferTextarea: options.preferTextarea ?? [],
	});
	const stableOptions = useMemo(
		() => JSON.parse(optionsKey) as StableEditorModelOptions,
		[optionsKey],
	);
	const fields = useMemo(
		() => createEditorModel(manifest, stableOptions),
		[manifest, stableOptions],
	);
	const fieldMap = useMemo(
		() => new Map(fields.map((field) => [field.path, field])),
		[fields],
	);
	const supportedFields = useMemo(
		() => fields.filter((field) => field.supported),
		[fields],
	);
	const manualFields = useMemo(
		() => fields.filter((field) => !field.supported),
		[fields],
	);

	const getField = (path: string) => fieldMap.get(path);
	const getStringValue = (
		source: UnknownRecord,
		path: string,
		fallback: string,
	) =>
		toStringValue(
			getValueAtPath(source, path) ?? getDefaultValue(getField(path), fallback),
			fallback,
		);
	const getNumberValue = (
		source: UnknownRecord,
		path: string,
		fallback: number,
	) =>
		toNumberValue(
			getValueAtPath(source, path) ?? getDefaultValue(getField(path), fallback),
			fallback,
		);
	const getBooleanValue = (
		source: UnknownRecord,
		path: string,
		fallback: boolean,
	) =>
		toBooleanValue(
			getValueAtPath(source, path) ?? getDefaultValue(getField(path), fallback),
			fallback,
		);
	const getSelectOptions = (
		path: string,
		labelMap?: Record<string, string>,
	) => toSelectOptions(getField(path)?.options ?? [], labelMap);

	return {
		fields,
		fieldMap,
		getBooleanValue,
		getField,
		getNumberValue,
		getSelectOptions,
		getStringValue,
		manualFields,
		supportedFields,
	};
}

export function useTypedAttributeUpdater<T extends object>(
	attributes: T,
	setAttributes: (attrs: Partial<T>) => void,
	validate?: (value: T) => ValidationResult<T>,
): TypedAttributeUpdater<T> {
	const validateAttributes = useMemo(
		() => validate ?? ((value: T) => createValidationResult(value)),
		[validate],
	);
	const updateAttribute = useMemo(
		() =>
			createAttributeUpdater(attributes, setAttributes, validateAttributes),
		[attributes, setAttributes, validateAttributes],
	);
	const updatePath = useMemo(
		() =>
			createNestedAttributeUpdater(attributes, setAttributes, validateAttributes),
		[attributes, setAttributes, validateAttributes],
	);
	const updateField = useCallback(
		<K extends keyof T>(path: K | string, value: unknown) => {
			if (typeof path === "string" && path.includes(".")) {
				return updatePath(path, value);
			}

			return updateAttribute(path as K, value as T[K]);
		},
		[updateAttribute, updatePath],
	);

	return {
		updateAttribute,
		updateField,
		updatePath,
	};
}

export function FieldControl({
	components,
	field,
	help,
	label,
	max,
	min,
	onChange,
	options,
	render,
	renderUnsupported,
	step,
	value,
}: FieldControlProps) {
	const resolvedComponents = resolveInspectorComponents(components);
	const context = getFieldControlContext(
		field,
		{
			help,
			label,
			max,
			min,
			onChange,
			options,
			step,
			value,
		},
		resolvedComponents,
	);

	if (render) {
		return <>{render(context)}</>;
	}

	if (!field.supported) {
		return renderUnsupported ? <>{renderUnsupported(context)}</> : null;
	}

	switch (field.control) {
		case "toggle": {
			const ToggleControl = resolvedComponents.ToggleControl;
			if (!ToggleControl) {
				return null;
			}

			return (
				<ToggleControl
					checked={toBooleanValue(value, false)}
					help={context.help}
					label={context.label}
					onChange={(nextValue) => {
						onChange(nextValue);
					}}
				/>
			);
		}
		case "select": {
			const SelectControl = resolvedComponents.SelectControl;
			if (!SelectControl) {
				return null;
			}

			const selectOptions =
				context.options ?? toSelectOptions(field.options);

			return (
				<SelectControl
					help={context.help}
					label={context.label}
					onChange={(nextValue) => {
						onChange(parseSelectValue(field, nextValue, context.options));
					}}
					options={selectOptions}
					value={String(value ?? "")}
				/>
			);
		}
		case "range": {
			const RangeControl = resolvedComponents.RangeControl;
			if (!RangeControl) {
				return null;
			}

			return (
				<RangeControl
					help={context.help}
					label={context.label}
					max={context.max}
					min={context.min}
					onChange={(nextValue) => {
						if (typeof nextValue === "number" && Number.isFinite(nextValue)) {
							onChange(nextValue);
						}
					}}
					step={context.step}
					value={toNumberValue(value, 0)}
				/>
			);
		}
		case "number": {
			const TextControl = resolvedComponents.TextControl;
			if (!TextControl) {
				return null;
			}

			return (
				<NumberFieldControl
					context={context}
					onChange={onChange}
					TextControl={TextControl}
					value={value}
				/>
			);
		}
		case "textarea": {
			const TextareaControl = resolvedComponents.TextareaControl;
			if (!TextareaControl) {
				return null;
			}

			return (
				<TextareaControl
					help={context.help}
					label={context.label}
					onChange={(nextValue) => {
						onChange(nextValue);
					}}
					value={toStringValue(value, "")}
				/>
			);
		}
		case "text": {
			const TextControl = resolvedComponents.TextControl;
			if (!TextControl) {
				return null;
			}

			return (
				<TextControl
					help={context.help}
					label={context.label}
					onChange={(nextValue) => {
						onChange(nextValue);
					}}
					value={toStringValue(value, "")}
				/>
			);
		}
		default:
			return renderUnsupported ? <>{renderUnsupported(context)}</> : null;
	}
}

export function InspectorFromManifest<T extends UnknownRecord>({
	attributes,
	children,
	components,
	fieldLookup,
	fieldOverrides,
	initialOpen,
	onChange,
	paths,
	title,
}: InspectorFromManifestProps<T>) {
	const resolvedComponents = resolveInspectorComponents(components);
	const PanelBody = resolvedComponents.PanelBody ?? FallbackPanelBody;
	const fieldControls = paths
		.map((path) => {
			const field = fieldLookup.getField(path);
			if (!field) {
				return null;
			}

			const overrides = fieldOverrides?.[path];

			return (
				<FieldControl
					key={path}
					components={resolvedComponents}
					field={field}
					help={overrides?.help}
					label={overrides?.label}
					max={overrides?.max}
					min={overrides?.min}
					onChange={(value) => {
						onChange(path, value);
					}}
					options={overrides?.options}
					render={overrides?.render}
					renderUnsupported={overrides?.renderUnsupported}
					step={overrides?.step}
					value={getFieldValue(field, attributes)}
				/>
			);
		})
		.filter(Boolean);

	return (
		<PanelBody initialOpen={initialOpen} title={title}>
			{fieldControls}
			{children}
		</PanelBody>
	);
}
