import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const runtimeRoot = path.join(import.meta.dir, "..", "src", "runtime");

test("cli-add-workspace delegates asset and rest-resource workflows to focused helpers", () => {
	const addWorkspaceSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace.ts"),
		"utf8",
	);
	const assetsSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace-assets.ts"),
		"utf8",
	);
	const restSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace-rest.ts"),
		"utf8",
	);
	const restAnchorsSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace-rest-anchors.ts"),
		"utf8",
	);
	const restSourceEmittersSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace-rest-source-emitters.ts"),
		"utf8",
	);

	expect(addWorkspaceSource).toContain('from "./cli-add-workspace-assets.js"');
	expect(addWorkspaceSource).toContain('from "./cli-add-workspace-rest.js"');
	expect(addWorkspaceSource).toContain("runAddBindingSourceCommand");
	expect(addWorkspaceSource).toContain("runAddEditorPluginCommand");
	expect(addWorkspaceSource).toContain("runAddPatternCommand");
	expect(addWorkspaceSource).toContain("runAddRestResourceCommand");
	expect(addWorkspaceSource).not.toContain("function buildPatternSource(");
	expect(addWorkspaceSource).not.toContain("function buildBindingSourceServerSource(");
	expect(addWorkspaceSource).not.toContain("async function ensureBindingSourceBootstrapAnchors(");
	expect(addWorkspaceSource).not.toContain("async function ensureEditorPluginBootstrapAnchors(");
	expect(addWorkspaceSource).not.toContain("function buildRestResourceTypesSource(");
	expect(addWorkspaceSource).not.toContain("async function ensureRestResourceBootstrapAnchors(");
	expect(addWorkspaceSource).not.toContain("export async function runAddPatternCommand(");
	expect(addWorkspaceSource).not.toContain("export async function runAddBindingSourceCommand(");
	expect(addWorkspaceSource).not.toContain("export async function runAddEditorPluginCommand(");
	expect(addWorkspaceSource).not.toContain("export async function runAddRestResourceCommand(");
	expect(assetsSource).toContain("function buildPatternSource(");
	expect(assetsSource).toContain("function buildBindingSourceServerSource(");
	expect(assetsSource).toContain("function buildEditorPluginEntrySource(");
	expect(assetsSource).toContain("export async function runAddPatternCommand(");
	expect(assetsSource).toContain("export async function runAddBindingSourceCommand(");
	expect(assetsSource).toContain("export async function runAddEditorPluginCommand(");
	expect(restSource).toContain('from "./cli-add-workspace-rest-anchors.js"');
	expect(restSource).toContain('from "./cli-add-workspace-rest-source-emitters.js"');
	expect(restSource).not.toContain("function buildRestResourceTypesSource(");
	expect(restSource).not.toContain("async function ensureRestResourceBootstrapAnchors(");
	expect(restSource).toContain("function buildRestResourcePhpSource(");
	expect(restSource).toContain("export async function runAddRestResourceCommand(");
	expect(restSourceEmittersSource).toContain("function buildRestResourceTypesSource(");
	expect(restSourceEmittersSource).toContain("function buildRestResourceApiSource(");
	expect(restSourceEmittersSource).toContain("function buildRestResourceDataSource(");
	expect(restAnchorsSource).toContain("async function ensureRestResourceBootstrapAnchors(");
	expect(restAnchorsSource).toContain("async function ensureRestResourceSyncScriptAnchors(");
});
