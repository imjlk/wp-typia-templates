# @wp-typia/dataviews

Opt-in typed compatibility facade for WordPress DataViews and DataForm
integrations.

This package owns the wp-typia-facing type contract for generated admin screens
without making `@wordpress/dataviews` part of default `wp-typia create` or
`wp-typia add block` workflows.

## Usage

Use this package for types and adapter contracts:

```ts
import type {
  DataFormConfig,
  DataFormConfigOptions,
  DataViewsAction,
  DataViewsField,
  DataViewsFieldValidationRules,
  DataViewsQueryAdapterOptions,
  DataViewsView,
  QueryAdapter,
} from '@wp-typia/dataviews';
import {
  createDataFormConfig,
  createDataViewsQueryAdapter,
  defineDataViews,
  toDataViewsQueryArgs,
} from '@wp-typia/dataviews';
```

`defineDataViews<T>()` adds the typed convenience layer for field maps,
defaults, and common schema metadata:

```ts
interface Product {
  id: number;
  status: 'draft' | 'publish';
  title: string;
  views: number;
}

const productViews = defineDataViews<Product>({
  idField: 'id',
  titleField: 'title',
  defaultView: { type: 'table', page: 1, perPage: 20 },
  fields: {
    title: { schema: { type: 'string' } },
    status: {
      schema: {
        type: 'string',
        enum: ['draft', 'publish'],
        enumLabels: { publish: 'Published' },
      },
    },
    views: { enableSorting: true, schema: { type: 'integer' } },
  },
});

const config = productViews.createConfig({ data: [] });
```

Common schema metadata is normalized for DataViews defaults, including
`string` to `text`, numeric schemas to numeric fields, date formats to
`date`/`datetime`, and `email`/`uri`/`url` formats to `email`/`url`.
`idField` is limited to string or number model keys for automatic row identity;
use `getItemId` when identity comes from a nullable, object-backed, or custom
value.

Generate DataForm configuration for single-record editing workflows from the
same field contract:

```ts
const form = productViews.toFormConfig({
  fields: [
    'title',
    {
      id: 'status',
      layout: { labelPosition: 'side', type: 'regular' },
    },
    'views',
  ],
});
```

By default, read-only fields are skipped. Pass `includeReadOnly: true` when a
read-only field should still appear in the generated form, or call
`createDataFormConfig(fields, options)` when you have a standalone field list.
The helper fills DataForm labels and descriptions from normalized DataViews
fields while keeping the actual `DataForm` component import in the WordPress
package.

Validation metadata is mapped as UI hints on `field.isValid`: `required`,
`minimum`/`min`, `maximum`/`max`, `pattern`, `minLength`, and `maxLength`.
Enum and const schemas also opt into DataForm element validation. These hints do
not replace typia/schema runtime validation; keep runtime validation as the
source of truth for persistence and REST writes.

## Normalization boundaries

`defineDataViews<T>()` performs a small amount of runtime normalization for the
wp-typia facade:

- field labels and descriptions fall back from the field id and schema metadata;
- schema metadata can infer DataViews field `type`, enum/const `elements`, and
  `field.isValid` UI hints;
- omitted `defaultView.fields` fall back to the normalized field ids, and
  `titleField` is copied into the normalized default view when declared;
- `toFormConfig()` / `createDataFormConfig()` fill labels and descriptions from
  normalized DataViews fields while filtering read-only fields unless
  `includeReadOnly: true` is requested;
- `toDataViewsQueryArgs()` emits only the mapped pagination, search, sort, and
  filter params that the caller explicitly enables.

Other guarantees remain intentionally type-level only:

- TypeScript ensures field ids, sort fields, filter fields, and query adapter
  option names line up when you stay inside the public types.
- Runtime helpers do not try to repair arbitrary `view` overrides passed through
  `createConfig({ view })` or `toDataViewsQueryArgs(view, ...)`; if you cast
  around the types, the runtime trusts the provided object shape.
- Query adapters merge mapper results exactly as returned. When multiple mapper
  calls write the same query key, the last returned value wins.

Map DataViews state into REST or custom data-provider args explicitly:

```ts
interface ProductRestQuery {
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'title';
  page?: number;
  per_page?: number;
  search?: string;
  status?: readonly Product['status'][];
}

const queryArgs = productViews.toQueryArgs<ProductRestQuery>(config.view, {
  mapSort: {
    title: 'title',
  },
  mapFilter(filter) {
    if (filter.field === 'status' && filter.operator === 'isAny') {
      return { status: filter.value as readonly Product['status'][] };
    }

    return undefined;
  },
});

const reusableAdapter = createDataViewsQueryAdapter<Product, ProductRestQuery>({
  mapSort: { title: 'title' },
});

const standaloneArgs = toDataViewsQueryArgs<Product, ProductRestQuery>(
  config.view,
  {
    mapSort: { title: 'title' },
  },
);
```

Pagination and search use WordPress REST-style names by default: `page`,
`per_page`, and `search`. Sorts and filters are emitted only when `mapSort` or
`mapFilter` handles them, so unsupported filters stay explicit no-ops instead of
being guessed.
If your query type does not declare those default keys, explicitly remap them
with `pageParam`, `perPageParam`, and `searchParam`, or set the unused params to
`false`.
If multiple filters return the same query key, the last returned value wins; use
array values from `mapFilter` when your data source needs combined semantics.

Use WordPress' package for the actual components in WordPress-built scripts:

```ts
import { DataForm, DataViews } from '@wordpress/dataviews/wp';
```

The facade intentionally does not re-export upstream Gutenberg types. That keeps
generated projects insulated from DataViews/DataForm API churn while future
scaffolds can map this smaller contract into the current upstream component
shape.

## Boundary

- `@wp-typia/dataviews` provides type contracts and setup constants only.
- It does not depend on `@wordpress/dataviews`.
- It does not add DataViews dependencies to default block scaffolds.
- Consumers remain responsible for mapping `DataViewsView` state into REST,
  entity, or custom data-provider query arguments.
