import { type RestResourceMethodId } from "./cli-add-shared.js";
import { quotePhpString } from "./php-utils.js";
import { toTitleCase } from "./string-case.js";

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
	options: {
		controllerVariableName?: string;
		permissionCallback?: string;
		routePattern: string;
	},
): string {
	const collectionRoutes: string[] = [];
	const itemRoutes: string[] = [];
	const readPermissionCallback = options.permissionCallback
		? quotePhpString(options.permissionCallback)
		: quotePhpString("__return_true");
	const writePermissionCallback = options.permissionCallback
		? quotePhpString(options.permissionCallback)
		: options.controllerVariableName
			? `array( ${options.controllerVariableName}, 'can_manage_rest_resource' )`
			: quotePhpString(functions.canWriteFunctionName);
	const buildRouteCallback = (functionName: string, methodName: string) =>
		options.controllerVariableName
			? `array( ${options.controllerVariableName}, '${methodName}' )`
			: quotePhpString(functionName);

	if (methods.includes("list")) {
		collectionRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::READABLE,
\t\t\t'callback'            => ${buildRouteCallback(functions.listHandlerName, "list_items")},
\t\t\t'permission_callback' => ${readPermissionCallback},
\t\t)`);
	}
	if (methods.includes("create")) {
		collectionRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::CREATABLE,
\t\t\t'callback'            => ${buildRouteCallback(functions.createHandlerName, "create_item")},
\t\t\t'permission_callback' => ${writePermissionCallback},
\t\t)`);
	}
	if (methods.includes("read")) {
		itemRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::READABLE,
\t\t\t'callback'            => ${buildRouteCallback(functions.readHandlerName, "read_item")},
\t\t\t'permission_callback' => ${readPermissionCallback},
\t\t)`);
	}
	if (methods.includes("update")) {
		itemRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::EDITABLE,
\t\t\t'callback'            => ${buildRouteCallback(functions.updateHandlerName, "update_item")},
\t\t\t'permission_callback' => ${writePermissionCallback},
\t\t)`);
	}
	if (methods.includes("delete")) {
		itemRoutes.push(`\t\tarray(
\t\t\t'methods'             => WP_REST_Server::DELETABLE,
\t\t\t'callback'            => ${buildRouteCallback(functions.deleteHandlerName, "delete_item")},
\t\t\t'permission_callback' => ${writePermissionCallback},
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
\t\t${quotePhpString(options.routePattern)},
\t\tarray(
${itemRoutes.join(",\n")}
\t\t)
\t);`);
	}

	return registrations.join("\n\n");
}

function normalizeGlobalPhpClassName(classReference: string): string | undefined {
	const normalized = classReference.startsWith("\\")
		? classReference.slice(1)
		: classReference;

	return /^[A-Za-z_][A-Za-z0-9_]*$/u.test(normalized) ? normalized : undefined;
}

function toPhpClassConstantReference(classReference: string): string {
	const normalized = classReference.startsWith("\\")
		? classReference
		: `\\${classReference}`;
	return `${normalized}::class`;
}

function buildRestResourceControllerClassSource(options: {
	controllerClass: string;
	controllerExtends?: string;
	functions: {
		canWriteFunctionName: string;
		createHandlerName: string;
		deleteHandlerName: string;
		listHandlerName: string;
		readHandlerName: string;
		updateHandlerName: string;
	};
}): string {
	const controllerClassName = normalizeGlobalPhpClassName(options.controllerClass);
	if (!controllerClassName) {
		return "";
	}

	const extendsClause = options.controllerExtends
		? ` extends ${options.controllerExtends.startsWith("\\") ? options.controllerExtends : `\\${options.controllerExtends}`}`
		: "";

	return `
if ( ! class_exists( ${quotePhpString(controllerClassName)} ) ) {
\tclass ${controllerClassName}${extendsClause} {
\t\tpublic function can_manage_rest_resource() {
\t\t\treturn ${options.functions.canWriteFunctionName}();
\t\t}

\t\tpublic function list_items( WP_REST_Request $request ) {
\t\t\treturn ${options.functions.listHandlerName}( $request );
\t\t}

\t\tpublic function read_item( WP_REST_Request $request ) {
\t\t\treturn ${options.functions.readHandlerName}( $request );
\t\t}

\t\tpublic function create_item( WP_REST_Request $request ) {
\t\t\treturn ${options.functions.createHandlerName}( $request );
\t\t}

\t\tpublic function update_item( WP_REST_Request $request ) {
\t\t\treturn ${options.functions.updateHandlerName}( $request );
\t\t}

\t\tpublic function delete_item( WP_REST_Request $request ) {
\t\t\treturn ${options.functions.deleteHandlerName}( $request );
\t\t}
\t}
}
`;
}

/**
 * Build the PHP route/controller glue for generated workspace REST resources.
 *
 * @param restResourceSlug Normalized REST resource slug.
 * @param namespace WordPress REST namespace, such as `vendor/v1`.
 * @param phpPrefix Plugin PHP function prefix.
 * @param methods REST operations to expose.
 * @param options Optional generated route and controller customizations.
 * @returns A complete PHP source file for the generated REST resource.
 */
export function buildRestResourcePhpSource(
	restResourceSlug: string,
	namespace: string,
	phpPrefix: string,
	methods: RestResourceMethodId[],
	options: {
		controllerClass?: string;
		controllerExtends?: string;
		permissionCallback?: string;
		routePattern: string;
	},
): string {
	const restResourceTitle = toTitleCase(restResourceSlug);
	const restResourcePhpId = restResourceSlug.replace(/-/g, "_");
	const canWriteFunctionName = `${phpPrefix}_${restResourcePhpId}_can_manage_rest_resource`;
	const getItemsFunctionName = `${phpPrefix}_${restResourcePhpId}_get_rest_resource_items`;
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
	const controllerVariableName = options.controllerClass ? "$controller" : undefined;
	const routeRegistrations = buildRestResourceRouteRegistrations(restResourceSlug, methods, {
		canWriteFunctionName,
		createHandlerName,
		deleteHandlerName,
		listHandlerName,
		readHandlerName,
		updateHandlerName,
	}, {
		...(controllerVariableName ? { controllerVariableName } : {}),
		...(options.permissionCallback
			? { permissionCallback: options.permissionCallback }
			: {}),
		routePattern: options.routePattern,
	});
	const controllerClassSource = options.controllerClass
		? buildRestResourceControllerClassSource({
				controllerClass: options.controllerClass,
				...(options.controllerExtends
					? { controllerExtends: options.controllerExtends }
					: {}),
				functions: {
					canWriteFunctionName,
					createHandlerName,
					deleteHandlerName,
					listHandlerName,
					readHandlerName,
					updateHandlerName,
				},
			})
		: "";
	const controllerBootstrapSource = options.controllerClass
		? `\t\t$controller_class = ${toPhpClassConstantReference(options.controllerClass)};
\t\tif ( ! class_exists( $controller_class ) ) {
\t\t\treturn;
\t\t}
\t\t$controller = new $controller_class();

`
		: "";

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

if ( ! function_exists( '${validatePayloadFunctionName}' ) ) {
\tfunction ${validatePayloadFunctionName}( $value, $schema_name, $param_name ) {
\t\tif ( ! function_exists( '${phpPrefix}_validate_and_sanitize_rest_payload' ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'missing_rest_schema_helper',
\t\t\t\t'Missing REST schema helper. Ensure inc/rest-schema.php is loaded before REST resources.',
\t\t\t\tarray( 'status' => 500 )
\t\t\t);
\t\t}

\t\treturn ${phpPrefix}_validate_and_sanitize_rest_payload(
\t\t\t$value,
\t\t\t$schema_name,
\t\t\t$param_name,
\t\t\tarray( 'resource' => ${quotePhpString(restResourceSlug)} )
\t\t);
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

${controllerClassSource}
if ( ! function_exists( '${registerRoutesFunctionName}' ) ) {
\tfunction ${registerRoutesFunctionName}() {
\t\t$namespace = ${quotePhpString(namespace)};

${controllerBootstrapSource}
${routeRegistrations}
\t}
}

add_action( 'rest_api_init', '${registerRoutesFunctionName}' );
`;
}

/**
 * Build the shared PHP helper loaded by workspace bootstraps for generated REST schemas.
 *
 * @param phpPrefix Plugin-scoped PHP function prefix.
 * @returns PHP source for `inc/rest-schema.php`.
 */
export function buildWorkspaceRestSchemaHelperPhpSource(phpPrefix: string): string {
	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( '${phpPrefix}_is_valid_rest_schema_key' ) ) {
\tfunction ${phpPrefix}_is_valid_rest_schema_key( $value ) {
\t\treturn is_string( $value ) && 1 === preg_match( '/\\A[A-Za-z0-9_-]+\\z/', $value );
\t}
}

if ( ! function_exists( '${phpPrefix}_is_valid_rest_resource_slug' ) ) {
\tfunction ${phpPrefix}_is_valid_rest_resource_slug( $value ) {
\t\treturn is_string( $value ) && 1 === preg_match( '/\\A[a-z0-9]+(?:-[a-z0-9]+)*\\z/', $value );
\t}
}

if ( ! function_exists( '${phpPrefix}_resolve_rest_schema_paths' ) ) {
\tfunction ${phpPrefix}_resolve_rest_schema_paths( $schema_name, $options = array() ) {
\t\tif ( ! ${phpPrefix}_is_valid_rest_schema_key( $schema_name ) ) {
\t\t\treturn new WP_Error(
\t\t\t\t'invalid_rest_schema_name',
\t\t\t\t'Invalid REST schema name.',
\t\t\t\tarray( 'status' => 500 )
\t\t\t);
\t\t}

\t\t$options      = is_array( $options ) ? $options : array();
\t\t$project_root = dirname( __DIR__ );
\t\t$paths        = array();

\t\tif ( isset( $options['resource'] ) && '' !== $options['resource'] ) {
\t\t\tif ( ! ${phpPrefix}_is_valid_rest_resource_slug( $options['resource'] ) ) {
\t\t\t\treturn new WP_Error(
\t\t\t\t\t'invalid_rest_schema_resource',
\t\t\t\t\t'Invalid REST schema resource slug.',
\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t);
\t\t\t}

\t\t\t$resource_slug = $options['resource'];
\t\t\t$paths[]       = __DIR__ . '/rest-schemas/rest/' . $resource_slug . '/' . $schema_name . '.schema.json';
\t\t\t$paths[]       = $project_root . '/src/rest/' . $resource_slug . '/api-schemas/' . $schema_name . '.schema.json';
\t\t}

\t\tif ( isset( $options['paths'] ) && is_array( $options['paths'] ) ) {
\t\t\tforeach ( $options['paths'] as $schema_path ) {
\t\t\t\tif ( is_string( $schema_path ) && '' !== $schema_path && ! in_array( $schema_path, $paths, true ) ) {
\t\t\t\t\t$paths[] = $schema_path;
\t\t\t\t}
\t\t\t}
\t\t}

\t\treturn $paths;
\t}
}

if ( ! function_exists( '${phpPrefix}_load_rest_schema' ) ) {
\tfunction ${phpPrefix}_load_rest_schema( $schema_name, $options = array() ) {
\t\t$schema_paths = ${phpPrefix}_resolve_rest_schema_paths( $schema_name, $options );
\t\tif ( is_wp_error( $schema_paths ) ) {
\t\t\treturn $schema_paths;
\t\t}

\t\tforeach ( $schema_paths as $schema_path ) {
\t\t\tif ( ! is_file( $schema_path ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\tif ( ! is_readable( $schema_path ) ) {
\t\t\t\treturn new WP_Error(
\t\t\t\t\t'unreadable_rest_schema',
\t\t\t\t\t'Generated REST schema is not readable.',
\t\t\t\t\tarray(
\t\t\t\t\t\t'path'   => $schema_path,
\t\t\t\t\t\t'status' => 500,
\t\t\t\t\t)
\t\t\t\t);
\t\t\t}

\t\t\t$schema_json = file_get_contents( $schema_path );
\t\t\tif ( false === $schema_json ) {
\t\t\t\treturn new WP_Error(
\t\t\t\t\t'rest_schema_read_failed',
\t\t\t\t\t'Generated REST schema could not be read.',
\t\t\t\t\tarray(
\t\t\t\t\t\t'path'   => $schema_path,
\t\t\t\t\t\t'status' => 500,
\t\t\t\t\t)
\t\t\t\t);
\t\t\t}

\t\t\t$decoded = json_decode( $schema_json, true );
\t\t\tif ( ! is_array( $decoded ) ) {
\t\t\t\treturn new WP_Error(
\t\t\t\t\t'malformed_rest_schema',
\t\t\t\t\t'Generated REST schema contains malformed JSON.',
\t\t\t\t\tarray(
\t\t\t\t\t\t'json_error' => json_last_error_msg(),
\t\t\t\t\t\t'path'       => $schema_path,
\t\t\t\t\t\t'status'     => 500,
\t\t\t\t\t)
\t\t\t\t);
\t\t\t}

\t\t\treturn $decoded;
\t\t}

\t\treturn new WP_Error(
\t\t\t'missing_rest_schema',
\t\t\t'Generated REST schema could not be found.',
\t\t\tarray(
\t\t\t\t'paths'  => $schema_paths,
\t\t\t\t'schema' => $schema_name,
\t\t\t\t'status' => 500,
\t\t\t)
\t\t);
\t}
}

if ( ! function_exists( '${phpPrefix}_prepare_rest_schema_for_wordpress' ) ) {
\tfunction ${phpPrefix}_prepare_rest_schema_for_wordpress( $schema ) {
\t\tif ( ! is_array( $schema ) ) {
\t\t\treturn $schema;
\t\t}

\t\tunset( $schema['$schema'], $schema['title'] );

\t\tforeach ( array( 'properties', 'patternProperties', 'definitions', '$defs' ) as $schema_map_key ) {
\t\t\tif ( ! isset( $schema[ $schema_map_key ] ) || ! is_array( $schema[ $schema_map_key ] ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\tforeach ( $schema[ $schema_map_key ] as $key => $property_schema ) {
\t\t\t\t$schema[ $schema_map_key ][ $key ] = ${phpPrefix}_prepare_rest_schema_for_wordpress( $property_schema );
\t\t\t}
\t\t}

\t\tforeach ( array( 'items', 'additionalProperties', 'contains', 'propertyNames', 'not', 'if', 'then', 'else' ) as $nested_schema_key ) {
\t\t\tif ( isset( $schema[ $nested_schema_key ] ) && is_array( $schema[ $nested_schema_key ] ) ) {
\t\t\t\t$schema[ $nested_schema_key ] = ${phpPrefix}_prepare_rest_schema_for_wordpress( $schema[ $nested_schema_key ] );
\t\t\t}
\t\t}

\t\tforeach ( array( 'allOf', 'anyOf', 'oneOf' ) as $schema_list_key ) {
\t\t\tif ( ! isset( $schema[ $schema_list_key ] ) || ! is_array( $schema[ $schema_list_key ] ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\tforeach ( $schema[ $schema_list_key ] as $index => $variant_schema ) {
\t\t\t\t$schema[ $schema_list_key ][ $index ] = ${phpPrefix}_prepare_rest_schema_for_wordpress( $variant_schema );
\t\t\t}
\t\t}

\t\treturn $schema;
\t}
}

if ( ! function_exists( '${phpPrefix}_get_wordpress_rest_schema' ) ) {
\tfunction ${phpPrefix}_get_wordpress_rest_schema( $schema_name, $options = array() ) {
\t\t$schema = ${phpPrefix}_load_rest_schema( $schema_name, $options );
\t\tif ( is_wp_error( $schema ) ) {
\t\t\treturn $schema;
\t\t}

\t\treturn ${phpPrefix}_prepare_rest_schema_for_wordpress( $schema );
\t}
}

if ( ! function_exists( '${phpPrefix}_validate_and_sanitize_rest_payload' ) ) {
\tfunction ${phpPrefix}_validate_and_sanitize_rest_payload( $value, $schema_name, $param_name, $options = array() ) {
\t\t$rest_schema = ${phpPrefix}_get_wordpress_rest_schema( $schema_name, $options );
\t\tif ( is_wp_error( $rest_schema ) ) {
\t\t\treturn $rest_schema;
\t\t}

\t\t$validation = rest_validate_value_from_schema( $value, $rest_schema, $param_name );
\t\tif ( is_wp_error( $validation ) ) {
\t\t\treturn $validation;
\t\t}

\t\treturn rest_sanitize_value_from_schema( $value, $rest_schema, $param_name );
\t}
}
`;
}
