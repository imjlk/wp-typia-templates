import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import { ensureBlockConfigCanAddRestManifests } from "./cli-add-block-legacy-validator.js";
import {
	assertRestResourceDoesNotExist,
	assertValidGeneratedSlug,
	assertValidRestResourceMethods,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	resolveRestResourceNamespace,
	rollbackWorkspaceMutation,
	type RestResourceMethodId,
	type RunAddRestResourceCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import { buildRestResourceEndpointManifest, syncRestResourceArtifacts } from "./rest-resource-artifacts.js";
import { toTitleCase } from "./string-case.js";
import {
	appendWorkspaceInventoryEntries,
	readWorkspaceInventory,
} from "./workspace-inventory.js";
import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";

const REST_RESOURCE_SERVER_GLOB = "/inc/rest/*.php";

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function quotePhpString(value: string): string {
	return `'${value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'")}'`;
}

function findPhpFunctionRange(
	source: string,
	functionName: string,
): {
	end: number;
	start: number;
} | null {
	const signaturePattern = new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\(`, "u");
	const signatureMatch = signaturePattern.exec(source);
	if (!signatureMatch || signatureMatch.index === undefined) {
		return null;
	}

	const functionStart = signatureMatch.index;
	const openBraceIndex = source.indexOf("{", functionStart);
	if (openBraceIndex === -1) {
		return null;
	}

	let depth = 0;
	for (let index = openBraceIndex; index < source.length; index += 1) {
		const character = source[index];
		if (character === "{") {
			depth += 1;
			continue;
		}
		if (character !== "}") {
			continue;
		}
		depth -= 1;
		if (depth === 0) {
			let functionEnd = index + 1;
			while (functionEnd < source.length && /[\r\n]/u.test(source[functionEnd] ?? "")) {
				functionEnd += 1;
			}
			return {
				end: functionEnd,
				start: functionStart,
			};
		}
	}

	return null;
}

function replacePhpFunctionDefinition(
	source: string,
	functionName: string,
	replacement: string,
): string | null {
	const functionRange = findPhpFunctionRange(source, functionName);
	if (!functionRange) {
		return null;
	}

	return [
		source.slice(0, functionRange.start),
		replacement,
		source.slice(functionRange.end),
	].join("");
}

function toPascalCaseFromSlug(slug: string): string {
	return normalizeBlockSlug(slug)
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join("");
}

function indentMultiline(source: string, prefix: string): string {
	return source
		.split("\n")
		.map((line) => `${prefix}${line}`)
		.join("\n");
}

function buildRestResourceConfigEntry(
	restResourceSlug: string,
	namespace: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCaseFromSlug(restResourceSlug);
	const title = toTitleCase(restResourceSlug);
	const manifest = buildRestResourceEndpointManifest(
		{
			namespace,
			pascalCase,
			slugKebabCase: restResourceSlug,
			title,
		},
		methods,
	);

	return [
		"\t{",
		`\t\tapiFile: ${quoteTsString(`src/rest/${restResourceSlug}/api.ts`)},`,
		`\t\tclientFile: ${quoteTsString(`src/rest/${restResourceSlug}/api-client.ts`)},`,
		`\t\tdataFile: ${quoteTsString(`src/rest/${restResourceSlug}/data.ts`)},`,
		`\t\tmethods: [ ${methods.map((method) => quoteTsString(method)).join(", ")} ],`,
		`\t\tnamespace: ${quoteTsString(namespace)},`,
		`\t\topenApiFile: ${quoteTsString(`src/rest/${restResourceSlug}/api.openapi.json`)},`,
		`\t\tphpFile: ${quoteTsString(`inc/rest/${restResourceSlug}.php`)},`,
		"\t\trestManifest: defineEndpointManifest(",
		indentMultiline(JSON.stringify(manifest, null, "\t"), "\t\t\t"),
		"\t\t),",
		`\t\tslug: ${quoteTsString(restResourceSlug)},`,
		`\t\ttypesFile: ${quoteTsString(`src/rest/${restResourceSlug}/api-types.ts`)},`,
		`\t\tvalidatorsFile: ${quoteTsString(`src/rest/${restResourceSlug}/api-validators.ts`)},`,
		"\t},",
	].join("\n");
}

function buildRestResourceTypesSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCaseFromSlug(restResourceSlug);
	const lines = [
		"import { tags } from 'typia';",
		"",
		`export type ${pascalCase}Status = 'draft' | 'published';`,
		"",
		`export interface ${pascalCase}Record {`,
		"\tid: number & tags.Type< 'uint32' >;",
		"\ttitle: string & tags.MinLength< 1 > & tags.MaxLength< 120 >;",
		"\tcontent?: string & tags.MaxLength< 2000 >;",
		`\tstatus: ${pascalCase}Status;`,
		"\tupdatedAt: string;",
		"}",
	];

	if (methods.includes("list")) {
		lines.push(
			"",
			`export interface ${pascalCase}ListQuery {`,
			"\tpage?: number & tags.Type< 'uint32' > & tags.Minimum< 1 > & tags.Default< 1 >;",
			"\tperPage?: number & tags.Type< 'uint32' > & tags.Minimum< 1 > & tags.Maximum< 50 > & tags.Default< 10 >;",
			"\tsearch?: string & tags.MaxLength< 120 >;",
			"}",
			"",
			`export interface ${pascalCase}ListResponse {`,
			`\titems: ${pascalCase}Record[];`,
			"\tpage: number & tags.Type< 'uint32' >;",
			"\tperPage: number & tags.Type< 'uint32' >;",
			"\ttotal: number & tags.Type< 'uint32' >;",
			"}",
		);
	}

	if (methods.includes("read")) {
		lines.push(
			"",
			`export interface ${pascalCase}ReadQuery {`,
			"\tid: number & tags.Type< 'uint32' >;",
			"}",
			"",
			`export type ${pascalCase}ReadResponse = ${pascalCase}Record;`,
		);
	}

	if (methods.includes("create")) {
		lines.push(
			"",
			`export interface ${pascalCase}CreateRequest {`,
			"\ttitle: string & tags.MinLength< 1 > & tags.MaxLength< 120 >;",
			"\tcontent?: string & tags.MaxLength< 2000 >;",
			`\tstatus?: ${pascalCase}Status;`,
			"}",
			"",
			`export type ${pascalCase}CreateResponse = ${pascalCase}Record;`,
		);
	}

	if (methods.includes("update")) {
		lines.push(
			"",
			`export interface ${pascalCase}UpdateQuery {`,
			"\tid: number & tags.Type< 'uint32' >;",
			"}",
			"",
			`export interface ${pascalCase}UpdateRequest {`,
			"\ttitle?: string & tags.MinLength< 1 > & tags.MaxLength< 120 >;",
			"\tcontent?: string & tags.MaxLength< 2000 >;",
			`\tstatus?: ${pascalCase}Status;`,
			"}",
			"",
			`export type ${pascalCase}UpdateResponse = ${pascalCase}Record;`,
		);
	}

	if (methods.includes("delete")) {
		lines.push(
			"",
			`export interface ${pascalCase}DeleteQuery {`,
			"\tid: number & tags.Type< 'uint32' >;",
			"}",
			"",
			`export interface ${pascalCase}DeleteResponse {`,
			"\tdeleted: true;",
			"\tid: number & tags.Type< 'uint32' >;",
			"}",
		);
	}

	return `${lines.join("\n")}\n`;
}

function buildRestResourceValidatorsSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCaseFromSlug(restResourceSlug);
	const importedTypes = new Set<string>();
	const validatorDeclarations: string[] = [];
	const validatorEntries: string[] = [];

	const addValidator = (
		propertyName: string,
		typeName: string,
		validateIdentifier: string,
	) => {
		importedTypes.add(typeName);
		validatorDeclarations.push(
			`const ${validateIdentifier} = typia.createValidate< ${typeName} >();`,
		);
		validatorEntries.push(
			`\t${propertyName}: ( input: unknown ) => toValidationResult< ${typeName} >( ${validateIdentifier}( input ) ),`,
		);
	};

	if (methods.includes("list")) {
		addValidator("listQuery", `${pascalCase}ListQuery`, "validateListQuery");
		addValidator("listResponse", `${pascalCase}ListResponse`, "validateListResponse");
	}
	if (methods.includes("read")) {
		addValidator("readQuery", `${pascalCase}ReadQuery`, "validateReadQuery");
		addValidator("readResponse", `${pascalCase}ReadResponse`, "validateReadResponse");
	}
	if (methods.includes("create")) {
		addValidator("createRequest", `${pascalCase}CreateRequest`, "validateCreateRequest");
		addValidator("createResponse", `${pascalCase}CreateResponse`, "validateCreateResponse");
	}
	if (methods.includes("update")) {
		addValidator("updateQuery", `${pascalCase}UpdateQuery`, "validateUpdateQuery");
		addValidator("updateRequest", `${pascalCase}UpdateRequest`, "validateUpdateRequest");
		addValidator("updateResponse", `${pascalCase}UpdateResponse`, "validateUpdateResponse");
	}
	if (methods.includes("delete")) {
		addValidator("deleteQuery", `${pascalCase}DeleteQuery`, "validateDeleteQuery");
		addValidator("deleteResponse", `${pascalCase}DeleteResponse`, "validateDeleteResponse");
	}

	return `import typia from 'typia';

import { toValidationResult } from '@wp-typia/rest';
import type {
\t${Array.from(importedTypes).sort().join(",\n\t")},
} from './api-types';

${validatorDeclarations.join("\n")}

export const apiValidators = {
${validatorEntries.join("\n")}
};
`;
}

function buildRestResourceApiSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCaseFromSlug(restResourceSlug);
	const typeImports = new Set<string>();
	const clientEndpointImports: string[] = [];
	const exportedBindings: string[] = [];
	const writeMethods = methods.filter((method) =>
		["create", "update", "delete"].includes(method),
	);

	if (methods.includes("list")) {
		typeImports.add(`${pascalCase}ListQuery`);
		clientEndpointImports.push(`list${pascalCase}ResourcesEndpoint`);
		exportedBindings.push(`export const restResourceListEndpoint = {
\t...list${pascalCase}ResourcesEndpoint,
\tbuildRequestOptions: () => ( {
\t\turl: resolveRestRouteUrl( list${pascalCase}ResourcesEndpoint.path ),
\t} ),
};

export function listResource( request: ${pascalCase}ListQuery ) {
\treturn callEndpoint( restResourceListEndpoint, request );
}`);
	}

	if (methods.includes("read")) {
		typeImports.add(`${pascalCase}ReadQuery`);
		clientEndpointImports.push(`read${pascalCase}ResourceEndpoint`);
		exportedBindings.push(`export const restResourceReadEndpoint = {
\t...read${pascalCase}ResourceEndpoint,
\tbuildRequestOptions: () => ( {
\t\turl: resolveRestRouteUrl( read${pascalCase}ResourceEndpoint.path ),
\t} ),
};

export function readResource( request: ${pascalCase}ReadQuery ) {
\treturn callEndpoint( restResourceReadEndpoint, request );
}`);
	}

	if (methods.includes("create")) {
		typeImports.add(`${pascalCase}CreateRequest`);
		clientEndpointImports.push(`create${pascalCase}ResourceEndpoint`);
		exportedBindings.push(`export const restResourceCreateEndpoint = {
\t...create${pascalCase}ResourceEndpoint,
\tbuildRequestOptions: () => {
\t\tconst nonce = resolveRestNonce();
\t\treturn {
\t\t\trequestOptions: nonce
\t\t\t\t? {
\t\t\t\t\theaders: {
\t\t\t\t\t\t'X-WP-Nonce': nonce,
\t\t\t\t\t},
\t\t\t\t}
\t\t\t\t: undefined,
\t\t\turl: resolveRestRouteUrl( create${pascalCase}ResourceEndpoint.path ),
\t\t};
\t},
};

export function createResource( request: ${pascalCase}CreateRequest ) {
\treturn callEndpoint( restResourceCreateEndpoint, request );
}`);
	}

	if (methods.includes("update")) {
		typeImports.add(`${pascalCase}UpdateQuery`);
		typeImports.add(`${pascalCase}UpdateRequest`);
		clientEndpointImports.push(`update${pascalCase}ResourceEndpoint`);
		exportedBindings.push(`export const restResourceUpdateEndpoint = {
\t...update${pascalCase}ResourceEndpoint,
\tbuildRequestOptions: () => {
\t\tconst nonce = resolveRestNonce();
\t\treturn {
\t\t\trequestOptions: nonce
\t\t\t\t? {
\t\t\t\t\theaders: {
\t\t\t\t\t\t'X-WP-Nonce': nonce,
\t\t\t\t\t},
\t\t\t\t}
\t\t\t\t: undefined,
\t\t\turl: resolveRestRouteUrl( update${pascalCase}ResourceEndpoint.path ),
\t\t};
\t},
};

export function updateResource( request: {
\tbody: ${pascalCase}UpdateRequest;
\tquery: ${pascalCase}UpdateQuery;
} ) {
\treturn callEndpoint( restResourceUpdateEndpoint, request );
}`);
	}

	if (methods.includes("delete")) {
		typeImports.add(`${pascalCase}DeleteQuery`);
		clientEndpointImports.push(`delete${pascalCase}ResourceEndpoint`);
		exportedBindings.push(`export const restResourceDeleteEndpoint = {
\t...delete${pascalCase}ResourceEndpoint,
\tbuildRequestOptions: () => {
\t\tconst nonce = resolveRestNonce();
\t\treturn {
\t\t\trequestOptions: nonce
\t\t\t\t? {
\t\t\t\t\theaders: {
\t\t\t\t\t\t'X-WP-Nonce': nonce,
\t\t\t\t\t},
\t\t\t\t}
\t\t\t\t: undefined,
\t\t\turl: resolveRestRouteUrl( delete${pascalCase}ResourceEndpoint.path ),
\t\t};
\t},
};

export function deleteResource( request: ${pascalCase}DeleteQuery ) {
\treturn callEndpoint( restResourceDeleteEndpoint, request );
}`);
	}

	return `import {
\tcallEndpoint,
\tresolveRestRouteUrl,
} from '@wp-typia/rest';

import type {
\t${Array.from(typeImports).sort().join(",\n\t")},
} from './api-types';
import {
\t${clientEndpointImports.sort().join(",\n\t")},
} from './api-client';
${writeMethods.length > 0
	? `
function resolveRestNonce( fallback?: string ): string | undefined {
\tif ( typeof fallback === 'string' && fallback.length > 0 ) {
\t\treturn fallback;
\t}

\tif ( typeof window === 'undefined' ) {
\t\treturn undefined;
\t}

\tconst wpApiSettings = (
\t\twindow as typeof window & {
\t\t\twpApiSettings?: { nonce?: string };
\t\t}
\t).wpApiSettings;

\treturn typeof wpApiSettings?.nonce === 'string' &&
\t\twpApiSettings.nonce.length > 0
\t\t? wpApiSettings.nonce
\t\t: undefined;
}
`
	: ""}
${exportedBindings.join("\n\n")}
`;
}

function buildRestResourceDataSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCaseFromSlug(restResourceSlug);
	const typeImports = new Set<string>();
	const endpointImports: string[] = [];
	const exportedBindings: string[] = [];

	if (methods.includes("list")) {
		typeImports.add(`${pascalCase}ListQuery`);
		typeImports.add(`${pascalCase}ListResponse`);
		endpointImports.push("restResourceListEndpoint");
		exportedBindings.push(`export type Use${pascalCase}ListQueryOptions<
\tSelected = ${pascalCase}ListResponse,
> = UseEndpointQueryOptions<
\t${pascalCase}ListQuery,
\t${pascalCase}ListResponse,
\tSelected
>;

export function use${pascalCase}ListQuery<
\tSelected = ${pascalCase}ListResponse,
>(
\trequest: ${pascalCase}ListQuery,
\toptions: Use${pascalCase}ListQueryOptions< Selected > = {}
) {
\treturn useEndpointQuery( restResourceListEndpoint, request, options );
}`);
	}

	if (methods.includes("read")) {
		typeImports.add(`${pascalCase}ReadQuery`);
		typeImports.add(`${pascalCase}ReadResponse`);
		endpointImports.push("restResourceReadEndpoint");
		exportedBindings.push(`export type Use${pascalCase}ReadQueryOptions<
\tSelected = ${pascalCase}ReadResponse,
> = UseEndpointQueryOptions<
\t${pascalCase}ReadQuery,
\t${pascalCase}ReadResponse,
\tSelected
>;

export function use${pascalCase}ReadQuery<
\tSelected = ${pascalCase}ReadResponse,
>(
\trequest: ${pascalCase}ReadQuery,
\toptions: Use${pascalCase}ReadQueryOptions< Selected > = {}
) {
\treturn useEndpointQuery( restResourceReadEndpoint, request, options );
}`);
	}

	if (methods.includes("create")) {
		typeImports.add(`${pascalCase}CreateRequest`);
		typeImports.add(`${pascalCase}CreateResponse`);
		endpointImports.push("restResourceCreateEndpoint");
		exportedBindings.push(`export type UseCreate${pascalCase}ResourceMutationOptions = UseEndpointMutationOptions<
\t${pascalCase}CreateRequest,
\t${pascalCase}CreateResponse,
\tunknown
>;

export function useCreate${pascalCase}ResourceMutation(
\toptions: UseCreate${pascalCase}ResourceMutationOptions = {}
) {
\treturn useEndpointMutation( restResourceCreateEndpoint, options );
}`);
	}

	if (methods.includes("update")) {
		typeImports.add(`${pascalCase}UpdateQuery`);
		typeImports.add(`${pascalCase}UpdateRequest`);
		typeImports.add(`${pascalCase}UpdateResponse`);
		endpointImports.push("restResourceUpdateEndpoint");
		exportedBindings.push(`export type UseUpdate${pascalCase}ResourceMutationOptions = UseEndpointMutationOptions<
\t{
\t\tbody: ${pascalCase}UpdateRequest;
\t\tquery: ${pascalCase}UpdateQuery;
\t},
\t${pascalCase}UpdateResponse,
\tunknown
>;

export function useUpdate${pascalCase}ResourceMutation(
\toptions: UseUpdate${pascalCase}ResourceMutationOptions = {}
) {
\treturn useEndpointMutation( restResourceUpdateEndpoint, options );
}`);
	}

	if (methods.includes("delete")) {
		typeImports.add(`${pascalCase}DeleteQuery`);
		typeImports.add(`${pascalCase}DeleteResponse`);
		endpointImports.push("restResourceDeleteEndpoint");
		exportedBindings.push(`export type UseDelete${pascalCase}ResourceMutationOptions = UseEndpointMutationOptions<
\t${pascalCase}DeleteQuery,
\t${pascalCase}DeleteResponse,
\tunknown
>;

export function useDelete${pascalCase}ResourceMutation(
\toptions: UseDelete${pascalCase}ResourceMutationOptions = {}
) {
\treturn useEndpointMutation( restResourceDeleteEndpoint, options );
}`);
	}

	return `import {
\tuseEndpointMutation,
\tuseEndpointQuery,
\ttype UseEndpointMutationOptions,
\ttype UseEndpointQueryOptions,
} from '@wp-typia/rest/react';

import type {
\t${Array.from(typeImports).sort().join(",\n\t")},
} from './api-types';
import {
\t${endpointImports.sort().join(",\n\t")},
} from './api';

${exportedBindings.join("\n\n")}
`;
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

async function ensureRestResourceBootstrapAnchors(workspace: WorkspaceProject): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const registerFunctionName = `${workspace.workspace.phpPrefix}_register_rest_resources`;
		const registerHook = `add_action( 'init', '${registerFunctionName}', 20 );`;
		const registerFunction = `

function ${registerFunctionName}() {
\tforeach ( glob( __DIR__ . '${REST_RESOURCE_SERVER_GLOB}' ) ?: array() as $rest_resource_module ) {
\t\trequire_once $rest_resource_module;
\t}
}
`;
		const insertionAnchors = [
			/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
			/\?>\s*$/u,
		];
		const hasPhpFunctionDefinition = (functionName: string): boolean =>
			new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\(`, "u").test(nextSource);
		const insertPhpSnippet = (snippet: string): void => {
			for (const anchor of insertionAnchors) {
				const candidate = nextSource.replace(anchor, (match) => `${snippet}\n${match}`);
				if (candidate !== nextSource) {
					nextSource = candidate;
					return;
				}
			}
			nextSource = `${nextSource.trimEnd()}\n${snippet}\n`;
		};
		const appendPhpSnippet = (snippet: string): void => {
			const closingTagPattern = /\?>\s*$/u;
			if (closingTagPattern.test(nextSource)) {
				nextSource = nextSource.replace(closingTagPattern, `${snippet}\n?>`);
				return;
			}
			nextSource = `${nextSource.trimEnd()}\n${snippet}\n`;
		};

		if (!hasPhpFunctionDefinition(registerFunctionName)) {
			insertPhpSnippet(registerFunction);
		} else {
			const functionRange = findPhpFunctionRange(nextSource, registerFunctionName);
			const functionSource = functionRange
				? nextSource.slice(functionRange.start, functionRange.end)
				: "";
			if (!functionSource.includes(REST_RESOURCE_SERVER_GLOB)) {
				const replacedSource = replacePhpFunctionDefinition(
					nextSource,
					registerFunctionName,
					registerFunction,
				);
				if (!replacedSource) {
					throw new Error(
						`Unable to repair ${path.basename(bootstrapPath)} for ${registerFunctionName}.`,
					);
				}
				nextSource = replacedSource;
			}
		}

		if (!nextSource.includes(registerHook)) {
			appendPhpSnippet(registerHook);
		}

		return nextSource;
	});
}

async function ensureRestResourceSyncScriptAnchors(workspace: WorkspaceProject): Promise<void> {
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");

	await patchFile(syncRestScriptPath, (source) => {
		let nextSource = source;

		if (
			!nextSource.includes("REST_RESOURCES") &&
			nextSource.includes("import { BLOCKS, type WorkspaceBlockConfig } from './block-config';")
		) {
			nextSource = nextSource.replace(
				"import { BLOCKS, type WorkspaceBlockConfig } from './block-config';",
				[
					"import {",
					"\tBLOCKS,",
					"\tREST_RESOURCES,",
					"\ttype WorkspaceBlockConfig,",
					"\ttype WorkspaceRestResourceConfig,",
					"} from './block-config';",
				].join("\n"),
			);
		}

		if (
			!nextSource.includes("function isWorkspaceRestResource(") &&
			nextSource.includes("function isRestEnabledBlock(")
		) {
			nextSource = nextSource.replace(
				"async function assertTypeArtifactsCurrent",
				[
					"function isWorkspaceRestResource(",
					"\tresource: WorkspaceRestResourceConfig",
					"): resource is WorkspaceRestResourceConfig & {",
					"\tclientFile: string;",
					"\topenApiFile: string;",
					"\trestManifest: NonNullable< WorkspaceRestResourceConfig[ 'restManifest' ] >;",
					"\ttypesFile: string;",
					"\tvalidatorsFile: string;",
					"} {",
					"\treturn (",
					"\t\ttypeof resource.clientFile === 'string' &&",
					"\t\ttypeof resource.openApiFile === 'string' &&",
					"\t\ttypeof resource.typesFile === 'string' &&",
					"\t\ttypeof resource.validatorsFile === 'string' &&",
					"\t\ttypeof resource.restManifest === 'object' &&",
					"\t\tresource.restManifest !== null",
					"\t);",
					"}",
					"",
					"async function assertTypeArtifactsCurrent",
				].join("\n"),
			);
		}

		if (
			!nextSource.includes("const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );")
		) {
			nextSource = nextSource.replace(
				"const restBlocks = BLOCKS.filter( isRestEnabledBlock );",
				[
					"const restBlocks = BLOCKS.filter( isRestEnabledBlock );",
					"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );",
				].join("\n"),
			);
		}

		if (
			!nextSource.includes("restBlocks.length === 0 && restResources.length === 0") &&
			nextSource.includes("if ( restBlocks.length === 0 ) {")
		) {
			nextSource = nextSource.replace(
				/if \( restBlocks.length === 0 \) \{[\s\S]*?\n\t\treturn;\n\t\}/u,
				[
					"if ( restBlocks.length === 0 && restResources.length === 0 ) {",
					"\t\tconsole.log(",
					"\t\t\toptions.check",
					"\t\t\t\t? 'ℹ️ No REST-enabled workspace blocks or plugin-level REST resources are registered yet. `sync-rest --check` is already clean.'",
					"\t\t\t\t: 'ℹ️ No REST-enabled workspace blocks or plugin-level REST resources are registered yet.'",
					"\t\t);",
					"\t\treturn;",
					"\t}",
				].join("\n"),
			);
		}

		if (
			!nextSource.includes("for ( const resource of restResources ) {") &&
			nextSource.includes("\n\tconsole.log(")
		) {
			nextSource = nextSource.replace(
				/\n\tconsole\.log\(\n\t\toptions\.check/u,
				[
					"",
					"\tfor ( const resource of restResources ) {",
					"\t\tconst contracts = resource.restManifest.contracts;",
					"",
					"\t\tfor ( const [ baseName, contract ] of Object.entries( contracts ) ) {",
					"\t\t\tawait syncTypeSchemas(",
					"\t\t\t\t{",
					"\t\t\t\t\tjsonSchemaFile: path.join(",
					"\t\t\t\t\t\tpath.dirname( resource.typesFile ),",
					"\t\t\t\t\t\t'api-schemas',",
					"\t\t\t\t\t\t`${ baseName }.schema.json`",
					"\t\t\t\t\t),",
					"\t\t\t\t\topenApiFile: path.join(",
					"\t\t\t\t\t\tpath.dirname( resource.typesFile ),",
					"\t\t\t\t\t\t'api-schemas',",
					"\t\t\t\t\t\t`${ baseName }.openapi.json`",
					"\t\t\t\t\t),",
					"\t\t\t\t\tsourceTypeName: contract.sourceTypeName,",
					"\t\t\t\t\ttypesFile: resource.typesFile,",
					"\t\t\t\t},",
					"\t\t\t\t{",
					"\t\t\t\t\tcheck: options.check,",
					"\t\t\t\t}",
					"\t\t\t);",
					"\t\t}",
					"",
					"\t\tawait syncRestOpenApi(",
					"\t\t\t{",
					"\t\t\t\tmanifest: resource.restManifest,",
					"\t\t\t\topenApiFile: resource.openApiFile,",
					"\t\t\t\ttypesFile: resource.typesFile,",
					"\t\t\t},",
					"\t\t\t{",
					"\t\t\t\tcheck: options.check,",
					"\t\t\t}",
					"\t\t);",
					"",
					"\t\tawait syncEndpointClient(",
					"\t\t\t{",
					"\t\t\t\tclientFile: resource.clientFile,",
					"\t\t\t\tmanifest: resource.restManifest,",
					"\t\t\t\ttypesFile: resource.typesFile,",
					"\t\t\t\tvalidatorsFile: resource.validatorsFile,",
					"\t\t\t},",
					"\t\t\t{",
					"\t\t\t\tcheck: options.check,",
					"\t\t\t}",
					"\t\t);",
					"\t}",
					"",
					"\tconsole.log(",
					"\t\toptions.check",
				].join("\n"),
			);
		}

		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date with the TypeScript types!",
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date for workspace blocks and plugin-level resources!",
		);
		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated from TypeScript types!",
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated for workspace blocks and plugin-level resources!",
		);

		return nextSource;
	});
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
	const clientFilePath = path.join(restResourceDir, "api-client.ts");
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
