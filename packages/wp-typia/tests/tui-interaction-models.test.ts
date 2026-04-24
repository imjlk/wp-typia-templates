import { describe, expect, test } from "bun:test";

import {
	getVisibleAddFieldNames,
	isAddPersistenceTemplate,
	sanitizeAddSubmitValues,
} from "../src/ui/add-flow-model";
import { getWrappedFieldNeighbors } from "../src/ui/first-party-form-model";
import {
	getVisibleMigrateFieldNames,
	sanitizeMigrateSubmitValues,
} from "../src/ui/migrate-flow-model";

describe("first-party TUI interaction models", () => {
	test("field neighbor lookup avoids self-loops for single-field states", () => {
		expect(getWrappedFieldNeighbors(["command"], "command")).toEqual({});
		expect(getWrappedFieldNeighbors(["kind", "name", "template"], "name")).toEqual({
			nextFieldName: "template",
			previousFieldName: "kind",
		});
	});

	test("add flow keeps visible field ordering stable across kind switches", () => {
		expect(getVisibleAddFieldNames({ kind: "block", template: "basic" })).toEqual([
			"kind",
			"name",
			"template",
		]);
		expect(
			getVisibleAddFieldNames({ kind: "block", template: "persistence" }),
		).toEqual([
			"kind",
			"name",
			"template",
			"alternate-render-targets",
			"data-storage",
			"persistence-policy",
		]);
		expect(getVisibleAddFieldNames({ kind: "variation" })).toEqual([
			"kind",
			"name",
			"block",
		]);
		expect(getVisibleAddFieldNames({ kind: "rest-resource" })).toEqual([
			"kind",
			"name",
			"namespace",
			"methods",
		]);
		expect(getVisibleAddFieldNames({ kind: "ability" })).toEqual([
			"kind",
			"name",
		]);
		expect(getVisibleAddFieldNames({ kind: "ai-feature" })).toEqual([
			"kind",
			"name",
			"namespace",
		]);
		expect(getVisibleAddFieldNames({ kind: "hooked-block" })).toEqual([
			"kind",
			"name",
			"anchor",
			"position",
		]);
		expect(isAddPersistenceTemplate("compound")).toBe(true);
		expect(isAddPersistenceTemplate("basic")).toBe(false);
	});

	test("add flow strips hidden fields from submit payloads", () => {
		expect(
			sanitizeAddSubmitValues({
				anchor: "core/post-content",
				block: "counter-card",
				"data-storage": "post-meta",
				kind: "variation",
				name: "hero-card",
				"persistence-policy": "public",
				position: "after",
				template: "compound",
			}),
		).toEqual({
			block: "counter-card",
			kind: "variation",
			name: "hero-card",
		});

		expect(
			sanitizeAddSubmitValues({
				anchor: "",
				block: "",
				"alternate-render-targets": " email,mjml ",
				"data-storage": "custom-table",
				"external-layer-id": " acme/demo ",
				"external-layer-source": " ./layers/demo ",
				kind: "block",
				name: "counter-card",
				"persistence-policy": "authenticated",
				position: "",
				template: "persistence",
			}),
		).toEqual({
			"alternate-render-targets": "email,mjml",
			"data-storage": "custom-table",
			"external-layer-id": "acme/demo",
			"external-layer-source": "./layers/demo",
			kind: "block",
			name: "counter-card",
			"persistence-policy": "authenticated",
			template: "persistence",
		});

		expect(
			sanitizeAddSubmitValues({
				anchor: "",
				block: "counter-card",
				"alternate-render-targets": " email,mjml ",
				"data-storage": "custom-table",
				"external-layer-id": " acme/demo ",
				"external-layer-source": " ./layers/demo ",
				kind: "variation",
				name: "hero-card",
				"persistence-policy": "authenticated",
				position: "",
				template: "persistence",
			}),
		).toEqual({
			block: "counter-card",
			kind: "variation",
			name: "hero-card",
		});

		expect(
			sanitizeAddSubmitValues({
				anchor: "",
				block: "",
				kind: "ability",
				name: "review-workflow",
				namespace: " demo-space/v1 ",
				position: "",
				template: "persistence",
			}),
		).toEqual({
			kind: "ability",
			name: "review-workflow",
		});

		expect(
			sanitizeAddSubmitValues({
				anchor: "",
				block: "",
				kind: "ai-feature",
				name: "brief-suggestions",
				namespace: " demo-space/v1 ",
				position: "",
				template: "persistence",
			}),
		).toEqual({
			kind: "ai-feature",
			name: "brief-suggestions",
			namespace: "demo-space/v1",
		});

		expect(
			sanitizeAddSubmitValues({
				anchor: "",
				block: "",
				kind: "rest-resource",
				methods: " list,read,create ",
				name: "snapshots",
				namespace: " demo-space/v1 ",
				position: "",
				template: "persistence",
			}),
		).toEqual({
			kind: "rest-resource",
			methods: "list,read,create",
			name: "snapshots",
			namespace: "demo-space/v1",
		});
	});

	test("migrate flow keeps visible field ordering stable across command switches", () => {
		expect(getVisibleMigrateFieldNames({ command: "wizard" })).toEqual(["command"]);
		expect(getVisibleMigrateFieldNames({ command: "plan" })).toEqual([
			"command",
			"from-migration-version",
			"to-migration-version",
		]);
		expect(getVisibleMigrateFieldNames({ command: "fixtures" })).toEqual([
			"command",
			"from-migration-version",
			"to-migration-version",
			"all",
			"force",
		]);
		expect(getVisibleMigrateFieldNames({ command: "fuzz" })).toEqual([
			"command",
			"from-migration-version",
			"all",
			"iterations",
			"seed",
		]);
	});

	test("migrate flow strips hidden and empty fields from submit payloads", () => {
		expect(
			sanitizeMigrateSubmitValues({
				all: true,
				command: "wizard",
				"current-migration-version": "",
				force: true,
				"from-migration-version": "  ",
				iterations: "10",
				"migration-version": "",
				seed: "demo",
				"to-migration-version": "current",
			}),
		).toEqual({
			command: "wizard",
		});

		expect(
			sanitizeMigrateSubmitValues({
				all: false,
				command: "fixtures",
				"current-migration-version": "",
				force: true,
				"from-migration-version": "v1",
				iterations: "",
				"migration-version": "",
				seed: "",
				"to-migration-version": "current",
			}),
		).toEqual({
			all: false,
			command: "fixtures",
			force: true,
			"from-migration-version": "v1",
			"to-migration-version": "current",
		});
	});
});
