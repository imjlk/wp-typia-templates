import { describe, expect, test } from "bun:test";

import {
	CREATE_CHECKBOX_FIELD_NAMES,
	getCreateScrollTop,
	getCreateViewportHeight,
	getVisibleCreateFieldNames,
	isCreatePersistenceTemplate,
} from "../src/ui/create-flow-model";

describe("create flow layout model", () => {
	test("keeps the checkbox cluster order stable", () => {
		const basicFields = getVisibleCreateFieldNames({ template: "basic" });
		expect(basicFields.slice(-CREATE_CHECKBOX_FIELD_NAMES.length)).toEqual([
			...CREATE_CHECKBOX_FIELD_NAMES,
		]);
	});

	test("shows persistence fields only for persistence-capable templates", () => {
		expect(isCreatePersistenceTemplate("persistence")).toBe(true);
		expect(isCreatePersistenceTemplate("compound")).toBe(true);
		expect(isCreatePersistenceTemplate("basic")).toBe(false);

		expect(getVisibleCreateFieldNames({ template: "basic" })).not.toContain("data-storage");
		expect(getVisibleCreateFieldNames({ template: "basic" })).not.toContain(
			"persistence-policy",
		);

		expect(getVisibleCreateFieldNames({ template: "persistence" })).toContain("data-storage");
		expect(getVisibleCreateFieldNames({ template: "compound" })).toContain(
			"persistence-policy",
		);
	});

	test("inserts persistence fields before the checkbox cluster", () => {
		const persistenceFields = getVisibleCreateFieldNames({ template: "persistence" });
		expect(persistenceFields).toEqual([
			"project-dir",
			"template",
			"package-manager",
			"namespace",
			"text-domain",
			"php-prefix",
			"data-storage",
			"persistence-policy",
			...CREATE_CHECKBOX_FIELD_NAMES,
		]);
	});

	test("keeps early fields pinned at the top in a small viewport", () => {
		const viewportHeight = getCreateViewportHeight(18);
		expect(viewportHeight).toBe(8);
		expect(
			getCreateScrollTop({
				activeFieldName: "project-dir",
				values: { template: "basic" },
				viewportHeight,
			}),
		).toBe(0);
	});

	test("scrolls trailing checkbox fields into view in a small viewport", () => {
		const viewportHeight = getCreateViewportHeight(18);
		expect(
			getCreateScrollTop({
				activeFieldName: "with-migration-ui",
				values: { template: "basic" },
				viewportHeight,
			}),
		).toBeGreaterThan(0);
	});

	test("scrolls persistence checkbox traversal in a small viewport", () => {
		const viewportHeight = getCreateViewportHeight(18);
		expect(
			getCreateScrollTop({
				activeFieldName: "with-test-preset",
				values: { template: "compound" },
				viewportHeight,
			}),
		).toBeGreaterThan(
			getCreateScrollTop({
				activeFieldName: "persistence-policy",
				values: { template: "compound" },
				viewportHeight,
			}),
		);
	});
});
