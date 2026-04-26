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
- `QueryAdapter`
- `DataViewsQueryAdapterOptions`
- `defineDataViews`
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
  DataViewsField,
  DataViewsQueryAdapterOptions,
  DataViewsView,
  QueryAdapter,
} from '@wp-typia/dataviews';
import {
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

When multiple filters return the same query key, the adapter uses the last
returned value. Return an array value from `mapFilter` when a data source needs
combined filter semantics.

Use `createDataViewsQueryAdapter(options)` when a reusable `QueryAdapter` is
more convenient, or call `definedViews.toQueryArgs(view, options)` from a
`defineDataViews<T>()` result to reuse the normalized field context.

This boundary lets future scaffold support generate typed fields, actions,
forms, and query adapters without hiding application-specific data fetching.

## Upstream References

- [@wordpress/dataviews package reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/)
- [Using Data Views to display and interact with data in plugins](https://developer.wordpress.org/news/2024/08/using-data-views-to-display-and-interact-with-data-in-plugins/)
- [Gutenberg DataViews style-loading discussion](https://github.com/wordpress/gutenberg/issues/71943)
