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
  DataViewsView,
  QueryAdapter,
} from '@wp-typia/dataviews';
import { DataForm, DataViews } from '@wordpress/dataviews/wp';
```

WordPress' package docs require the `/wp` import path when plugins or themes are
built with `@wordpress/scripts`. Do not import components from
`@wordpress/dataviews` directly in generated WordPress scripts.

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
import type { QueryAdapter } from '@wp-typia/dataviews';

interface Book {
  id: number;
  status: 'draft' | 'publish';
  title: string;
}

const toQueryArgs: QueryAdapter<Book, Record<string, unknown>> = (view) => ({
  page: view.page,
  per_page: view.perPage,
  search: view.search,
  status: view.filters?.find((filter) => filter.field === 'status')?.value,
});
```

This boundary lets future scaffold support generate typed fields, actions,
forms, and query adapters without hiding application-specific data fetching.

## Upstream References

- [@wordpress/dataviews package reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/)
- [Using Data Views to display and interact with data in plugins](https://developer.wordpress.org/news/2024/08/using-data-views-to-display-and-interact-with-data-in-plugins/)
- [Gutenberg DataViews style-loading discussion](https://github.com/wordpress/gutenberg/issues/71943)
