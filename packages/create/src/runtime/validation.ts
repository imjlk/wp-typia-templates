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

interface RawTypiaValidationError {
	description?: string;
	expected?: string;
	path?: string;
	value?: unknown;
}

interface RawTypiaValidationResult<T> {
	data?: unknown;
	errors?: unknown;
	success: boolean;
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

export function toValidationResult<T>(
	result: RawTypiaValidationResult<T>,
): ValidationResult<T> {
	if (result.success) {
		return {
			data: result.data as T | undefined,
			errors: [],
			isValid: true,
		};
	}

	const rawErrors = Array.isArray(result.errors) ? result.errors : [];

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

export function toAttributePatch<T, K extends keyof T>(
	key: K,
	value: T[K],
): Pick<T, K> {
	return {
		[key]: value,
	} as Pick<T, K>;
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
			setAttributes(toAttributePatch<T, K>(key, value) as Partial<T>);
			return true;
		}

		onValidationError?.(validation, key);
		return false;
	};
}
