export const BLOCK_CONFIG_ENTRY_MARKER = "\t// wp-typia add block entries";
export const VARIATION_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add variation entries";
export const BLOCK_STYLE_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add style entries";
export const BLOCK_TRANSFORM_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add transform entries";
export const PATTERN_CONFIG_ENTRY_MARKER = "\t// wp-typia add pattern entries";
export const BINDING_SOURCE_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add binding-source entries";
export const REST_RESOURCE_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add rest-resource entries";
export const ABILITY_CONFIG_ENTRY_MARKER = "\t// wp-typia add ability entries";
export const AI_FEATURE_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add ai-feature entries";
export const ADMIN_VIEW_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add admin-view entries";
/**
 * Marker used to append generated editor-plugin entries into `EDITOR_PLUGINS`.
 */
export const EDITOR_PLUGIN_CONFIG_ENTRY_MARKER =
	"\t// wp-typia add editor-plugin entries";

export const VARIATIONS_INTERFACE_SECTION = `

export interface WorkspaceVariationConfig {
\tblock: string;
\tfile: string;
\tslug: string;
}
`;

export const VARIATIONS_CONST_SECTION = `

export const VARIATIONS: WorkspaceVariationConfig[] = [
\t// wp-typia add variation entries
];
`;

export const BLOCK_STYLES_INTERFACE_SECTION = `

export interface WorkspaceBlockStyleConfig {
\tblock: string;
\tfile: string;
\tslug: string;
}
`;

export const BLOCK_STYLES_CONST_SECTION = `

export const BLOCK_STYLES: WorkspaceBlockStyleConfig[] = [
\t// wp-typia add style entries
];
`;

export const BLOCK_TRANSFORMS_INTERFACE_SECTION = `

export interface WorkspaceBlockTransformConfig {
\tblock: string;
\tfile: string;
\tfrom: string;
\tslug: string;
\tto: string;
}
`;

export const BLOCK_TRANSFORMS_CONST_SECTION = `

export const BLOCK_TRANSFORMS: WorkspaceBlockTransformConfig[] = [
\t// wp-typia add transform entries
];
`;

export const PATTERNS_INTERFACE_SECTION = `

export interface WorkspacePatternConfig {
\tfile: string;
\tslug: string;
}
`;

export const PATTERNS_CONST_SECTION = `

export const PATTERNS: WorkspacePatternConfig[] = [
\t// wp-typia add pattern entries
];
`;

export const BINDING_SOURCES_INTERFACE_SECTION = `

export interface WorkspaceBindingSourceConfig {
\tattribute?: string;
\tblock?: string;
\teditorFile: string;
\tserverFile: string;
\tslug: string;
}
`;

export const BINDING_SOURCES_CONST_SECTION = `

export const BINDING_SOURCES: WorkspaceBindingSourceConfig[] = [
\t// wp-typia add binding-source entries
];
`;

export const REST_RESOURCES_INTERFACE_SECTION = `

export interface WorkspaceRestResourceConfig {
\tapiFile: string;
\tclientFile: string;
\tdataFile: string;
\tmethods: Array< 'list' | 'read' | 'create' | 'update' | 'delete' >;
\tnamespace: string;
\topenApiFile: string;
\tphpFile: string;
\trestManifest?: ReturnType<
\t\ttypeof import( '@wp-typia/block-runtime/metadata-core' ).defineEndpointManifest
\t>;
\tslug: string;
\ttypesFile: string;
\tvalidatorsFile: string;
}
`;

export const REST_RESOURCES_CONST_SECTION = `

export const REST_RESOURCES: WorkspaceRestResourceConfig[] = [
\t// wp-typia add rest-resource entries
];
`;

export const WORKSPACE_COMPATIBILITY_CONFIG_FIELD = `\tcompatibility?: {
\t\thardMinimums: {
\t\t\tphp?: string;
\t\t\twordpress?: string;
\t\t};
\t\tmode: 'baseline' | 'optional' | 'required';
\t\toptionalFeatureIds: string[];
\t\toptionalFeatures: string[];
\t\trequiredFeatureIds: string[];
\t\trequiredFeatures: string[];
\t\truntimeGates: string[];
\t};
`;

export const ABILITIES_INTERFACE_SECTION = `

export interface WorkspaceAbilityConfig {
\tclientFile: string;
${WORKSPACE_COMPATIBILITY_CONFIG_FIELD}\tconfigFile: string;
\tdataFile: string;
\tinputSchemaFile: string;
\tinputTypeName: string;
\toutputSchemaFile: string;
\toutputTypeName: string;
\tphpFile: string;
\tslug: string;
\ttypesFile: string;
}
`;

export const ABILITIES_CONST_SECTION = `

export const ABILITIES: WorkspaceAbilityConfig[] = [
\t// wp-typia add ability entries
];
`;

export const AI_FEATURES_INTERFACE_SECTION = `

export interface WorkspaceAiFeatureConfig {
\taiSchemaFile: string;
\tapiFile: string;
\tclientFile: string;
${WORKSPACE_COMPATIBILITY_CONFIG_FIELD}\tdataFile: string;
\tnamespace: string;
\topenApiFile: string;
\tphpFile: string;
\trestManifest?: ReturnType<
\t\ttypeof import( '@wp-typia/block-runtime/metadata-core' ).defineEndpointManifest
\t>;
\tslug: string;
\ttypesFile: string;
\tvalidatorsFile: string;
}
`;

export const AI_FEATURES_CONST_SECTION = `

export const AI_FEATURES: WorkspaceAiFeatureConfig[] = [
\t// wp-typia add ai-feature entries
];
`;

export const ADMIN_VIEWS_INTERFACE_SECTION = `

export interface WorkspaceAdminViewConfig {
\tfile: string;
\tphpFile: string;
\tslug: string;
\tsource?: string;
}
`;

export const ADMIN_VIEWS_CONST_SECTION = `

export const ADMIN_VIEWS: WorkspaceAdminViewConfig[] = [
\t// wp-typia add admin-view entries
];
`;

export const EDITOR_PLUGINS_INTERFACE_SECTION = `

export interface WorkspaceEditorPluginConfig {
\tfile: string;
\tslug: string;
\tslot: string;
}
`;

export const EDITOR_PLUGINS_CONST_SECTION = `

export const EDITOR_PLUGINS: WorkspaceEditorPluginConfig[] = [
\t// wp-typia add editor-plugin entries
];
`;
