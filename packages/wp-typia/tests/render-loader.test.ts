import { afterAll, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import { resolveBundledModuleHref } from "../src/render-loader";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-render-loader-"));

afterAll(() => {
	fs.rmSync(tempRoot, { force: true, recursive: true });
});

test("resolveBundledModuleHref returns the first existing candidate", () => {
	const baseDir = path.join(tempRoot, "existing-candidate");
	fs.mkdirSync(path.join(baseDir, "ui"), { recursive: true });
	fs.writeFileSync(path.join(baseDir, "entry.mjs"), "", "utf8");
	fs.writeFileSync(path.join(baseDir, "ui", "create-flow.js"), "export {};\n", "utf8");

	const resolved = resolveBundledModuleHref(
		pathToFileURL(path.join(baseDir, "entry.mjs")).href,
		["./ui/create-flow.js", "./ui/create-flow.tsx"],
		{ moduleLabel: "the create-flow UI" },
	);

	expect(resolved).toBe(
		pathToFileURL(path.join(baseDir, "ui", "create-flow.js")).href,
	);
});

test("resolveBundledModuleHref reports missing bundled artifacts directly", () => {
	const baseDir = path.join(tempRoot, "missing-candidates");
	fs.mkdirSync(baseDir, { recursive: true });
	fs.writeFileSync(path.join(baseDir, "entry.mjs"), "", "utf8");

	let error: Error | undefined;
	try {
		resolveBundledModuleHref(
			pathToFileURL(path.join(baseDir, "entry.mjs")).href,
			["./ui/add-flow.js", "./ui/add-flow.tsx"],
			{ moduleLabel: "the add-flow UI" },
		);
	} catch (caught) {
		error = caught as Error;
	}

	expect(error).toBeInstanceOf(Error);
	expect((error as { code?: string } | undefined)?.code).toBe(
		"missing-build-artifact",
	);
	expect(error?.message).toMatch(/Missing bundled build artifacts for the add-flow UI/);
	expect(error?.message).toMatch(/bun run --filter wp-typia build/);
});
