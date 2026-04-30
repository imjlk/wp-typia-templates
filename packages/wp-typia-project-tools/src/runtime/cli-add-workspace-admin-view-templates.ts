import path from 'node:path';

import { type WorkspaceProject } from './workspace-project.js';
import { quotePhpString } from './php-utils.js';
import { quoteTsString } from './cli-add-shared.js';
import {
  ADMIN_VIEWS_ASSET,
  ADMIN_VIEWS_SCRIPT,
  ADMIN_VIEWS_STYLE,
  ADMIN_VIEWS_STYLE_RTL,
  formatAdminViewSourceLocator,
  isAdminViewCoreDataSource,
  type AdminViewCoreDataSource,
  type AdminViewRestResource,
  type AdminViewSource,
} from './cli-add-workspace-admin-view-types.js';
import { toCamelCase, toPascalCase, toTitleCase } from './string-case.js';

function getAdminViewRelativeModuleSpecifier(
  adminViewSlug: string,
  workspaceFile: string,
): string {
  const adminViewDir = `src/admin-views/${adminViewSlug}`;
  const normalizedFile = workspaceFile.replace(/\\/gu, '/');
  const modulePath = normalizedFile.replace(/\.[cm]?[jt]sx?$/u, '');
  const relativeModulePath = path.posix.relative(adminViewDir, modulePath);

  return relativeModulePath.startsWith('.')
    ? relativeModulePath
    : `./${relativeModulePath}`;
}

export function buildAdminViewConfigEntry(
  adminViewSlug: string,
  source: AdminViewSource | undefined,
): string {
  return [
    '\t{',
    `\t\tfile: ${quoteTsString(`src/admin-views/${adminViewSlug}/index.tsx`)},`,
    `\t\tphpFile: ${quoteTsString(`inc/admin-views/${adminViewSlug}.php`)},`,
    `\t\tslug: ${quoteTsString(adminViewSlug)},`,
    source
      ? `\t\tsource: ${quoteTsString(formatAdminViewSourceLocator(source))},`
      : null,
    '\t},',
  ]
    .filter((line): line is string => typeof line === 'string')
    .join('\n');
}

export function buildAdminViewRegistrySource(adminViewSlugs: string[]): string {
  const importLines = adminViewSlugs
    .map((adminViewSlug) => `import './${adminViewSlug}';`)
    .join('\n');

  return `${importLines}${importLines ? '\n\n' : ''}// wp-typia add admin-view entries\n`;
}

/**
 * Build the generated admin-view item and dataset types for the selected source.
 */
export function buildAdminViewTypesSource(
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
    if (coreDataSource.entityKind === 'taxonomy') {
      return `export interface ${coreDataRecordTypeName} {
\tcount?: number;
\tdescription?: string;
\tid: number;
\tlink?: string;
\tmeta?: Record<string, unknown>;
\tname?: string;
\tparent?: number;
\tslug?: string;
\ttaxonomy?: string;
\t[key: string]: unknown;
}

export interface ${itemTypeName} {
\tcount: number;
\tdescription: string;
\tid: number;
\tlink: string;
\tname: string;
\tparent: number;
\traw: ${coreDataRecordTypeName};
\tslug: string;
\ttaxonomy: string;
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

/**
 * Build the generated DataViews config source for an admin-view scaffold.
 */
export function buildAdminViewConfigSource(
  adminViewSlug: string,
  textDomain: string,
  source: AdminViewSource | undefined,
  restResource: AdminViewRestResource | undefined,
): string {
  const pascalName = toPascalCase(adminViewSlug);
  const camelName = toCamelCase(adminViewSlug);
  const itemTypeName = `${pascalName}AdminViewItem`;
  const dataViewsName = `${camelName}AdminDataViews`;
  const isCoreDataSource = isAdminViewCoreDataSource(source);
  const isTaxonomyCoreDataSource =
    isAdminViewCoreDataSource(source) && source.entityKind === 'taxonomy';
  const defaultViewFields = restResource
    ? "['id']"
    : isTaxonomyCoreDataSource
      ? "['name', 'slug', 'count']"
      : isCoreDataSource
        ? "['title', 'slug', 'status', 'updatedAt']"
        : "['title', 'status', 'updatedAt']";
  const searchEnabled = restResource ? 'false' : 'true';
  const titleFieldSource = restResource
    ? ''
    : isTaxonomyCoreDataSource
      ? "\ttitleField: 'name',\n"
      : "\ttitleField: 'title',\n";
  const defaultViewEnhancementsSource = restResource
    ? ''
    : isTaxonomyCoreDataSource
      ? "\t\ttitleField: 'name',\n"
      : isCoreDataSource
        ? "\t\ttitleField: 'title',\n"
        : `\t\tsort: {
\t\t\tdirection: 'desc',
\t\t\tfield: 'updatedAt',
\t\t},
\t\ttitleField: 'title',
`;
  const additionalFieldsSource = restResource
    ? '\t\t// REST-backed screens start with the guaranteed ID column. Add project-owned fields here once they are declared on the REST record type.'
    : isTaxonomyCoreDataSource
      ? `\t\tcount: {
\t\t\tlabel: __( 'Count', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'integer' },
\t\t},
\t\tdescription: {
\t\t\tlabel: __( 'Description', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\tlink: {
\t\t\tlabel: __( 'Link', ${quoteTsString(textDomain)} ),
\t\t\tschema: { format: 'uri', type: 'string' },
\t\t},
\t\tname: {
\t\t\tenableGlobalSearch: true,
\t\t\tlabel: __( 'Name', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\tparent: {
\t\t\tlabel: __( 'Parent', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'integer' },
\t\t},
\t\tslug: {
\t\t\tenableGlobalSearch: true,
\t\t\tlabel: __( 'Slug', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},
\t\ttaxonomy: {
\t\t\tlabel: __( 'Taxonomy', ${quoteTsString(textDomain)} ),
\t\t\tschema: { type: 'string' },
\t\t},`
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

export function buildDefaultAdminViewDataSource(adminViewSlug: string): string {
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

export function buildRestAdminViewDataSource(
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

/**
 * Build a core-data-backed admin-view data module for a supported entity family.
 */
export function buildCoreDataAdminViewDataSource(
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

  if (coreDataSource.entityKind === 'taxonomy') {
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

function normalizeCoreDataNumber(value: unknown): number {
\treturn typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeCoreDataString(value: unknown): string {
\treturn typeof value === 'string' ? value : '';
}

function normalizeTaxonomyRecord(record: ${coreDataRecordTypeName}): ${itemTypeName} {
\treturn {
\t\tcount: normalizeCoreDataNumber(record.count),
\t\tdescription: normalizeCoreDataString(record.description),
\t\tid: record.id,
\t\tlink: normalizeCoreDataString(record.link),
\t\tname: normalizeCoreDataString(record.name) || normalizeCoreDataString(record.slug),
\t\tparent: normalizeCoreDataNumber(record.parent),
\t\traw: record,
\t\tslug: normalizeCoreDataString(record.slug),
\t\ttaxonomy: normalizeCoreDataString(record.taxonomy),
\t};
\t}

export function ${useEntityRecordName}(recordId: number | undefined) {
\treturn useEntityRecord<${coreDataRecordTypeName}>(
\t\tCORE_DATA_ENTITY_KIND,
\t\tCORE_DATA_ENTITY_NAME,
\t\trecordId ?? 0,
\t\t{ enabled: typeof recordId === 'number' },
\t);
\t}

export function ${useEntityRecordsName}(view: DataViewsView<${itemTypeName}>) {
\tconst query = ${dataViewsName}.toQueryArgs<${queryTypeName}>(view, {
\t\tperPageParam: 'per_page',
\t});

\treturn useEntityRecords<${coreDataRecordTypeName}>(
\t\tCORE_DATA_ENTITY_KIND,
\t\tCORE_DATA_ENTITY_NAME,
\t\tquery,
\t);
\t}

export function ${useAdminViewDataName}(view: DataViewsView<${itemTypeName}>) {
\tconst { hasResolved, isResolving, records, totalItems, totalPages } =
\t\t${useEntityRecordsName}(view);
\tconst items = useMemo(
\t\t() => (records ?? []).map((record) => normalizeTaxonomyRecord(record)),
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
\t}
`;
  }

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

export function buildAdminViewScreenSource(
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

export function buildCoreDataAdminViewScreenSource(
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

export function buildAdminViewEntrySource(adminViewSlug: string): string {
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

export function buildAdminViewStyleSource(): string {
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

export function buildAdminViewPhpSource(
  adminViewSlug: string,
  workspace: WorkspaceProject,
): string {
  const workspaceBaseName =
    workspace.packageName.split('/').pop() ?? workspace.packageName;
  const phpSlug = adminViewSlug.replace(/-/g, '_');
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
