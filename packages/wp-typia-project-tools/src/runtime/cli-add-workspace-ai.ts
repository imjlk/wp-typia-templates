import { promises as fsp } from "node:fs";
import path from "node:path";

import {
	assertAiFeatureDoesNotExist,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	resolveRestResourceNamespace,
	rollbackWorkspaceMutation,
	snapshotWorkspaceFiles,
	type RunAddAiFeatureCommandOptions,
	type WorkspaceMutationSnapshot,
} from "./cli-add-shared.js";
import { ensureBlockConfigCanAddRestManifests } from "./cli-add-block-legacy-validator.js";
import {
	buildAiFeatureConfigEntry,
	buildAiFeatureDataSource,
	buildAiFeatureSyncScriptSource,
	buildAiFeatureTypesSource,
	buildAiFeatureValidatorsSource,
	buildAiFeatureApiSource,
	toPascalCaseFromAiFeatureSlug,
} from "./cli-add-workspace-ai-source-emitters.js";
import {
	ensureAiFeatureBootstrapAnchors,
	ensureAiFeaturePackageScripts,
	ensureAiFeatureSyncProjectAnchors,
	ensureAiFeatureSyncRestAnchors,
} from "./cli-add-workspace-ai-anchors.js";
import {
	syncAiFeatureRestArtifacts,
	syncAiFeatureSchemaArtifact,
} from "./ai-feature-artifacts.js";
import { appendWorkspaceInventoryEntries, readWorkspaceInventory } from "./workspace-inventory.js";
import { resolveWorkspaceProject } from "./workspace-project.js";
import {
	OPTIONAL_WORDPRESS_AI_CLIENT_COMPATIBILITY,
	resolveScaffoldCompatibilityPolicy,
	updatePluginHeaderCompatibility,
} from "./scaffold-compatibility.js";
import { toTitleCase } from "./string-case.js";

function quotePhpString(value: string): string {
	return `'${value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'")}'`;
}

function buildAiFeaturePhpSource(
	aiFeatureSlug: string,
	namespace: string,
	phpPrefix: string,
	textDomain: string,
): string {
	const aiFeatureTitle = toTitleCase(aiFeatureSlug);
	const aiFeaturePhpId = aiFeatureSlug.replace(/-/g, "_");
	const loadSchemaFunctionName = `${phpPrefix}_${aiFeaturePhpId}_load_ai_feature_schema`;
	const loadAiSchemaFunctionName = `${phpPrefix}_${aiFeaturePhpId}_load_ai_response_schema`;
	const normalizeSchemaFunctionName = `${phpPrefix}_${aiFeaturePhpId}_sanitize_ai_feature_schema`;
	const validatePayloadFunctionName = `${phpPrefix}_${aiFeaturePhpId}_validate_ai_feature_payload`;
	const canManageFunctionName = `${phpPrefix}_${aiFeaturePhpId}_can_manage_ai_feature`;
	const buildPromptFunctionName = `${phpPrefix}_${aiFeaturePhpId}_build_ai_feature_prompt`;
	const normalizeProviderTypeFunctionName = `${phpPrefix}_${aiFeaturePhpId}_normalize_provider_type`;
	const buildTelemetryFunctionName = `${phpPrefix}_${aiFeaturePhpId}_build_ai_feature_telemetry`;
	const isSupportedFunctionName = `${phpPrefix}_${aiFeaturePhpId}_is_ai_feature_supported`;
	const adminNoticeFunctionName = `${phpPrefix}_${aiFeaturePhpId}_ai_feature_admin_notice`;
	const handlerFunctionName = `${phpPrefix}_${aiFeaturePhpId}_handle_run_ai_feature`;
	const registerRoutesFunctionName = `${phpPrefix}_${aiFeaturePhpId}_register_ai_feature_routes`;

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( '${loadSchemaFunctionName}' ) ) {
\tfunction ${loadSchemaFunctionName}( $schema_name ) {
\t\t$project_root = dirname( __DIR__, 2 );
\t\t$schema_path  = $project_root . '/src/ai-features/${aiFeatureSlug}/api-schemas/' . $schema_name . '.schema.json';
\t\tif ( ! file_exists( $schema_path ) ) {
\t\t\treturn null;
\t\t}

\t\t$decoded = json_decode( file_get_contents( $schema_path ), true );
\t\treturn is_array( $decoded ) ? $decoded : null;
\t}
}

if ( ! function_exists( '${loadAiSchemaFunctionName}' ) ) {
\tfunction ${loadAiSchemaFunctionName}() {
\t\t$project_root = dirname( __DIR__, 2 );
\t\t$schema_path  = $project_root . '/src/ai-features/${aiFeatureSlug}/ai-schemas/feature-result.ai.schema.json';
\t\tif ( ! file_exists( $schema_path ) ) {
\t\t\treturn null;
\t\t}

\t\t$decoded = json_decode( file_get_contents( $schema_path ), true );
\t\treturn is_array( $decoded ) ? $decoded : null;
\t}
}

if ( ! function_exists( '${normalizeSchemaFunctionName}' ) ) {
\tfunction ${normalizeSchemaFunctionName}( $schema ) {
\t\tif ( ! is_array( $schema ) ) {
\t\t\treturn $schema;
\t\t}

\t\tunset( $schema['$schema'], $schema['title'] );

\t\tif ( isset( $schema['properties'] ) && is_array( $schema['properties'] ) ) {
\t\t\tforeach ( $schema['properties'] as $key => $property_schema ) {
\t\t\t\t$schema['properties'][ $key ] = ${normalizeSchemaFunctionName}( $property_schema );
\t\t\t}
\t\t}

\t\tif ( isset( $schema['items'] ) && is_array( $schema['items'] ) ) {
\t\t\t$schema['items'] = ${normalizeSchemaFunctionName}( $schema['items'] );
\t\t}

\t\treturn $schema;
\t}
}

if ( ! function_exists( '${validatePayloadFunctionName}' ) ) {
\tfunction ${validatePayloadFunctionName}( $value, $schema_name, $param_name ) {
\t\t$schema = ${loadSchemaFunctionName}( $schema_name );
\t\tif ( ! is_array( $schema ) ) {
\t\t\treturn new WP_Error( 'missing_schema', 'Missing AI feature schema.', array( 'status' => 500 ) );
\t\t}

\t\t$rest_schema = ${normalizeSchemaFunctionName}( $schema );
\t\t$validation  = rest_validate_value_from_schema( $value, $rest_schema, $param_name );
\t\tif ( is_wp_error( $validation ) ) {
\t\t\treturn $validation;
\t\t}

\t\treturn rest_sanitize_value_from_schema( $value, $rest_schema, $param_name );
\t}
}

if ( ! function_exists( '${canManageFunctionName}' ) ) {
\tfunction ${canManageFunctionName}() {
\t\treturn current_user_can( 'edit_posts' );
\t}
}

if ( ! function_exists( '${buildPromptFunctionName}' ) ) {
\tfunction ${buildPromptFunctionName}( array $payload ) {
\t\treturn sprintf(
\t\t\t'You are helping with the %1$s AI workflow. Read the JSON request payload and return JSON that matches the provided schema. Request payload: %2$s',
\t\t\t${quotePhpString(aiFeatureTitle)},
\t\t\twp_json_encode( $payload )
\t\t);
\t}
}

if ( ! function_exists( '${normalizeProviderTypeFunctionName}' ) ) {
\tfunction ${normalizeProviderTypeFunctionName}( $provider_type ) {
\t\tif ( is_object( $provider_type ) && isset( $provider_type->value ) && is_string( $provider_type->value ) ) {
\t\t\treturn $provider_type->value;
\t\t}

\t\treturn is_string( $provider_type ) && '' !== $provider_type ? $provider_type : 'cloud';
\t}
}

if ( ! function_exists( '${buildTelemetryFunctionName}' ) ) {
\tfunction ${buildTelemetryFunctionName}( $result ) {
\t\tif (
\t\t\t! is_object( $result ) ||
\t\t\t! method_exists( $result, 'getId' ) ||
\t\t\t! method_exists( $result, 'getModelMetadata' ) ||
\t\t\t! method_exists( $result, 'getProviderMetadata' ) ||
\t\t\t! method_exists( $result, 'getTokenUsage' )
\t\t) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_result_shape',
\t\t\t\t'The current WordPress AI Client result object is missing telemetry helpers.',
\t\t\t\tarray( 'status' => 502 )
\t\t\t);
\t\t}

\t\t$model_metadata    = $result->getModelMetadata();
\t\t$provider_metadata = $result->getProviderMetadata();
\t\t$token_usage       = $result->getTokenUsage();

\t\tif (
\t\t\t! is_object( $model_metadata ) ||
\t\t\t! method_exists( $model_metadata, 'getId' ) ||
\t\t\t! method_exists( $model_metadata, 'getName' ) ||
\t\t\t! is_object( $provider_metadata ) ||
\t\t\t! method_exists( $provider_metadata, 'getId' ) ||
\t\t\t! method_exists( $provider_metadata, 'getName' ) ||
\t\t\t! method_exists( $provider_metadata, 'getType' ) ||
\t\t\t! is_object( $token_usage ) ||
\t\t\t! method_exists( $token_usage, 'getCompletionTokens' ) ||
\t\t\t! method_exists( $token_usage, 'getPromptTokens' ) ||
\t\t\t! method_exists( $token_usage, 'getTotalTokens' )
\t\t) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_result_shape',
\t\t\t\t'The current WordPress AI Client telemetry objects are missing expected getters.',
\t\t\t\tarray( 'status' => 502 )
\t\t\t);
\t\t}

\t\t$telemetry = array(
\t\t\t'modelId'      => (string) $model_metadata->getId(),
\t\t\t'modelName'    => (string) $model_metadata->getName(),
\t\t\t'providerId'   => (string) $provider_metadata->getId(),
\t\t\t'providerName' => (string) $provider_metadata->getName(),
\t\t\t'providerType' => ${normalizeProviderTypeFunctionName}( $provider_metadata->getType() ),
\t\t\t'resultId'     => (string) $result->getId(),
\t\t\t'tokenUsage'   => array(
\t\t\t\t'completionTokens' => (int) $token_usage->getCompletionTokens(),
\t\t\t\t'promptTokens'     => (int) $token_usage->getPromptTokens(),
\t\t\t\t'totalTokens'      => (int) $token_usage->getTotalTokens(),
\t\t\t),
\t\t);

\t\tif ( method_exists( $token_usage, 'getThoughtTokens' ) ) {
\t\t\t$thought_tokens = $token_usage->getThoughtTokens();
\t\t\tif ( null !== $thought_tokens ) {
\t\t\t\t$telemetry['tokenUsage']['thoughtTokens'] = (int) $thought_tokens;
\t\t\t}
\t\t}

\t\treturn $telemetry;
\t}
}

if ( ! function_exists( '${isSupportedFunctionName}' ) ) {
\tfunction ${isSupportedFunctionName}() {
\t\tstatic $is_supported = null;
\t\tif ( null !== $is_supported ) {
\t\t\treturn $is_supported;
\t\t}

\t\tif ( ! function_exists( 'wp_ai_client_prompt' ) ) {
\t\t\t$is_supported = false;
\t\t\treturn $is_supported;
\t\t}

\t\t$schema = ${loadAiSchemaFunctionName}();
\t\tif ( ! is_array( $schema ) ) {
\t\t\t$is_supported = false;
\t\t\treturn $is_supported;
\t\t}

\t\t$prompt = wp_ai_client_prompt( 'AI feature support probe.' );
\t\tif ( ! is_object( $prompt ) || ! method_exists( $prompt, 'as_json_response' ) ) {
\t\t\t$is_supported = false;
\t\t\treturn $is_supported;
\t\t}

\t\t$structured_prompt = $prompt->as_json_response( $schema );
\t\tif ( ! is_object( $structured_prompt ) ) {
\t\t\t$is_supported = false;
\t\t\treturn $is_supported;
\t\t}

\t\tif ( method_exists( $structured_prompt, 'is_supported_for_text_generation' ) ) {
\t\t\t$is_supported = (bool) $structured_prompt->is_supported_for_text_generation();
\t\t\treturn $is_supported;
\t\t}

\t\t$is_supported = method_exists( $structured_prompt, 'generate_text_result' );
\t\treturn $is_supported;
\t}
}

if ( ! function_exists( '${adminNoticeFunctionName}' ) ) {
\tfunction ${adminNoticeFunctionName}() {
\t\tif ( ! current_user_can( 'manage_options' ) || ${isSupportedFunctionName}() ) {
\t\t\treturn;
\t\t}

\t\t$message = sprintf(
\t\t\t/* translators: %s: AI feature name. */
\t\t\t__( 'The %s AI feature is optional and remains disabled until the WordPress AI Client is available with structured text generation support for the generated schema.', ${quotePhpString(textDomain)} ),
\t\t\t${quotePhpString(aiFeatureTitle)}
\t\t);
\t\tprintf( '<div class="notice notice-warning"><p>%s</p></div>', esc_html( $message ) );
\t}
}

if ( ! function_exists( '${handlerFunctionName}' ) ) {
\tfunction ${handlerFunctionName}( WP_REST_Request $request ) {
\t\t$payload = ${validatePayloadFunctionName}( $request->get_json_params(), 'feature-request', 'body' );
\t\tif ( is_wp_error( $payload ) ) {
\t\t\treturn $payload;
\t\t}

\t\tif ( ! ${isSupportedFunctionName}() ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_unavailable',
\t\t\t\t'The WordPress AI Client is unavailable or does not support this feature endpoint.',
\t\t\t\tarray( 'status' => 501 )
\t\t\t);
\t\t}

\t\t$ai_schema = ${loadAiSchemaFunctionName}();
\t\tif ( ! is_array( $ai_schema ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_schema_missing',
\t\t\t\t'The generated AI response schema is missing for this feature endpoint.',
\t\t\t\tarray( 'status' => 500 )
\t\t\t);
\t\t}

\t\t$prompt = wp_ai_client_prompt( ${buildPromptFunctionName}( $payload ) );
\t\tif ( ! is_object( $prompt ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_unavailable',
\t\t\t\t'The WordPress AI Client prompt builder is unavailable on this site.',
\t\t\t\tarray( 'status' => 501 )
\t\t\t);
\t\t}

\t\tif ( method_exists( $prompt, 'using_temperature' ) ) {
\t\t\t$prompt = $prompt->using_temperature( 0.2 );
\t\t}
\t\tif ( ! method_exists( $prompt, 'as_json_response' ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_unavailable',
\t\t\t\t'The current WordPress AI Client does not expose as_json_response().',
\t\t\t\tarray( 'status' => 501 )
\t\t\t);
\t\t}

\t\t$structured_prompt = $prompt->as_json_response( $ai_schema );
\t\tif ( ! is_object( $structured_prompt ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_unavailable',
\t\t\t\t'The current WordPress AI Client could not prepare a structured-output prompt.',
\t\t\t\tarray( 'status' => 501 )
\t\t\t);
\t\t}

\t\tif (
\t\t\tmethod_exists( $structured_prompt, 'is_supported_for_text_generation' ) &&
\t\t\t! $structured_prompt->is_supported_for_text_generation()
\t\t) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_unavailable',
\t\t\t\t'The current WordPress AI Client provider or model does not support this structured-output feature.',
\t\t\t\tarray( 'status' => 501 )
\t\t\t);
\t\t}
\t\tif ( ! method_exists( $structured_prompt, 'generate_text_result' ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_unavailable',
\t\t\t\t'The current WordPress AI Client does not expose generate_text_result() after as_json_response().',
\t\t\t\tarray( 'status' => 501 )
\t\t\t);
\t\t}

\t\t$result = $structured_prompt->generate_text_result();
\t\tif ( is_wp_error( $result ) ) {
\t\t\treturn $result;
\t\t}
\t\tif ( ! is_object( $result ) || ! method_exists( $result, 'toText' ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_result_shape',
\t\t\t\t'The current WordPress AI Client result does not expose toText().',
\t\t\t\tarray( 'status' => 502 )
\t\t\t);
\t\t}

\t\t$decoded_result = json_decode( $result->toText(), true );
\t\tif ( ! is_array( $decoded_result ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_invalid_json',
\t\t\t\t'The AI feature response did not decode to a JSON object.',
\t\t\t\tarray( 'status' => 502 )
\t\t\t);
\t\t}

\t\t$normalized_result = ${validatePayloadFunctionName}( $decoded_result, 'feature-result', 'result' );
\t\tif ( is_wp_error( $normalized_result ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_invalid_response',
\t\t\t\t$normalized_result->get_error_message(),
\t\t\t\tarray( 'status' => 502 )
\t\t\t);
\t\t}

\t\t$telemetry = ${buildTelemetryFunctionName}( $result );
\t\tif ( is_wp_error( $telemetry ) ) {
\t\t\treturn $telemetry;
\t\t}

\t\t$response = ${validatePayloadFunctionName}(
\t\t\tarray(
\t\t\t\t'result'    => $normalized_result,
\t\t\t\t'telemetry' => $telemetry,
\t\t\t),
\t\t\t'feature-response',
\t\t\t'response'
\t\t);
\t\tif ( is_wp_error( $response ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'ai_client_invalid_response',
\t\t\t\t$response->get_error_message(),
\t\t\t\tarray( 'status' => 502 )
\t\t\t);
\t\t}

\t\treturn rest_ensure_response( $response );
\t}
}

if ( ! function_exists( '${registerRoutesFunctionName}' ) ) {
\tfunction ${registerRoutesFunctionName}() {
\t\tregister_rest_route(
\t\t\t${quotePhpString(namespace)},
\t\t\t'/ai/${aiFeatureSlug}',
\t\t\tarray(
\t\t\t\tarray(
\t\t\t\t\t'methods'             => WP_REST_Server::CREATABLE,
\t\t\t\t\t'callback'            => '${handlerFunctionName}',
\t\t\t\t\t'permission_callback' => '${canManageFunctionName}',
\t\t\t\t)
\t\t\t)
\t\t);
\t}
}

add_action( 'admin_notices', '${adminNoticeFunctionName}' );
add_action( 'rest_api_init', '${registerRoutesFunctionName}' );
`;
}

/**
 * Scaffold a workspace-level server-only AI feature endpoint and synchronize
 * its typed REST plus AI-schema artifacts.
 *
 * @param options Command options for the AI feature scaffold workflow.
 * @returns Resolved scaffold metadata for the created AI feature.
 */
export async function runAddAiFeatureCommand({
	aiFeatureName,
	cwd = process.cwd(),
	namespace,
}: RunAddAiFeatureCommandOptions): Promise<{
	aiFeatureSlug: string;
	namespace: string;
	projectDir: string;
	warnings: string[];
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const aiFeatureSlug = assertValidGeneratedSlug(
		"AI feature name",
		normalizeBlockSlug(aiFeatureName),
		"wp-typia add ai-feature <name> [--namespace <vendor/v1>]",
	);
	const resolvedNamespace = resolveRestResourceNamespace(
		workspace.workspace.namespace,
		namespace,
	);
	const compatibilityPolicy = resolveScaffoldCompatibilityPolicy(
		OPTIONAL_WORDPRESS_AI_CLIENT_COMPATIBILITY,
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertAiFeatureDoesNotExist(workspace.projectDir, aiFeatureSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const syncAiScriptPath = path.join(workspace.projectDir, "scripts", "sync-ai-features.ts");
	const syncProjectScriptPath = path.join(workspace.projectDir, "scripts", "sync-project.ts");
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");
	const aiFeatureDir = path.join(
		workspace.projectDir,
		"src",
		"ai-features",
		aiFeatureSlug,
	);
	const typesFilePath = path.join(aiFeatureDir, "api-types.ts");
	const validatorsFilePath = path.join(aiFeatureDir, "api-validators.ts");
	const apiFilePath = path.join(aiFeatureDir, "api.ts");
	const dataFilePath = path.join(aiFeatureDir, "data.ts");
	const phpFilePath = path.join(
		workspace.projectDir,
		"inc",
		"ai-features",
		`${aiFeatureSlug}.php`,
	);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			bootstrapPath,
			packageJsonPath,
			syncAiScriptPath,
			syncProjectScriptPath,
			syncRestScriptPath,
		]),
		snapshotDirs: [],
		targetPaths: [aiFeatureDir, phpFilePath, syncAiScriptPath],
	};

	try {
		await fsp.mkdir(aiFeatureDir, { recursive: true });
		await fsp.mkdir(path.dirname(phpFilePath), { recursive: true });
		await ensureAiFeatureBootstrapAnchors(workspace);
		await patchFile(bootstrapPath, (source) =>
			updatePluginHeaderCompatibility(source, compatibilityPolicy),
		);
		const packageScriptChanges = await ensureAiFeaturePackageScripts(workspace);
		await ensureAiFeatureSyncProjectAnchors(workspace);
		await ensureAiFeatureSyncRestAnchors(workspace);
		await fsp.writeFile(
			syncAiScriptPath,
			buildAiFeatureSyncScriptSource(),
			"utf8",
		);
		await fsp.writeFile(
			typesFilePath,
			buildAiFeatureTypesSource(aiFeatureSlug),
			"utf8",
		);
		await fsp.writeFile(
			validatorsFilePath,
			buildAiFeatureValidatorsSource(aiFeatureSlug),
			"utf8",
		);
		await fsp.writeFile(
			apiFilePath,
			buildAiFeatureApiSource(aiFeatureSlug),
			"utf8",
		);
		await fsp.writeFile(
			dataFilePath,
			buildAiFeatureDataSource(aiFeatureSlug),
			"utf8",
		);
		await fsp.writeFile(
			phpFilePath,
			buildAiFeaturePhpSource(
				aiFeatureSlug,
				resolvedNamespace,
				workspace.workspace.phpPrefix,
				workspace.workspace.textDomain,
			),
			"utf8",
		);

		const pascalCase = toPascalCaseFromAiFeatureSlug(aiFeatureSlug);
		await syncAiFeatureRestArtifacts({
			clientFile: `src/ai-features/${aiFeatureSlug}/api-client.ts`,
			outputDir: path.join("src", "ai-features", aiFeatureSlug),
			projectDir: workspace.projectDir,
			typesFile: `src/ai-features/${aiFeatureSlug}/api-types.ts`,
			validatorsFile: `src/ai-features/${aiFeatureSlug}/api-validators.ts`,
			variables: {
				namespace: resolvedNamespace,
				pascalCase,
				slugKebabCase: aiFeatureSlug,
				title: toTitleCase(aiFeatureSlug),
			},
		});
		await syncAiFeatureSchemaArtifact({
			aiSchemaFile: `src/ai-features/${aiFeatureSlug}/ai-schemas/feature-result.ai.schema.json`,
			outputDir: path.join("src", "ai-features", aiFeatureSlug),
			projectDir: workspace.projectDir,
		});
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			aiFeatureEntries: [
				buildAiFeatureConfigEntry(aiFeatureSlug, resolvedNamespace),
			],
			transformSource: ensureBlockConfigCanAddRestManifests,
		});

		return {
			aiFeatureSlug,
			namespace: resolvedNamespace,
			projectDir: workspace.projectDir,
			warnings: packageScriptChanges.addedProjectToolsDependency
				? [
						"Added `@wp-typia/project-tools` to devDependencies for `sync-ai`. If this workspace was already installed, rerun your package manager install command before the first `wp-typia sync ai`.",
					]
				: [],
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
