import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";

import {
  DATAVIEWS_FIELD_TYPES,
  DATAVIEWS_FILTER_OPERATORS,
  DATAVIEWS_LAYOUT_TYPES,
  DATAVIEWS_STANDALONE_STYLE_IMPORTS,
  DATAVIEWS_WORDPRESS_COMPONENT_IMPORT,
  DATAVIEWS_WORDPRESS_STYLE_DEPENDENCIES,
} from "../src/index.js";

const packageRoot = resolve(import.meta.dir, "..");

describe("@wp-typia/dataviews package contracts", () => {
  test("keeps upstream DataViews as an opt-in consumer dependency", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(packageRoot, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.["@wordpress/dataviews"]).toBeUndefined();
    expect(packageJson.peerDependencies?.["@wordpress/dataviews"]).toBeUndefined();
  });

  test("publishes the owned setup constants and narrow layout vocabulary", () => {
    expect(DATAVIEWS_LAYOUT_TYPES).toEqual([
      "table",
      "grid",
      "list",
      "activity",
      "pickerTable",
      "pickerGrid",
    ]);
    expect(DATAVIEWS_FIELD_TYPES).toContain("text");
    expect(DATAVIEWS_FILTER_OPERATORS).toContain("isAll");
    expect(DATAVIEWS_FILTER_OPERATORS).toContain("lessThanOrEqual");
    expect(DATAVIEWS_FILTER_OPERATORS).toContain("beforeInc");
    expect(DATAVIEWS_WORDPRESS_COMPONENT_IMPORT).toBe("@wordpress/dataviews/wp");
    expect(DATAVIEWS_WORDPRESS_STYLE_DEPENDENCIES).toEqual(["wp-components"]);
    expect(DATAVIEWS_STANDALONE_STYLE_IMPORTS).toContain(
      "@wordpress/dataviews/build-style/style.css",
    );
  });
});
