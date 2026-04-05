import { cloneJsonValue } from "./json-utils.js";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface ManifestDefaultAttribute {
	typia: {
		defaultValue: JsonValue | null;
		hasDefault: boolean;
	};
	ts: {
		items: ManifestDefaultAttribute | null;
		kind: "string" | "number" | "boolean" | "array" | "object" | "union";
		properties: Record<string, ManifestDefaultAttribute> | null;
		required: boolean;
		union: {
			branches: Record<string, ManifestDefaultAttribute>;
			discriminator: string;
		} | null;
	};
}

export interface ManifestDefaultsDocument {
	attributes: Record<string, ManifestDefaultAttribute>;
}

function isListArray(value: unknown[]): boolean {
	return value.every((_, index) => index in value);
}

function deriveDefaultValue(attribute: ManifestDefaultAttribute): JsonValue | undefined {
	if (attribute.typia.hasDefault) {
		return cloneJsonValue(attribute.typia.defaultValue);
	}

	if (attribute.ts.kind !== "object" || !attribute.ts.properties) {
		return undefined;
	}

	const objectValue: Record<string, JsonValue> = {};

	for (const [name, child] of Object.entries(attribute.ts.properties)) {
		const childDefault = deriveDefaultValue(child);
		if (childDefault !== undefined) {
			objectValue[name] = childDefault;
		}
	}

	return Object.keys(objectValue).length > 0 ? objectValue : undefined;
}

function applyDefaultsForObject(
	value: Record<string, unknown>,
	schema: Record<string, ManifestDefaultAttribute>,
): Record<string, unknown> {
	const result = { ...value };

	for (const [name, attribute] of Object.entries(schema)) {
		if (!(name in result)) {
			const derivedDefault = deriveDefaultValue(attribute);
			if (derivedDefault !== undefined) {
				result[name] = derivedDefault;
			}
			continue;
		}

		result[name] = applyDefaultsForNode(result[name], attribute);
	}

	return result;
}

function applyDefaultsForUnion(
	value: Record<string, unknown>,
	attribute: ManifestDefaultAttribute,
): Record<string, unknown> {
	const union = attribute.ts.union;
	if (!union) {
		return value;
	}

	const discriminator = union.discriminator;
	const branchKey = value[discriminator];
	if (typeof branchKey !== "string" || !(branchKey in union.branches)) {
		return value;
	}

	return applyDefaultsForNode(value, union.branches[branchKey]) as Record<string, unknown>;
}

function applyDefaultsForNode(value: unknown, attribute: ManifestDefaultAttribute): unknown {
	if (value === null || value === undefined) {
		return value;
	}

	switch (attribute.ts.kind) {
		case "object":
			if (typeof value === "object" && !Array.isArray(value) && attribute.ts.properties) {
				return applyDefaultsForObject(value as Record<string, unknown>, attribute.ts.properties);
			}
			return value;
		case "array":
			if (Array.isArray(value) && isListArray(value) && attribute.ts.items) {
				return value.map((item) => applyDefaultsForNode(item, attribute.ts.items as ManifestDefaultAttribute));
			}
			return value;
		case "union":
			if (typeof value === "object" && value !== null && !Array.isArray(value)) {
				return applyDefaultsForUnion(value as Record<string, unknown>, attribute);
			}
			return value;
		default:
			return value;
	}
}

export function applyTemplateDefaultsFromManifest<T extends object>(
	manifest: ManifestDefaultsDocument,
	value: Partial<T>,
): Partial<T> {
	return applyDefaultsForObject(value as Record<string, unknown>, manifest.attributes) as Partial<T>;
}
