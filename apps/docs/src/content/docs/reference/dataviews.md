---
title: 'DataViews Compatibility'
---

wp-typia exposes DataViews/DataForm support as an opt-in compatibility boundary.
The default `wp-typia create` and `wp-typia add block` paths do not add
DataViews dependencies.

## Package Boundary

`@wp-typia/dataviews` owns the stable wp-typia-facing contract for generated
admin screens:

- `DataViewsField`
- `DataViewsView`
- `DataViewsAction`
- `DataFormConfig`
- `DataFormConfigOptions`
- `DataViewsFieldValidationRules`
- `QueryAdapter`
- `DataViewsQueryAdapterOptions`
- `defineDataViews`
- `createDataFormConfig`
- `createDataViewsQueryAdapter`
- `toDataViewsQueryArgs`

The facade intentionally does not re-export upstream Gutenberg types. This keeps
generated projects insulated from DataViews/DataForm API churn while wp-typia
can map its smaller contract to the current upstream component surface.

## WordPress Usage

Use the wp-typia package for local type contracts and the WordPress package for
actual components:

```ts
import type {
  DataFormConfig,
  DataFormConfigOptions,
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
import { DataForm, DataViews } from '@wordpress/dataviews/wp';
```

WordPress' package docs require the `/wp` import path when plugins or themes are
built with `@wordpress/scripts`. Do not import components from
`@wordpress/dataviews` directly in generated WordPress scripts.

## Typed Config

Use `defineDataViews<T>()` when field ids, defaults, and metadata should be tied
to a TypeScript model:

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
  defaultView: {
    sort: { direction: 'desc', field: 'views' },
    type: 'table',
  },
  fields: {
    title: { schema: { type: 'string' } },
    status: {
      filterBy: { operators: ['isAny', 'isNone'] },
      schema: {
        enum: ['draft', 'publish'],
        enumLabels: { publish: 'Published' },
        type: 'string',
      },
    },
    views: {
      enableSorting: true,
      schema: { type: 'integer' },
    },
  },
});

const config = productViews.createConfig({ data: [] });
```

The field map rejects ids outside `keyof T`, `idField` only accepts string or
number model keys for automatic DataViews row identity, and sort/filter fields
in `defaultView` stay tied to the same model. Use `getItemId` for custom,
nullable, or object-backed identity values. Runtime metadata maps common schema
types through `normalizeDataViewsFieldType`: `string` to `text`,
`number`/`integer` to numeric fields, `boolean` to `boolean`, `date`/`date-time`
formats to `date`/`datetime`, and `email`/`uri`/`url` formats to `email`/`url`.
Literal and enum metadata can generate `elements` without hand-writing the
repetitive value/label objects.

## DataForm Config

Use `definedViews.toFormConfig(options)` to generate a basic DataForm
configuration for single-record editing from the same normalized fields:

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

The helper fills DataForm field labels and descriptions from the normalized
DataViews fields, supports nested `children`, and supports the basic
`regular`, `panel`, and `card` layouts owned by the wp-typia facade. Read-only
fields are skipped by default; pass `includeReadOnly: true` when a read-only
field should still be shown in the generated form. For standalone field arrays,
call `createDataFormConfig(fields, options)`.

Schema metadata is mapped into DataForm field validation hints on
`field.isValid`: `required`, `minimum`/`min`, `maximum`/`max`, `pattern`,
`minLength`, and `maxLength`. Enum and const schemas opt into element
validation. These hints are intentionally best-effort UI metadata. They do not
execute typia validation and should not replace runtime validation for REST
writes, persistence, or server-side authorization.

## Styles

Within WordPress, keep `wp-components` as a stylesheet dependency for plugin
styles that render DataViews screens so WordPress loads component styles in the
right order.

Outside WordPress, load the upstream package styles explicitly:

```ts
import '@wordpress/theme/design-tokens.css';
import '@wordpress/components/build-style/style.css';
import '@wordpress/dataviews/build-style/style.css';
```

## Admin Screen Scaffold

Use `wp-typia add admin-view <name>` when you want an opt-in WordPress admin
screen that demonstrates typed DataViews config, explicit fetching, loading
state, and pagination without changing default block scaffolds:

```sh
wp-typia add admin-view products
wp-typia add admin-view products --source rest-resource:products
wp-typia add admin-view posts --source core-data:postType/post
```

Current public CLI releases gate `wp-typia add admin-view` until
`@wp-typia/dataviews` is published to npm. Until that package is publicly
available, treat the examples below as the intended scaffold shape rather than a
workflow that is installable from npm today.

The scaffold writes `src/admin-views/<name>/` plus
`inc/admin-views/<name>.php`, adds `@wp-typia/dataviews` and
`@wordpress/dataviews` only to that workspace, and wires the screen under the
WordPress Tools menu. The generated `data.ts` file is intentionally small and
replaceable. Without `--source` it uses a local fetcher; with
`--source rest-resource:<slug>` it calls the list endpoint from an existing
list-capable `wp-typia add rest-resource` scaffold. That scaffold can continue
to export individual endpoint helpers, or it can group them with
`defineRestResource(...)` from `@wp-typia/rest` and let the admin view consume
the same resource facade.

Current public scaffolds also support `core-data:<kind>/<name>` entity sources
for a narrow first-wave boundary:

- `core-data:postType/<post-type>`
- `core-data:taxonomy/<taxonomy>`

That path adds direct `@wordpress/core-data` and `@wordpress/data`
dependencies only for the generated workspace and keeps the fetching/edit
boundary on the WordPress entity store. The maintainer boundary in
[`docs/core-data-adapter-boundary.md`](../maintainers/core-data-adapter-boundary.md)
explains why this first implementation stays narrower than the REST-resource
path.

Prefer custom UI instead of DataViews when the interaction is primarily a
guided flow, a canvas/editor experience, a dense dashboard with unrelated
widgets, or a purpose-built form where table/list/grid view state is incidental.
DataViews works best for browse, filter, search, sort, select, and paginate
screens over one coherent collection.

## Query Ownership

DataViews is a UI layer. It does not own REST or entity fetching for wp-typia.
Generated and hand-authored integrations should map view state into project
queries explicitly:

```ts
import type { DataViewsView } from '@wp-typia/dataviews';
import { toDataViewsQueryArgs } from '@wp-typia/dataviews';

interface Book {
  id: number;
  createdAt: string;
  status: 'draft' | 'publish';
  title: string;
}

interface BookRestQuery {
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'title';
  page?: number;
  per_page?: number;
  search?: string;
  status?: readonly Book['status'][];
}

const view: DataViewsView<Book> = {
  filters: [
    { field: 'status', operator: 'isAny', value: ['draft', 'publish'] },
  ],
  page: 1,
  perPage: 20,
  search: 'patterns',
  sort: { direction: 'desc', field: 'createdAt' },
  type: 'table',
};

const queryArgs = toDataViewsQueryArgs<Book, BookRestQuery>(view, {
  mapSort: {
    createdAt: 'date',
    title: 'title',
  },
  mapFilter(filter) {
    if (filter.field === 'status' && filter.operator === 'isAny') {
      return { status: filter.value as readonly Book['status'][] };
    }

    return undefined;
  },
});
```

`page`, `perPage`, and `search` map to `page`, `per_page`, and `search` by
default. Sorts are only emitted when `mapSort` maps the DataViews field to a
query value such as a WordPress REST `orderby` value. Filters are only emitted
when `mapFilter` returns query args, so unknown filters remain explicit no-ops
instead of being guessed.

When your query type omits any default pagination or search key, explicitly
remap it with `pageParam`, `perPageParam`, or `searchParam`, or set that param to
`false`.

When multiple filters return the same query key, the adapter uses the last
returned value. Return an array value from `mapFilter` when a data source needs
combined filter semantics.

Use `createDataViewsQueryAdapter(options)` when a reusable `QueryAdapter` is
more convenient, or call `definedViews.toQueryArgs(view, options)` from a
`defineDataViews<T>()` result to reuse the normalized field context.

This boundary lets future scaffold support generate typed fields, actions,
forms, and query adapters without hiding application-specific data fetching.
When you adopt the optional resource facade, `toRestResourceListRequest(...)`
is the intended bridge point from DataViews-owned view state into the list
request shape that your resource facade expects.

## Upstream References

- [@wordpress/dataviews package reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/)
- [Using Data Views to display and interact with data in plugins](https://developer.wordpress.org/news/2024/08/using-data-views-to-display-and-interact-with-data-in-plugins/)
- [Gutenberg DataViews style-loading discussion](https://github.com/wordpress/gutenberg/issues/71943)
