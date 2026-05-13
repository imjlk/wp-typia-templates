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

if ( ! function_exists( '${loadSchemaFunctionName}' ) ) {
\tfunction ${loadSchemaFunctionName}( $schema_name ) {
\t\t$project_root = dirname( __DIR__, 2 );
\t\t$schema_paths = array(
\t\t\t$project_root . '/inc/rest-schemas/rest/${restResourceSlug}/' . $schema_name . '.schema.json',
\t\t\t$project_root . '/src/rest/${restResourceSlug}/api-schemas/' . $schema_name . '.schema.json',
\t\t);

\t\tforeach ( $schema_paths as $schema_path ) {
\t\t\tif ( ! is_file( $schema_path ) || ! is_readable( $schema_path ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$schema_json = file_get_contents( $schema_path );
\t\t\tif ( false === $schema_json ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$decoded = json_decode( $schema_json, true );
\t\t\tif ( is_array( $decoded ) ) {
\t\t\t\treturn $decoded;
\t\t\t}
\t\t}

\t\treturn null;
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
