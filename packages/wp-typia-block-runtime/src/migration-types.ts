export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ManifestTsKind = "string" | "number" | "boolean" | "array" | "object" | "union";

export interface ManifestConstraints {
	exclusiveMaximum?: number | null;
	exclusiveMinimum?: number | null;
	format?: string | null;
	maxLength?: number | null;
	maxItems?: number | null;
	maximum?: number | null;
	minLength?: number | null;
	minItems?: number | null;
	minimum?: number | null;
	multipleOf?: number | null;
	pattern?: string | null;
	typeTag?: string | null;
}

export interface ManifestUnionMetadata {
	discriminator: string;
	branches: Record<string, ManifestAttribute>;
}

export interface ManifestTsMetadata {
	items?: ManifestAttribute | null;
	kind: ManifestTsKind;
	properties?: Record<string, ManifestAttribute> | null;
	required?: boolean;
	union?: ManifestUnionMetadata | null;
}

export interface ManifestTypiaMetadata {
	constraints: ManifestConstraints;
	defaultValue?: JsonValue | null;
	hasDefault?: boolean;
}

export interface ManifestWpMetadata {
	defaultValue?: JsonValue | null;
	enum?: JsonValue[] | null;
	hasDefault?: boolean;
	selector?: string | null;
	source?: "html" | "text" | "rich-text" | null;
	type?: string | null;
}

export interface ManifestAttribute {
	ts: ManifestTsMetadata;
	typia: ManifestTypiaMetadata;
	wp: ManifestWpMetadata;
}

export interface ManifestDocument {
	attributes?: Record<string, ManifestAttribute>;
	manifestVersion?: number | null;
	sourceType?: string | null;
}
