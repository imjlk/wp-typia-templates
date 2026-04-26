import type {
  DataFormConfig,
  DataViewsAction,
  DataViewsConfig,
  DataViewsField,
  DataViewsView,
  QueryAdapter,
} from "@wp-typia/dataviews";

interface Book {
  readonly id: number;
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
  filters: [{ field: "status", operator: "isAny", value: ["draft", "publish"] }],
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
  view,
} satisfies DataViewsConfig<Book>;

const form = {
  fields: [{ id: "title", label: "Title" }],
} satisfies DataFormConfig<Book>;

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

void config;
void form;
void adapter(view, { fields });
void unsupportedView;
