import {
	quoteTsString,
	type ManualRestContractAuthId,
	type ManualRestContractHttpMethodId,
	type RestResourceMethodId,
} from "./cli-add-shared.js";
import {
	buildManualRestContractEndpointManifest,
	buildRestResourceEndpointManifest,
} from "./rest-resource-artifacts.js";
import { toPascalCase, toTitleCase } from "./string-case.js";

function indentMultiline(source: string, prefix: string): string {
	return source
		.split("\n")
		.map((line) => `${prefix}${line}`)
		.join("\n");
}

export function buildRestResourceConfigEntry(
	restResourceSlug: string,
	namespace: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCase(restResourceSlug);
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

/**
 * Build the `REST_RESOURCES` config entry appended for a manual REST contract.
 *
 * @param options Manual contract file, route, type, and auth metadata.
 * @param options.auth Auth intent stored in the endpoint manifest.
 * @param options.bodyTypeName Optional exported body type name.
 * @param options.method Uppercase HTTP method for the external route.
 * @param options.namespace REST namespace such as `vendor/v1`.
 * @param options.pathPattern Route pattern relative to the namespace.
 * @param options.queryTypeName Exported query type name.
 * @param options.responseTypeName Exported response type name.
 * @param options.restResourceSlug Normalized workspace REST contract slug.
 * @returns A TypeScript object literal string for `scripts/block-config.ts`.
 */
export function buildManualRestContractConfigEntry(options: {
	auth: ManualRestContractAuthId;
	bodyTypeName?: string;
	method: ManualRestContractHttpMethodId;
	namespace: string;
	pathPattern: string;
	queryTypeName: string;
	responseTypeName: string;
	restResourceSlug: string;
}): string {
	const pascalCase = toPascalCase(options.restResourceSlug);
	const title = toTitleCase(options.restResourceSlug);
	const manifest = buildManualRestContractEndpointManifest({
		auth: options.auth,
		...(options.bodyTypeName ? { bodyTypeName: options.bodyTypeName } : {}),
		method: options.method,
		namespace: options.namespace,
		pascalCase,
		pathPattern: options.pathPattern,
		queryTypeName: options.queryTypeName,
		responseTypeName: options.responseTypeName,
		slugKebabCase: options.restResourceSlug,
		title,
	});

	return [
		"\t{",
		`\t\tapiFile: ${quoteTsString(`src/rest/${options.restResourceSlug}/api.ts`)},`,
		`\t\tauth: ${quoteTsString(options.auth)},`,
		...(options.bodyTypeName
			? [`\t\tbodyTypeName: ${quoteTsString(options.bodyTypeName)},`]
			: []),
		`\t\tclientFile: ${quoteTsString(`src/rest/${options.restResourceSlug}/api-client.ts`)},`,
		`\t\tmethod: ${quoteTsString(options.method)},`,
		"\t\tmethods: [],",
		"\t\tmode: 'manual',",
		`\t\tnamespace: ${quoteTsString(options.namespace)},`,
		`\t\topenApiFile: ${quoteTsString(`src/rest/${options.restResourceSlug}/api.openapi.json`)},`,
		`\t\tpathPattern: ${quoteTsString(options.pathPattern)},`,
		`\t\tqueryTypeName: ${quoteTsString(options.queryTypeName)},`,
		"\t\trestManifest: defineEndpointManifest(",
		indentMultiline(JSON.stringify(manifest, null, "\t"), "\t\t\t"),
		"\t\t),",
		`\t\tresponseTypeName: ${quoteTsString(options.responseTypeName)},`,
		`\t\tslug: ${quoteTsString(options.restResourceSlug)},`,
		`\t\ttypesFile: ${quoteTsString(`src/rest/${options.restResourceSlug}/api-types.ts`)},`,
		`\t\tvalidatorsFile: ${quoteTsString(`src/rest/${options.restResourceSlug}/api-validators.ts`)},`,
		"\t},",
	].join("\n");
}

/**
 * Build the editable TypeScript type source for a manual REST contract.
 *
 * @param options Manual contract type naming metadata.
 * @param options.bodyTypeName Optional exported body type name.
 * @param options.queryTypeName Exported query type name.
 * @param options.responseTypeName Exported response type name.
 * @param options.restResourceSlug Normalized workspace REST contract slug.
 * @returns TypeScript source for `api-types.ts`.
 */
export function buildManualRestContractTypesSource(options: {
	bodyTypeName?: string;
	queryTypeName: string;
	responseTypeName: string;
	restResourceSlug: string;
}): string {
	const title = toTitleCase(options.restResourceSlug);
	const lines = [
		"import { tags } from 'typia';",
		"",
		`export interface ${options.queryTypeName} {`,
		"\tid?: string & tags.MinLength< 1 >;",
		"\tpreview?: boolean;",
		"}",
	];

	if (options.bodyTypeName) {
		lines.push(
			"",
			`export interface ${options.bodyTypeName} {`,
			"\tpayload: string & tags.MinLength< 1 >;",
			"\tcomment?: string & tags.MaxLength< 500 >;",
			"}",
		);
	}

	lines.push(
		"",
		`export interface ${options.responseTypeName} {`,
		"\tid: string & tags.MinLength< 1 >;",
		"\tstatus: 'ok' | 'error';",
		"\tmessage?: string;",
		"\tupdatedAt?: string;",
		"}",
		"",
		`// ${title} is a manual REST contract: edit these types to match the external route owner.`,
	);

	return `${lines.join("\n")}\n`;
}

/**
 * Build Typia validator source for a manual REST contract.
 *
 * @param options Manual contract type names to validate.
 * @param options.bodyTypeName Optional exported body type name.
 * @param options.queryTypeName Exported query type name.
 * @param options.responseTypeName Exported response type name.
 * @returns TypeScript source for `api-validators.ts`.
 */
export function buildManualRestContractValidatorsSource(options: {
	bodyTypeName?: string;
	queryTypeName: string;
	responseTypeName: string;
}): string {
	const importedTypes = [
		options.queryTypeName,
		...(options.bodyTypeName ? [options.bodyTypeName] : []),
		options.responseTypeName,
	].sort();
	const validatorDeclarations = [
		`const validateQuery = typia.createValidate< ${options.queryTypeName} >();`,
		...(options.bodyTypeName
			? [`const validateRequest = typia.createValidate< ${options.bodyTypeName} >();`]
			: []),
		`const validateResponse = typia.createValidate< ${options.responseTypeName} >();`,
	];
	const validatorEntries = [
		`\tquery: ( input: unknown ) => toValidationResult< ${options.queryTypeName} >( validateQuery( input ) ),`,
		...(options.bodyTypeName
			? [
					`\trequest: ( input: unknown ) => toValidationResult< ${options.bodyTypeName} >( validateRequest( input ) ),`,
				]
			: []),
		`\tresponse: ( input: unknown ) => toValidationResult< ${options.responseTypeName} >( validateResponse( input ) ),`,
	];

	return `import typia from 'typia';

import { toValidationResult } from '@wp-typia/rest';
import type {
\t${importedTypes.join(",\n\t")},
} from './api-types';

${validatorDeclarations.join("\n")}

export const apiValidators = {
${validatorEntries.join("\n")}
};
`;
}

/**
 * Build the public API shim for a manual REST contract.
 *
 * @returns TypeScript source that re-exports the generated endpoint client.
 */
export function buildManualRestContractApiSource(): string {
	return `export * from './api-client';
`;
}

export function buildRestResourceTypesSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCase(restResourceSlug);
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

export function buildRestResourceValidatorsSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCase(restResourceSlug);
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

export function buildRestResourceApiSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCase(restResourceSlug);
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
\t\t\theaders: nonce
\t\t\t\t? {
\t\t\t\t\t'X-WP-Nonce': nonce,
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
\t\t\theaders: nonce
\t\t\t\t? {
\t\t\t\t\t'X-WP-Nonce': nonce,
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
\t\t\theaders: nonce
\t\t\t\t? {
\t\t\t\t\t'X-WP-Nonce': nonce,
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

	const resolveRestNonceSource =
		writeMethods.length > 0
			? `function resolveRestNonce( fallback?: string ): string | undefined {
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
			: "";

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
${resolveRestNonceSource}
${exportedBindings.join("\n\n")}
`;
}

export function buildRestResourceDataSource(
	restResourceSlug: string,
	methods: RestResourceMethodId[],
): string {
	const pascalCase = toPascalCase(restResourceSlug);
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
