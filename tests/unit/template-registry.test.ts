import { describe, expect, test } from "bun:test";
import path from "node:path";

import {
	BUILTIN_TEMPLATE_IDS,
	TEMPLATE_IDS,
	getTemplateById,
	getTemplateSelectOptions,
	isBuiltInTemplateId,
	listTemplates,
	resolvePackageRoot,
} from "../../packages/create/src/runtime/template-registry";
import { createTempDir, writeJsonFile, writeTextFile } from "../helpers/file-fixtures";

describe("template registry runtime helpers", () => {
	test("resolvePackageRoot walks upward and ignores malformed package.json files", () => {
		const packageRoot = createTempDir("wp-typia-template-root-");
		const nestedDir = path.join(packageRoot, "src", "runtime", "nested");

		writeJsonFile(path.join(packageRoot, "package.json"), {
			name: "@wp-typia/create",
		});
		writeTextFile(path.join(packageRoot, "src", "runtime", "package.json"), "{not-json");

		expect(resolvePackageRoot(nestedDir)).toBe(packageRoot);
	});

	test("resolvePackageRoot fails clearly when no matching package root exists", () => {
		const startDir = createTempDir("wp-typia-missing-template-root-");

		expect(() => resolvePackageRoot(startDir)).toThrow(
			"Unable to resolve the @wp-typia/create package root.",
		);
	});

	test("reports built-in template metadata and select options", () => {
		expect([...BUILTIN_TEMPLATE_IDS]).toEqual(["basic", "interactivity", "persistence", "compound"]);
		expect([...TEMPLATE_IDS]).toEqual([...BUILTIN_TEMPLATE_IDS]);
		expect(listTemplates().map((template) => template.id)).toEqual([...BUILTIN_TEMPLATE_IDS]);
		expect(isBuiltInTemplateId("compound")).toBe(true);
		expect(isBuiltInTemplateId("remote-template")).toBe(false);
		expect(getTemplateById("persistence")).toEqual(
			expect.objectContaining({
				defaultCategory: "widgets",
				features: ["Interactivity API", "Typed REST client", "Schema sync", "Persistence policies"],
				id: "persistence",
			}),
		);
		expect(getTemplateSelectOptions()).toEqual([
			{
				hint: "Type-safe attributes, Runtime validation, Minimal setup",
				label: "basic",
				value: "basic",
			},
			{
				hint: "Interactivity API, Client-side state, Event handling",
				label: "interactivity",
				value: "interactivity",
			},
			{
				hint: "Interactivity API, Typed REST client, Schema sync, Persistence policies",
				label: "persistence",
				value: "persistence",
			},
			{
				hint: "InnerBlocks, Hidden child blocks, Optional persistence layer",
				label: "compound",
				value: "compound",
			},
		]);
	});

	test("throws a helpful error for unknown template ids", () => {
		expect(() => getTemplateById("workspace")).toThrow(
			'Unknown template "workspace". Expected one of: basic, interactivity, persistence, compound',
		);
	});
});
