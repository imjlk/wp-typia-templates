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

export interface ManifestSummaryAttribute {
	constraints: ManifestAttribute["typia"]["constraints"];
	defaultValue: ManifestAttribute["typia"]["defaultValue"] | null;
	enum: ManifestAttribute["wp"]["enum"] | null;
	hasDefault: boolean;
	kind: ManifestAttribute["ts"]["kind"] | null;
	required: boolean;
	union: ManifestAttribute["ts"]["union"] | null;
}

export interface ManifestSummary {
	attributes: Record<string, ManifestSummaryAttribute>;
	manifestVersion: number | null;
	sourceType: string | null;
}

export interface UnionBranchSummary {
	branches: string[];
	discriminator: string | null;
	field: string;
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
	bodyLines: string[];
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

export interface MigrationRiskBucket {
	count: number;
	items: string[];
}

export interface MigrationRiskSummary {
	additive: MigrationRiskBucket;
	rename: MigrationRiskBucket;
	semanticTransform: MigrationRiskBucket;
	unionBreaking: MigrationRiskBucket;
}

export interface MigrationFuzzMapping {
	currentPath: string;
	legacyPath: string;
}

export interface MigrationFuzzPlan {
	blockedPaths: string[];
	compatibleMappings: MigrationFuzzMapping[];
}

export interface GeneratedMigrationEntry {
	diff: MigrationDiff;
	entry: MigrationEntry;
	fuzzPlan: MigrationFuzzPlan;
	riskSummary: MigrationRiskSummary;
}

export interface MigrationRuleFileInput {
	currentAttributes: Record<string, ManifestAttribute>;
	currentTypeName: string | null | undefined;
	diff: MigrationDiff;
	fromVersion: string;
	targetVersion: string;
}

export interface MigrationFixtureCase {
	input: JsonObject;
	name: string;
}

export interface MigrationFixtureDocument {
	cases: MigrationFixtureCase[];
	fromVersion: string;
	toVersion: string;
}

export interface ParsedMigrationArgs {
	command?: string;
	flags: {
		all: boolean;
		currentVersion?: string;
		force: boolean;
		from?: string;
		iterations?: string;
		seed?: string;
		to?: string;
		version?: string;
	};
}

export type RenderLine = (line: string) => void;
export type JsonObject = Record<string, JsonValue>;
