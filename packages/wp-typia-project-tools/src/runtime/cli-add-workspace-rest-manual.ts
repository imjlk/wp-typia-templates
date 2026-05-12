import { promises as fsp } from "node:fs";
import path from "node:path";

import { ensureBlockConfigCanAddRestManifests } from "./cli-add-block-legacy-validator.js";
import {
	assertValidManualRestContractAuth,
	assertValidManualRestContractHttpMethod,
	assertValidTypeScriptIdentifier,
	resolveManualRestContractPathPattern,
	rollbackWorkspaceMutation,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import { ensureRestResourceSyncScriptAnchors } from "./cli-add-workspace-rest-anchors.js";
import {
	buildManualRestContractApiSource,
	buildManualRestContractConfigEntry,
	buildManualRestContractTypesSource,
	buildManualRestContractValidatorsSource,
} from "./cli-add-workspace-rest-source-emitters.js";
import {
	type ManualRestContractScaffoldOptions,
	type RunAddRestResourceCommandResult,
} from "./cli-add-workspace-rest-types.js";
import { syncManualRestContractArtifacts } from "./rest-resource-artifacts.js";
import { toPascalCase, toTitleCase } from "./string-case.js";
import { appendWorkspaceInventoryEntries } from "./workspace-inventory.js";

const MANUAL_REST_REQUEST_BODY_FIELD_NAMES = new Set(["payload", "comment"]);
const MANUAL_REST_RESPONSE_FIELD_NAMES = new Set([
	"id",
	"status",
	"message",
	"updatedAt",
]);

/**
 * Scaffold a type-only external REST contract for workspace consumers.
 *
 * @param options Resolved workspace and raw manual-mode command options.
 * @returns Resolved scaffold metadata for the manual REST contract.
 */
export async function scaffoldManualRestContract({
	auth,
	bodyTypeName,
	controllerClass,
	controllerExtends,
	method,
	namespace,
	pathPattern,
	permissionCallback,
	queryTypeName,
	responseTypeName,
	restResourceSlug,
	routePattern,
	secretFieldName,
	secretStateFieldName,
	workspace,
}: ManualRestContractScaffoldOptions): Promise<RunAddRestResourceCommandResult> {
	if (controllerClass || controllerExtends || permissionCallback || routePattern) {
		throw new Error(
			"Manual REST contracts do not generate PHP route glue. Use generated rest-resource mode for --route-pattern, --permission-callback, --controller-class, or --controller-extends.",
		);
	}

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");
	const restResourceDir = path.join(workspace.projectDir, "src", "rest", restResourceSlug);
	const typesFilePath = path.join(restResourceDir, "api-types.ts");
	const validatorsFilePath = path.join(restResourceDir, "api-validators.ts");
	const apiFilePath = path.join(restResourceDir, "api.ts");
	const pascalCase = toPascalCase(restResourceSlug);
	const resolvedAuth = assertValidManualRestContractAuth(auth);
	const resolvedMethod = assertValidManualRestContractHttpMethod(method);
	const resolvedPathPattern = resolveManualRestContractPathPattern(
		restResourceSlug,
		pathPattern,
	);
	const resolvedQueryTypeName = assertValidTypeScriptIdentifier(
		"Manual REST contract query type",
		queryTypeName ?? `${pascalCase}Query`,
		"wp-typia add rest-resource <name> --manual [--query-type <ExportedQueryType>]",
	);
	const resolvedResponseTypeName = assertValidTypeScriptIdentifier(
		"Manual REST contract response type",
		responseTypeName ?? `${pascalCase}Response`,
		"wp-typia add rest-resource <name> --manual [--response-type <ExportedResponseType>]",
	);
	const defaultsToBody =
		bodyTypeName == null && ["PATCH", "POST", "PUT"].includes(resolvedMethod);
	const resolvedBodyTypeName =
		bodyTypeName != null || defaultsToBody
			? assertValidTypeScriptIdentifier(
					"Manual REST contract body type",
					bodyTypeName ?? `${pascalCase}Request`,
					"wp-typia add rest-resource <name> --manual [--body-type <ExportedBodyType>]",
				)
			: undefined;
	if (resolvedMethod === "GET" && resolvedBodyTypeName) {
		throw new Error(
			"Manual REST contract GET routes cannot define a body type. Remove --body-type or use POST, PUT, or PATCH.",
		);
	}
	if (secretStateFieldName && !secretFieldName) {
		throw new Error(
			"Manual REST contract --secret-state-field requires --secret-field.",
		);
	}
	if (secretFieldName && !resolvedBodyTypeName) {
		throw new Error(
			"Manual REST contract secret fields require a request body. Use POST, PUT, or PATCH so a request body is generated.",
		);
	}
	const resolvedSecretFieldName = secretFieldName
		? assertValidTypeScriptIdentifier(
				"Manual REST contract secret field",
				secretFieldName,
				"wp-typia add rest-resource <name> --manual --method POST --secret-field <field>",
			)
		: undefined;
	const resolvedSecretStateFieldName = resolvedSecretFieldName
		? assertValidTypeScriptIdentifier(
				"Manual REST contract secret state field",
				secretStateFieldName ?? `has${toPascalCase(resolvedSecretFieldName)}`,
				"wp-typia add rest-resource <name> --manual --method POST --secret-state-field <field>",
			)
		: undefined;
	if (
		resolvedSecretFieldName &&
		MANUAL_REST_REQUEST_BODY_FIELD_NAMES.has(resolvedSecretFieldName)
	) {
		throw new Error(
			`Manual REST contract secret field must not reuse scaffolded request body fields: ${Array.from(
				MANUAL_REST_REQUEST_BODY_FIELD_NAMES,
			).join(", ")}.`,
		);
	}
	if (
		resolvedSecretStateFieldName &&
		MANUAL_REST_RESPONSE_FIELD_NAMES.has(resolvedSecretStateFieldName)
	) {
		throw new Error(
			`Manual REST contract secret state field must not reuse scaffolded response fields: ${Array.from(
				MANUAL_REST_RESPONSE_FIELD_NAMES,
			).join(", ")}.`,
		);
	}
	if (
		resolvedSecretFieldName &&
		resolvedSecretStateFieldName &&
		resolvedSecretFieldName === resolvedSecretStateFieldName
	) {
		throw new Error(
			"Manual REST contract secret state field must be different from the raw secret field.",
		);
	}
	const manualTypeNames = [
		resolvedQueryTypeName,
		resolvedResponseTypeName,
		resolvedBodyTypeName,
	].filter((value): value is string => value != null);
	const duplicateManualTypeNames = manualTypeNames.filter(
		(name, index) => manualTypeNames.indexOf(name) !== index,
	);
	if (duplicateManualTypeNames.length > 0) {
		throw new Error(
			`Manual REST contract type names must be unique: ${Array.from(
				new Set(duplicateManualTypeNames),
			).join(", ")}. Use distinct --query-type, --body-type, and --response-type values.`,
		);
	}
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			syncRestScriptPath,
		]),
		snapshotDirs: [],
		targetPaths: [restResourceDir],
	};

	try {
		await fsp.mkdir(restResourceDir, { recursive: true });
		await ensureRestResourceSyncScriptAnchors(workspace);
		await fsp.writeFile(
			typesFilePath,
			buildManualRestContractTypesSource({
				...(resolvedBodyTypeName
					? { bodyTypeName: resolvedBodyTypeName }
					: {}),
				queryTypeName: resolvedQueryTypeName,
				responseTypeName: resolvedResponseTypeName,
				restResourceSlug,
				...(resolvedSecretFieldName
					? { secretFieldName: resolvedSecretFieldName }
					: {}),
				...(resolvedSecretStateFieldName
					? { secretStateFieldName: resolvedSecretStateFieldName }
					: {}),
			}),
			"utf8",
		);
		await fsp.writeFile(
			validatorsFilePath,
			buildManualRestContractValidatorsSource({
				...(resolvedBodyTypeName
					? { bodyTypeName: resolvedBodyTypeName }
					: {}),
				queryTypeName: resolvedQueryTypeName,
				responseTypeName: resolvedResponseTypeName,
			}),
			"utf8",
		);
		await fsp.writeFile(
			apiFilePath,
			buildManualRestContractApiSource({
				...(resolvedBodyTypeName
					? { bodyTypeName: resolvedBodyTypeName }
					: {}),
				queryTypeName: resolvedQueryTypeName,
				restResourceSlug,
			}),
			"utf8",
		);
		await syncManualRestContractArtifacts({
			clientFile: `src/rest/${restResourceSlug}/api-client.ts`,
			outputDir: restResourceDir,
			projectDir: workspace.projectDir,
			typesFile: `src/rest/${restResourceSlug}/api-types.ts`,
			validatorsFile: `src/rest/${restResourceSlug}/api-validators.ts`,
			variables: {
				auth: resolvedAuth,
				...(resolvedBodyTypeName
					? { bodyTypeName: resolvedBodyTypeName }
					: {}),
				method: resolvedMethod,
				namespace,
				pascalCase,
				pathPattern: resolvedPathPattern,
				queryTypeName: resolvedQueryTypeName,
				responseTypeName: resolvedResponseTypeName,
				slugKebabCase: restResourceSlug,
				title: toTitleCase(restResourceSlug),
			},
		});
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			restResourceEntries: [
				buildManualRestContractConfigEntry({
					auth: resolvedAuth,
					...(resolvedBodyTypeName
						? { bodyTypeName: resolvedBodyTypeName }
						: {}),
					method: resolvedMethod,
					namespace,
					pathPattern: resolvedPathPattern,
					queryTypeName: resolvedQueryTypeName,
					responseTypeName: resolvedResponseTypeName,
					restResourceSlug,
					...(resolvedSecretFieldName
						? { secretFieldName: resolvedSecretFieldName }
						: {}),
					...(resolvedSecretStateFieldName
						? { secretStateFieldName: resolvedSecretStateFieldName }
						: {}),
				}),
			],
			transformSource: ensureBlockConfigCanAddRestManifests,
		});

		return {
			auth: resolvedAuth,
			...(resolvedBodyTypeName
				? { bodyTypeName: resolvedBodyTypeName }
				: {}),
			method: resolvedMethod,
			methods: [],
			mode: "manual",
			namespace,
			pathPattern: resolvedPathPattern,
			projectDir: workspace.projectDir,
			queryTypeName: resolvedQueryTypeName,
			restResourceSlug,
			responseTypeName: resolvedResponseTypeName,
			...(resolvedSecretFieldName
				? { secretFieldName: resolvedSecretFieldName }
				: {}),
			...(resolvedSecretStateFieldName
				? { secretStateFieldName: resolvedSecretStateFieldName }
				: {}),
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
