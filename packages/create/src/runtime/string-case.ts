function capitalizeSegment(segment: string): string {
	return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/**
 * Normalize arbitrary text into a kebab-case identifier.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A lowercase kebab-case string with collapsed separators.
 */
export function toKebabCase(input: string): string {
	return input
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")
		.toLowerCase();
}

/**
 * Normalize arbitrary text into a snake_case identifier.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A lowercase snake_case string derived from the kebab-case form.
 */
export function toSnakeCase(input: string): string {
	return toKebabCase(input).replace(/-/g, "_");
}

/**
 * Normalize arbitrary text into a PascalCase identifier.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A PascalCase string derived from the normalized kebab-case form.
 */
export function toPascalCase(input: string): string {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map(capitalizeSegment)
		.join("");
}

/**
 * Convert delimited text to PascalCase while preserving each segment's
 * existing internal casing.
 *
 * @param input Raw text split on non-alphanumeric boundaries.
 * @returns A PascalCase string that preserves acronyms inside segments.
 */
export function toSegmentPascalCase(input: string): string {
	return input
		.replace(/[^A-Za-z0-9]+/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map(capitalizeSegment)
		.join("");
}

/**
 * Normalize arbitrary text into a human-readable title.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A title-cased string derived from the normalized kebab-case form.
 */
export function toTitleCase(input: string): string {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map(capitalizeSegment)
		.join(" ");
}
