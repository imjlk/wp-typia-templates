import { applyTemplateDefaultsFromManifest } from "./defaults.js";
import type { ManifestDefaultsDocument } from "./defaults.js";
import { isPlainObject as isRecord } from "./object-utils.js";

export interface TypiaValidationError {
	description?: string;
	expected: string;
	path: string;
	value: unknown;
}

export interface ValidationResult<T> {
	data?: T;
	errors: TypiaValidationError[];
	isValid: boolean;
}

export interface ValidationState<T> extends ValidationResult<T> {
	errorMessages: string[];
}

export interface ValidationHookBindings {
	useMemo: <S>(factory: () => S, deps: readonly unknown[]) => S;
}

export interface ScaffoldValidatorToolkitOptions<T extends object> {
	assert: (value: unknown) => T;
	clone: (value: T) => T;
	finalize?: (value: Partial<T>) => unknown;
	is: (value: unknown) => value is T;
	manifest: ManifestDefaultsDocument;
	onValidationError?: (result: ValidationResult<T>, key: keyof T) => void;
	prune: (value: T) => unknown;
	random: (...args: unknown[]) => T;
	validate: (value: unknown) => unknown;
}

const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

interface RawTypiaValidationError {
	description?: string;
	expected?: string;
	path?: string;
	value?: unknown;
}

interface RawTypiaValidationResult {
	data?: unknown;
	errors?: unknown;
	success?: unknown;
}

function getValueType(value: unknown): string {
	if (value === null) {
		return "null";
	}
	if (Array.isArray(value)) {
		return "array";
	}
	return typeof value;
}

function redactValidationErrors(
	errors: readonly TypiaValidationError[],
): Array<Pick<TypiaValidationError, "description" | "expected" | "path">> {
	return errors.map(({ description, expected, path }) => ({
		description,
		expected,
		path,
	}));
}

export function normalizeValidationError(error: unknown): TypiaValidationError {
	const raw =
		error !== null && typeof error === "object"
			? (error as RawTypiaValidationError)
			: {};

	return {
		description: typeof raw.description === "string" ? raw.description : undefined,
		expected: typeof raw.expected === "string" ? raw.expected : "unknown",
		path: typeof raw.path === "string" && raw.path.length > 0 ? raw.path : "(root)",
		value: Object.prototype.hasOwnProperty.call(raw, "value") ? raw.value : undefined,
	};
}

export function toValidationResult<T>(result: unknown): ValidationResult<T> {
	const raw =
		result !== null && typeof result === "object"
			? (result as RawTypiaValidationResult)
			: undefined;

	if (raw?.success === true) {
		return {
			data: raw.data as T | undefined,
			errors: [],
			isValid: true,
		};
	}

	const rawErrors = Array.isArray(raw?.errors) ? raw.errors : [];

	return {
		data: undefined,
		errors: rawErrors.map(normalizeValidationError),
		isValid: false,
	};
}

export function formatValidationError(error: TypiaValidationError): string {
	return `${error.path}: ${error.expected} expected, got ${getValueType(error.value)}`;
}

export function formatValidationErrors(
	errors: readonly TypiaValidationError[],
): string[] {
	return errors.map(formatValidationError);
}

export function toValidationState<T>(
	result: ValidationResult<T>,
): ValidationState<T> {
	return {
		...result,
		errorMessages: formatValidationErrors(result.errors),
	};
}

export function createUseTypiaValidationHook({
	useMemo,
}: ValidationHookBindings) {
	return function useTypiaValidation<T>(
		value: T,
		validator: (value: T) => ValidationResult<T>,
	): ValidationState<T> {
		return useMemo(
			() => toValidationState(validator(value)),
			[value, validator],
		);
	};
}

export function createScaffoldValidatorToolkit<T extends object>({
	assert,
	clone,
	finalize,
	is,
	manifest,
	onValidationError = (validation, key) => {
		console.error(
			`Validation failed for ${String(key)}:`,
			redactValidationErrors(validation.errors),
		);
	},
	prune,
	random,
	validate,
}: ScaffoldValidatorToolkitOptions<T>) {
	const validateAttributes = (value: unknown): ValidationResult<T> =>
		toValidationResult<T>(validate(value));

	const normalizeAttributes = (value: Partial<T>): unknown => {
		const normalized = applyTemplateDefaultsFromManifest<T>(manifest, value);

		return finalize ? finalize(normalized) : normalized;
	};

	const sanitizeAttributes = (value: Partial<T>): T => assert(normalizeAttributes(value));

	const validateSanitizedAttributes = (value: T): ValidationResult<T> => {
		const normalized = normalizeAttributes(value);

		try {
			const data = assert(normalized);

			return {
				data,
				errors: [],
				isValid: true,
			};
		} catch {
			return validateAttributes(value);
		}
	};

	const createScaffoldAttributeUpdater = (
		attributes: T,
		setAttributes: (attrs: Partial<T>) => void,
		validator: (value: T) => ValidationResult<T> = validateSanitizedAttributes,
	) =>
		createAttributeUpdater(
			attributes,
			setAttributes,
			validator,
			onValidationError,
		);

	return {
		createAttributeUpdater: createScaffoldAttributeUpdater,
		sanitizeAttributes,
		validateAttributes,
		validators: {
			assert,
			clone,
			is,
			prune,
			random,
			validate: validateAttributes,
		},
	};
}

function toChangedAttributePatch<T extends object>(
	attributes: T,
	nextAttributes: T,
): Partial<T> {
	const patch: Partial<T> = {};
	const keys = new Set<keyof T>([
		...(Object.keys(attributes) as Array<keyof T>),
		...(Object.keys(nextAttributes) as Array<keyof T>),
	]);

	for (const key of keys) {
		if (!(key in nextAttributes)) {
			patch[key] = undefined as T[keyof T];
			continue;
		}
		if (!Object.is(attributes[key], nextAttributes[key])) {
			patch[key] = nextAttributes[key];
		}
	}

	return patch;
}

function mergeAttributeUpdate<T extends object, K extends keyof T>(
	attributes: T,
	key: K,
	value: T[K],
): T {
	return {
		...attributes,
		[key]: value,
	} as T;
}

function getNestedPathSegments(path: string): string[] {
	const segments = path.split(".").filter(Boolean);

	if (segments.length === 0) {
		throw new Error("Nested attribute paths must contain at least one segment.");
	}

	if (segments.some((segment) => UNSAFE_PATH_SEGMENTS.has(segment))) {
		throw new Error(`Unsupported nested attribute path: ${path}`);
	}

	return segments;
}

function updateNestedRecord(
	current: Record<string, unknown> | undefined,
	segments: readonly string[],
	value: unknown,
): Record<string, unknown> {
	const [head, ...rest] = segments;
	if (typeof head !== "string") {
		return current ?? {};
	}

	if (rest.length === 0) {
		return {
			...(current ?? {}),
			[head]: value,
		};
	}

	const nextCurrent =
		current && isRecord(current[head]) ? (current[head] as Record<string, unknown>) : undefined;

	return {
		...(current ?? {}),
		[head]: updateNestedRecord(nextCurrent, rest, value),
	};
}

export function createAttributeUpdater<T extends object>(
	attributes: T,
	setAttributes: (attrs: Partial<T>) => void,
	validate: (value: T) => ValidationResult<T>,
	onValidationError?: (result: ValidationResult<T>, key: keyof T) => void,
) {
	return <K extends keyof T>(key: K, value: T[K]) => {
		const nextAttributes = mergeAttributeUpdate(attributes, key, value);
		const validation = validate(nextAttributes);

		if (validation.isValid) {
			const patch =
				validation.data && typeof validation.data === "object"
					? toChangedAttributePatch(attributes, validation.data)
					: (toAttributePatch<T, K>(key, value) as Partial<T>);

			setAttributes(patch);
			return true;
		}

		onValidationError?.(validation, key);
		return false;
	};
}

export function mergeNestedAttributeUpdate<T extends object>(
	attributes: T,
	path: string,
	value: unknown,
): T {
	return {
		...attributes,
		...toNestedAttributePatch(attributes, path, value),
	} as T;
}

export function toAttributePatch<T, K extends keyof T>(
	key: K,
	value: T[K],
): Pick<T, K> {
	return {
		[key]: value,
	} as Pick<T, K>;
}

export function toNestedAttributePatch<T extends object>(
	attributes: T,
	path: string,
	value: unknown,
): Partial<T> {
	const [root, ...rest] = getNestedPathSegments(path);

	if (rest.length === 0) {
		return toAttributePatch(root as keyof T, value as T[keyof T]) as Partial<T>;
	}

	const currentRoot = isRecord((attributes as Record<string, unknown>)[root])
		? ((attributes as Record<string, unknown>)[root] as Record<string, unknown>)
		: undefined;

	return {
		[root]: updateNestedRecord(currentRoot, rest, value),
	} as Partial<T>;
}

export function createNestedAttributeUpdater<T extends object>(
	attributes: T,
	setAttributes: (attrs: Partial<T>) => void,
	validate: (value: T) => ValidationResult<T>,
	onValidationError?: (result: ValidationResult<T>, path: string) => void,
) {
	return (path: string, value: unknown) => {
		const nextAttributes = mergeNestedAttributeUpdate(attributes, path, value);
		const validation = validate(nextAttributes);

		if (validation.isValid) {
			const patch =
				validation.data && typeof validation.data === "object"
					? toChangedAttributePatch(attributes, validation.data)
					: toNestedAttributePatch(attributes, path, value);

			setAttributes(patch);
			return true;
		}

		onValidationError?.(validation, path);
		return false;
	};
}
