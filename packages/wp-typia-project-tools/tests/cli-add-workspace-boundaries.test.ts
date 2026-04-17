import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const runtimeRoot = path.join(import.meta.dir, "..", "src", "runtime");

test("cli-add-workspace delegates pattern and binding-source workflows to focused helpers", () => {
	const addWorkspaceSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace.ts"),
		"utf8",
	);
	const assetsSource = fs.readFileSync(
		path.join(runtimeRoot, "cli-add-workspace-assets.ts"),
		"utf8",
	);

	expect(addWorkspaceSource).toContain('from "./cli-add-workspace-assets.js"');
	expect(addWorkspaceSource).toContain("runAddBindingSourceCommand");
	expect(addWorkspaceSource).toContain("runAddPatternCommand");
	expect(addWorkspaceSource).not.toContain("function buildPatternSource(");
	expect(addWorkspaceSource).not.toContain("function buildBindingSourceServerSource(");
	expect(addWorkspaceSource).not.toContain("async function ensureBindingSourceBootstrapAnchors(");
	expect(addWorkspaceSource).not.toContain("export async function runAddPatternCommand(");
	expect(addWorkspaceSource).not.toContain("export async function runAddBindingSourceCommand(");
	expect(assetsSource).toContain("function buildPatternSource(");
	expect(assetsSource).toContain("function buildBindingSourceServerSource(");
	expect(assetsSource).toContain("export async function runAddPatternCommand(");
	expect(assetsSource).toContain("export async function runAddBindingSourceCommand(");
});
