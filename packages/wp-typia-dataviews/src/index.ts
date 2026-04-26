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

export type DataViewsItemIdValue = number | string;

export type DataViewsItemIdField<TItem extends object = DataViewsRecord> = {
  readonly [TKey in DataViewsFieldId<TItem>]-?: TItem[TKey] extends DataViewsItemIdValue
    ? TKey
    : never;
}[DataViewsFieldId<TItem>];

export type DataViewsFieldElementValue<TValue> =
  Extract<NonNullable<TValue>, DataViewsScalar> extends never
    ? DataViewsScalar
    : Extract<NonNullable<TValue>, DataViewsScalar>;

export type DataViewsWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DataViewsFieldFormat {
  readonly date?: string;
  readonly datetime?: string;
  readonly decimals?: number;
  readonly separatorDecimal?: string;
  readonly separatorThousand?: string;
  readonly weekStartsOn?: DataViewsWeekStart;
}

export type DataViewsFieldValidationCustomResult = null | string | Promise<null | string>;

export type DataViewsFieldValidationCustom<
  TItem extends object = DataViewsRecord,
  TValue = unknown,
> = (
  item: TItem,
  field: DataViewsField<TItem, TValue>,
) => DataViewsFieldValidationCustomResult;

export interface DataViewsFieldValidationRules<
  TItem extends object = DataViewsRecord,
  TValue = unknown,
> {
  readonly custom?: DataViewsFieldValidationCustom<TItem, TValue>;
  readonly elements?: boolean;
  readonly max?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly required?: boolean;
}

type MutableDataViewsFieldValidationRules<TItem extends object, TValue> = {
  -readonly [TKey in keyof DataViewsFieldValidationRules<TItem, TValue>]?: DataViewsFieldValidationRules<
    TItem,
    TValue
  >[TKey];
};

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
  readonly elements?: readonly DataViewsFieldElement<DataViewsFieldElementValue<TValue>>[];
  readonly enableGlobalSearch?: boolean;
  readonly enableHiding?: boolean;
  readonly enableSorting?: boolean;
  readonly filterBy?: DataViewsFieldFilter;
  readonly format?: DataViewsFieldFormat;
  readonly getValue?: (context: DataViewsFieldContext<TItem, TValue>) => TValue;
  readonly getValueFormatted?: (context: DataViewsFieldContext<TItem, TValue>) => string;
  readonly header?: string;
  readonly id: DataViewsFieldId<TItem>;
  readonly isValid?: DataViewsFieldValidationRules<TItem, TValue>;
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

export type DataViewsResolvedField<TItem extends object = DataViewsRecord> = {
  readonly [TKey in DataViewsFieldId<TItem>]: DataViewsField<TItem, TItem[TKey]>;
}[DataViewsFieldId<TItem>];

export type DataViewsConfigField<TItem extends object = DataViewsRecord> =
  | DataViewsField<TItem>
  | DataViewsResolvedField<TItem>;

export interface DataViewsConfig<TItem extends object = DataViewsRecord> {
  readonly actions?: readonly DataViewsAction<TItem>[];
  readonly data: readonly TItem[];
  readonly defaultLayouts?: DataViewsDefaultLayouts;
  readonly fields: readonly DataViewsConfigField<TItem>[];
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

export type DataFormFieldLayoutType = "regular" | "panel" | "card";

export type DataFormFieldLabelPosition = "none" | "side" | "top";

export interface DataFormFieldSummaryItem<
  TItem extends object = DataViewsRecord,
> {
  readonly id: DataViewsFieldId<TItem>;
  readonly visibility?: "always" | "when-collapsed";
}

export type DataFormFieldSummary<TItem extends object = DataViewsRecord> =
  | DataViewsFieldId<TItem>
  | readonly DataViewsFieldId<TItem>[]
  | readonly DataFormFieldSummaryItem<TItem>[];

export type DataFormPanelFieldSummary<TItem extends object = DataViewsRecord> =
  | DataViewsFieldId<TItem>
  | readonly DataViewsFieldId<TItem>[];

export interface DataFormRegularFieldLayout {
  readonly labelPosition?: DataFormFieldLabelPosition;
  readonly type: "regular";
}

export interface DataFormPanelFieldLayout<TItem extends object = DataViewsRecord> {
  readonly editVisibility?: "always" | "on-hover";
  readonly labelPosition?: DataFormFieldLabelPosition;
  readonly openAs?: "dropdown" | "modal";
  readonly summary?: DataFormPanelFieldSummary<TItem>;
  readonly type: "panel";
}

export interface DataFormCardFieldLayout<TItem extends object = DataViewsRecord> {
  readonly isOpened?: boolean;
  readonly summary?: DataFormFieldSummary<TItem>;
  readonly type: "card";
  readonly withHeader?: boolean;
}

export type DataFormFieldLayout<TItem extends object = DataViewsRecord> =
  | DataFormFieldLayoutType
  | DataFormRegularFieldLayout
  | DataFormPanelFieldLayout<TItem>
  | DataFormCardFieldLayout<TItem>;

export interface DataFormField<TItem extends object = DataViewsRecord> {
  readonly children?: readonly DataFormField<TItem>[];
  readonly description?: string;
  readonly id: DataViewsFieldId<TItem>;
  readonly label?: string;
  readonly layout?: DataFormFieldLayout<TItem>;
}

export interface DataFormConfig<TItem extends object = DataViewsRecord> {
  readonly fields: readonly DataFormField<TItem>[];
  readonly validation?: Partial<Record<DataViewsFieldId<TItem>, string>>;
}

export type DataFormFieldInput<TItem extends object = DataViewsRecord> =
  | DataViewsFieldId<TItem>
  | DataFormField<TItem>;

export interface DataFormConfigOptions<TItem extends object = DataViewsRecord> {
  readonly fields?: readonly DataFormFieldInput<TItem>[];
  readonly includeReadOnly?: boolean;
  readonly layout?: DataFormFieldLayout<TItem>;
}

export interface QueryAdapterContext<TItem extends object = DataViewsRecord> {
  readonly fields: readonly DataViewsConfigField<TItem>[];
}

export type QueryAdapter<
  TItem extends object = DataViewsRecord,
  TQuery = Record<string, unknown>,
> = (view: DataViewsView<TItem>, context: QueryAdapterContext<TItem>) => TQuery;

export type DataViewsQueryArgs = Record<string, unknown>;

export type DataViewsQueryParamName<TQuery extends object = DataViewsQueryArgs> = Extract<
  keyof TQuery,
  string
>;

type DataViewsQueryDefaultParamName = "page" | "per_page" | "search";

type DataViewsQueryParamOption<TQuery extends object> =
  | DataViewsQueryParamName<TQuery>
  | false;

type DataViewsQueryDefaultParamOption<
  TQuery extends object,
  TDefaultParam extends string,
  TOptionName extends string,
> = TDefaultParam extends DataViewsQueryParamName<TQuery>
  ? { readonly [TKey in TOptionName]?: DataViewsQueryParamOption<TQuery> }
  : { readonly [TKey in TOptionName]: DataViewsQueryParamOption<TQuery> };

type DataViewsQueryDefaultParamOptions<TQuery extends object> =
  DataViewsQueryDefaultParamOption<TQuery, "page", "pageParam"> &
    DataViewsQueryDefaultParamOption<TQuery, "per_page", "perPageParam"> &
    DataViewsQueryDefaultParamOption<TQuery, "search", "searchParam">;

type DataViewsQueryDefaultSortParamOptions<TQuery extends object> =
  DataViewsQueryDefaultParamOption<TQuery, "orderby", "orderByParam"> &
    DataViewsQueryDefaultParamOption<TQuery, "order", "orderParam">;

type DataViewsQueryMissingDefaultParamNames<TQuery extends object> = Exclude<
  DataViewsQueryDefaultParamName,
  DataViewsQueryParamName<TQuery>
>;

export type DataViewsQuerySortValue = boolean | number | string;

export type DataViewsQuerySortMap<TItem extends object = DataViewsRecord> = Readonly<
  Partial<Record<DataViewsFieldId<TItem>, DataViewsQuerySortValue>>
>;

export interface DataViewsQueryAdapterMapContext<
  TItem extends object = DataViewsRecord,
> extends QueryAdapterContext<TItem> {
  readonly view: DataViewsView<TItem>;
}

export type DataViewsQueryMapperResult<TQuery extends object = DataViewsQueryArgs> =
  | Partial<TQuery>
  | null
  | undefined;

export type DataViewsQuerySortMapper<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = (
  sort: DataViewsSort<TItem>,
  context: DataViewsQueryAdapterMapContext<TItem>,
) => DataViewsQueryMapperResult<TQuery>;

export type DataViewsQueryFilterMapper<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = (
  filter: DataViewsFilter<TItem>,
  context: DataViewsQueryAdapterMapContext<TItem>,
) => DataViewsQueryMapperResult<TQuery>;

interface DataViewsQueryAdapterBaseOptions<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> {
  readonly mapFilter?: DataViewsQueryFilterMapper<TItem, TQuery>;
  readonly orderByParam?: DataViewsQueryParamOption<TQuery>;
  readonly orderParam?: DataViewsQueryParamOption<TQuery>;
  readonly pageParam?: DataViewsQueryParamOption<TQuery>;
  readonly perPageParam?: DataViewsQueryParamOption<TQuery>;
  readonly searchParam?: DataViewsQueryParamOption<TQuery>;
}

type DataViewsQueryAdapterSortOptions<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> =
  | { readonly mapSort?: DataViewsQuerySortMapper<TItem, TQuery> }
  | ({
      readonly mapSort: DataViewsQuerySortMap<TItem>;
    } & DataViewsQueryDefaultSortParamOptions<TQuery>);

type DataViewsQueryAdapterRuntimeOptions<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = DataViewsQueryAdapterBaseOptions<TItem, TQuery> & {
  readonly mapSort?: DataViewsQuerySortMap<TItem> | DataViewsQuerySortMapper<TItem, TQuery>;
};

export type DataViewsQueryAdapterOptions<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = DataViewsQueryAdapterBaseOptions<TItem, TQuery> &
  DataViewsQueryDefaultParamOptions<TQuery> &
  DataViewsQueryAdapterSortOptions<TItem, TQuery>;

type DataViewsQueryAdapterArguments<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = [DataViewsQueryMissingDefaultParamNames<TQuery>] extends [never]
  ? [
      options?: DataViewsQueryAdapterOptions<TItem, TQuery>,
      context?: QueryAdapterContext<TItem>,
    ]
  : [
      options: DataViewsQueryAdapterOptions<TItem, TQuery>,
      context?: QueryAdapterContext<TItem>,
    ];

type DataViewsQueryAdapterFactoryArguments<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = [DataViewsQueryMissingDefaultParamNames<TQuery>] extends [never]
  ? [options?: DataViewsQueryAdapterOptions<TItem, TQuery>]
  : [options: DataViewsQueryAdapterOptions<TItem, TQuery>];

type DefinedDataViewsQueryAdapterArguments<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
> = DataViewsQueryAdapterFactoryArguments<TItem, TQuery>;

export type DataViewsCompatibleFieldType<TValue> =
  NonNullable<TValue> extends boolean
    ? "boolean"
    : NonNullable<TValue> extends number
      ? "integer" | "number"
      : NonNullable<TValue> extends string
        ? "date" | "datetime" | "email" | "text" | "url"
        : NonNullable<TValue> extends readonly unknown[]
          ? "array"
          : NonNullable<TValue> extends object
            ? "media" | "object"
            : DataViewsFieldType;

export type DataViewsFieldSchemaType =
  | "array"
  | "boolean"
  | "integer"
  | "number"
  | "object"
  | "string";

export type DataViewsFieldSchemaFormat =
  | "date"
  | "date-time"
  | "datetime"
  | "email"
  | "uri"
  | "url"
  | (string & {});

export interface DataViewsFieldSchemaMetadata<TValue = DataViewsScalar> {
  readonly const?: DataViewsFieldElementValue<TValue>;
  readonly description?: string;
  readonly enum?: readonly DataViewsFieldElementValue<TValue>[];
  readonly enumLabels?: Readonly<Record<string, string>>;
  readonly format?: DataViewsFieldSchemaFormat;
  readonly max?: number;
  readonly maxLength?: number;
  readonly maximum?: number;
  readonly min?: number;
  readonly minLength?: number;
  readonly minimum?: number;
  readonly pattern?: string;
  readonly required?: boolean;
  readonly type?: DataViewsFieldSchemaType | readonly DataViewsFieldSchemaType[];
}

export interface DefineDataViewsFieldDefinition<
  TItem extends object,
  TKey extends DataViewsFieldId<TItem>,
> extends Omit<DataViewsField<TItem, TItem[TKey]>, "elements" | "id" | "label" | "type"> {
  readonly elements?: readonly DataViewsFieldElement<DataViewsFieldElementValue<TItem[TKey]>>[];
  readonly label?: string;
  readonly schema?: DataViewsFieldSchemaMetadata<TItem[TKey]>;
  readonly type?: DataViewsCompatibleFieldType<TItem[TKey]>;
}

export type DefineDataViewsFields<TItem extends object> = {
  readonly [TKey in DataViewsFieldId<TItem>]?: DefineDataViewsFieldDefinition<TItem, TKey>;
};

export interface DefineDataViewsInput<TItem extends object> {
  readonly actions?: readonly DataViewsAction<TItem>[];
  readonly defaultLayouts?: DataViewsDefaultLayouts;
  readonly defaultView: DataViewsView<TItem>;
  readonly fields: DefineDataViewsFields<TItem>;
  readonly getItemId?: (item: TItem) => string;
  readonly getItemLevel?: (item: TItem) => number;
  readonly idField?: DataViewsItemIdField<TItem>;
  readonly search?: boolean;
  readonly searchLabel?: string;
  readonly titleField?: DataViewsFieldId<TItem>;
}

export interface DefineDataViewsConfigOptions<TItem extends object> {
  readonly actions?: readonly DataViewsAction<TItem>[];
  readonly data: readonly TItem[];
  readonly getItemId?: (item: TItem) => string;
  readonly getItemLevel?: (item: TItem) => number;
  readonly isLoading?: boolean;
  readonly onChangeSelection?: (selection: readonly string[]) => void;
  readonly onChangeView?: (view: DataViewsView<TItem>) => void;
  readonly paginationInfo?: DataViewsPaginationInfo;
  readonly search?: boolean;
  readonly searchLabel?: string;
  readonly selection?: readonly string[];
  readonly view?: DataViewsView<TItem>;
}

export type DefinedDataViewsFieldMap<TItem extends object> = Readonly<
  Partial<Record<DataViewsFieldId<TItem>, DataViewsResolvedField<TItem>>>
>;

export interface DefinedDataViews<TItem extends object> {
  readonly actions?: readonly DataViewsAction<TItem>[];
  readonly defaultLayouts?: DataViewsDefaultLayouts;
  readonly defaultView: DataViewsView<TItem>;
  readonly fieldMap: DefinedDataViewsFieldMap<TItem>;
  readonly fields: readonly DataViewsResolvedField<TItem>[];
  readonly getItemId?: (item: TItem) => string;
  readonly getItemLevel?: (item: TItem) => number;
  readonly idField?: DataViewsItemIdField<TItem>;
  readonly search?: boolean;
  readonly searchLabel?: string;
  readonly titleField?: DataViewsFieldId<TItem>;
  readonly createConfig: (options: DefineDataViewsConfigOptions<TItem>) => DataViewsConfig<TItem>;
  readonly toFormConfig: (options?: DataFormConfigOptions<TItem>) => DataFormConfig<TItem>;
  readonly toQueryArgs: <TQuery extends object = DataViewsQueryArgs>(
    view: DataViewsView<TItem>,
    ...args: DefinedDataViewsQueryAdapterArguments<TItem, TQuery>
  ) => Partial<TQuery>;
}

export function defineDataViews<TItem extends object>(
  definition: DefineDataViewsInput<TItem>,
): DefinedDataViews<TItem> {
  const fields = normalizeDefineDataViewsFields(definition.fields);
  const fieldMap = Object.fromEntries(
    fields.map((field) => [field.id, field]),
  ) as DefinedDataViewsFieldMap<TItem>;
  const defaultView = normalizeDefineDataViewsDefaultView(definition, fields);
  const defaultGetItemId = definition.getItemId ?? createGetItemId(definition.idField);
  const toQueryArgs = <TQuery extends object = DataViewsQueryArgs>(
    view: DataViewsView<TItem>,
    ...args: DefinedDataViewsQueryAdapterArguments<TItem, TQuery>
  ): Partial<TQuery> =>
    toDataViewsQueryArgs<TItem, TQuery>(
      view,
      ...([args[0], { fields }] as DataViewsQueryAdapterArguments<TItem, TQuery>),
    );
  const toFormConfig = (options?: DataFormConfigOptions<TItem>): DataFormConfig<TItem> =>
    createDataFormConfig(fields, options);

  return {
    actions: definition.actions,
    createConfig: (options) => ({
      actions: options.actions ?? definition.actions,
      data: options.data,
      defaultLayouts: definition.defaultLayouts,
      fields,
      getItemId: options.getItemId ?? defaultGetItemId,
      getItemLevel: options.getItemLevel ?? definition.getItemLevel,
      isLoading: options.isLoading,
      onChangeSelection: options.onChangeSelection,
      onChangeView: options.onChangeView,
      paginationInfo: options.paginationInfo,
      search: options.search ?? definition.search,
      searchLabel: options.searchLabel ?? definition.searchLabel,
      selection: options.selection,
      view: options.view ?? defaultView,
    }),
    toQueryArgs,
    defaultLayouts: definition.defaultLayouts,
    defaultView,
    fieldMap,
    fields,
    getItemId: defaultGetItemId,
    getItemLevel: definition.getItemLevel,
    idField: definition.idField,
    search: definition.search,
    searchLabel: definition.searchLabel,
    titleField: definition.titleField,
    toFormConfig,
  };
}

export function createDataFormConfig<TItem extends object = DataViewsRecord>(
  fields: readonly DataViewsConfigField<TItem>[],
  options: DataFormConfigOptions<TItem> = {},
): DataFormConfig<TItem> {
  const fieldMap = createDataViewsConfigFieldMap(fields);
  const formFields = normalizeDataFormFields(
    options.fields ?? fields,
    fieldMap,
    options.layout,
    options.includeReadOnly === true,
  );

  return {
    fields: formFields,
  };
}

export function createDataViewsQueryAdapter<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
>(
  ...args: DataViewsQueryAdapterFactoryArguments<TItem, TQuery>
): QueryAdapter<TItem, Partial<TQuery>> {
  return (view, context) =>
    toDataViewsQueryArgs<TItem, TQuery>(
      view,
      ...([args[0], context] as DataViewsQueryAdapterArguments<TItem, TQuery>),
    );
}

export function toDataViewsQueryArgs<
  TItem extends object = DataViewsRecord,
  TQuery extends object = DataViewsQueryArgs,
>(
  view: DataViewsView<TItem>,
  ...args: DataViewsQueryAdapterArguments<TItem, TQuery>
): Partial<TQuery> {
  const options = (args[0] ?? {}) as DataViewsQueryAdapterRuntimeOptions<TItem, TQuery>;
  const context = args[1] ?? { fields: [] };
  const query: Record<string, unknown> = {};
  const mapContext: DataViewsQueryAdapterMapContext<TItem> = {
    ...context,
    view,
  };

  assignDataViewsQueryParam(query, options.pageParam, "page", view.page);
  assignDataViewsQueryParam(query, options.perPageParam, "per_page", view.perPage);
  assignDataViewsQueryParam(query, options.searchParam, "search", view.search);
  mergeDataViewsSortQuery(query, view, options, mapContext);
  mergeDataViewsFilterQueries(query, view, options, mapContext);

  return query as Partial<TQuery>;
}

function normalizeDefineDataViewsFields<TItem extends object>(
  fields: DefineDataViewsFields<TItem>,
): readonly DataViewsResolvedField<TItem>[] {
  return (
    Object.entries(fields) as Array<
      [
        DataViewsFieldId<TItem>,
        DefineDataViewsFieldDefinition<TItem, DataViewsFieldId<TItem>> | undefined,
      ]
    >
  )
    .filter(
      (entry): entry is [
        DataViewsFieldId<TItem>,
        DefineDataViewsFieldDefinition<TItem, DataViewsFieldId<TItem>>,
      ] => entry[1] !== undefined,
    )
    .map(([id, field]) => normalizeDefineDataViewsField(id, field));
}

function normalizeDefineDataViewsField<
  TItem extends object,
  TKey extends DataViewsFieldId<TItem>,
>(
  id: TKey,
  field: DefineDataViewsFieldDefinition<TItem, TKey>,
): DataViewsField<TItem, TItem[TKey]> {
  const { isValid, schema, ...fieldDefinition } = field;
  const label = fieldDefinition.label ?? formatDataViewsFieldLabel(id);
  const description = fieldDefinition.description ?? schema?.description;
  const type = normalizeDataViewsFieldType(fieldDefinition.type, schema);
  const elements = fieldDefinition.elements ?? normalizeDataViewsFieldElements(schema);
  const validation = normalizeDataViewsFieldValidation(isValid, schema);

  return {
    ...fieldDefinition,
    description,
    elements,
    id,
    isValid: validation,
    label,
    type,
  };
}

function createDataViewsConfigFieldMap<TItem extends object>(
  fields: readonly DataViewsConfigField<TItem>[],
): ReadonlyMap<DataViewsFieldId<TItem>, DataViewsConfigField<TItem>> {
  return new Map(fields.map((field) => [field.id, field]));
}

function normalizeDataFormFields<TItem extends object>(
  fields: readonly (DataFormFieldInput<TItem> | DataViewsConfigField<TItem>)[],
  fieldMap: ReadonlyMap<DataViewsFieldId<TItem>, DataViewsConfigField<TItem>>,
  layout: DataFormFieldLayout<TItem> | undefined,
  includeReadOnly: boolean,
): readonly DataFormField<TItem>[] {
  const normalizedFields: DataFormField<TItem>[] = [];

  for (const field of fields) {
    const normalizedField = normalizeDataFormField(field, fieldMap, layout, includeReadOnly);

    if (normalizedField !== undefined) {
      normalizedFields.push(normalizedField);
    }
  }

  return normalizedFields;
}

function normalizeDataFormField<TItem extends object>(
  field: DataFormFieldInput<TItem> | DataViewsConfigField<TItem>,
  fieldMap: ReadonlyMap<DataViewsFieldId<TItem>, DataViewsConfigField<TItem>>,
  layout: DataFormFieldLayout<TItem> | undefined,
  includeReadOnly: boolean,
): DataFormField<TItem> | undefined {
  if (typeof field === "string") {
    return normalizeDataFormFieldObject({ id: field }, fieldMap, layout, includeReadOnly);
  }

  return normalizeDataFormFieldObject(field, fieldMap, layout, includeReadOnly);
}

function normalizeDataFormFieldObject<TItem extends object>(
  field: Partial<DataFormField<TItem>> & Pick<DataFormField<TItem>, "id">,
  fieldMap: ReadonlyMap<DataViewsFieldId<TItem>, DataViewsConfigField<TItem>>,
  layout: DataFormFieldLayout<TItem> | undefined,
  includeReadOnly: boolean,
): DataFormField<TItem> | undefined {
  const sourceField = fieldMap.get(field.id);
  const resolvedLayout = field.layout ?? layout;

  if (sourceField?.readOnly === true && !includeReadOnly) {
    return undefined;
  }

  return {
    children:
      field.children === undefined
        ? undefined
        : normalizeDataFormFields(field.children, fieldMap, layout, includeReadOnly),
    description: field.description ?? sourceField?.description,
    id: field.id,
    label: field.label ?? sourceField?.label,
    layout: resolvedLayout,
  };
}

function normalizeDefineDataViewsDefaultView<TItem extends object>(
  definition: DefineDataViewsInput<TItem>,
  fields: readonly DataViewsResolvedField<TItem>[],
): DataViewsView<TItem> {
  const defaults =
    definition.titleField === undefined
      ? { fields: fields.map((field) => field.id) }
      : { fields: fields.map((field) => field.id), titleField: definition.titleField };

  return {
    ...defaults,
    ...definition.defaultView,
  };
}

function normalizeDataViewsFieldType<TValue>(
  type: DataViewsCompatibleFieldType<TValue> | undefined,
  schema: DataViewsFieldSchemaMetadata<TValue> | undefined,
): DataViewsFieldType | undefined {
  if (type !== undefined) {
    return type;
  }

  if (schema?.format === "date-time" || schema?.format === "datetime") {
    return "datetime";
  }

  if (schema?.format === "date") {
    return "date";
  }

  if (schema?.format === "email") {
    return "email";
  }

  if (schema?.format === "uri" || schema?.format === "url") {
    return "url";
  }

  const schemaType = getFirstDataViewsSchemaType(schema?.type);

  return schemaType;
}

function normalizeDataViewsFieldElements<TValue>(
  schema: DataViewsFieldSchemaMetadata<TValue> | undefined,
): readonly DataViewsFieldElement<DataViewsFieldElementValue<TValue>>[] | undefined {
  const values = getDataViewsSchemaElementValues(schema);

  if (values.length === 0) {
    return undefined;
  }

  return values.map((value) => ({
    label: schema?.enumLabels?.[String(value)] ?? formatDataViewsElementLabel(value),
    value,
  }));
}

function getDataViewsSchemaElementValues<TValue>(
  schema: DataViewsFieldSchemaMetadata<TValue> | undefined,
): readonly DataViewsFieldElementValue<TValue>[] {
  if (schema?.enum !== undefined) {
    return schema.enum;
  }

  if (schema?.const !== undefined) {
    return [schema.const];
  }

  return [];
}

function normalizeDataViewsFieldValidation<
  TItem extends object,
  TValue,
>(
  fieldValidation: DataViewsFieldValidationRules<TItem, TValue> | undefined,
  schema: DataViewsFieldSchemaMetadata<TValue> | undefined,
): DataViewsFieldValidationRules<TItem, TValue> | undefined {
  const schemaValidation: MutableDataViewsFieldValidationRules<TItem, TValue> = {};

  if (schema?.enum !== undefined || schema?.const !== undefined) {
    schemaValidation.elements = true;
  }
  if (schema?.max !== undefined || schema?.maximum !== undefined) {
    schemaValidation.max = schema.max ?? schema.maximum;
  }
  if (schema?.maxLength !== undefined) {
    schemaValidation.maxLength = schema.maxLength;
  }
  if (schema?.min !== undefined || schema?.minimum !== undefined) {
    schemaValidation.min = schema.min ?? schema.minimum;
  }
  if (schema?.minLength !== undefined) {
    schemaValidation.minLength = schema.minLength;
  }
  if (schema?.pattern !== undefined) {
    schemaValidation.pattern = schema.pattern;
  }
  if (schema?.required !== undefined) {
    schemaValidation.required = schema.required;
  }

  const validation = {
    ...schemaValidation,
    ...fieldValidation,
  };

  return Object.values(validation).some((value) => value !== undefined)
    ? validation
    : undefined;
}

function getFirstDataViewsSchemaType(
  type: DataViewsFieldSchemaMetadata["type"] | undefined,
): DataViewsFieldType | undefined {
  const schemaType = Array.isArray(type)
    ? (type.find((candidate) => candidate !== "object") ?? type[0])
    : type;

  if (schemaType === "string") {
    return "text";
  }

  if (
    schemaType === "array" ||
    schemaType === "boolean" ||
    schemaType === "integer" ||
    schemaType === "number" ||
    schemaType === "object"
  ) {
    return schemaType;
  }

  return undefined;
}

function createGetItemId<TItem extends object>(
  idField: DataViewsItemIdField<TItem> | undefined,
): ((item: TItem) => string) | undefined {
  if (idField === undefined) {
    return undefined;
  }

  return (item) => {
    const idValue = item[idField];

    if (typeof idValue === "string") {
      return idValue;
    }

    if (typeof idValue === "number" && Number.isFinite(idValue)) {
      return String(idValue);
    }

    throw new TypeError(
      `defineDataViews idField "${idField}" must resolve to a string or finite number. Provide getItemId for custom item identity values.`,
    );
  };
}

function assignDataViewsQueryParam<TQuery extends object>(
  query: Record<string, unknown>,
  param: DataViewsQueryParamName<TQuery> | false | undefined,
  defaultParam: string,
  value: unknown,
): void {
  if (param === false || value === undefined) {
    return;
  }

  query[param ?? defaultParam] = value;
}

function mergeDataViewsSortQuery<TItem extends object, TQuery extends object>(
  query: Record<string, unknown>,
  view: DataViewsView<TItem>,
  options: DataViewsQueryAdapterRuntimeOptions<TItem, TQuery>,
  context: DataViewsQueryAdapterMapContext<TItem>,
): void {
  if (view.sort === undefined || options.mapSort === undefined) {
    return;
  }

  if (typeof options.mapSort === "function") {
    mergeDataViewsQueryResult(query, options.mapSort(view.sort, context));
    return;
  }

  const orderBy = getDataViewsQuerySortMapValue(options.mapSort, view.sort.field);

  if (orderBy === undefined) {
    return;
  }

  if (options.orderByParam === false) {
    return;
  }

  assignDataViewsQueryParam(query, options.orderByParam, "orderby", orderBy);
  assignDataViewsQueryParam(query, options.orderParam, "order", view.sort.direction);
}

function getDataViewsQuerySortMapValue<TItem extends object>(
  mapSort: DataViewsQuerySortMap<TItem>,
  field: DataViewsFieldId<TItem>,
): DataViewsQuerySortValue | undefined {
  if (!Object.prototype.hasOwnProperty.call(mapSort, field)) {
    return undefined;
  }

  return mapSort[field];
}

function mergeDataViewsFilterQueries<TItem extends object, TQuery extends object>(
  query: Record<string, unknown>,
  view: DataViewsView<TItem>,
  options: DataViewsQueryAdapterRuntimeOptions<TItem, TQuery>,
  context: DataViewsQueryAdapterMapContext<TItem>,
): void {
  if (options.mapFilter === undefined) {
    return;
  }

  for (const filter of view.filters ?? []) {
    mergeDataViewsQueryResult(query, options.mapFilter(filter, context));
  }
}

function mergeDataViewsQueryResult<TQuery extends object>(
  query: Record<string, unknown>,
  result: DataViewsQueryMapperResult<TQuery>,
): void {
  if (result === undefined || result === null) {
    return;
  }

  Object.assign(query, result);
}

function formatDataViewsFieldLabel(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDataViewsElementLabel(value: DataViewsScalar): string {
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return formatDataViewsFieldLabel(String(value));
}

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
