import type {
	ElementType,
	ReactNode,
} from "react";

import type {
	EditorFieldDescriptor,
	EditorFieldOption,
	EditorModelOptions,
} from "./editor.js";

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
	PanelBody?: ElementType<PanelBodyLikeProps>;
	RangeControl?: ElementType<RangeControlLikeProps>;
	SelectControl?: ElementType<SelectControlLikeProps>;
	TextControl?: ElementType<TextControlLikeProps>;
	TextareaControl?: ElementType<TextareaControlLikeProps>;
	ToggleControl?: ElementType<ToggleControlLikeProps>;
}

export interface UseEditorFieldsResult {
	fields: EditorFieldDescriptor[];
	fieldMap: Map<string, EditorFieldDescriptor>;
	getBooleanValue: (
		source: object,
		path: string,
		fallback: boolean,
	) => boolean;
	getField: (path: string) => EditorFieldDescriptor | undefined;
	getNumberValue: (
		source: object,
		path: string,
		fallback: number,
	) => number;
	getSelectOptions: (
		path: string,
		labelMap?: Record<string, string>,
	) => InspectorSelectOption[];
	getStringValue: (
		source: object,
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

export interface InspectorFromManifestProps<T extends object> {
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

export interface StableEditorModelOptions {
	hidden: string[];
	labels: Record<string, string>;
	manual: string[];
	preferTextarea: string[];
}

export type {
	EditorFieldDescriptor,
	EditorFieldOption,
	EditorModelOptions,
} from "./editor.js";
