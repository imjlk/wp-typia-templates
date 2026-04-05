function capitalizeSegment(segment: string): string {
	return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function toKebabCase(input: string): string {
	return input
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")
		.toLowerCase();
}

export function toSnakeCase(input: string): string {
	return toKebabCase(input).replace(/-/g, "_");
}

export function toPascalCase(input: string): string {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map(capitalizeSegment)
		.join("");
}

export function toTitleCase(input: string): string {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map(capitalizeSegment)
		.join(" ");
}
