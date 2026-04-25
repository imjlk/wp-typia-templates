import { promises as fsp } from "node:fs";
import path from "node:path";

import { ensureBlockConfigCanAddRestManifests } from "./cli-add-block-legacy-validator.js";
import {
	assertRestResourceDoesNotExist,
	assertValidGeneratedSlug,
	assertValidRestResourceMethods,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	resolveRestResourceNamespace,
	rollbackWorkspaceMutation,
	type RestResourceMethodId,
	type RunAddRestResourceCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	ensureRestResourceBootstrapAnchors,
	ensureRestResourceSyncScriptAnchors,
} from "./cli-add-workspace-rest-anchors.js";
import {
	buildRestResourceApiSource,
	buildRestResourceConfigEntry,
	buildRestResourceDataSource,
	buildRestResourceTypesSource,
	buildRestResourceValidatorsSource,
	toPascalCaseFromSlug,
} from "./cli-add-workspace-rest-source-emitters.js";
import { syncRestResourceArtifacts } from "./rest-resource-artifacts.js";
import { toTitleCase } from "./string-case.js";
import {
	appendWorkspaceInventoryEntries,
	readWorkspaceInventory,
} from "./workspace-inventory.js";
import { resolveWorkspaceProject } from "./workspace-project.js";

function quotePhpString(value: string): string {
	return `'${value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'")}'`;
}

function buildRestResourceRouteRegistrations(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
	functions: {
		canWriteFunctionName: string;
		createHandlerName: string;
		deleteHandlerName: string;
		listHandlerName: string;
		readHandlerName: string;
		updateHandlerName: string;
	},
): string {
	const collectionRoutes: string[] = [];
	const itemRoutes: string[] = [];

	if (methods.includes("list")) {
		collectionRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::READABLE,
\t\t\t'callback'            => '${functions.listHandlerName}',
\t\t\t'permission_callback' => '__return_true',
\t\t)`);
	}
	if (methods.includes("create")) {
		collectionRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::CREATABLE,
\t\t\t'callback'            => '${functions.createHandlerName}',
\t\t\t'permission_callback' => '${functions.canWriteFunctionName}',
\t\t)`);
	}
	if (methods.includes("read")) {
		itemRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::READABLE,
\t\t\t'callback'            => '${functions.readHandlerName}',
\t\t\t'permission_callback' => '__return_true',
\t\t)`);
	}
	if (methods.includes("update")) {
		itemRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::EDITABLE,
\t\t\t'callback'            => '${functions.updateHandlerName}',
\t\t\t'permission_callback' => '${functions.canWriteFunctionName}',
\t\t)`);
	}
	if (methods.includes("delete")) {
		itemRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::DELETABLE,
\t\t\t'callback'            => '${functions.deleteHandlerName}',
\t\t\t'permission_callback' => '${functions.canWriteFunctionName}',
\t\t)`);
	}

	const registrations: string[] = [];
	if (collectionRoutes.length > 0) {
		registrations.push(`\tregister_rest_route(
\t\t$namespace,
\t\t'/${restResourceSlug}',
\t\tarray(
${collectionRoutes.join(",\n")}
\t\t)
\t);`);
	}
	if (itemRoutes.length > 0) {
		registrations.push(`\tregister_rest_route(
\t\t$namespace,
\t\t'/${restResourceSlug}/item',
\t\tarray(
${itemRoutes.join(",\n")}
\t\t)
\t);`);
	}

	return registrations.join("\n\n");
}

function buildRestResourcePhpSource(
	restResourceSlug: string,
	namespace: string,
	phpPrefix: string,
	textDomain: string,
	methods: RestResourceMethodId[],
): string {
	const restResourceTitle = toTitleCase(restResourceSlug);
	const restResourcePhpId = restResourceSlug.replace(/-/g, "_");
	const canWriteFunctionName = `${phpPrefix}_${restResourcePhpId}_can_manage_rest_resource`;
	const getItemsFunctionName = `${phpPrefix}_${restResourcePhpId}_get_rest_resource_items`;
	const loadSchemaFunctionName = `${phpPrefix}_${restResourcePhpId}_load_rest_resource_schema`;
	const normalizeSchemaFunctionName = `${phpPrefix}_${restResourcePhpId}_sanitize_rest_resource_schema`;
	const validatePayloadFunctionName = `${phpPrefix}_${restResourcePhpId}_validate_rest_resource_payload`;
	const normalizeItemFunctionName = `${phpPrefix}_${restResourcePhpId}_normalize_rest_resource_item`;
	const saveItemsFunctionName = `${phpPrefix}_${restResourcePhpId}_save_rest_resource_items`;
	const getOptionNameFunctionName = `${phpPrefix}_${restResourcePhpId}_get_rest_resource_option_name`;
	const listHandlerName = `${phpPrefix}_${restResourcePhpId}_handle_list_rest_resource`;
	const readHandlerName = `${phpPrefix}_${restResourcePhpId}_handle_read_rest_resource`;
	const createHandlerName = `${phpPrefix}_${restResourcePhpId}_handle_create_rest_resource`;
	const updateHandlerName = `${phpPrefix}_${restResourcePhpId}_handle_update_rest_resource`;
	const deleteHandlerName = `${phpPrefix}_${restResourcePhpId}_handle_delete_rest_resource`;
	const registerRoutesFunctionName = `${phpPrefix}_${restResourcePhpId}_register_rest_routes`;
	const routeRegistrations = buildRestResourceRouteRegistrations(restResourceSlug, methods, {
		canWriteFunctionName,
		createHandlerName,
		deleteHandlerName,
		listHandlerName,
		readHandlerName,
		updateHandlerName,
	});

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( '${getOptionNameFunctionName}' ) ) {
\tfunction ${getOptionNameFunctionName}() {
\t\treturn ${quotePhpString(`${phpPrefix}_${restResourcePhpId}_rest_resource_items`)};
\t}
}

if ( ! function_exists( '${normalizeItemFunctionName}' ) ) {
\tfunction ${normalizeItemFunctionName}( array $item ) {
\t\treturn array(
\t\t\t'id'        => isset( $item['id'] ) ? (int) $item['id'] : 0,
\t\t\t'title'     => isset( $item['title'] ) ? (string) $item['title'] : '',
\t\t\t'content'   => isset( $item['content'] ) ? (string) $item['content'] : '',
\t\t\t'status'    => isset( $item['status'] ) && 'published' === $item['status'] ? 'published' : 'draft',
\t\t\t'updatedAt' => isset( $item['updatedAt'] ) ? (string) $item['updatedAt'] : gmdate( 'c' ),
\t\t);
\t}
}

if ( ! function_exists( '${getItemsFunctionName}' ) ) {
\tfunction ${getItemsFunctionName}() {
\t\t$seed_items = array(
\t\t\tarray(
\t\t\t\t'id'        => 1,
\t\t\t\t'title'     => ${quotePhpString(`${restResourceTitle} Starter`)},
\t\t\t\t'content'   => ${quotePhpString(`Replace this seeded ${restResourceTitle.toLowerCase()} content with your plugin data source.`)},
\t\t\t\t'status'    => 'draft',
\t\t\t\t'updatedAt' => '2026-01-01T00:00:00Z',
\t\t\t),
\t\t);
\t\t$items = get_option( ${getOptionNameFunctionName}(), $seed_items );

\t\tif ( ! is_array( $items ) ) {
\t\t\t$items = $seed_items;
\t\t}

\t\treturn array_values(
\t\t\tarray_map(
\t\t\t\t'${normalizeItemFunctionName}',
\t\t\t\tarray_filter(
\t\t\t\t\t$items,
\t\t\t\t\t'is_array'
\t\t\t\t)
\t\t\t)
\t\t);
\t}
}

if ( ! function_exists( '${saveItemsFunctionName}' ) ) {
\tfunction ${saveItemsFunctionName}( array $items ) {
\t\tupdate_option(
\t\t\t${getOptionNameFunctionName}(),
\t\t\tarray_values(
\t\t\t\tarray_map(
\t\t\t\t\t'${normalizeItemFunctionName}',
\t\t\t\t\t$items
\t\t\t\t)
\t\t\t),
\t\t\tfalse
\t\t);
\t}
}

if ( ! function_exists( '${loadSchemaFunctionName}' ) ) {
\tfunction ${loadSchemaFunctionName}( $schema_name ) {
\t\t$project_root = dirname( __DIR__, 2 );
\t\t$schema_path  = $project_root . '/src/rest/${restResourceSlug}/api-schemas/' . $schema_name . '.schema.json';
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
\t\t\treturn new WP_Error( 'missing_schema', 'Missing REST schema.', array( 'status' => 500 ) );
\t\t}

\t\t$rest_schema = ${normalizeSchemaFunctionName}( $schema );
\t\t$validation  = rest_validate_value_from_schema( $value, $rest_schema, $param_name );
\t\tif ( is_wp_error( $validation ) ) {
\t\t\treturn $validation;
\t\t}

\t\treturn rest_sanitize_value_from_schema( $value, $rest_schema, $param_name );
\t}
}

if ( ! function_exists( '${canWriteFunctionName}' ) ) {
\tfunction ${canWriteFunctionName}() {
\t\treturn current_user_can( 'edit_posts' );
\t}
}

if ( ! function_exists( '${listHandlerName}' ) ) {
\tfunction ${listHandlerName}( WP_REST_Request $request ) {
\t\t$payload_input = array();
\t\t$page          = $request->get_param( 'page' );
\t\t$per_page      = $request->get_param( 'perPage' );
\t\t$search        = $request->get_param( 'search' );

\t\tif ( null !== $page ) {
\t\t\t$payload_input['page'] = $page;
\t\t}
\t\tif ( null !== $per_page ) {
\t\t\t$payload_input['perPage'] = $per_page;
\t\t}
\t\tif ( null !== $search ) {
\t\t\t$payload_input['search'] = $search;
\t\t}

\t\t$payload = ${validatePayloadFunctionName}(
\t\t\t$payload_input,
\t\t\t'list-query',
\t\t\t'query'
\t\t);

\t\tif ( is_wp_error( $payload ) ) {
\t\t\treturn $payload;
\t\t}

\t\t$page     = isset( $payload['page'] ) ? max( 1, (int) $payload['page'] ) : 1;
\t\t$per_page = isset( $payload['perPage'] ) ? min( 50, max( 1, (int) $payload['perPage'] ) ) : 10;
\t\t$search   = isset( $payload['search'] ) ? strtolower( (string) $payload['search'] ) : '';
\t\t$items    = ${getItemsFunctionName}();

\t\tif ( '' !== $search ) {
\t\t\t$items = array_values(
\t\t\t\tarray_filter(
\t\t\t\t\t$items,
\t\t\t\t\tstatic function ( $item ) use ( $search ) {
\t\t\t\t\t\treturn false !== strpos( strtolower( (string) ( $item['title'] ?? '' ) ), $search ) ||
\t\t\t\t\t\t\tfalse !== strpos( strtolower( (string) ( $item['content'] ?? '' ) ), $search );
\t\t\t\t\t}
\t\t\t\t)
\t\t\t);
\t\t}

\t\t$total = count( $items );
\t\t$items = array_slice( $items, ( $page - 1 ) * $per_page, $per_page );

\t\treturn rest_ensure_response(
\t\t\tarray(
\t\t\t\t'items'   => $items,
\t\t\t\t'page'    => $page,
\t\t\t\t'perPage' => $per_page,
\t\t\t\t'total'   => $total,
\t\t\t)
\t\t);
\t}
}

if ( ! function_exists( '${readHandlerName}' ) ) {
\tfunction ${readHandlerName}( WP_REST_Request $request ) {
\t\t$payload = ${validatePayloadFunctionName}(
\t\t\tarray(
\t\t\t\t'id' => $request->get_param( 'id' ),
\t\t\t),
\t\t\t'read-query',
\t\t\t'query'
\t\t);

\t\tif ( is_wp_error( $payload ) ) {
\t\t\treturn $payload;
\t\t}

\t\tforeach ( ${getItemsFunctionName}() as $item ) {
\t\t\tif ( (int) $item['id'] === (int) $payload['id'] ) {
\t\t\t\treturn rest_ensure_response( $item );
\t\t\t}
\t\t}

\t\treturn new WP_Error( 'rest_not_found', 'Resource not found.', array( 'status' => 404 ) );
\t}
}

if ( ! function_exists( '${createHandlerName}' ) ) {
\tfunction ${createHandlerName}( WP_REST_Request $request ) {
\t\t$payload = ${validatePayloadFunctionName}( $request->get_json_params(), 'create-request', 'body' );
\t\tif ( is_wp_error( $payload ) ) {
\t\t\treturn $payload;
\t\t}

\t\t$items   = ${getItemsFunctionName}();
\t\t$next_id = 1;
\t\tforeach ( $items as $item ) {
\t\t\t$next_id = max( $next_id, (int) $item['id'] + 1 );
\t\t}

\t\t$record = ${normalizeItemFunctionName}(
\t\t\tarray(
\t\t\t\t'id'        => $next_id,
\t\t\t\t'title'     => (string) $payload['title'],
\t\t\t\t'content'   => isset( $payload['content'] ) ? (string) $payload['content'] : '',
\t\t\t\t'status'    => isset( $payload['status'] ) ? (string) $payload['status'] : 'draft',
\t\t\t\t'updatedAt' => gmdate( 'c' ),
\t\t\t)
\t\t);

\t\t$items[] = $record;
\t\t${saveItemsFunctionName}( $items );

\t\treturn rest_ensure_response( $record );
\t}
}

if ( ! function_exists( '${updateHandlerName}' ) ) {
\tfunction ${updateHandlerName}( WP_REST_Request $request ) {
\t\t$query = ${validatePayloadFunctionName}(
\t\t\tarray(
\t\t\t\t'id' => $request->get_param( 'id' ),
\t\t\t),
\t\t\t'update-query',
\t\t\t'query'
\t\t);
\t\tif ( is_wp_error( $query ) ) {
\t\t\treturn $query;
\t\t}

\t\t$payload = ${validatePayloadFunctionName}( $request->get_json_params(), 'update-request', 'body' );
\t\tif ( is_wp_error( $payload ) ) {
\t\t\treturn $payload;
\t\t}

\t\t$items = ${getItemsFunctionName}();
\t\tforeach ( $items as $index => $item ) {
\t\t\tif ( (int) $item['id'] !== (int) $query['id'] ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$items[ $index ] = ${normalizeItemFunctionName}(
\t\t\t\tarray(
\t\t\t\t\t'id'        => $item['id'],
\t\t\t\t\t'title'     => isset( $payload['title'] ) ? (string) $payload['title'] : (string) $item['title'],
\t\t\t\t\t'content'   => array_key_exists( 'content', $payload ) ? (string) $payload['content'] : (string) $item['content'],
\t\t\t\t\t'status'    => isset( $payload['status'] ) ? (string) $payload['status'] : (string) $item['status'],
\t\t\t\t\t'updatedAt' => gmdate( 'c' ),
\t\t\t\t)
\t\t\t);

\t\t\t${saveItemsFunctionName}( $items );
\t\t\treturn rest_ensure_response( $items[ $index ] );
\t\t}

\t\treturn new WP_Error( 'rest_not_found', 'Resource not found.', array( 'status' => 404 ) );
\t}
}

if ( ! function_exists( '${deleteHandlerName}' ) ) {
\tfunction ${deleteHandlerName}( WP_REST_Request $request ) {
\t\t$query = ${validatePayloadFunctionName}(
\t\t\tarray(
\t\t\t\t'id' => $request->get_param( 'id' ),
\t\t\t),
\t\t\t'delete-query',
\t\t\t'query'
\t\t);
\t\tif ( is_wp_error( $query ) ) {
\t\t\treturn $query;
\t\t}

\t\t$items       = ${getItemsFunctionName}();
\t\t$filtered    = array_values(
\t\t\tarray_filter(
\t\t\t\t$items,
\t\t\t\tstatic function ( $item ) use ( $query ) {
\t\t\t\t\treturn (int) $item['id'] !== (int) $query['id'];
\t\t\t\t}
\t\t\t)
\t\t);
\t\t$was_deleted = count( $filtered ) !== count( $items );

\t\tif ( ! $was_deleted ) {
\t\t\treturn new WP_Error( 'rest_not_found', 'Resource not found.', array( 'status' => 404 ) );
\t\t}

\t\t${saveItemsFunctionName}( $filtered );

\t\treturn rest_ensure_response(
\t\t\tarray(
\t\t\t\t'deleted' => true,
\t\t\t\t'id'      => (int) $query['id'],
\t\t\t)
\t\t);
\t}
}

if ( ! function_exists( '${registerRoutesFunctionName}' ) ) {
\tfunction ${registerRoutesFunctionName}() {
\t\t$namespace = ${quotePhpString(namespace)};

${routeRegistrations}
\t}
}

add_action( 'rest_api_init', '${registerRoutesFunctionName}' );
`;
}

/**
 * Scaffold a workspace-level REST resource and synchronize its generated
 * TypeScript and PHP artifacts.
 *
 * @param options Command options for the REST resource scaffold workflow.
 * @returns Resolved scaffold metadata for the created REST resource.
 */
export async function runAddRestResourceCommand({
	cwd = process.cwd(),
	methods,
	namespace,
	restResourceName,
}: RunAddRestResourceCommandOptions): Promise<{
	methods: RestResourceMethodId[];
	namespace: string;
	projectDir: string;
	restResourceSlug: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const restResourceSlug = assertValidGeneratedSlug(
		"REST resource name",
		normalizeBlockSlug(restResourceName),
		"wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create>]",
	);
	const resolvedMethods = assertValidRestResourceMethods(methods);
	const resolvedNamespace = resolveRestResourceNamespace(
		workspace.workspace.namespace,
		namespace,
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertRestResourceDoesNotExist(workspace.projectDir, restResourceSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");
	const restResourceDir = path.join(workspace.projectDir, "src", "rest", restResourceSlug);
	const typesFilePath = path.join(restResourceDir, "api-types.ts");
	const validatorsFilePath = path.join(restResourceDir, "api-validators.ts");
	const apiFilePath = path.join(restResourceDir, "api.ts");
	const dataFilePath = path.join(restResourceDir, "data.ts");
	const phpFilePath = path.join(workspace.projectDir, "inc", "rest", `${restResourceSlug}.php`);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			bootstrapPath,
			syncRestScriptPath,
		]),
		snapshotDirs: [],
		targetPaths: [restResourceDir, phpFilePath],
	};

	try {
		await fsp.mkdir(restResourceDir, { recursive: true });
		await fsp.mkdir(path.dirname(phpFilePath), { recursive: true });
		await ensureRestResourceBootstrapAnchors(workspace);
		await ensureRestResourceSyncScriptAnchors(workspace);
		await fsp.writeFile(
			typesFilePath,
			buildRestResourceTypesSource(restResourceSlug, resolvedMethods),
			"utf8",
		);
		await fsp.writeFile(
			validatorsFilePath,
			buildRestResourceValidatorsSource(restResourceSlug, resolvedMethods),
			"utf8",
		);
		await fsp.writeFile(
			apiFilePath,
			buildRestResourceApiSource(restResourceSlug, resolvedMethods),
			"utf8",
		);
		await fsp.writeFile(
			dataFilePath,
			buildRestResourceDataSource(restResourceSlug, resolvedMethods),
			"utf8",
		);
		await fsp.writeFile(
			phpFilePath,
			buildRestResourcePhpSource(
				restResourceSlug,
				resolvedNamespace,
				workspace.workspace.phpPrefix,
				workspace.workspace.textDomain,
				resolvedMethods,
			),
			"utf8",
		);
		await syncRestResourceArtifacts({
			clientFile: `src/rest/${restResourceSlug}/api-client.ts`,
			methods: resolvedMethods,
			outputDir: restResourceDir,
			projectDir: workspace.projectDir,
			typesFile: `src/rest/${restResourceSlug}/api-types.ts`,
			validatorsFile: `src/rest/${restResourceSlug}/api-validators.ts`,
			variables: {
				namespace: resolvedNamespace,
				pascalCase: toPascalCaseFromSlug(restResourceSlug),
				slugKebabCase: restResourceSlug,
				title: toTitleCase(restResourceSlug),
			},
		});
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			restResourceEntries: [
				buildRestResourceConfigEntry(
					restResourceSlug,
					resolvedNamespace,
					resolvedMethods,
				),
			],
			transformSource: ensureBlockConfigCanAddRestManifests,
		});

		return {
			methods: resolvedMethods,
			namespace: resolvedNamespace,
			projectDir: workspace.projectDir,
			restResourceSlug,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
