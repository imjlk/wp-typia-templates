import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { ValidationErrorSummary } from "../../examples/my-typia-block/src/components/ValidationErrorSummary";
import { isNonArrayObject } from "../../examples/my-typia-block/src/migrations/plain-object";

describe("my-typia-block reference app helpers", () => {
  test("migration object helper preserves the example semantics", () => {
    class ExampleValue {}

    expect(isNonArrayObject({})).toBe(true);
    expect(isNonArrayObject(Object.create(null))).toBe(true);
    expect(isNonArrayObject(new ExampleValue())).toBe(true);
    expect(isNonArrayObject([])).toBe(false);
    expect(isNonArrayObject(null)).toBe(false);
  });

  test("ValidationErrorSummary renders the shared heading and list items", () => {
    const rendered = renderToStaticMarkup(
      <ValidationErrorSummary
        errors={["content: string", "padding.top: number"]}
      />
    );

    expect(rendered).toContain("Validation Errors:");
    expect(rendered).toContain("content: string");
    expect(rendered).toContain("padding.top: number");
    expect(rendered).toContain("<ul");
  });

  test("migration-detector keeps the expected facade exports after the module split", () => {
    const migrationDetectorSource = fs.readFileSync(
      path.join(
        import.meta.dir,
        "../../examples/my-typia-block/src/migration-detector.ts"
      ),
      "utf8"
    );

    expect(migrationDetectorSource).toContain("BatchMigrationResult");
    expect(migrationDetectorSource).toContain("BlockScanResult");
    expect(migrationDetectorSource).toContain("MigrationAnalysis");
    expect(migrationDetectorSource).toContain("batchMigrateScanResults");
    expect(migrationDetectorSource).toContain("detectBlockMigration");
    expect(migrationDetectorSource).toContain("generateMigrationReport");
    expect(migrationDetectorSource).toContain("scanSiteForMigrations");
  });

  test("reference app imports the shared runtime identifier helper instead of a local UUID utility", () => {
    const editSource = fs.readFileSync(
      path.join(import.meta.dir, "../../examples/my-typia-block/src/edit.tsx"),
      "utf8"
    );
    const hooksSource = fs.readFileSync(
      path.join(import.meta.dir, "../../examples/my-typia-block/src/hooks.ts"),
      "utf8"
    );
    const validatorsSource = fs.readFileSync(
      path.join(import.meta.dir, "../../examples/my-typia-block/src/validators.ts"),
      "utf8"
    );

    expect(editSource).toContain("@wp-typia/block-runtime/identifiers");
    expect(hooksSource).toContain("@wp-typia/block-runtime/identifiers");
    expect(validatorsSource).toContain("@wp-typia/block-runtime/identifiers");
    expect(
      fs.existsSync(
        path.join(import.meta.dir, "../../examples/my-typia-block/src/utils/uuid.ts")
      )
    ).toBe(false);
  });
});
