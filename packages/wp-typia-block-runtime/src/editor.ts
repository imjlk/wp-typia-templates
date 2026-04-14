import type {} from "./typia-tags.js";

import {
	isJsonValue,
	isNullableBoolean,
	isNullableFiniteNumber,
	isNullableJsonValue,
	isNullableString,
	isRecordOf,
} from "./artifact-validation.js";
import { isPlainObject } from "./object-utils.js";
import type {
	JsonValue,
	ManifestAttribute,
	ManifestConstraints,
	ManifestDocument,
	ManifestTsMetadata,
	ManifestTsKind,
	ManifestTypiaMetadata,
	ManifestWpMetadata,
} from "./migration-types.js";

export type {
	JsonValue,
	ManifestAttribute,
	ManifestConstraints,
	ManifestDocument,
	ManifestTsMetadata,
	ManifestTsKind,
	ManifestTypiaMetadata,
	ManifestWpMetadata,
} from "./migration-types.js";

function isManifestConstraints(value: unknown): value is ManifestConstraints {
	return (
		isPlainObject(value) &&
		isNullableFiniteNumber(value.exclusiveMaximum) &&
		isNullableFiniteNumber(value.exclusiveMinimum) &&
		isNullableString(value.format) &&
		isNullableFiniteNumber(value.maxLength) &&
		isNullableFiniteNumber(value.maxItems) &&
		isNullableFiniteNumber(value.maximum) &&
		isNullableFiniteNumber(value.minLength) &&
		isNullableFiniteNumber(value.minItems) &&
		isNullableFiniteNumber(value.minimum) &&
		isNullableFiniteNumber(value.multipleOf) &&
		isNullableString(value.pattern) &&
		isNullableString(value.typeTag)
	);
}

function isManifestWpMetadata(value: unknown): value is ManifestWpMetadata {
	return (
		isPlainObject(value) &&
		isNullableJsonValue(value.defaultValue) &&
		(value.enum === undefined ||
			value.enum === null ||
			(Array.isArray(value.enum) &&
				value.enum.every((entry) => isJsonValue(entry)))) &&
		isNullableBoolean(value.hasDefault) &&
		(value.source === undefined ||
			value.source === null ||
			value.source === "html" ||
			value.source === "text" ||
			value.source === "rich-text") &&
		isNullableString(value.type) &&
		isNullableString(value.selector)
	);
}

function isManifestTsMetadata(value: unknown): value is ManifestTsMetadata {
	if (!isPlainObject(value)) {
		return false;
	}

	return (
		(value.items === undefined ||
			value.items === null ||
			isManifestAttribute(value.items)) &&
		(value.kind === "string" ||
			value.kind === "number" ||
			value.kind === "boolean" ||
			value.kind === "array" ||
			value.kind === "object" ||
			value.kind === "union") &&
		(value.properties === undefined ||
			value.properties === null ||
			isRecordOf(value.properties, isManifestAttribute)) &&
		(value.required === undefined || typeof value.required === "boolean") &&
		(value.union === undefined ||
			value.union === null ||
			(isPlainObject(value.union) &&
				typeof value.union.discriminator === "string" &&
				isRecordOf(value.union.branches, isManifestAttribute)))
	);
}

function isManifestTypiaMetadata(value: unknown): value is ManifestTypiaMetadata {
	return (
		isPlainObject(value) &&
		isManifestConstraints(value.constraints) &&
		isNullableJsonValue(value.defaultValue) &&
		isNullableBoolean(value.hasDefault)
	);
}

export function isManifestAttribute(value: unknown): value is ManifestAttribute {
	return (
		isPlainObject(value) &&
		isManifestTsMetadata(value.ts) &&
		isManifestTypiaMetadata(value.typia) &&
		isManifestWpMetadata(value.wp)
	);
}

export function isManifestDocument(value: unknown): value is ManifestDocument {
	return (
		isPlainObject(value) &&
		isRecordOf(value.attributes, isManifestAttribute) &&
		typeof value.manifestVersion === "number" &&
		Number.isFinite(value.manifestVersion) &&
		typeof value.sourceType === "string"
	);
}

export function assertManifestDocument<
	TDocument = ManifestDocument,
>(value: unknown): TDocument {
	if (!isManifestDocument(value)) {
		throw new Error(
			"Manifest document must contain an attributes record with scaffold editor metadata.",
		);
	}

	return value as TDocument;
}

export function parseManifestDocument<
	TDocument = ManifestDocument,
>(value: unknown): TDocument {
	return assertManifestDocument<TDocument>(value);
}

export type EditorControlKind =
	| "toggle"
	| "select"
	| "range"
	| "number"
	| "text"
	| "textarea"
	| "unsupported";

export interface EditorFieldOption {
	label: string;
	value: string | number | boolean;
}

export interface EditorFieldDescriptor {
	constraints: ManifestConstraints;
	control: EditorControlKind;
	defaultValue: JsonValue | null;
	hasDefault: boolean;
	key: string;
	kind: ManifestTsKind;
	label: string;
	maximum: number | null;
	minimum: number | null;
	options: EditorFieldOption[];
	path: string;
	reason?: string;
	required: boolean;
	step: number | null;
	supported: boolean;
}

export interface EditorModelOptions {
	hidden?: string[];
	labels?: Record<string, string>;
	manual?: string[];
	preferTextarea?: string[];
}

const FORMATTED_STRING_MANUAL_FORMATS = new Set([
	"date-time",
	"email",
	"ipv4",
	"ipv6",
	"uri",
	"url",
	"uuid",
]);
const INTEGER_TYPE_TAGS = new Set(["int32", "uint32", "uint64"]);
const UPPERCASE_TOKENS = new Map([
	["api", "API"],
	["css", "CSS"],
	["id", "ID"],
	["uri", "URI"],
	["url", "URL"],
	["uuid", "UUID"],
]);

function isScalarOptionValue(
	value: JsonValue,
): value is string | number | boolean {
	return (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	);
}

function isNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function isPathFlagged(path: string, candidates: readonly string[]): boolean {
	return candidates.some(
		(candidate) => path === candidate || path.startsWith(`${candidate}.`),
	);
}

function getLabel(path: string, labels?: Record<string, string>): string {
	return labels?.[path] ?? formatEditorFieldLabel(path);
}

function getOptions(attribute: ManifestAttribute): EditorFieldOption[] {
	if (!Array.isArray(attribute.wp.enum)) {
		return [];
	}

	return attribute.wp.enum.filter(isScalarOptionValue).map((value) => ({
		label: formatEditorFieldLabel(String(value)),
		value,
	}));
}

function getStep(constraints: ManifestConstraints): number | null {
	if (isNumber(constraints.multipleOf)) {
		return constraints.multipleOf;
	}

	if (
		typeof constraints.typeTag === "string" &&
		INTEGER_TYPE_TAGS.has(constraints.typeTag)
	) {
		return 1;
	}

	return null;
}

function getControlKind(
	path: string,
	attribute: ManifestAttribute,
	options: EditorModelOptions,
): { control: EditorControlKind; reason?: string } {
	if (isPathFlagged(path, options.manual ?? [])) {
		return {
			control: "unsupported",
			reason: "This field is intentionally handled manually in the editor.",
		};
	}

	switch (attribute.ts.kind) {
		case "boolean":
			return { control: "toggle" };
		case "number":
			if (
				isNumber(attribute.typia.constraints.minimum) &&
				isNumber(attribute.typia.constraints.maximum)
			) {
				return { control: "range" };
			}
			return { control: "number" };
		case "string":
			if (
				typeof attribute.typia.constraints.format === "string" &&
				FORMATTED_STRING_MANUAL_FORMATS.has(attribute.typia.constraints.format)
			) {
				return {
					control: "unsupported",
					reason: `Formatted ${attribute.typia.constraints.format} strings should keep manual editor wiring.`,
				};
			}
			if (getOptions(attribute).length > 0) {
				return { control: "select" };
			}
			if (isPathFlagged(path, options.preferTextarea ?? [])) {
				return { control: "textarea" };
			}
			return { control: "text" };
		case "array":
			return {
				control: "unsupported",
				reason: "Array fields are not auto-rendered by the editor helper.",
			};
		case "object":
			return {
				control: "unsupported",
				reason: "Object fields are flattened into individual leaf controls.",
			};
		case "union":
			return {
				control: "unsupported",
				reason: "Union fields must keep manual editor wiring.",
			};
		default:
			return {
				control: "unsupported",
				reason: "This field kind is not supported by the editor helper.",
			};
	}
}

export function formatEditorFieldLabel(path: string): string {
	return path
		.split(".")
		.flatMap((segment) =>
			segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_-]+/),
		)
		.filter(Boolean)
		.map((part) => {
			const normalized = part.toLowerCase();
			const upper = UPPERCASE_TOKENS.get(normalized);
			return upper ?? normalized.charAt(0).toUpperCase() + normalized.slice(1);
		})
		.join(" ");
}

export function describeEditorField(
	path: string,
	attribute: ManifestAttribute,
	options: EditorModelOptions = {},
): EditorFieldDescriptor {
	const { control, reason } = getControlKind(path, attribute, options);
	const pathSegments = path.split(".");
	const key = pathSegments[pathSegments.length - 1] ?? path;

	return {
		constraints: attribute.typia.constraints,
		control,
		defaultValue: attribute.typia.defaultValue ?? null,
		hasDefault: attribute.typia.hasDefault === true,
		key,
		kind: attribute.ts.kind,
		label: getLabel(path, options.labels),
		maximum:
			isNumber(attribute.typia.constraints.maximum)
				? attribute.typia.constraints.maximum
				: null,
		minimum:
			isNumber(attribute.typia.constraints.minimum)
				? attribute.typia.constraints.minimum
				: null,
		// Preserve the legacy `@wp-typia/create/runtime/editor` descriptor contract
		// for compatibility shims: enum options are only exposed for select controls.
		options: control === "select" ? getOptions(attribute) : [],
		path,
		reason,
		required: attribute.ts.required === true,
		step: getStep(attribute.typia.constraints),
		supported: control !== "unsupported",
	};
}

function collectEditorFields(
	path: string,
	attribute: ManifestAttribute,
	options: EditorModelOptions,
): EditorFieldDescriptor[] {
	if (isPathFlagged(path, options.hidden ?? [])) {
		return [];
	}

	if (isPathFlagged(path, options.manual ?? [])) {
		return [describeEditorField(path, attribute, options)];
	}

	if (attribute.ts.kind === "object" && attribute.ts.properties) {
		const childFields = Object.entries(attribute.ts.properties).flatMap(
			([key, child]) => collectEditorFields(`${path}.${key}`, child, options),
		);

		return childFields.length > 0
			? childFields
			: [describeEditorField(path, attribute, options)];
	}

	return [describeEditorField(path, attribute, options)];
}

export function createEditorModel(
	manifest: ManifestDocument,
	options: EditorModelOptions = {},
): EditorFieldDescriptor[] {
	if (!manifest.attributes) {
		return [];
	}

	return Object.entries(manifest.attributes).flatMap(([path, attribute]) =>
		collectEditorFields(path, attribute, options),
	);
}
