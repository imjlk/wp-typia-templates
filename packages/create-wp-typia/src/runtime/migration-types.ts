export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ManifestTsKind = "string" | "number" | "boolean" | "array" | "object" | "union";

export interface ManifestConstraints {
	format?: string | null;
	maxLength?: number | null;
	maximum?: number | null;
	minLength?: number | null;
	minimum?: number | null;
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
	properties?: Record<string, ManifestAttribute>;
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

export interface MigrationConfig {
	blockName: string;
	currentVersion: string;
	snapshotDir: string;
	supportedVersions: string[];
}

export interface MigrationProjectPaths {
	configFile: string;
	fixturesDir: string;
	generatedDir: string;
	rulesDir: string;
	snapshotDir: string;
}

export interface MigrationProjectState {
	config: MigrationConfig;
	currentBlockJson: Record<string, unknown>;
	currentManifest: ManifestDocument;
	paths: MigrationProjectPaths;
	projectDir: string;
}

export interface MigrationEntry {
	blockJsonImport: string;
	fixtureImport: string;
	fromVersion: string;
	manifestImport: string;
	ruleImport: string;
	rulePath: string;
	saveImport: string;
	toVersion: string;
}

export interface RuleMetadata {
	renameMap: Array<{ currentPath: string; legacyPath: string }>;
	transforms: string[];
	unresolved: string[];
}

export interface FlattenedAttributeDescriptor {
	attribute: ManifestAttribute;
	currentPath: string;
	rootPath: string;
	sourcePath: string;
	unionBranch: string | null;
	unionDiscriminator: string | null;
	unionRoot: string | null;
}

export interface DiffOutcome {
	detail?: string;
	kind: string;
	path: string;
	status: "auto" | "manual";
}

export interface RenameCandidate {
	autoApply: boolean;
	currentPath: string;
	legacyPath: string;
	reason: string;
	score: number;
}

export interface TransformSuggestion {
	attribute: ManifestAttribute | null;
	currentPath: string;
	legacyPath: string | null;
	reason: string;
}

export interface MigrationDiffSummary {
	auto: number;
	autoItems: DiffOutcome[];
	manual: number;
	manualItems: DiffOutcome[];
	renameCandidates: RenameCandidate[];
	transformSuggestions: TransformSuggestion[];
}

export interface MigrationDiff {
	currentTypeName: string | null | undefined;
	fromVersion: string;
	summary: MigrationDiffSummary;
	toVersion: string;
}

export interface ParsedMigrationArgs {
	command?: string;
	flags: {
		all: boolean;
		currentVersion?: string;
		from?: string;
		to?: string;
		version?: string;
	};
}

export type RenderLine = (line: string) => void;
export type JsonObject = Record<string, JsonValue>;
