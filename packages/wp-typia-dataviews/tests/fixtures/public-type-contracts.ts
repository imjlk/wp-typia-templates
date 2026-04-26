import type {
  DataFormConfig,
  DataViewsAction,
  DataViewsConfig,
  DataViewsField,
  DataViewsView,
  DefinedDataViews,
  DefineDataViewsInput,
  QueryAdapter,
} from "@wp-typia/dataviews";
import { defineDataViews } from "@wp-typia/dataviews";

interface Book {
  readonly createdAt: string;
  readonly id: number;
  readonly published: boolean;
  readonly status: "draft" | "publish";
  readonly title: string;
  readonly views: number;
}

const fields = [
  {
    id: "title",
    label: "Title",
    type: "text",
  },
  {
    enableSorting: true,
    id: "views",
    label: "Views",
    sort: (left, right, direction) =>
      direction === "asc" ? left.views - right.views : right.views - left.views,
    type: "integer",
  },
] as const satisfies readonly DataViewsField<Book>[];

const view = {
  fields: ["title", "status"],
  filters: [
    { field: "status", operator: "isAny", value: ["draft", "publish"] },
    { field: "status", operator: "isAll", value: ["publish"] },
    { field: "views", operator: "lessThanOrEqual", value: 500 },
  ],
  page: 1,
  perPage: 10,
  search: "plugin",
  sort: { direction: "desc", field: "views" },
  titleField: "title",
  type: "table",
} as const satisfies DataViewsView<Book>;

const action = {
  callback: (items) => {
    items.map((item) => item.id);
  },
  id: "archive",
  label: "Archive",
  supportsBulk: true,
} satisfies DataViewsAction<Book>;

const config = {
  actions: [action],
  data: [],
  fields,
  onChangeSelection: (selection) => {
    selection.map((id) => id.toUpperCase());
  },
  selection: ["1"],
  view,
} satisfies DataViewsConfig<Book>;

const form = {
  fields: [{ id: "title", label: "Title" }],
} satisfies DataFormConfig<Book>;

const bookViews = defineDataViews<Book>({
  defaultView: {
    filters: [{ field: "status", operator: "isAny", value: ["draft", "publish"] }],
    sort: { direction: "desc", field: "views" },
    type: "table",
  },
  fields: {
    createdAt: {
      format: { datetime: "M j, Y g:i a" },
      schema: { format: "date-time", type: "string" },
    },
    published: { schema: { type: "boolean" } },
    status: {
      elements: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "publish" },
      ],
      filterBy: { operators: ["isAny", "isNone"] },
      schema: { enum: ["draft", "publish"], type: "string" },
    },
    title: {
      description: "Book title",
      enableGlobalSearch: true,
      enableHiding: false,
      label: "Title",
      schema: { type: "string" },
    },
    views: {
      enableSorting: true,
      schema: { type: "integer" },
    },
  },
  idField: "id",
  titleField: "title",
}) satisfies DefinedDataViews<Book>;

const configInput = {
  defaultView: { type: "table" },
  fields: {
    title: { schema: { type: "string" } },
  },
} satisfies DefineDataViewsInput<Book>;

const adapter: QueryAdapter<Book, { page?: number; per_page?: number; search?: string }> = (
  currentView,
) => {
  const query: { page?: number; per_page?: number; search?: string } = {};

  if (currentView.page !== undefined) {
    query.page = currentView.page;
  }
  if (currentView.perPage !== undefined) {
    query.per_page = currentView.perPage;
  }
  if (currentView.search !== undefined) {
    query.search = currentView.search;
  }

  return query;
};

// @ts-expect-error wp-typia owns the initial supported layout union.
const unsupportedView = { type: "calendar" } satisfies DataViewsView<Book>;

defineDataViews<Book>({
  defaultView: { type: "table" },
  fields: {
    // @ts-expect-error field ids must be keys of Book.
    missing: { label: "Missing" },
  },
});

defineDataViews<Book>({
  defaultView: { type: "table" },
  fields: {},
  // @ts-expect-error idField must be a key of Book.
  idField: "missing",
});

defineDataViews<Book>({
  defaultView: { type: "table" },
  fields: {
    status: {
      elements: [
        // @ts-expect-error element values must match the field value type.
        { label: "Private", value: "private" },
      ],
    },
  },
});

const invalidSortView = {
  // @ts-expect-error sort fields must be keys of Book.
  sort: { direction: "asc", field: "missing" },
  type: "table",
} satisfies DataViewsView<Book>;

void config;
void configInput;
void form;
void adapter(view, { fields });
void bookViews.createConfig({ data: [] });
void invalidSortView;
void unsupportedView;
