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
  DataViewsView,
  QueryAdapter,
} from '@wp-typia/dataviews';
```

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
