import { describe, expect, test } from "bun:test";

import {
	CREATE_CHECKBOX_FIELD_NAMES,
	getCreateScrollTop,
	getCreateViewportHeight,
	getVisibleCreateFieldNames,
	isCreatePersistenceTemplate,
	isCreateQueryLoopTemplate,
	sanitizeCreateSubmitValues,
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
		expect(isCreateQueryLoopTemplate("query-loop")).toBe(true);
		expect(isCreateQueryLoopTemplate("basic")).toBe(false);

		expect(getVisibleCreateFieldNames({ template: "basic" })).not.toContain("data-storage");
		expect(getVisibleCreateFieldNames({ template: "basic" })).not.toContain(
			"alternate-render-targets",
		);
		expect(getVisibleCreateFieldNames({ template: "basic" })).not.toContain(
			"persistence-policy",
		);
		expect(getVisibleCreateFieldNames({ template: "basic" })).not.toContain(
			"query-post-type",
		);

		expect(getVisibleCreateFieldNames({ template: "persistence" })).toContain("data-storage");
		expect(getVisibleCreateFieldNames({ template: "persistence" })).toContain(
			"alternate-render-targets",
		);
		expect(getVisibleCreateFieldNames({ template: "compound" })).toContain(
			"persistence-policy",
		);
		expect(getVisibleCreateFieldNames({ template: "query-loop" })).toContain(
			"query-post-type",
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
			"alternate-render-targets",
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

	test("strips persistence-only fields before submitting non-persistence templates", () => {
		expect(
			sanitizeCreateSubmitValues({
				"data-storage": "custom-table",
				"dry-run": false,
				"alternate-render-targets": " email,mjml ",
				"external-layer-id": " acme/demo ",
				"external-layer-source": " ./layers/demo ",
				namespace: "demo",
				"no-install": false,
				"package-manager": "npm",
				"persistence-policy": "authenticated",
				"php-prefix": "DEMO",
				"project-dir": "demo-project",
				"query-post-type": " book ",
				template: "basic",
				"text-domain": "demo",
				variant: undefined,
				"with-migration-ui": false,
				"with-test-preset": false,
				"with-wp-env": true,
				yes: false,
			}),
		).toMatchObject({
			"alternate-render-targets": undefined,
			"data-storage": undefined,
			"external-layer-id": "acme/demo",
			"external-layer-source": "./layers/demo",
			"persistence-policy": undefined,
			"query-post-type": undefined,
			template: "basic",
			"with-wp-env": true,
		});

		expect(
			sanitizeCreateSubmitValues({
				"data-storage": "custom-table",
				"dry-run": false,
				"alternate-render-targets": " email,mjml ",
				namespace: "demo",
				"no-install": false,
				"package-manager": "npm",
				"persistence-policy": "authenticated",
				"php-prefix": "DEMO",
				"project-dir": "demo-project",
				"query-post-type": undefined,
				template: "compound",
				"text-domain": "demo",
				variant: undefined,
				"with-migration-ui": false,
				"with-test-preset": false,
				"with-wp-env": true,
				yes: false,
			}),
		).toMatchObject({
			"alternate-render-targets": "email,mjml",
			"data-storage": "custom-table",
			"external-layer-id": undefined,
			"external-layer-source": undefined,
			"persistence-policy": "authenticated",
			template: "compound",
		});
	});

	test("preserves query-loop post type only for query-loop templates", () => {
		expect(
			sanitizeCreateSubmitValues({
				"data-storage": undefined,
				"dry-run": false,
				"alternate-render-targets": " plain-text ",
				"external-layer-id": undefined,
				"external-layer-source": undefined,
				namespace: "demo",
				"no-install": false,
				"package-manager": "npm",
				"persistence-policy": undefined,
				"php-prefix": "DEMO",
				"project-dir": "demo-project",
				"query-post-type": " book ",
				template: "query-loop",
				"text-domain": "demo",
				variant: undefined,
				"with-migration-ui": false,
				"with-test-preset": false,
				"with-wp-env": false,
				yes: false,
			}),
		).toMatchObject({
			"alternate-render-targets": undefined,
			"query-post-type": "book",
			template: "query-loop",
		});
	});

	test("only preserves hidden external-layer defaults for built-in templates", () => {
		expect(
			sanitizeCreateSubmitValues({
				"data-storage": undefined,
				"dry-run": false,
				"external-layer-id": " acme/demo ",
				"external-layer-source": " ./layers/demo ",
				namespace: "demo",
				"no-install": false,
				"package-manager": "npm",
				"persistence-policy": undefined,
				"php-prefix": "DEMO",
				"project-dir": "demo-project",
				template: "@wp-typia/create-workspace-template",
				"text-domain": "demo",
				variant: undefined,
				"with-migration-ui": false,
				"with-test-preset": false,
				"with-wp-env": true,
				yes: false,
			}),
		).toMatchObject({
			"external-layer-id": undefined,
			"external-layer-source": undefined,
			template: "@wp-typia/create-workspace-template",
		});
	});
});
