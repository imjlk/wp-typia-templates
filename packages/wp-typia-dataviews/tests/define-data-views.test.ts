import { describe, expect, test } from "bun:test";

import { defineDataViews } from "../src/index.js";

interface Product {
  readonly createdAt: string;
  readonly featured: boolean;
  readonly homepage: string;
  readonly id: number;
  readonly price: number;
  readonly publishedOn: string;
  readonly status: "draft" | "publish";
  readonly title: string;
  readonly views: number;
}

describe("defineDataViews", () => {
  test("normalizes primitive schema metadata into DataViews field types", () => {
    const views = defineDataViews<Product>({
      defaultView: { type: "table" },
      fields: {
        featured: { schema: { type: "boolean" } },
        price: { schema: { type: "number" } },
        title: { schema: { type: "string" } },
        views: { schema: { type: "integer" } },
      },
      idField: "id",
      titleField: "title",
    });

    expect(views.fields).toEqual([
      { id: "featured", label: "Featured", type: "boolean" },
      { id: "price", label: "Price", type: "number" },
      { id: "title", label: "Title", type: "text" },
      { id: "views", label: "Views", type: "integer" },
    ]);
    expect(views.defaultView).toEqual({
      fields: ["featured", "price", "title", "views"],
      titleField: "title",
      type: "table",
    });
    expect(views.createConfig({ data: [{ ...sampleProduct, id: 7 }] }).getItemId?.(sampleProduct)).toBe(
      "1",
    );
  });

  test("normalizes enum metadata into typed field elements", () => {
    const views = defineDataViews<Product>({
      defaultView: { type: "table" },
      fields: {
        status: {
          schema: {
            enum: ["draft", "publish"],
            enumLabels: { publish: "Published" },
            type: "string",
          },
        },
      },
    });

    expect(views.fieldMap.status?.elements).toEqual([
      { label: "Draft", value: "draft" },
      { label: "Published", value: "publish" },
    ]);
  });

  test("normalizes date-like and URL metadata while preserving field options", () => {
    const views = defineDataViews<Product>({
      defaultView: {
        filters: [{ field: "createdAt", operator: "after", value: "2026-01-01" }],
        sort: { direction: "desc", field: "createdAt" },
        type: "table",
      },
      fields: {
        createdAt: {
          enableGlobalSearch: true,
          enableHiding: false,
          enableSorting: true,
          format: { datetime: "M j, Y g:i a", weekStartsOn: 1 },
          label: "Created",
          schema: { description: "Creation time", format: "date-time", type: "string" },
        },
        homepage: {
          schema: { format: "uri", type: "string" },
        },
        publishedOn: {
          filterBy: { operators: ["on", "beforeInc", "afterInc"] },
          schema: { format: "date", type: "string" },
        },
      },
    });

    expect(views.fieldMap.createdAt).toMatchObject({
      description: "Creation time",
      enableGlobalSearch: true,
      enableHiding: false,
      enableSorting: true,
      format: { datetime: "M j, Y g:i a", weekStartsOn: 1 },
      id: "createdAt",
      label: "Created",
      type: "datetime",
    });
    expect(views.fieldMap.homepage).toMatchObject({
      id: "homepage",
      label: "Homepage",
      type: "url",
    });
    expect(views.fieldMap.publishedOn).toMatchObject({
      filterBy: { operators: ["on", "beforeInc", "afterInc"] },
      id: "publishedOn",
      label: "Published On",
      type: "date",
    });
  });
});

const sampleProduct: Product = {
  createdAt: "2026-04-26T00:00:00Z",
  featured: true,
  homepage: "https://example.com",
  id: 1,
  price: 19.99,
  publishedOn: "2026-04-26",
  status: "publish",
  title: "Typed block patterns",
  views: 42,
};
