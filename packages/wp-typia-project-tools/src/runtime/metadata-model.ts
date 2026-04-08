export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AttributeKind =
	| "string"
	| "number"
	| "boolean"
	| "array"
	| "object"
	| "union";

export type WordPressAttributeKind =
	| "string"
	| "number"
	| "boolean"
	| "array"
	| "object";

export type WordPressAttributeSource = "html" | "text" | "rich-text";

export interface AttributeConstraints {
	exclusiveMaximum: number | null;
	exclusiveMinimum: number | null;
	format: string | null;
	maxLength: number | null;
	maxItems: number | null;
	maximum: number | null;
	minLength: number | null;
	minItems: number | null;
	minimum: number | null;
	multipleOf: number | null;
	pattern: string | null;
	typeTag: string | null;
}

export interface AttributeNode {
	constraints: AttributeConstraints;
	defaultValue?: JsonValue;
	enumValues: Array<string | number | boolean> | null;
	items?: AttributeNode;
	kind: AttributeKind;
	path: string;
	properties?: Record<string, AttributeNode>;
	required: boolean;
	union?: AttributeUnion | null;
	wp: {
		selector: string | null;
		source: WordPressAttributeSource | null;
	};
}

export interface AttributeUnion {
	branches: Record<string, AttributeNode>;
	discriminator: string;
}

export interface BlockJsonAttribute {
	default?: JsonValue;
	enum?: Array<string | number | boolean>;
	selector?: string;
	source?: WordPressAttributeSource;
	type: WordPressAttributeKind;
}

export interface ManifestAttribute {
	typia: {
		constraints: AttributeConstraints;
		defaultValue: JsonValue | null;
		hasDefault: boolean;
	};
	ts: {
		items: ManifestAttribute | null;
		kind: AttributeKind;
		properties: Record<string, ManifestAttribute> | null;
		required: boolean;
		union: ManifestUnion | null;
	};
	wp: {
		defaultValue: JsonValue | null;
		enum: Array<string | number | boolean> | null;
		hasDefault: boolean;
		selector?: string | null;
		source?: WordPressAttributeSource | null;
		type: WordPressAttributeKind;
	};
}

export interface ManifestUnion {
	branches: Record<string, ManifestAttribute>;
	discriminator: string;
}

export interface ManifestDocument {
	attributes: Record<string, ManifestAttribute>;
	manifestVersion: 2;
	sourceType: string;
}

export function defaultAttributeConstraints(): AttributeConstraints {
	return {
		exclusiveMaximum: null,
		exclusiveMinimum: null,
		format: null,
		maxLength: null,
		maxItems: null,
		maximum: null,
		minLength: null,
		minItems: null,
		minimum: null,
		multipleOf: null,
		pattern: null,
		typeTag: null,
	};
}

export function getWordPressKind(node: AttributeNode): WordPressAttributeKind {
	return node.kind === "union" ? "object" : node.kind;
}

export function baseNode(kind: AttributeKind, pathLabel: string): AttributeNode {
	return {
		constraints: defaultAttributeConstraints(),
		enumValues: null,
		kind,
		path: pathLabel,
		required: true,
		union: null,
		wp: {
			selector: null,
			source: null,
		},
	};
}

export function withRequired(
	node: AttributeNode,
	required: boolean,
): AttributeNode {
	return {
		...node,
		items: node.items
			? withRequired(node.items, node.items.required)
			: undefined,
		properties: node.properties ? cloneProperties(node.properties) : undefined,
		required,
		union: node.union ? cloneUnion(node.union) : null,
	};
}

export function cloneUnion(union: AttributeUnion): AttributeUnion {
	return {
		branches: Object.fromEntries(
			Object.entries(union.branches).map(([key, branch]) => [
				key,
				withRequired(branch, branch.required),
			]),
		),
		discriminator: union.discriminator,
	};
}

export function cloneProperties(
	properties: Record<string, AttributeNode>,
): Record<string, AttributeNode> {
	return Object.fromEntries(
		Object.entries(properties).map(([key, node]) => [
			key,
			withRequired(node, node.required),
		]),
	);
}
