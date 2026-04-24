import {
	normalizeBlockSlug,
	quoteTsString,
} from "./cli-add-shared.js";
import { buildAiFeatureEndpointManifest } from "./ai-feature-artifacts.js";
import { toTitleCase } from "./string-case.js";

export function toPascalCaseFromAiFeatureSlug(slug: string): string {
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

export function buildAiFeatureConfigEntry(
	aiFeatureSlug: string,
	namespace: string,
): string {
	const pascalCase = toPascalCaseFromAiFeatureSlug(aiFeatureSlug);
	const title = toTitleCase(aiFeatureSlug);
	const manifest = buildAiFeatureEndpointManifest({
		namespace,
		pascalCase,
		slugKebabCase: aiFeatureSlug,
		title,
	});

	return [
		"\t{",
		`\t\taiSchemaFile: ${quoteTsString(
			`src/ai-features/${aiFeatureSlug}/ai-schemas/feature-result.ai.schema.json`,
		)},`,
		`\t\tapiFile: ${quoteTsString(`src/ai-features/${aiFeatureSlug}/api.ts`)},`,
		`\t\tclientFile: ${quoteTsString(
			`src/ai-features/${aiFeatureSlug}/api-client.ts`,
		)},`,
		`\t\tdataFile: ${quoteTsString(`src/ai-features/${aiFeatureSlug}/data.ts`)},`,
		`\t\tnamespace: ${quoteTsString(namespace)},`,
		`\t\topenApiFile: ${quoteTsString(
			`src/ai-features/${aiFeatureSlug}/api.openapi.json`,
		)},`,
		`\t\tphpFile: ${quoteTsString(`inc/ai-features/${aiFeatureSlug}.php`)},`,
		"\t\trestManifest: defineEndpointManifest(",
		indentMultiline(JSON.stringify(manifest, null, "\t"), "\t\t\t"),
		"\t\t),",
		`\t\tslug: ${quoteTsString(aiFeatureSlug)},`,
		`\t\ttypesFile: ${quoteTsString(
			`src/ai-features/${aiFeatureSlug}/api-types.ts`,
		)},`,
		`\t\tvalidatorsFile: ${quoteTsString(
			`src/ai-features/${aiFeatureSlug}/api-validators.ts`,
		)},`,
		"\t},",
	].join("\n");
}

export function buildAiFeatureTypesSource(aiFeatureSlug: string): string {
	const pascalCase = toPascalCaseFromAiFeatureSlug(aiFeatureSlug);

	return `import { tags } from 'typia';

export interface ${pascalCase}AiFeatureRequest {
\tbrief: string & tags.MinLength< 1 > & tags.MaxLength< 4000 >;
\tcontext?: string & tags.MaxLength< 4000 >;
}

export interface ${pascalCase}AiFeatureResult {
\ttitle: string & tags.MinLength< 1 > & tags.MaxLength< 160 >;
\tsummary: string & tags.MinLength< 1 > & tags.MaxLength< 2000 >;
\tconfidence?: number & tags.Minimum< 0 > & tags.Maximum< 1 >;
}

export interface ${pascalCase}AiFeatureTokenUsage {
\tcompletionTokens: number & tags.Type< 'uint32' >;
\tpromptTokens: number & tags.Type< 'uint32' >;
\ttotalTokens: number & tags.Type< 'uint32' >;
\tthoughtTokens?: number & tags.Type< 'uint32' >;
}

export interface ${pascalCase}AiFeatureTelemetry {
\tmodelId: string & tags.MinLength< 1 > & tags.MaxLength< 160 >;
\tmodelName: string & tags.MinLength< 1 > & tags.MaxLength< 160 >;
\tproviderId: string & tags.MinLength< 1 > & tags.MaxLength< 80 >;
\tproviderName: string & tags.MinLength< 1 > & tags.MaxLength< 160 >;
\tproviderType: 'client' | 'cloud' | 'server';
\tresultId: string & tags.MinLength< 1 > & tags.MaxLength< 160 >;
\ttokenUsage: ${pascalCase}AiFeatureTokenUsage;
}

export interface ${pascalCase}AiFeatureResponse {
\tresult: ${pascalCase}AiFeatureResult;
\ttelemetry: ${pascalCase}AiFeatureTelemetry;
}
`;
}

export function buildAiFeatureValidatorsSource(
	aiFeatureSlug: string,
): string {
	const pascalCase = toPascalCaseFromAiFeatureSlug(aiFeatureSlug);

	return `import typia from 'typia';

import { toValidationResult } from '@wp-typia/rest';
import type {
\t${pascalCase}AiFeatureRequest,
\t${pascalCase}AiFeatureResponse,
\t${pascalCase}AiFeatureResult,
} from './api-types';

const validateFeatureRequest = typia.createValidate< ${pascalCase}AiFeatureRequest >();
const validateFeatureResult = typia.createValidate< ${pascalCase}AiFeatureResult >();
const validateFeatureResponse = typia.createValidate< ${pascalCase}AiFeatureResponse >();

export const apiValidators = {
\tfeatureRequest: ( input: unknown ) =>
\t\ttoValidationResult< ${pascalCase}AiFeatureRequest >(
\t\t\tvalidateFeatureRequest( input )
\t\t),
\tfeatureResult: ( input: unknown ) =>
\t\ttoValidationResult< ${pascalCase}AiFeatureResult >(
\t\t\tvalidateFeatureResult( input )
\t\t),
\tfeatureResponse: ( input: unknown ) =>
\t\ttoValidationResult< ${pascalCase}AiFeatureResponse >(
\t\t\tvalidateFeatureResponse( input )
\t\t),
};
`;
}

export function buildAiFeatureApiSource(aiFeatureSlug: string): string {
	const pascalCase = toPascalCaseFromAiFeatureSlug(aiFeatureSlug);

	return `import {
\tcallEndpoint,
\tresolveRestRouteUrl,
} from '@wp-typia/rest';

import type {
\t${pascalCase}AiFeatureRequest,
} from './api-types';
import {
\trun${pascalCase}AiFeatureEndpoint,
} from './api-client';

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

export const aiFeatureRunEndpoint = {
\t...run${pascalCase}AiFeatureEndpoint,
\tbuildRequestOptions: () => {
\t\tconst nonce = resolveRestNonce();
\t\treturn {
\t\t\theaders: nonce
\t\t\t\t? {
\t\t\t\t\t'X-WP-Nonce': nonce,
\t\t\t\t}
\t\t\t\t: undefined,
\t\t\turl: resolveRestRouteUrl( run${pascalCase}AiFeatureEndpoint.path ),
\t\t};
\t},
};

export function runAiFeature( request: ${pascalCase}AiFeatureRequest ) {
\treturn callEndpoint( aiFeatureRunEndpoint, request );
}
`;
}

export function buildAiFeatureDataSource(aiFeatureSlug: string): string {
	const pascalCase = toPascalCaseFromAiFeatureSlug(aiFeatureSlug);

	return `import {
\tuseEndpointMutation,
\ttype UseEndpointMutationOptions,
} from '@wp-typia/rest/react';

import type {
\t${pascalCase}AiFeatureRequest,
\t${pascalCase}AiFeatureResponse,
} from './api-types';
import {
\taiFeatureRunEndpoint,
} from './api';

export type UseRun${pascalCase}AiFeatureMutationOptions =
\tUseEndpointMutationOptions<
\t\t${pascalCase}AiFeatureRequest,
\t\t${pascalCase}AiFeatureResponse,
\t\tunknown
\t>;

export function useRun${pascalCase}AiFeatureMutation(
\toptions: UseRun${pascalCase}AiFeatureMutationOptions = {}
) {
\treturn useEndpointMutation( aiFeatureRunEndpoint, options );
}
`;
}

export function buildAiFeatureSyncScriptSource(): string {
	return `/* eslint-disable no-console */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { projectWordPressAiSchema } from '@wp-typia/project-tools/ai-artifacts';

import {
\tAI_FEATURES,
\ttype WorkspaceAiFeatureConfig,
} from './block-config';

function parseCliOptions( argv: string[] ) {
\tconst options = {
\t\tcheck: false,
\t};

\tfor ( const argument of argv ) {
\t\tif ( argument === '--check' ) {
\t\t\toptions.check = true;
\t\t\tcontinue;
\t\t}

\t\tthrow new Error( \`Unknown sync-ai flag: \${ argument }\` );
\t}

\treturn options;
}

function isWorkspaceAiFeature(
\tfeature: WorkspaceAiFeatureConfig
): feature is WorkspaceAiFeatureConfig & {
\taiSchemaFile: string;
\ttypesFile: string;
} {
\treturn (
\t\ttypeof feature.aiSchemaFile === 'string' &&
\t\ttypeof feature.typesFile === 'string'
\t);
}

function normalizeGeneratedArtifactContent( content: string ) {
\treturn content.replace( /\\r\\n?/g, '\\n' );
}

async function reconcileGeneratedArtifact( options: {
\tcheck: boolean;
\tcontent: string;
\tfilePath: string;
\tlabel: string;
} ) {
\tif ( ! options.check ) {
\t\tawait mkdir( path.dirname( options.filePath ), {
\t\t\trecursive: true,
\t\t} );
\t\tawait writeFile( options.filePath, options.content, 'utf8' );
\t\treturn;
\t}

\tconst current = normalizeGeneratedArtifactContent(
\t\tawait readFile( options.filePath, 'utf8' )
\t);
\tconst expected = normalizeGeneratedArtifactContent( options.content );
\tif ( current !== expected ) {
\t\tthrow new Error(
\t\t\t\`Generated AI feature artifact is stale: \${ options.label } (\${ options.filePath }).\`
\t\t);
\t}
}

async function loadJsonDocument( filePath: string ) {
\tconst decoded = JSON.parse( await readFile( filePath, 'utf8' ) ) as unknown;
\tif ( ! decoded || typeof decoded !== 'object' || Array.isArray( decoded ) ) {
\t\tthrow new Error( \`Expected \${ filePath } to decode to a JSON object.\` );
\t}

\treturn decoded as Parameters< typeof projectWordPressAiSchema >[ 0 ];
}

async function main() {
\tconst options = parseCliOptions( process.argv.slice( 2 ) );
\tconst aiFeatures = AI_FEATURES.filter( isWorkspaceAiFeature );

\tif ( aiFeatures.length === 0 ) {
\t\tconsole.log(
\t\t\toptions.check
\t\t\t\t? 'ℹ️ No workspace AI features are registered yet. \`sync-ai --check\` is already clean.'
\t\t\t\t: 'ℹ️ No workspace AI features are registered yet.'
\t\t);
\t\treturn;
\t}

\tfor ( const feature of aiFeatures ) {
\t\tconst sourceSchemaPath = path.join(
\t\t\tpath.dirname( feature.typesFile ),
\t\t\t'api-schemas',
\t\t\t'feature-result.schema.json'
\t\t);
\t\tconst sourceSchema = await loadJsonDocument( sourceSchemaPath );
\t\tconst aiSchema = projectWordPressAiSchema( sourceSchema );
\t\tawait reconcileGeneratedArtifact( {
\t\t\tcheck: options.check,
\t\t\tcontent: \`\${ JSON.stringify( aiSchema, null, 2 ) }\\n\`,
\t\t\tfilePath: feature.aiSchemaFile,
\t\t\tlabel: feature.slug,
\t\t} );
\t}

\tconsole.log(
\t\toptions.check
\t\t\t? '✅ AI feature structured-output schemas are already synchronized.'
\t\t\t: '✅ AI feature structured-output schemas were synchronized.'
\t);
}

main().catch( ( error ) => {
\tconsole.error( '❌ AI feature sync failed:', error );
\tprocess.exit( 1 );
} );
`;
}
