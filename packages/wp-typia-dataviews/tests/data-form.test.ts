import { describe, expect, test } from "bun:test";

import {
  createDataFormConfig,
  defineDataViews,
  type DataFormField,
} from "../src/index.js";

interface Product {
  readonly id: number;
  readonly price: number;
  readonly sku: string;
  readonly status: "draft" | "publish";
  readonly summary: string;
  readonly title: string;
}

describe("DataForm helpers", () => {
  test("generates single-record form config from normalized fields", () => {
    const views = defineDataViews<Product>({
      defaultView: { type: "table" },
      fields: {
        id: { readOnly: true, schema: { type: "integer" } },
        price: { description: "Retail price", schema: { type: "number" } },
        title: { label: "Product title", schema: { type: "string" } },
      },
      idField: "id",
    });

    expect(views.toFormConfig()).toEqual({
      fields: [
        {
          children: undefined,
          description: "Retail price",
          id: "price",
          label: "Price",
          layout: undefined,
        },
        {
          children: undefined,
          description: undefined,
          id: "title",
          label: "Product title",
          layout: undefined,
        },
      ],
    });
  });

  test("supports custom field order, nested fields, read-only inclusion, and layouts", () => {
    const views = defineDataViews<Product>({
      defaultView: { type: "table" },
      fields: {
        id: { readOnly: true, schema: { type: "integer" } },
        price: { schema: { type: "number" } },
        sku: { schema: { type: "string" } },
        title: { schema: { type: "string" } },
      },
    });
    const identityCard = {
      children: [{ id: "title" }, { id: "sku", label: "Stock keeping unit" }],
      id: "id",
      label: "Identity",
    } satisfies DataFormField<Product>;

    expect(
      views.toFormConfig({
        fields: [identityCard, "price"],
        includeReadOnly: true,
        layout: { isOpened: true, summary: ["title", "sku"], type: "card" },
      }),
    ).toEqual({
      fields: [
        {
          children: [
            {
              children: undefined,
              description: undefined,
              id: "title",
              label: "Title",
              layout: { isOpened: true, summary: ["title", "sku"], type: "card" },
            },
            {
              children: undefined,
              description: undefined,
              id: "sku",
              label: "Stock keeping unit",
              layout: { isOpened: true, summary: ["title", "sku"], type: "card" },
            },
          ],
          description: undefined,
          id: "id",
          label: "Identity",
          layout: { isOpened: true, summary: ["title", "sku"], type: "card" },
        },
        {
          children: undefined,
          description: undefined,
          id: "price",
          label: "Price",
          layout: { isOpened: true, summary: ["title", "sku"], type: "card" },
        },
      ],
    });
  });

  test("maps schema metadata into DataForm validation hints", () => {
    const customSummaryValidation = () => null;
    const views = defineDataViews<Product>({
      defaultView: { type: "table" },
      fields: {
        price: {
          schema: { maximum: 999, minimum: 0, type: "number" },
        },
        sku: {
          schema: { maxLength: 32, pattern: "^[A-Z0-9-]+$", required: true, type: "string" },
        },
        status: {
          schema: { enum: ["draft", "publish"], type: "string" },
        },
        summary: {
          isValid: { custom: customSummaryValidation, minLength: 20 },
          schema: { maxLength: 200, minLength: 10, type: "string" },
        },
      },
    });

    expect(views.fieldMap.price?.isValid).toEqual({ max: 999, min: 0 });
    expect(views.fieldMap.sku?.isValid).toEqual({
      maxLength: 32,
      pattern: "^[A-Z0-9-]+$",
      required: true,
    });
    expect(views.fieldMap.status?.isValid).toEqual({ elements: true });
    expect(views.fieldMap.summary?.isValid).toEqual({
      custom: customSummaryValidation,
      maxLength: 200,
      minLength: 20,
    });
  });

  test("creates standalone form configs from DataViews fields", () => {
    const form = createDataFormConfig<Product>(
      [
        { id: "title", label: "Title", type: "text" },
        { description: "Internal SKU", id: "sku", label: "SKU", type: "text" },
      ],
      {
        fields: ["sku"],
        layout: { labelPosition: "side", type: "regular" },
      },
    );

    expect(form).toEqual({
      fields: [
        {
          children: undefined,
          description: "Internal SKU",
          id: "sku",
          label: "SKU",
          layout: { labelPosition: "side", type: "regular" },
        },
      ],
    });
  });
});
