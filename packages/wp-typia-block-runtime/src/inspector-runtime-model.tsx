import {
	useCallback,
	useMemo,
} from "react";

import {
	createEditorModel,
	type EditorFieldOption,
	type EditorModelOptions,
	type ManifestDocument,
} from "./editor.js";
import { isPlainObject as isRecord } from "./object-utils.js";
import {
	type ValidationResult,
	createAttributeUpdater,
	createNestedAttributeUpdater,
} from "./validation.js";

import type {
	EditorFieldDescriptor,
	InspectorSelectOption,
	StableEditorModelOptions,
	TypedAttributeUpdater,
	UseEditorFieldsResult,
} from "./inspector-runtime-types.js";

type UnknownRecord = Record<string, unknown>;

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

function getValueAtPath(source: object, path: string): unknown {
	return getPathSegments(path).reduce<unknown>((current, segment) => {
		if (!isRecord(current)) {
			return undefined;
		}

		return current[segment];
	}, source as UnknownRecord);
}

export function toStringValue(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

export function toNumberValue(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function toBooleanValue(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

export function toSelectOptions(
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

export function getFieldValue(
	field: EditorFieldDescriptor,
	source: object,
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

/**
 * Build memoized editor-field helpers from one manifest document.
 *
 * @param manifest Manifest document that describes the editor field tree.
 * @param options Optional field-model overrides such as labels, hidden paths, and manual controls.
 * @returns Derived field collections plus helpers for reading typed field values from attribute objects.
 * @category React
 */
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
		source: object,
		path: string,
		fallback: string,
	) =>
		toStringValue(
			getValueAtPath(source, path) ?? getDefaultValue(getField(path), fallback),
			fallback,
		);
	const getNumberValue = (
		source: object,
		path: string,
		fallback: number,
	) =>
		toNumberValue(
			getValueAtPath(source, path) ?? getDefaultValue(getField(path), fallback),
			fallback,
		);
	const getBooleanValue = (
		source: object,
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

/**
 * Create typed attribute update callbacks for manifest-driven editor UIs.
 *
 * @param attributes Current block attribute object.
 * @param setAttributes Callback that applies partial attribute updates.
 * @param validate Optional validator used before committing updates.
 * @returns Typed helpers for key-based and path-based attribute updates.
 * @category React
 */
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
