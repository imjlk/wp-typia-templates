import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { ValidationErrorSummary } from "../../examples/my-typia-block/src/components/ValidationErrorSummary";
import { isNonArrayObject } from "../../examples/my-typia-block/src/migrations/plain-object";
import { generateUUID } from "../../examples/my-typia-block/src/utils/uuid";

describe("my-typia-block reference app helpers", () => {
  test("generateUUID uses native randomUUID when available and falls back to a valid UUID v4", () => {
    const nativeUuid = "00000000-0000-4000-8000-000000000000";

    expect(generateUUID(() => nativeUuid)).toBe(nativeUuid);
    expect(generateUUID(null)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

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
});
