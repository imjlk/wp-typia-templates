/**
 * Stable wp-typia-owned DataViews layout identifiers.
 *
 * @remarks
 * These names mirror the WordPress DataViews layouts that generated admin
 * surfaces are expected to target first. Keeping the union local lets wp-typia
 * absorb upstream Gutenberg churn without making generated projects depend on
 * Gutenberg's internal TypeScript declarations as their public contract.
 */
export const DATAVIEWS_LAYOUT_TYPES = [
  "table",
  "grid",
  "list",
  "activity",
  "pickerTable",
  "pickerGrid",
] as const;

export type DataViewsLayoutType = (typeof DATAVIEWS_LAYOUT_TYPES)[number];

/**
 * Narrow field vocabulary used by wp-typia scaffold and adapter contracts.
 *
 * @remarks
 * This intentionally stays smaller than upstream DataViews. Project-specific
 * field behavior should be expressed through callbacks and adapter code instead
 * of leaking upstream component types into this package.
 */
export const DATAVIEWS_FIELD_TYPES = [
  "text",
  "integer",
  "number",
  "date",
  "datetime",
  "boolean",
  "email",
  "url",
  "media",
  "array",
  "object",
] as const;

export type DataViewsFieldType = (typeof DATAVIEWS_FIELD_TYPES)[number];

export const DATAVIEWS_SORT_DIRECTIONS = ["asc", "desc"] as const;

export type DataViewsSortDirection = (typeof DATAVIEWS_SORT_DIRECTIONS)[number];

export const DATAVIEWS_FILTER_OPERATORS = [
  "is",
  "isNot",
  "isAny",
  "isNone",
  "isAll",
  "contains",
  "notContains",
  "startsWith",
  "lessThan",
  "lessThanOrEqual",
  "greaterThan",
  "greaterThanOrEqual",
  "between",
  "on",
  "notOn",
  "before",
  "beforeInc",
  "after",
  "afterInc",
  "inThePast",
  "over",
] as const;

export type DataViewsFilterOperator = (typeof DATAVIEWS_FILTER_OPERATORS)[number];

export type DataViewsRecord = Record<string, unknown>;

export type DataViewsFieldId<TItem extends object = DataViewsRecord> = Extract<
  keyof TItem,
  string
>;

export type DataViewsScalar = boolean | number | string;

export interface DataViewsFieldElement<TValue = DataViewsScalar> {
  readonly label: string;
  readonly value: TValue;
}

export interface DataViewsFieldFilter {
  readonly operators?: readonly DataViewsFilterOperator[];
}

export interface DataViewsFieldContext<
  TItem extends object = DataViewsRecord,
  TValue = unknown,
> {
  readonly field: DataViewsField<TItem, TValue>;
  readonly item: TItem;
}

export interface DataViewsFieldUpdateContext<
  TItem extends object = DataViewsRecord,
  TValue = unknown,
> extends DataViewsFieldContext<TItem, TValue> {
  readonly value: TValue;
}

/**
 * Field definition surface owned by wp-typia.
 *
 * @remarks
 * Rendering hooks return `unknown` instead of React nodes so this package does
 * not force React or Gutenberg declarations onto default scaffold consumers.
 */
export interface DataViewsField<
  TItem extends object = DataViewsRecord,
  TValue = unknown,
> {
  readonly description?: string;
  readonly elements?: readonly DataViewsFieldElement<TValue>[];
  readonly enableGlobalSearch?: boolean;
  readonly enableHiding?: boolean;
  readonly enableSorting?: boolean;
  readonly filterBy?: DataViewsFieldFilter;
  readonly getValue?: (context: DataViewsFieldContext<TItem, TValue>) => TValue;
  readonly getValueFormatted?: (context: DataViewsFieldContext<TItem, TValue>) => string;
  readonly header?: string;
  readonly id: DataViewsFieldId<TItem>;
  readonly label: string;
  readonly placeholder?: string;
  readonly readOnly?: boolean;
  readonly render?: (context: DataViewsFieldContext<TItem, TValue>) => unknown;
  readonly setValue?: (context: DataViewsFieldUpdateContext<TItem, TValue>) => TItem;
  readonly sort?: (
    left: TItem,
    right: TItem,
    direction: DataViewsSortDirection,
  ) => number;
  readonly type?: DataViewsFieldType;
}

export interface DataViewsFilter<
  TItem extends object = DataViewsRecord,
  TValue = unknown,
> {
  readonly field: DataViewsFieldId<TItem>;
  readonly isLocked?: boolean;
  readonly operator: DataViewsFilterOperator;
  readonly value?: TValue;
}

export interface DataViewsSort<TItem extends object = DataViewsRecord> {
  readonly direction: DataViewsSortDirection;
  readonly field: DataViewsFieldId<TItem>;
}

export type DataViewsLayoutConfig = Readonly<Record<string, unknown>>;

export type DataViewsDefaultLayouts = Readonly<
  Partial<Record<DataViewsLayoutType, DataViewsLayoutConfig>>
>;

export interface DataViewsPaginationInfo {
  readonly totalItems: number;
  readonly totalPages: number;
}

/**
 * View state passed to DataViews and query adapters.
 */
export interface DataViewsView<TItem extends object = DataViewsRecord> {
  readonly descriptionField?: DataViewsFieldId<TItem>;
  readonly fields?: readonly DataViewsFieldId<TItem>[];
  readonly filters?: readonly DataViewsFilter<TItem>[];
  readonly groupBy?: {
    readonly direction?: DataViewsSortDirection;
    readonly field: DataViewsFieldId<TItem>;
    readonly showLabel?: boolean;
  };
  readonly infiniteScrollEnabled?: boolean;
  readonly layout?: DataViewsLayoutConfig;
  readonly mediaField?: DataViewsFieldId<TItem>;
  readonly page?: number;
  readonly perPage?: number;
  readonly search?: string;
  readonly showDescription?: boolean;
  readonly showLevels?: boolean;
  readonly showMedia?: boolean;
  readonly showTitle?: boolean;
  readonly sort?: DataViewsSort<TItem>;
  readonly startPosition?: number;
  readonly titleField?: DataViewsFieldId<TItem>;
  readonly type: DataViewsLayoutType;
}

export interface DataViewsActionContext<TItem extends object = DataViewsRecord> {
  readonly view: DataViewsView<TItem>;
}

export interface DataViewsAction<TItem extends object = DataViewsRecord> {
  readonly callback: (
    items: readonly TItem[],
    context: DataViewsActionContext<TItem>,
  ) => Promise<void> | void;
  readonly context?: "item" | "bulk" | "both";
  readonly disabled?: boolean | ((item: TItem) => boolean);
  readonly hideModalHeader?: boolean;
  readonly icon?: unknown;
  readonly id: string;
  readonly isEligible?: (item: TItem) => boolean;
  readonly isPrimary?: boolean;
  readonly label: string;
  readonly modalHeader?: string;
  readonly modalSize?: "small" | "medium" | "large" | "fill";
  readonly supportsBulk?: boolean;
}

export interface DataViewsConfig<TItem extends object = DataViewsRecord> {
  readonly actions?: readonly DataViewsAction<TItem>[];
  readonly data: readonly TItem[];
  readonly defaultLayouts?: DataViewsDefaultLayouts;
  readonly fields: readonly DataViewsField<TItem>[];
  readonly getItemId?: (item: TItem) => string;
  readonly getItemLevel?: (item: TItem) => number;
  readonly isLoading?: boolean;
  readonly onChangeView?: (view: DataViewsView<TItem>) => void;
  readonly paginationInfo?: DataViewsPaginationInfo;
  readonly search?: boolean;
  readonly searchLabel?: string;
  readonly onChangeSelection?: (selection: readonly string[]) => void;
  readonly selection?: readonly string[];
  readonly view: DataViewsView<TItem>;
}

export interface DataFormField<TItem extends object = DataViewsRecord> {
  readonly children?: readonly DataFormField<TItem>[];
  readonly description?: string;
  readonly id: DataViewsFieldId<TItem>;
  readonly label?: string;
  readonly layout?: "regular" | "panel" | "card";
}

export interface DataFormConfig<TItem extends object = DataViewsRecord> {
  readonly fields: readonly DataFormField<TItem>[];
  readonly validation?: Partial<Record<DataViewsFieldId<TItem>, string>>;
}

export interface QueryAdapterContext<TItem extends object = DataViewsRecord> {
  readonly fields: readonly DataViewsField<TItem>[];
}

export type QueryAdapter<
  TItem extends object = DataViewsRecord,
  TQuery = Record<string, unknown>,
> = (view: DataViewsView<TItem>, context: QueryAdapterContext<TItem>) => TQuery;

/**
 * WordPress-script import path for actual DataViews/DataForm components.
 */
export const DATAVIEWS_WORDPRESS_COMPONENT_IMPORT = "@wordpress/dataviews/wp";

/**
 * Stylesheet dependency that WordPress plugins should preserve for DataViews UI.
 */
export const DATAVIEWS_WORDPRESS_STYLE_DEPENDENCIES = ["wp-components"] as const;

/**
 * CSS imports needed when the upstream package is rendered outside WordPress.
 */
export const DATAVIEWS_STANDALONE_STYLE_IMPORTS = [
  "@wordpress/theme/design-tokens.css",
  "@wordpress/components/build-style/style.css",
  "@wordpress/dataviews/build-style/style.css",
] as const;
