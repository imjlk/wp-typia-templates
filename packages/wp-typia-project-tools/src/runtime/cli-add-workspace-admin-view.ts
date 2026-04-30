import fs from "node:fs";
import { promises as fsp } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";
import { readWorkspaceInventory, appendWorkspaceInventoryEntries } from "./workspace-inventory.js";
import { PROJECT_TOOLS_PACKAGE_ROOT } from "./template-registry.js";
import { toPascalCase, toTitleCase } from "./string-case.js";
import {
	findPhpFunctionRange,
	hasPhpFunctionDefinition,
	quotePhpString,
	replacePhpFunctionDefinition,
} from "./php-utils.js";
import {
	assertAdminViewDoesNotExist,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	rollbackWorkspaceMutation,
	type RunAddAdminViewCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	CLI_DIAGNOSTIC_CODES,
	createCliDiagnosticCodeError,
} from "./cli-diagnostics.js";
import {
	DEFAULT_WORDPRESS_DATAVIEWS_VERSION,
	DEFAULT_WORDPRESS_CORE_DATA_VERSION,
	DEFAULT_WORDPRESS_DATA_VERSION,
	DEFAULT_WP_TYPIA_DATAVIEWS_VERSION,
} from "./package-versions.js";

const ADMIN_VIEW_REST_SOURCE_KIND = "rest-resource";
const ADMIN_VIEW_CORE_DATA_SOURCE_KIND = "core-data";
const ADMIN_VIEW_CORE_DATA_ENTITY_KIND_IDS = ["postType", "taxonomy"] as const;
const ADMIN_VIEW_CORE_DATA_ENTITY_SEGMENT_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/u;
const ADMIN_VIEW_SOURCE_USAGE =
	"wp-typia add admin-view <name> --source <rest-resource:slug|core-data:kind/name>";
const ADMIN_VIEWS_SCRIPT = "build/admin-views/index.js";
const ADMIN_VIEWS_ASSET = "build/admin-views/index.asset.php";
const ADMIN_VIEWS_STYLE = "build/admin-views/style-index.css";
const ADMIN_VIEWS_STYLE_RTL = "build/admin-views/style-index-rtl.css";
const ADMIN_VIEWS_PHP_GLOB = "/inc/admin-views/*.php";
const ADMIN_VIEW_ALLOW_UNPUBLISHED_DATAVIEWS_ENV =
	"WP_TYPIA_ALLOW_UNPUBLISHED_DATAVIEWS";
// Lift this gate in the same release that publishes @wp-typia/dataviews.
const ADMIN_VIEW_PUBLIC_INSTALLS_ENABLED = false;

const require = createRequire(import.meta.url);

interface PackageManifestSummary {
	version?: string;
}

interface AdminViewRestResourceSource {
	kind: typeof ADMIN_VIEW_REST_SOURCE_KIND;
	slug: string;
}

type AdminViewCoreDataEntityKind = (typeof ADMIN_VIEW_CORE_DATA_ENTITY_KIND_IDS)[number];

interface AdminViewCoreDataSource {
	entityKind: AdminViewCoreDataEntityKind;
	entityName: string;
	kind: typeof ADMIN_VIEW_CORE_DATA_SOURCE_KIND;
}

type AdminViewSource = AdminViewCoreDataSource | AdminViewRestResourceSource;

type AdminViewRestResource = ReturnType<typeof readWorkspaceInventory>["restResources"][number];

function toCamelCase(input: string): string {
	const pascalCase = toPascalCase(input);
	return `${pascalCase.charAt(0).toLowerCase()}${pascalCase.slice(1)}`;
}

function normalizeVersionRange(value: string | undefined, fallback: string): string {
	const trimmed = value?.trim();
	if (!trimmed || trimmed.startsWith("workspace:")) {
		return fallback;
	}

	return /^[~^<>=]/u.test(trimmed) ? trimmed : `^${trimmed}`;
}

function readPackageManifest(packageJsonPath: string): PackageManifestSummary | undefined {
	try {
		return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageManifestSummary;
	} catch {
		return undefined;
	}
}

function readPackageManifestVersion(packageJsonPath: string): string | undefined {
	return readPackageManifest(packageJsonPath)?.version;
}

function isAdminViewUnpublishedDataViewsOverrideEnabled(): boolean {
	return process.env[ADMIN_VIEW_ALLOW_UNPUBLISHED_DATAVIEWS_ENV]?.trim() === "1";
}

function assertAdminViewPackageAvailability(): void {
	if (isAdminViewUnpublishedDataViewsOverrideEnabled() || ADMIN_VIEW_PUBLIC_INSTALLS_ENABLED) {
		return;
	}

	throw createCliDiagnosticCodeError(
		CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
		"`wp-typia add admin-view` is temporarily unavailable because `@wp-typia/dataviews` is not published to npm for public installs yet.",
	);
}

function detectJsonIndent(source: string): string | number {
	const indentMatch = /\n([ \t]+)"/u.exec(source);
	return indentMatch?.[1] ?? 2;
}

function resolvePackageVersionRange(
	packageName: string,
	fallback: string,
	workspacePackageDirName?: string,
): string {
	if (workspacePackageDirName) {
		const workspaceVersion = readPackageManifestVersion(
			path.join(PROJECT_TOOLS_PACKAGE_ROOT, "..", workspacePackageDirName, "package.json"),
		);
		if (workspaceVersion) {
			return normalizeVersionRange(workspaceVersion, fallback);
		}
	}

	try {
		return normalizeVersionRange(
			readPackageManifestVersion(require.resolve(`${packageName}/package.json`)),
			fallback,
		);
	} catch {
		return fallback;
	}
}

function getAdminViewRelativeModuleSpecifier(adminViewSlug: string, workspaceFile: string): string {
	const adminViewDir = `src/admin-views/${adminViewSlug}`;
	const normalizedFile = workspaceFile.replace(/\\/gu, "/");
	const modulePath = normalizedFile.replace(/\.[cm]?[jt]sx?$/u, "");
	const relativeModulePath = path.posix.relative(adminViewDir, modulePath);

	return relativeModulePath.startsWith(".") ? relativeModulePath : `./${relativeModulePath}`;
}

function isAdminViewCoreDataSource(
	source: AdminViewSource | undefined,
): source is AdminViewCoreDataSource {
	return source?.kind === ADMIN_VIEW_CORE_DATA_SOURCE_KIND;
}

function isAdminViewRestResourceSource(
	source: AdminViewSource | undefined,
): source is AdminViewRestResourceSource {
	return source?.kind === ADMIN_VIEW_REST_SOURCE_KIND;
}

function assertValidCoreDataEntitySegment(label: string, value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error(`${label} is required. Use \`${ADMIN_VIEW_SOURCE_USAGE}\`.`);
	}
	if (!ADMIN_VIEW_CORE_DATA_ENTITY_SEGMENT_PATTERN.test(trimmed)) {
		throw new Error(
			`${label} must start with a letter and contain only letters, numbers, underscores, or hyphens.`,
		);
	}

	return trimmed;
}

function assertValidCoreDataEntityKind(value: string): AdminViewCoreDataEntityKind {
	const normalized = assertValidCoreDataEntitySegment(
		"Admin view source entity kind",
		value,
	);
	if (
		!(ADMIN_VIEW_CORE_DATA_ENTITY_KIND_IDS as readonly string[]).includes(
			normalized,
		)
	) {
		throw new Error(
			`Admin view core-data sources currently support only: ${ADMIN_VIEW_CORE_DATA_ENTITY_KIND_IDS.join(", ")}.`,
		);
	}

	return normalized as AdminViewCoreDataEntityKind;
}

function formatAdminViewSourceLocator(source: AdminViewSource): string {
	if (isAdminViewCoreDataSource(source)) {
		return `${source.kind}:${source.entityKind}/${source.entityName}`;
	}

	return `${source.kind}:${source.slug}`;
}

function parseAdminViewSource(source?: string): AdminViewSource | undefined {
	const trimmed = source?.trim();
	if (!trimmed) {
		return undefined;
	}

	const separatorIndex = trimmed.indexOf(":");
	const kind = separatorIndex === -1 ? trimmed : trimmed.slice(0, separatorIndex);
	const locator = separatorIndex === -1 ? "" : trimmed.slice(separatorIndex + 1);
	if (!locator) {
		throw new Error(
			"Admin view source must use `rest-resource:<slug>` or `core-data:<kind>/<name>`.",
		);
	}

	if (kind === ADMIN_VIEW_REST_SOURCE_KIND) {
		return {
			kind,
			slug: assertValidGeneratedSlug(
				"Admin view source slug",
				normalizeBlockSlug(locator),
				ADMIN_VIEW_SOURCE_USAGE,
			),
		};
	}

	if (kind === ADMIN_VIEW_CORE_DATA_SOURCE_KIND) {
		const [entityKind, entityName, extra] = locator.split("/");
		if (!entityKind || !entityName || extra !== undefined) {
			throw new Error(
				"Admin view core-data sources must use `core-data:<kind>/<name>`, for example `core-data:postType/post`.",
			);
		}

		return {
			entityKind: assertValidCoreDataEntityKind(entityKind),
			entityName: assertValidCoreDataEntitySegment(
				"Admin view source entity name",
				entityName,
			),
			kind,
		};
	}

	throw new Error(
		"Admin view source must use `rest-resource:<slug>` or `core-data:<kind>/<name>`.",
	);
}

function resolveRestResourceSource(
	restResources: AdminViewRestResource[],
	source: AdminViewSource | undefined,
): AdminViewRestResource | undefined {
	if (!isAdminViewRestResourceSource(source)) {
		return undefined;
	}

	const restResource = restResources.find((entry) => entry.slug === source.slug);
	if (!restResource) {
		throw new Error(
			`Unknown REST resource source "${source.slug}". Choose one of: ${restResources
				.map((entry) => entry.slug)
				.join(", ") || "<none>"}.`,
		);
	}
	if (!restResource.methods.includes("list")) {
		throw new Error(
			`REST resource source "${source.slug}" must include the list method for DataViews pagination.`,
		);
	}

	return restResource;
}

function buildAdminViewConfigEntry(
	adminViewSlug: string,
	source: AdminViewSource | undefined,
): string {
	return [
		"\t{",
		`\t\tfile: ${quoteTsString(`src/admin-views/${adminViewSlug}/index.tsx`)},`,
		`\t\tphpFile: ${quoteTsString(`inc/admin-views/${adminViewSlug}.php`)},`,
		`\t\tslug: ${quoteTsString(adminViewSlug)},`,
		source
			? `\t\tsource: ${quoteTsString(formatAdminViewSourceLocator(source))},`
			: null,
		"\t},",
	]
		.filter((line): line is string => typeof line === "string")
		.join("\n");
}

function buildAdminViewRegistrySource(adminViewSlugs: string[]): string {
	const importLines = adminViewSlugs
		.map((adminViewSlug) => `import './${adminViewSlug}';`)
		.join("\n");

	return `${importLines}${importLines ? "\n\n" : ""}// wp-typia add admin-view entries\n`;
}

function buildAdminViewTypesSource(
	adminViewSlug: string,
	restResource: AdminViewRestResource | undefined,
	coreDataSource: AdminViewCoreDataSource | undefined,
): string {
	const pascalName = toPascalCase(adminViewSlug);
	const coreDataRecordTypeName = `${pascalName}CoreDataRecord`;
	const itemTypeName = `${pascalName}AdminViewItem`;
	const dataSetTypeName = `${pascalName}AdminViewDataSet`;

	if (restResource) {
		const restPascalName = toPascalCase(restResource.slug);
		const restTypesModule = getAdminViewRelativeModuleSpecifier(
			adminViewSlug,
			restResource.typesFile,
		);

		return `import type { ${restPascalName}Record } from ${quoteTsString(restTypesModule)};

export type ${itemTypeName} = ${restPascalName}Record;

export interface ${dataSetTypeName} {
\titems: ${itemTypeName}[];
\tpaginationInfo: {
\t\ttotalItems: number;
\t\ttotalPages: number;
\t};
}
`;
	}

	if (coreDataSource) {
		return `export interface ${coreDataRecordTypeName} {
\tid: number;
\tdate?: string;
\tmodified?: string;
\tname?: string;
\tslug?: string;
\tstatus?: string;
\ttitle?: string | {
\t\traw?: string;
\t\trendered?: string;
\t};
\t[key: string]: unknown;
}

export interface ${itemTypeName} {
\tid: number;
\traw: ${coreDataRecordTypeName};
\tslug: string;
\tstatus: string;
\ttitle: string;
\tupdatedAt: string;
}

export interface ${dataSetTypeName} {
\titems: ${itemTypeName}[];
\tpaginationInfo: {
\t\ttotalItems: number;
\t\ttotalPages: number;
\t};
}
`;
	}

	return `export type ${pascalName}AdminViewStatus = 'draft' | 'published';

export interface ${itemTypeName} {
\tid: number;
\towner: string;
\tstatus: ${pascalName}AdminViewStatus;
\ttitle: string;
\tupdatedAt: string;
}

export interface ${dataSetTypeName} {
\titems: ${itemTypeName}[];
\tpaginationInfo: {
\t\ttotalItems: number;
\t\ttotalPages: number;
\t};
}
`;
}

function buildAdminViewConfigSource(
	adminViewSlug: string,
	textDomain: string,
	source: AdminViewSource | undefined,
	restResource: AdminViewRestResource | undefined,
): string {
	const pascalName = toPascalCase(adminViewSlug);
	const camelName = toCamelCase(adminViewSlug);
	const itemTypeName = `${pascalName}AdminViewItem`;
	const dataViewsName = `${camelName}AdminDataViews`;
	const isCoreDataSource = source?.kind === ADMIN_VIEW_CORE_DATA_SOURCE_KIND;
	const defaultViewFields = restResource
		? "['id']"
		: isCoreDataSource
			? "['title', 'slug', 'status', 'updatedAt']"
			: "['title', 'status', 'updatedAt']";
	const searchEnabled = restResource ? "false" : "true";
	const titleFieldSource = restResource ? "" : "\ttitleField: 'title',\n";
	const defaultViewEnhancementsSource = restResource
		? ""
		: isCoreDataSource
			? "\t\ttitleField: 'title',\n"
			: `\t\tsort: {
\t\t\tdirection: 'desc',
\t\t\tfield: 'updatedAt',
\t\t},
\t\ttitleField: 'title',
`;
	const additionalFieldsSource = restResource
		? "\t\t// REST-backed screens start with the guaranteed ID column. Add project-owned fields here once they are declared on the REST record type."
		: isCoreDataSource
			? `\t\tslug: {
\t\t\tenableGlobalSearch: true,
\t\t\tlabel: __( 'Slug', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\tstatus: {
\t\t\tlabel: __( 'Status', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\ttitle: {
\t\t\tenableGlobalSearch: true,
\t\t\tlabel: __( 'Name', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\tupdatedAt: {
\t\t\tlabel: __( 'Updated', ${quoteTsString(textDomain)} ),
\t\t\tschema: { format: 'date-time', type: 'string' },
\t\t\ttype: 'datetime',
\t\t},`
		: `\t\towner: {
\t\t\tlabel: __( 'Owner', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\tstatus: {
\t\t\tfilterBy: { operators: ['isAny', 'isNone'] },
\t\t\tlabel: __( 'Status', ${quoteTsString(textDomain)} ),
\t\t\tschema: {
\t\t\t\tenum: ['draft', 'published'],
\t\t\t\tenumLabels: {
\t\t\t\t\tdraft: __( 'Draft', ${quoteTsString(textDomain)} ),
\t\t\t\t\tpublished: __( 'Published', ${quoteTsString(textDomain)} ),
\t\t\t\t},
\t\t\t\ttype: 'string',
\t\t\t},
\t\t},
\t\ttitle: {
\t\t\tenableGlobalSearch: true,
\t\t\tenableSorting: true,
\t\t\tlabel: __( 'Title', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\tupdatedAt: {
\t\t\tenableSorting: true,
\t\t\tlabel: __( 'Updated', ${quoteTsString(textDomain)} ),
\t\t\tschema: { format: 'date-time', type: 'string' },
\t\t\ttype: 'datetime',
\t\t},`;

	return `import { defineDataViews } from '@wp-typia/dataviews';
import { __ } from '@wordpress/i18n';

import type { ${itemTypeName} } from './types';

export const ${dataViewsName} = defineDataViews<${itemTypeName}>({
\tidField: 'id',
\tsearch: ${searchEnabled},
\tsearchLabel: __( 'Search records', ${quoteTsString(textDomain)} ),
${titleFieldSource}
\tdefaultView: {
\t\tfields: ${defaultViewFields},
\t\tpage: 1,
\t\tperPage: 10,
${defaultViewEnhancementsSource}
\t\ttype: 'table',
\t},
\tfields: {
\t\tid: {
\t\t\tenableHiding: false,
\t\t\tlabel: __( 'ID', ${quoteTsString(textDomain)} ),
\t\t\treadOnly: true,
\t\t\tschema: { type: 'integer' },
\t\t},
${additionalFieldsSource}
\t},
});
`;
}

function buildDefaultAdminViewDataSource(adminViewSlug: string): string {
	const pascalName = toPascalCase(adminViewSlug);
	const camelName = toCamelCase(adminViewSlug);
	const title = toTitleCase(adminViewSlug);
	const itemTypeName = `${pascalName}AdminViewItem`;
	const dataSetTypeName = `${pascalName}AdminViewDataSet`;
	const queryTypeName = `${pascalName}AdminViewQuery`;
	const dataViewsName = `${camelName}AdminDataViews`;
	const fetchName = `fetch${pascalName}AdminViewData`;

	return `import type { DataViewsView } from '@wp-typia/dataviews';

import { ${dataViewsName} } from './config';
import type { ${dataSetTypeName}, ${itemTypeName} } from './types';

export interface ${queryTypeName} {
\tpage?: number;
\tperPage?: number;
\tsearch?: string;
}

const STARTER_ITEMS: ${itemTypeName}[] = [
\t{
\t\tid: 1,
\t\towner: 'Editorial',
\t\tstatus: 'published',
\t\ttitle: ${quoteTsString(`${title} launch checklist`)},
\t\tupdatedAt: '2026-04-01T10:30:00Z',
\t},
\t{
\t\tid: 2,
\t\towner: 'Design',
\t\tstatus: 'draft',
\t\ttitle: ${quoteTsString(`${title} content refresh`)},
\t\tupdatedAt: '2026-04-03T14:15:00Z',
\t},
\t{
\t\tid: 3,
\t\towner: 'Operations',
\t\tstatus: 'published',
\t\ttitle: ${quoteTsString(`${title} support handoff`)},
\t\tupdatedAt: '2026-04-08T08:45:00Z',
\t},
];

function matchesSearch(item: ${itemTypeName}, search: string | undefined): boolean {
\tif (!search) {
\t\treturn true;
\t}

\tconst needle = search.toLowerCase();
\treturn [item.title, item.owner, item.status].some((value) =>
\t\tvalue.toLowerCase().includes(needle),
\t);
}

export async function ${fetchName}(
\tview: DataViewsView<${itemTypeName}>,
): Promise<${dataSetTypeName}> {
\tconst query = ${dataViewsName}.toQueryArgs<${queryTypeName}>(view, {
\t\tperPageParam: 'perPage',
\t});
\tconst requestedPage = query.page ?? 1;
\tconst page = requestedPage > 0 ? requestedPage : 1;
\tconst requestedPerPage = query.perPage ?? view.perPage ?? 10;
\tconst perPage = requestedPerPage > 0 ? requestedPerPage : 10;
\tconst filteredItems = STARTER_ITEMS.filter((item) =>
\t\tmatchesSearch(item, query.search),
\t);
\tconst offset = (page - 1) * perPage;
\tconst items = filteredItems.slice(offset, offset + perPage);

\treturn {
\t\titems,
\t\tpaginationInfo: {
\t\t\ttotalItems: filteredItems.length,
\t\t\ttotalPages: Math.max(1, Math.ceil(filteredItems.length / perPage)),
\t\t},
\t};
}
`;
}

function buildRestAdminViewDataSource(
	adminViewSlug: string,
	restResource: AdminViewRestResource,
): string {
	const pascalName = toPascalCase(adminViewSlug);
	const restPascalName = toPascalCase(restResource.slug);
	const camelName = toCamelCase(adminViewSlug);
	const itemTypeName = `${pascalName}AdminViewItem`;
	const dataSetTypeName = `${pascalName}AdminViewDataSet`;
	const dataViewsName = `${camelName}AdminDataViews`;
	const fetchName = `fetch${pascalName}AdminViewData`;
	const restApiModule = getAdminViewRelativeModuleSpecifier(
		adminViewSlug,
		restResource.apiFile,
	);
	const restTypesModule = getAdminViewRelativeModuleSpecifier(
		adminViewSlug,
		restResource.typesFile,
	);

	return `import type { DataViewsView } from '@wp-typia/dataviews';

import { listResource } from ${quoteTsString(restApiModule)};
import type { ${restPascalName}ListQuery } from ${quoteTsString(restTypesModule)};
import { ${dataViewsName} } from './config';
import type { ${dataSetTypeName}, ${itemTypeName} } from './types';

function resolveTotalPages(total: number, perPage: number | undefined): number {
\tconst resolvedPerPage = perPage && perPage > 0 ? perPage : 1;
\treturn Math.max(1, Math.ceil(total / resolvedPerPage));
}

export async function ${fetchName}(
\tview: DataViewsView<${itemTypeName}>,
): Promise<${dataSetTypeName}> {
\tconst query = ${dataViewsName}.toQueryArgs<${restPascalName}ListQuery>(view, {
\t\tperPageParam: 'perPage',
\t\tsearchParam: false,
\t});
\tconst result = await listResource({
\t\tpage: query.page,
\t\tperPage: query.perPage,
\t});
\tif (!result.isValid || !result.data) {
\t\tthrow new Error('Unable to load REST resource records.');
\t}

\tconst response = result.data;

\treturn {
\t\titems: response.items,
\t\tpaginationInfo: {
\t\t\ttotalItems: response.total,
\t\t\ttotalPages: resolveTotalPages(response.total, response.perPage ?? query.perPage),
\t\t},
\t};
}
`;
}

function buildCoreDataAdminViewDataSource(
	adminViewSlug: string,
	coreDataSource: AdminViewCoreDataSource,
): string {
	const pascalName = toPascalCase(adminViewSlug);
	const camelName = toCamelCase(adminViewSlug);
	const coreDataRecordTypeName = `${pascalName}CoreDataRecord`;
	const dataSetTypeName = `${pascalName}AdminViewDataSet`;
	const itemTypeName = `${pascalName}AdminViewItem`;
	const queryTypeName = `${pascalName}AdminViewQuery`;
	const dataViewsName = `${camelName}AdminDataViews`;
	const useEntityRecordName = `use${pascalName}EntityRecord`;
	const useEntityRecordsName = `use${pascalName}EntityRecords`;
	const useAdminViewDataName = `use${pascalName}AdminViewData`;

	return `import type { DataViewsView } from '@wp-typia/dataviews';
import { useEntityRecord, useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

import { ${dataViewsName} } from './config';
import type {
\t${coreDataRecordTypeName},
\t${dataSetTypeName},
\t${itemTypeName},
} from './types';

export interface ${queryTypeName} {
\tpage?: number;
\tper_page?: number;
\tsearch?: string;
}

const CORE_DATA_ENTITY_KIND = ${quoteTsString(coreDataSource.entityKind)};
const CORE_DATA_ENTITY_NAME = ${quoteTsString(coreDataSource.entityName)};

function normalizeCoreDataString(value: unknown): string {
\treturn typeof value === 'string' ? value : '';
}

function normalizeCoreDataTitle(record: ${coreDataRecordTypeName}): string {
\tif (typeof record.title === 'string') {
\t\treturn record.title;
\t}
\tif (record.title && typeof record.title === 'object') {
\t\tif (typeof record.title.rendered === 'string') {
\t\t\treturn record.title.rendered;
\t\t}
\t\tif (typeof record.title.raw === 'string') {
\t\t\treturn record.title.raw;
\t\t}
\t}

\treturn normalizeCoreDataString(record.name) || normalizeCoreDataString(record.slug);
}

function normalizeCoreDataUpdatedAt(record: ${coreDataRecordTypeName}): string {
\treturn normalizeCoreDataString(record.modified) || normalizeCoreDataString(record.date);
}

function normalizeCoreDataRecord(record: ${coreDataRecordTypeName}): ${itemTypeName} {
\treturn {
\t\tid: record.id,
\t\traw: record,
\t\tslug: normalizeCoreDataString(record.slug),
\t\tstatus: normalizeCoreDataString(record.status),
\t\ttitle: normalizeCoreDataTitle(record),
\t\tupdatedAt: normalizeCoreDataUpdatedAt(record),
\t};
}

export function ${useEntityRecordName}(recordId: number | undefined) {
\treturn useEntityRecord<${coreDataRecordTypeName}>(
\t\tCORE_DATA_ENTITY_KIND,
\t\tCORE_DATA_ENTITY_NAME,
\t\trecordId ?? 0,
\t\t{ enabled: typeof recordId === 'number' },
\t);
}

export function ${useEntityRecordsName}(view: DataViewsView<${itemTypeName}>) {
\tconst query = ${dataViewsName}.toQueryArgs<${queryTypeName}>(view, {
\t\tperPageParam: 'per_page',
\t});

\treturn useEntityRecords<${coreDataRecordTypeName}>(
\t\tCORE_DATA_ENTITY_KIND,
\t\tCORE_DATA_ENTITY_NAME,
\t\tquery,
\t);
}

export function ${useAdminViewDataName}(view: DataViewsView<${itemTypeName}>) {
\tconst { hasResolved, isResolving, records, totalItems, totalPages } =
\t\t${useEntityRecordsName}(view);
\tconst items = useMemo(
\t\t() => (records ?? []).map((record) => normalizeCoreDataRecord(record)),
\t\t[records],
\t);
\tconst dataSet = useMemo<${dataSetTypeName}>(
\t\t() => ({
\t\t\titems,
\t\t\tpaginationInfo: {
\t\t\t\ttotalItems: totalItems ?? items.length,
\t\t\t\ttotalPages: Math.max(1, totalPages ?? 1),
\t\t\t},
\t\t}),
\t\t[items, totalItems, totalPages],
\t);
\tconst error =
\t\t!isResolving && hasResolved && records === null
\t\t\t? 'Unable to load core-data entity records.'
\t\t\t: null;

\treturn {
\t\tdataSet,
\t\terror,
\t\tisLoading: isResolving,
\t};
}
`;
}

function buildAdminViewScreenSource(
	adminViewSlug: string,
	textDomain: string,
): string {
	const pascalName = toPascalCase(adminViewSlug);
	const camelName = toCamelCase(adminViewSlug);
	const itemTypeName = `${pascalName}AdminViewItem`;
	const dataSetTypeName = `${pascalName}AdminViewDataSet`;
	const componentName = `${pascalName}AdminViewScreen`;
	const dataViewsName = `${camelName}AdminDataViews`;
	const fetchName = `fetch${pascalName}AdminViewData`;
	const title = toTitleCase(adminViewSlug);

	return `import type { DataViewsConfig, DataViewsView } from '@wp-typia/dataviews';
import { Button, Notice, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataViews } from '@wordpress/dataviews/wp';

import { ${dataViewsName} } from './config';
import { ${fetchName} } from './data';
import type { ${dataSetTypeName}, ${itemTypeName} } from './types';

const TypedDataViews = DataViews as unknown as <TItem extends object>(
\tprops: DataViewsConfig<TItem>,
) => ReturnType<typeof DataViews>;

const EMPTY_DATA_SET: ${dataSetTypeName} = {
\titems: [],
\tpaginationInfo: {
\t\ttotalItems: 0,
\t\ttotalPages: 1,
\t},
};

export function ${componentName}() {
\tconst [view, setView] = useState<DataViewsView<${itemTypeName}>>(
\t\t${dataViewsName}.defaultView,
\t);
\tconst [dataSet, setDataSet] = useState<${dataSetTypeName}>(EMPTY_DATA_SET);
\tconst [error, setError] = useState<string | null>(null);
\tconst [isLoading, setIsLoading] = useState(true);
\tconst [reloadToken, setReloadToken] = useState(0);

\tuseEffect(() => {
\t\tlet isCurrentRequest = true;
\t\tsetIsLoading(true);
\t\tsetError(null);

\t\tvoid ${fetchName}(view)
\t\t\t.then((nextDataSet) => {
\t\t\t\tif (isCurrentRequest) {
\t\t\t\t\tsetDataSet(nextDataSet);
\t\t\t\t}
\t\t\t})
\t\t\t.catch((nextError: unknown) => {
\t\t\t\tif (isCurrentRequest) {
\t\t\t\t\tsetError(
\t\t\t\t\t\tnextError instanceof Error
\t\t\t\t\t\t\t? nextError.message
\t\t\t\t\t\t\t: __( 'Unable to load records.', ${quoteTsString(textDomain)} ),
\t\t\t\t\t);
\t\t\t\t}
\t\t\t})
\t\t\t.finally(() => {
\t\t\t\tif (isCurrentRequest) {
\t\t\t\t\tsetIsLoading(false);
\t\t\t\t}
\t\t\t});

\t\treturn () => {
\t\t\tisCurrentRequest = false;
\t\t};
\t}, [reloadToken, view]);

\tconst config = ${dataViewsName}.createConfig({
\t\tdata: dataSet.items,
\t\tisLoading,
\t\tonChangeView: setView,
\t\tpaginationInfo: dataSet.paginationInfo,
\t\tview,
\t});

\treturn (
\t\t<div className="wp-typia-admin-view-screen">
\t\t\t<header className="wp-typia-admin-view-screen__header">
\t\t\t\t<div>
\t\t\t\t\t<p className="wp-typia-admin-view-screen__eyebrow">
\t\t\t\t\t\t{ __( 'DataViews admin screen', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t</p>
\t\t\t\t\t<h1>{ __( ${quoteTsString(title)}, ${quoteTsString(textDomain)} ) }</h1>
\t\t\t\t\t<p>
\t\t\t\t\t\t{ __( 'Replace the fetcher in data.ts with your project data source when this screen graduates from scaffold to product UI.', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t</p>
\t\t\t\t</div>
\t\t\t\t<div className="wp-typia-admin-view-screen__actions">
\t\t\t\t\t{ isLoading ? <Spinner /> : null }
\t\t\t\t\t<Button
\t\t\t\t\t\tisBusy={ isLoading }
\t\t\t\t\t\tonClick={ () => setReloadToken((token) => token + 1) }
\t\t\t\t\t\tvariant="secondary"
\t\t\t\t\t>
\t\t\t\t\t\t{ __( 'Reload', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t</Button>
\t\t\t\t</div>
\t\t\t</header>
\t\t\t{ error ? (
\t\t\t\t<Notice isDismissible={ false } status="error">
\t\t\t\t\t{ error }
\t\t\t\t</Notice>
\t\t\t) : null }
\t\t\t<TypedDataViews<${itemTypeName}> { ...config } />
\t\t</div>
\t);
}
`;
}

function buildCoreDataAdminViewScreenSource(
	adminViewSlug: string,
	textDomain: string,
): string {
	const pascalName = toPascalCase(adminViewSlug);
	const camelName = toCamelCase(adminViewSlug);
	const itemTypeName = `${pascalName}AdminViewItem`;
	const dataSetTypeName = `${pascalName}AdminViewDataSet`;
	const componentName = `${pascalName}AdminViewScreen`;
	const dataViewsName = `${camelName}AdminDataViews`;
	const useAdminViewDataName = `use${pascalName}AdminViewData`;
	const title = toTitleCase(adminViewSlug);

	return `import type { DataViewsConfig, DataViewsView } from '@wp-typia/dataviews';
import { Notice, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DataViews } from '@wordpress/dataviews/wp';

import { ${dataViewsName} } from './config';
import { ${useAdminViewDataName} } from './data';
import type { ${dataSetTypeName}, ${itemTypeName} } from './types';

const TypedDataViews = DataViews as unknown as <TItem extends object>(
\tprops: DataViewsConfig<TItem>,
) => ReturnType<typeof DataViews>;

const EMPTY_DATA_SET: ${dataSetTypeName} = {
\titems: [],
\tpaginationInfo: {
\t\ttotalItems: 0,
\t\ttotalPages: 1,
\t},
};

export function ${componentName}() {
\tconst [view, setView] = useState<DataViewsView<${itemTypeName}>>(
\t\t${dataViewsName}.defaultView,
\t);
\tconst {
\t\tdataSet = EMPTY_DATA_SET,
\t\terror,
\t\tisLoading,
\t} = ${useAdminViewDataName}(view);
\tconst config = ${dataViewsName}.createConfig({
\t\tdata: dataSet.items,
\t\tisLoading,
\t\tonChangeView: setView,
\t\tpaginationInfo: dataSet.paginationInfo,
\t\tview,
\t});

\treturn (
\t\t<div className="wp-typia-admin-view-screen">
\t\t\t<header className="wp-typia-admin-view-screen__header">
\t\t\t\t<div>
\t\t\t\t\t<p className="wp-typia-admin-view-screen__eyebrow">
\t\t\t\t\t\t{ __( 'DataViews admin screen', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t</p>
\t\t\t\t\t<h1>{ __( ${quoteTsString(title)}, ${quoteTsString(textDomain)} ) }</h1>
\t\t\t\t\t<p>
\t\t\t\t\t\t{ __( 'This screen reads from the WordPress core-data entity store. Extend data.ts when you need entity-specific field mapping or edit flows.', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t</p>
\t\t\t\t</div>
\t\t\t\t<div className="wp-typia-admin-view-screen__actions">
\t\t\t\t\t{ isLoading ? <Spinner /> : null }
\t\t\t\t</div>
\t\t\t</header>
\t\t\t{ error ? (
\t\t\t\t<Notice isDismissible={ false } status="error">
\t\t\t\t\t{ error }
\t\t\t\t</Notice>
\t\t\t) : null }
\t\t\t<TypedDataViews<${itemTypeName}> { ...config } />
\t\t</div>
\t);
}
`;
}

function buildAdminViewEntrySource(adminViewSlug: string): string {
	const pascalName = toPascalCase(adminViewSlug);
	const componentName = `${pascalName}AdminViewScreen`;
	const rootId = `wp-typia-admin-view-${adminViewSlug}`;

	return `import { createRoot } from '@wordpress/element';

import '@wordpress/dataviews/build-style/style.css';
import { ${componentName} } from './Screen';
import './style.scss';

const ROOT_ELEMENT_ID = ${quoteTsString(rootId)};

function mountAdminView() {
\tconst rootElement = document.getElementById(ROOT_ELEMENT_ID);
\tif (!rootElement) {
\t\treturn;
\t}

\tcreateRoot(rootElement).render(<${componentName} />);
}

if (document.readyState === 'loading') {
\tdocument.addEventListener('DOMContentLoaded', mountAdminView);
} else {
\tmountAdminView();
}
`;
}

function buildAdminViewStyleSource(): string {
	return `.wp-typia-admin-view-screen {
\tbox-sizing: border-box;
\tmax-width: 1180px;
\tpadding: 24px 24px 48px 0;
}

.wp-typia-admin-view-screen__header {
\talign-items: flex-start;
\tdisplay: flex;
\tgap: 24px;
\tjustify-content: space-between;
\tmargin-bottom: 24px;
}

.wp-typia-admin-view-screen__header h1 {
\tfont-size: 28px;
\tline-height: 1.2;
\tmargin: 0 0 8px;
}

.wp-typia-admin-view-screen__header p {
\tmax-width: 680px;
}

.wp-typia-admin-view-screen__eyebrow {
\tcolor: #3858e9;
\tfont-size: 11px;
\tfont-weight: 600;
\tletter-spacing: 0.08em;
\tmargin: 0 0 8px;
\ttext-transform: uppercase;
}

.wp-typia-admin-view-screen__actions {
\talign-items: center;
\tdisplay: flex;
\tgap: 12px;
}
`;
}

function buildAdminViewPhpSource(
	adminViewSlug: string,
	workspace: WorkspaceProject,
): string {
	const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
	const phpSlug = adminViewSlug.replace(/-/g, "_");
	const functionPrefix = `${workspace.workspace.phpPrefix}_${phpSlug}`;
	const menuSlugFunctionName = `${functionPrefix}_admin_view_menu_slug`;
	const renderFunctionName = `${functionPrefix}_render_admin_view`;
	const registerFunctionName = `${functionPrefix}_register_admin_view`;
	const enqueueFunctionName = `${functionPrefix}_enqueue_admin_view`;
	const hookGlobalName = `${functionPrefix}_admin_view_hook`;
	const rootId = `wp-typia-admin-view-${adminViewSlug}`;
	const title = toTitleCase(adminViewSlug);

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( '${menuSlugFunctionName}' ) ) {
\tfunction ${menuSlugFunctionName}() : string {
\t\treturn '${workspaceBaseName}-${adminViewSlug}';
\t}
}

if ( ! function_exists( '${renderFunctionName}' ) ) {
\tfunction ${renderFunctionName}() : void {
\t\t?>
\t\t<div class="wrap">
\t\t\t<div id="${rootId}"></div>
\t\t</div>
\t\t<?php
\t}
}

if ( ! function_exists( '${registerFunctionName}' ) ) {
\tfunction ${registerFunctionName}() : void {
\t\t$GLOBALS['${hookGlobalName}'] = add_submenu_page(
\t\t\t'tools.php',
\t\t\t__( ${quotePhpString(title)}, ${quotePhpString(workspace.workspace.textDomain)} ),
\t\t\t__( ${quotePhpString(title)}, ${quotePhpString(workspace.workspace.textDomain)} ),
\t\t\t'edit_posts',
\t\t\t${menuSlugFunctionName}(),
\t\t\t'${renderFunctionName}'
\t\t);
\t}
}

if ( ! function_exists( '${enqueueFunctionName}' ) ) {
\tfunction ${enqueueFunctionName}( string $hook_suffix ) : void {
\t\t$page_hook = isset( $GLOBALS['${hookGlobalName}'] ) && is_string( $GLOBALS['${hookGlobalName}'] )
\t\t\t? $GLOBALS['${hookGlobalName}']
\t\t\t: '';

\t\tif ( $page_hook !== $hook_suffix ) {
\t\t\treturn;
\t\t}

\t\t$plugin_file = dirname( __DIR__, 2 ) . '/${workspaceBaseName}.php';
\t\t$script_path = dirname( __DIR__, 2 ) . '/${ADMIN_VIEWS_SCRIPT}';
\t\t$asset_path  = dirname( __DIR__, 2 ) . '/${ADMIN_VIEWS_ASSET}';
\t\t$style_path  = dirname( __DIR__, 2 ) . '/${ADMIN_VIEWS_STYLE}';
\t\t$style_rtl_path = dirname( __DIR__, 2 ) . '/${ADMIN_VIEWS_STYLE_RTL}';

\t\tif ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
\t\t\treturn;
\t\t}

\t\t$asset = require $asset_path;
\t\tif ( ! is_array( $asset ) ) {
\t\t\t$asset = array();
\t\t}

\t\t$dependencies = isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] )
\t\t\t? $asset['dependencies']
\t\t\t: array();

\t\twp_enqueue_script(
\t\t\t'${workspaceBaseName}-${adminViewSlug}-admin-view',
\t\t\tplugins_url( '${ADMIN_VIEWS_SCRIPT}', $plugin_file ),
\t\t\t$dependencies,
\t\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $script_path ),
\t\t\ttrue
\t\t);

\t\tif ( file_exists( $style_path ) ) {
\t\t\twp_enqueue_style(
\t\t\t\t'${workspaceBaseName}-${adminViewSlug}-admin-view',
\t\t\t\tplugins_url( '${ADMIN_VIEWS_STYLE}', $plugin_file ),
\t\t\t\tarray( 'wp-components' ),
\t\t\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $style_path )
\t\t\t);
\t\t\tif ( file_exists( $style_rtl_path ) ) {
\t\t\t\twp_style_add_data( '${workspaceBaseName}-${adminViewSlug}-admin-view', 'rtl', 'replace' );
\t\t\t}
\t\t}
\t}
}

add_action( 'admin_menu', '${registerFunctionName}' );
add_action( 'admin_enqueue_scripts', '${enqueueFunctionName}' );
`;
}

async function ensureAdminViewPackageDependencies(
	workspace: WorkspaceProject,
	adminViewSource: AdminViewSource | undefined,
): Promise<void> {
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const wpTypiaDataViewsVersion = resolvePackageVersionRange(
		"@wp-typia/dataviews",
		DEFAULT_WP_TYPIA_DATAVIEWS_VERSION,
		"wp-typia-dataviews",
	);
	const wordpressDataViewsVersion = resolvePackageVersionRange(
		"@wordpress/dataviews",
		DEFAULT_WORDPRESS_DATAVIEWS_VERSION,
	);
	const wordpressCoreDataVersion = resolvePackageVersionRange(
		"@wordpress/core-data",
		DEFAULT_WORDPRESS_CORE_DATA_VERSION,
	);
	const wordpressDataVersion = resolvePackageVersionRange(
		"@wordpress/data",
		DEFAULT_WORDPRESS_DATA_VERSION,
	);
	await patchFile(packageJsonPath, (source) => {
		const packageJson = JSON.parse(source) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const coreDataDependencies: Record<string, string> =
			isAdminViewCoreDataSource(adminViewSource)
				? {
						"@wordpress/core-data":
							packageJson.dependencies?.["@wordpress/core-data"] ??
							wordpressCoreDataVersion,
						"@wordpress/data":
							packageJson.dependencies?.["@wordpress/data"] ??
							wordpressDataVersion,
				  }
				: {};
		const nextDependencies = {
			...(packageJson.dependencies ?? {}),
			"@wordpress/dataviews":
				packageJson.dependencies?.["@wordpress/dataviews"] ?? wordpressDataViewsVersion,
			...coreDataDependencies,
		};
		const nextDevDependencies = {
			...(packageJson.devDependencies ?? {}),
			"@wp-typia/dataviews":
				packageJson.devDependencies?.["@wp-typia/dataviews"] ??
				wpTypiaDataViewsVersion,
		};
		if (
			JSON.stringify(nextDependencies) === JSON.stringify(packageJson.dependencies ?? {}) &&
			JSON.stringify(nextDevDependencies) ===
				JSON.stringify(packageJson.devDependencies ?? {})
		) {
			return source;
		}

		packageJson.dependencies = nextDependencies;
		packageJson.devDependencies = nextDevDependencies;
		return `${JSON.stringify(packageJson, null, detectJsonIndent(source))}\n`;
	});
}

async function ensureAdminViewBootstrapAnchors(workspace: WorkspaceProject): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const loadFunctionName = `${workspace.workspace.phpPrefix}_load_admin_views`;
		const loadHook = `add_action( 'plugins_loaded', '${loadFunctionName}' );`;
		const loadFunction = `

function ${loadFunctionName}() {
\tforeach ( glob( __DIR__ . '${ADMIN_VIEWS_PHP_GLOB}' ) ?: array() as $admin_view_module ) {
\t\trequire_once $admin_view_module;
\t}
}
`;
		const insertionAnchors = [
			/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
			/\?>\s*$/u,
		];
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

		if (!hasPhpFunctionDefinition(nextSource, loadFunctionName)) {
			insertPhpSnippet(loadFunction);
		} else {
			const functionRange = findPhpFunctionRange(nextSource, loadFunctionName);
			const functionSource = functionRange
				? nextSource.slice(functionRange.start, functionRange.end)
				: "";
			if (!functionSource.includes(ADMIN_VIEWS_PHP_GLOB)) {
				const replacedSource = replacePhpFunctionDefinition(
					nextSource,
					loadFunctionName,
					loadFunction,
				);
				if (!replacedSource) {
					throw new Error(
						`Unable to repair ${path.basename(bootstrapPath)} for ${loadFunctionName}.`,
					);
				}
				nextSource = replacedSource;
			}
		}

		if (!nextSource.includes(loadHook)) {
			appendPhpSnippet(loadHook);
		}

		return nextSource;
	});
}

async function ensureAdminViewBuildScriptAnchors(workspace: WorkspaceProject): Promise<void> {
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");

	await patchFile(buildScriptPath, (source) => {
		if (/['"]src\/admin-views\/index\.(?:ts|js)['"]/u.test(source)) {
			return source;
		}

		const currentSharedEntriesPattern =
			/(\r?\n\s*['"]src\/editor-plugins\/index\.js['"])\s*,?/u;
		let nextSource = source.replace(
			currentSharedEntriesPattern,
			`$1,
\t\t'src/admin-views/index.ts',
\t\t'src/admin-views/index.js',`,
		);
		if (nextSource !== source) {
			return nextSource;
		}

		const legacySharedEntriesPattern =
			/\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]/u;
		nextSource = source.replace(
			legacySharedEntriesPattern,
			`[
\t\t'src/bindings/index.ts',
\t\t'src/bindings/index.js',
\t\t'src/editor-plugins/index.ts',
\t\t'src/editor-plugins/index.js',
\t\t'src/admin-views/index.ts',
\t\t'src/admin-views/index.js',
\t]`,
		);
		if (nextSource !== source) {
			return nextSource;
		}

		throw new Error(
			`Unable to update ${path.relative(workspace.projectDir, buildScriptPath)} for admin view shared entries.`,
		);
	});
}

async function ensureAdminViewWebpackAnchors(workspace: WorkspaceProject): Promise<void> {
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");

	await patchFile(webpackConfigPath, (source) => {
		if (/['"]admin-views\/index['"]/u.test(source)) {
			return source;
		}

		const editorPluginEntryPattern =
			/(\n\s*\[\s*['"]editor-plugins\/index['"][\s\S]*?['"]src\/editor-plugins\/index\.js['"][\s\S]*?\]\s*\])\s*,?/u;
		let nextSource = source.replace(
			editorPluginEntryPattern,
			`$1,
\t\t[
\t\t\t'admin-views/index',
\t\t\t[ 'src/admin-views/index.ts', 'src/admin-views/index.js' ],
\t\t],`,
		);
		if (nextSource !== source) {
			return nextSource;
		}

		const legacySharedEntriesBlockPattern =
			/for\s*\(\s*const\s+relativePath\s+of\s+\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]\s*\)\s*\{[\s\S]*?entries\.push\(\s*\[\s*['"]bindings\/index['"]\s*,\s*entryPath\s*\]\s*\);\s*break;\s*\}/u;
		const nextSharedEntriesBlock = `\tfor ( const [ entryName, candidates ] of [\n\t\t[\n\t\t\t'bindings/index',\n\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'editor-plugins/index',\n\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'admin-views/index',\n\t\t\t[ 'src/admin-views/index.ts', 'src/admin-views/index.js' ],\n\t\t],\n\t] ) {\n\t\tfor ( const relativePath of candidates ) {\n\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\t\tcontinue;\n\t\t\t}\n\n\t\t\tentries.push( [ entryName, entryPath ] );\n\t\t\tbreak;\n\t\t}\n\t}`;
		nextSource = source.replace(
			legacySharedEntriesBlockPattern,
			nextSharedEntriesBlock,
		);
		if (nextSource === source) {
			throw new Error(
				`Unable to update ${path.relative(workspace.projectDir, webpackConfigPath)} for admin view shared entries.`,
			);
		}

		return nextSource;
	});
}

function resolveAdminViewRegistryPath(projectDir: string): string {
	const adminViewsDir = path.join(projectDir, "src", "admin-views");
	return [
		path.join(adminViewsDir, "index.ts"),
		path.join(adminViewsDir, "index.js"),
	].find((candidatePath) => fs.existsSync(candidatePath)) ?? path.join(adminViewsDir, "index.ts");
}

function readAdminViewRegistrySlugs(registryPath: string): string[] {
	if (!fs.existsSync(registryPath)) {
		return [];
	}

	const source = fs.readFileSync(registryPath, "utf8");
	return Array.from(
		source.matchAll(
			/^\s*import\s+['"]\.\/([^/'"]+)(?:\/index(?:\.[cm]?[jt]sx?)?)?['"];?\s*$/gmu,
		),
	).map((match) => match[1]);
}

async function writeAdminViewRegistry(
	projectDir: string,
	adminViewSlug: string,
): Promise<void> {
	const adminViewsDir = path.join(projectDir, "src", "admin-views");
	const registryPath = resolveAdminViewRegistryPath(projectDir);
	await fsp.mkdir(adminViewsDir, { recursive: true });

	const existingAdminViewSlugs = readWorkspaceInventory(projectDir).adminViews.map((entry) =>
		entry.slug,
	);
	const existingRegistrySlugs = readAdminViewRegistrySlugs(registryPath);
	const nextAdminViewSlugs = Array.from(
		new Set([...existingAdminViewSlugs, ...existingRegistrySlugs, adminViewSlug]),
	).sort();
	await fsp.writeFile(
		registryPath,
		buildAdminViewRegistrySource(nextAdminViewSlugs),
		"utf8",
	);
}

/**
 * Add one DataViews-powered WordPress admin screen scaffold to an official
 * workspace project.
 *
 * @param options Command options for the admin-view scaffold workflow.
 * @param options.adminViewName Human-entered admin screen name that will be
 * normalized and validated before files are written.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.source Optional data source locator. `rest-resource:<slug>`
 * wires the screen to an existing list-capable REST resource.
 * `core-data:<kind>/<name>` binds the screen to a supported WordPress-owned
 * core-data entity collection.
 * @returns A promise that resolves with the normalized `adminViewSlug`, optional
 * `source`, and owning `projectDir` after scaffold files and inventory entries
 * are written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the slug/source is invalid, or when a conflicting file or inventory entry exists.
 */
export async function runAddAdminViewCommand({
	adminViewName,
	cwd = process.cwd(),
	source,
}: RunAddAdminViewCommandOptions): Promise<{
	adminViewSlug: string;
	projectDir: string;
	source?: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	assertAdminViewPackageAvailability();
	const adminViewSlug = assertValidGeneratedSlug(
		"Admin view name",
		normalizeBlockSlug(adminViewName),
		"wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>]",
	);
	const parsedSource = parseAdminViewSource(source);
	const inventory = readWorkspaceInventory(workspace.projectDir);
	const restResource = resolveRestResourceSource(
		inventory.restResources,
		parsedSource,
	);
	const coreDataSource = isAdminViewCoreDataSource(parsedSource)
		? parsedSource
		: undefined;
	assertAdminViewDoesNotExist(workspace.projectDir, adminViewSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");
	const adminViewsIndexPath = resolveAdminViewRegistryPath(workspace.projectDir);
	const adminViewDir = path.join(workspace.projectDir, "src", "admin-views", adminViewSlug);
	const adminViewPhpPath = path.join(
		workspace.projectDir,
		"inc",
		"admin-views",
		`${adminViewSlug}.php`,
	);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			adminViewsIndexPath,
			blockConfigPath,
			bootstrapPath,
			buildScriptPath,
			packageJsonPath,
			webpackConfigPath,
		]),
		snapshotDirs: [],
		targetPaths: [adminViewDir, adminViewPhpPath],
	};

	try {
		await fsp.mkdir(adminViewDir, { recursive: true });
		await fsp.mkdir(path.dirname(adminViewPhpPath), { recursive: true });
		await ensureAdminViewPackageDependencies(workspace, parsedSource);
		await ensureAdminViewBootstrapAnchors(workspace);
		await ensureAdminViewBuildScriptAnchors(workspace);
		await ensureAdminViewWebpackAnchors(workspace);
		await fsp.writeFile(
			path.join(adminViewDir, "types.ts"),
			buildAdminViewTypesSource(adminViewSlug, restResource, coreDataSource),
			"utf8",
		);
		await fsp.writeFile(
			path.join(adminViewDir, "config.ts"),
			buildAdminViewConfigSource(
				adminViewSlug,
				workspace.workspace.textDomain,
				parsedSource,
				restResource,
			),
			"utf8",
		);
		await fsp.writeFile(
			path.join(adminViewDir, "data.ts"),
			coreDataSource
				? buildCoreDataAdminViewDataSource(adminViewSlug, coreDataSource)
				: restResource
				? buildRestAdminViewDataSource(adminViewSlug, restResource)
				: buildDefaultAdminViewDataSource(adminViewSlug),
			"utf8",
		);
		await fsp.writeFile(
			path.join(adminViewDir, "Screen.tsx"),
			coreDataSource
				? buildCoreDataAdminViewScreenSource(
						adminViewSlug,
						workspace.workspace.textDomain,
				  )
				: buildAdminViewScreenSource(
						adminViewSlug,
						workspace.workspace.textDomain,
				  ),
			"utf8",
		);
		await fsp.writeFile(
			path.join(adminViewDir, "index.tsx"),
			buildAdminViewEntrySource(adminViewSlug),
			"utf8",
		);
		await fsp.writeFile(
			path.join(adminViewDir, "style.scss"),
			buildAdminViewStyleSource(),
			"utf8",
		);
		await fsp.writeFile(
			adminViewPhpPath,
			buildAdminViewPhpSource(adminViewSlug, workspace),
			"utf8",
		);
		await writeAdminViewRegistry(workspace.projectDir, adminViewSlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			adminViewEntries: [buildAdminViewConfigEntry(adminViewSlug, parsedSource)],
		});

		return {
			adminViewSlug,
			projectDir: workspace.projectDir,
			source: parsedSource
				? formatAdminViewSourceLocator(parsedSource)
				: undefined,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
