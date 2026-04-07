export function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
export function isFormDataLike(value) {
    return typeof FormData !== "undefined" && value instanceof FormData;
}
export function normalizePath(path) {
    return typeof path === "string" && path.length > 0 ? path : "(root)";
}
export function normalizeExpected(expected) {
    return typeof expected === "string" && expected.length > 0
        ? expected
        : "unknown";
}
export function normalizeValidationError(error) {
    const raw = isPlainObject(error) ? error : {};
    return {
        description: typeof raw.description === "string" ? raw.description : undefined,
        expected: normalizeExpected(raw.expected),
        path: normalizePath(raw.path),
        value: Object.prototype.hasOwnProperty.call(raw, "value")
            ? raw.value
            : undefined,
    };
}
export function isValidationResult(value) {
    return (isPlainObject(value) &&
        typeof value.isValid === "boolean" &&
        Array.isArray(value.errors));
}
export function toValidationResult(result) {
    const rawResult = result;
    if (isValidationResult(result)) {
        return result;
    }
    if (rawResult.success === true) {
        return {
            data: rawResult.data,
            errors: [],
            isValid: true,
        };
    }
    return {
        data: undefined,
        errors: Array.isArray(rawResult.errors)
            ? rawResult.errors.map(normalizeValidationError)
            : [],
        isValid: false,
    };
}
