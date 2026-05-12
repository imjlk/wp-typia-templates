import { quoteTsString } from './cli-add-shared.js';
import { type AdminViewRestResource } from './cli-add-workspace-admin-view-types.js';
import { getAdminViewRelativeModuleSpecifier } from './cli-add-workspace-admin-view-templates-shared.js';
import { toCamelCase, toPascalCase } from './string-case.js';

export function buildRestAdminViewTypesSource(
  adminViewSlug: string,
  restResource: AdminViewRestResource,
): string {
  const pascalName = toPascalCase(adminViewSlug);
  const restPascalName = toPascalCase(restResource.slug);
  const itemTypeName = `${pascalName}AdminViewItem`;
  const dataSetTypeName = `${pascalName}AdminViewDataSet`;
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

export function buildRestAdminViewConfigSource(
  adminViewSlug: string,
  textDomain: string,
): string {
  const pascalName = toPascalCase(adminViewSlug);
  const camelName = toCamelCase(adminViewSlug);
  const itemTypeName = `${pascalName}AdminViewItem`;
  const dataViewsName = `${camelName}AdminDataViews`;

  return `import { defineDataViews } from '@wp-typia/dataviews';
import { __ } from '@wordpress/i18n';

import type { ${itemTypeName} } from './types';

export const ${dataViewsName} = defineDataViews<${itemTypeName}>({
\tidField: 'id',
\tsearch: false,
\tsearchLabel: __( 'Search records', ${quoteTsString(textDomain)} ),
\tdefaultView: {
\t\tfields: ['id'],
\t\tpage: 1,
\t\tperPage: 10,
\t\ttype: 'table',
\t},
\tfields: {
\t\tid: {
\t\t\tenableHiding: false,
\t\t\tlabel: __( 'ID', ${quoteTsString(textDomain)} ),
\t\t\treadOnly: true,
\t\t\tschema: { type: 'integer' },
\t\t},
\t\t// REST-backed screens start with the guaranteed ID column. Add project-owned fields here once they are declared on the REST record type.
\t},
});
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
