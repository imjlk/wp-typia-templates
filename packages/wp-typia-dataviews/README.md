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
  DataViewsAction,
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
