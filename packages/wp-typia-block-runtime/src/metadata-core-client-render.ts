import * as path from 'node:path';

import type {
	ArtifactSyncExecutionOptions,
	SyncEndpointClientOptions,
	SyncEndpointClientResult,
} from './metadata-core.js';
import { reconcileGeneratedArtifacts } from './metadata-core-artifacts.js';
import {
	assertValidClientIdentifier,
	normalizeSyncEndpointClientOptions,
	reserveUniqueClientTypeIdentifier,
	resolveEndpointClientContract,
	toJavaScriptStringLiteral,
	toModuleImportPath,
	toValidatorAccessExpression,
} from './metadata-core-endpoint-client.js';
import { analyzeSourceTypes } from './metadata-parser.js';
import { normalizeEndpointAuthDefinition } from './schema-core.js';

const WORDPRESS_NAMED_CAPTURE_PATTERN =
	/\(\?P<([A-Za-z_][A-Za-z0-9_]*)>[^)]*\)/gu;

function escapeTemplateLiteralText(value: string): string {
	return value
		.replace(/\\/gu, '\\\\')
		.replace(/`/gu, '\\`')
		.replace(/\$\{/gu, '\\${');
}

function getEndpointPathParameterNames(endpointPath: string): string[] {
	const names: string[] = [];
	WORDPRESS_NAMED_CAPTURE_PATTERN.lastIndex = 0;

	for (const match of endpointPath.matchAll(WORDPRESS_NAMED_CAPTURE_PATTERN)) {
		const name = match[1];
		if (name && !names.includes(name)) {
			names.push(name);
		}
	}

	return names;
}

function buildEndpointPathTemplate(
	endpointPath: string,
	pathParameterNames: readonly string[],
): string {
	const parameterIndexes = new Map(
		pathParameterNames.map((name, index) => [name, index] as const),
	);
	const fragments: string[] = [];
	let nextIndex = 0;
	WORDPRESS_NAMED_CAPTURE_PATTERN.lastIndex = 0;

	for (const match of endpointPath.matchAll(WORDPRESS_NAMED_CAPTURE_PATTERN)) {
		const matchIndex = match.index ?? 0;
		const name = match[1];
		const parameterIndex = name ? parameterIndexes.get(name) : undefined;
		fragments.push(escapeTemplateLiteralText(endpointPath.slice(nextIndex, matchIndex)));
		if (parameterIndex !== undefined) {
			fragments.push(
				`\${encodeURIComponent( String( pathParam${parameterIndex} ) )}`,
			);
		}
		nextIndex = matchIndex + match[0].length;
	}

	fragments.push(escapeTemplateLiteralText(endpointPath.slice(nextIndex)));

	return `\`${fragments.join('')}\``;
}

function buildEndpointPathRequestOptionLines(options: {
	endpointPath: string;
	requestLocationExpression: string | null;
}): string[] {
	const pathParameterNames = getEndpointPathParameterNames(options.endpointPath);
	if (pathParameterNames.length === 0) {
		return [];
	}

	const pathParamSource =
		options.requestLocationExpression === "'query-and-body'"
			? 'request.query'
			: 'request';
	return [
		`\tbuildRequestOptions: (request) => {`,
		`\t\tconst pathParams = ${pathParamSource} as unknown as Record<string, unknown>;`,
		...pathParameterNames.flatMap((name, index) => [
			`\t\tconst pathParam${index} = pathParams[${toJavaScriptStringLiteral(name)}];`,
			`\t\tif (pathParam${index} === undefined || pathParam${index} === null || pathParam${index} === '') {`,
			`\t\t\tthrow new Error(${toJavaScriptStringLiteral(
				`Missing path parameter "${name}" for endpoint path "${options.endpointPath}".`,
			)});`,
			`\t\t}`,
		]),
		`\t\treturn {`,
		`\t\t\tpath: ${buildEndpointPathTemplate(
			options.endpointPath,
			pathParameterNames,
		)},`,
		`\t\t};`,
		`\t},`,
	];
}

export async function syncEndpointClientModule(
	options: SyncEndpointClientOptions,
	executionOptions: ArtifactSyncExecutionOptions = {},
): Promise<SyncEndpointClientResult> {
	const { clientPath, manifest, projectRoot, typesFile, validatorsFile } =
		normalizeSyncEndpointClientOptions(options);
	analyzeSourceTypes(
		{ projectRoot, typesFile },
		[...new Set(Object.values(manifest.contracts).map((contract) => contract.sourceTypeName))],
	);
	const operationIds = new Set<string>();
	const importedTypeNames = new Set<string>();
	const endpointLines: string[] = [];
	const inlineHelpers = new Set<string>();
	const validatorPropertyNames = new Map<string, string>();
	const hasCombinedRequestEndpoints = manifest.endpoints.some(
		(endpoint) => Boolean(endpoint.bodyContract && endpoint.queryContract),
	);
	const occupiedIdentifiers = new Set([
		'apiValidators',
		'callEndpoint',
		'createEndpoint',
		...(manifest.endpoints.some(
			(endpoint) => !endpoint.bodyContract && !endpoint.queryContract,
		)
			? ['validateNoRequest']
			: []),
		...(hasCombinedRequestEndpoints ? ['validateCombinedRequest'] : []),
	]);

	for (const endpoint of manifest.endpoints) {
		const normalizedAuth = normalizeEndpointAuthDefinition(endpoint);
		const endpointConstantName = `${endpoint.operationId}Endpoint`;
		assertValidClientIdentifier(endpoint.operationId, 'operationId');
		assertValidClientIdentifier(endpointConstantName, 'endpoint constant');
		if (operationIds.has(endpoint.operationId)) {
			throw new Error(
				`Duplicate endpoint operationId "${endpoint.operationId}" detected while generating the endpoint client.`,
			);
		}
		for (const identifier of [endpoint.operationId, endpointConstantName]) {
			if (occupiedIdentifiers.has(identifier)) {
				throw new Error(
					`Generated endpoint client identifier "${identifier}" collides with another emitted symbol.`,
				);
			}
		}
		operationIds.add(endpoint.operationId);
		occupiedIdentifiers.add(endpoint.operationId);
		occupiedIdentifiers.add(endpointConstantName);

		const queryContractKey = endpoint.queryContract ?? null;
		const bodyContractKey = endpoint.bodyContract ?? null;
		const hasRequest = Boolean(queryContractKey || bodyContractKey);
		const responseContract = resolveEndpointClientContract(
			manifest,
			endpoint.responseContract,
			endpoint.operationId,
			'responseContract',
		);
		importedTypeNames.add(responseContract.sourceTypeName);

		let requestTypeName = 'undefined';
		let requestValidatorExpression = 'validateNoRequest';
		let requestLocationExpression: string | null = null;
		const queryContract = queryContractKey
			? resolveEndpointClientContract(
					manifest,
					queryContractKey,
					endpoint.operationId,
					'queryContract',
				)
			: null;
		const bodyContract = bodyContractKey
			? resolveEndpointClientContract(
					manifest,
					bodyContractKey,
					endpoint.operationId,
					'bodyContract',
				)
			: null;

		if (queryContract && bodyContract) {
			const queryValidatorExpression = toValidatorAccessExpression(
				queryContractKey!,
				validatorPropertyNames,
			);
			const bodyValidatorExpression = toValidatorAccessExpression(
				bodyContractKey!,
				validatorPropertyNames,
			);
			requestTypeName = `{ query: ${queryContract.sourceTypeName}; body: ${bodyContract.sourceTypeName} }`;
			requestValidatorExpression = `(input) => validateCombinedRequest( input, ${queryValidatorExpression}, ${bodyValidatorExpression} )`;
			requestLocationExpression = "'query-and-body'";
			importedTypeNames.add(queryContract.sourceTypeName);
			importedTypeNames.add(bodyContract.sourceTypeName);
			inlineHelpers.add('validateCombinedRequest');
		} else if (queryContract) {
			requestTypeName = queryContract.sourceTypeName;
			requestValidatorExpression = toValidatorAccessExpression(
				queryContractKey!,
				validatorPropertyNames,
			);
			requestLocationExpression = "'query'";
			importedTypeNames.add(queryContract.sourceTypeName);
		} else if (bodyContract) {
			requestTypeName = bodyContract.sourceTypeName;
			requestValidatorExpression = toValidatorAccessExpression(
				bodyContractKey!,
				validatorPropertyNames,
			);
			requestLocationExpression = "'body'";
			importedTypeNames.add(bodyContract.sourceTypeName);
		} else {
			inlineHelpers.add('validateNoRequest');
		}

		const buildRequestOptionsLines = buildEndpointPathRequestOptionLines({
			endpointPath: endpoint.path,
			requestLocationExpression,
		});
		const returnCallExpression = hasRequest
			? `callEndpoint( ${endpoint.operationId}Endpoint, request, options )`
			: `callEndpoint( ${endpoint.operationId}Endpoint, undefined, options )`;
		const returnCallLines =
			returnCallExpression.length <= 68
				? [`\treturn ${returnCallExpression};`]
				: [
						`\treturn callEndpoint(`,
						`\t\t${endpoint.operationId}Endpoint,`,
						`\t\t${hasRequest ? 'request' : 'undefined'},`,
						`\t\toptions`,
						`\t);`,
					];

		endpointLines.push(
			[
				`export const ${endpointConstantName} = createEndpoint<`,
				`\t${requestTypeName},`,
				`\t${responseContract.sourceTypeName}`,
				`>( {`,
				`\tauthIntent: ${toJavaScriptStringLiteral(normalizedAuth.auth)},`,
				...(normalizedAuth.authMode
					? [`\tauthMode: ${toJavaScriptStringLiteral(normalizedAuth.authMode)},`]
					: []),
				`\tmethod: ${toJavaScriptStringLiteral(endpoint.method)},`,
				`\toperationId: ${toJavaScriptStringLiteral(endpoint.operationId)},`,
				`\tpath: ${toJavaScriptStringLiteral(endpoint.path)},`,
				...(requestLocationExpression
					? [`\trequestLocation: ${requestLocationExpression},`]
					: []),
				...buildRequestOptionsLines,
				`\tvalidateRequest: ${requestValidatorExpression},`,
				`\tvalidateResponse: ${toValidatorAccessExpression(
					endpoint.responseContract,
					validatorPropertyNames,
				)},`,
				`} );`,
				'',
				`export function ${endpoint.operationId}(`,
				...(hasRequest ? [`\trequest: ${requestTypeName},`] : []),
				`\toptions: EndpointCallOptions`,
				`) {`,
				...returnCallLines,
				`}`,
			].join('\n'),
		);
	}

	const sortedTypeNames = [...importedTypeNames].sort();
	const helperTypeNames = new Set(sortedTypeNames);
	const combinedValidationErrorTypeName = inlineHelpers.has('validateCombinedRequest')
		? reserveUniqueClientTypeIdentifier('PortableValidationError', helperTypeNames)
		: null;
	const combinedValidationResultTypeName = inlineHelpers.has('validateCombinedRequest')
		? reserveUniqueClientTypeIdentifier('PortableValidationResult', helperTypeNames)
		: null;
	const lines = [
		`import {`,
		`\tcallEndpoint,`,
		`\tcreateEndpoint,`,
		`\ttype EndpointCallOptions,`,
		...(inlineHelpers.has('validateCombinedRequest')
			? [
					`\ttype ValidationError as ${combinedValidationErrorTypeName},`,
					`\ttype ValidationResult as ${combinedValidationResultTypeName},`,
				]
			: []),
		`} from '@wp-typia/api-client';`,
		...(sortedTypeNames.length === 1
			? [
					`import type { ${sortedTypeNames[0]} } from ${toJavaScriptStringLiteral(
						toModuleImportPath(clientPath, path.resolve(projectRoot, typesFile)),
					)};`,
				]
			: [
					`import type {`,
					...sortedTypeNames.map((typeName) => `\t${typeName},`),
					`} from ${toJavaScriptStringLiteral(
						toModuleImportPath(clientPath, path.resolve(projectRoot, typesFile)),
					)};`,
				]),
		`import { apiValidators } from ${toJavaScriptStringLiteral(
			toModuleImportPath(clientPath, path.resolve(projectRoot, validatorsFile)),
		)};`,
		'',
		...(inlineHelpers.has('validateNoRequest')
			? [
					`function validateNoRequest(input: unknown) {`,
					`\tif (input !== undefined) {`,
					`\t\treturn {`,
					`\t\t\tdata: undefined,`,
					`\t\t\terrors: [`,
					`\t\t\t\t{`,
					`\t\t\t\t\texpected: 'undefined',`,
					`\t\t\t\t\tpath: '(root)',`,
					`\t\t\t\t\tvalue: input,`,
					`\t\t\t\t},`,
					`\t\t\t],`,
					`\t\t\tisValid: false,`,
					`\t\t};`,
					`\t}`,
					'',
					`\treturn {`,
					`\t\tdata: undefined,`,
					`\t\terrors: [],`,
					`\t\tisValid: true,`,
					`\t};`,
					`}`,
					'',
				]
			: []),
		...(inlineHelpers.has('validateCombinedRequest')
			? [
					`function validateCombinedRequest<TQuery, TBody>(`,
					`\tinput: unknown,`,
					`\tvalidateQuery: (input: unknown) => ${combinedValidationResultTypeName}<TQuery>,`,
					`\tvalidateBody: (input: unknown) => ${combinedValidationResultTypeName}<TBody>,`,
					`): ${combinedValidationResultTypeName}<{ query: TQuery; body: TBody }> {`,
					`\tif ( input === null || typeof input !== 'object' || Array.isArray( input ) ) {`,
					`\t\treturn {`,
					`\t\t\tdata: undefined,`,
					`\t\t\terrors: [`,
					`\t\t\t\t{`,
					`\t\t\t\t\texpected: '{ query, body }',`,
					`\t\t\t\t\tpath: '(root)',`,
					`\t\t\t\t\tvalue: input,`,
					`\t\t\t\t},`,
					`\t\t\t],`,
					`\t\t\tisValid: false,`,
					`\t\t};`,
					`\t}`,
					``,
					`\tconst request = input as { query?: unknown; body?: unknown };`,
					`\tif ( !Object.prototype.hasOwnProperty.call( request, 'query' ) || !Object.prototype.hasOwnProperty.call( request, 'body' ) ) {`,
					`\t\treturn {`,
					`\t\t\tdata: undefined,`,
					`\t\t\terrors: [`,
					`\t\t\t\t{`,
					`\t\t\t\t\texpected: '{ query, body }',`,
					`\t\t\t\t\tpath: '(root)',`,
					`\t\t\t\t\tvalue: input,`,
					`\t\t\t\t},`,
					`\t\t\t],`,
					`\t\t\tisValid: false,`,
					`\t\t};`,
					`\t}`,
					``,
					`\tconst prefixPath = (prefix: '$.query' | '$.body', path: string): string => {`,
					`\t\tif ( path === '(root)' ) {`,
					`\t\t\treturn prefix;`,
					`\t\t}`,
					``,
					`\t\treturn path.startsWith( '$' ) ? \`\${prefix}\${path.slice( 1 )}\` : \`\${prefix}.\${path}\`;`,
					`\t};`,
					``,
					`\tconst queryValidation = validateQuery( request.query );`,
					`\tconst bodyValidation = validateBody( request.body );`,
					`\tconst errors: ${combinedValidationErrorTypeName}[] = [`,
					`\t\t...queryValidation.errors.map( ( error ) => ( {`,
					`\t\t\t...error,`,
					`\t\t\tpath: prefixPath( '$.query', error.path ),`,
					`\t\t} ) ),`,
					`\t\t...bodyValidation.errors.map( ( error ) => ( {`,
					`\t\t\t...error,`,
					`\t\t\tpath: prefixPath( '$.body', error.path ),`,
					`\t\t} ) ),`,
					`\t];`,
					``,
					`\tif ( !queryValidation.isValid || !bodyValidation.isValid ) {`,
					`\t\treturn {`,
					`\t\t\tdata: undefined,`,
					`\t\t\terrors,`,
					`\t\t\tisValid: false,`,
					`\t\t};`,
					`\t}`,
					``,
					`\treturn {`,
					`\t\tdata: {`,
					`\t\t\tbody: bodyValidation.data ?? ( request.body as TBody ),`,
					`\t\t\tquery: queryValidation.data ?? ( request.query as TQuery ),`,
					`\t\t},`,
					`\t\terrors: [],`,
					`\t\tisValid: true,`,
					`\t};`,
					`}`,
					'',
				]
			: []),
		...endpointLines.flatMap((entry) => [entry, '']),
	];

	reconcileGeneratedArtifacts(
		[
			{
				content: `${lines.join('\n').trimEnd()}\n`,
				path: clientPath,
			},
		],
		executionOptions,
	);

	return {
		clientPath,
		endpointCount: manifest.endpoints.length,
		operationIds: [...operationIds],
	};
}
