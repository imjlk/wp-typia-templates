import { afterAll, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { executeSyncCommand } from "../src/runtime-bridge-sync";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-sync-bridge-"));

function writeSyncFixture(options: {
	name: string;
	scripts: Record<string, string>;
	withInstallMarker?: boolean;
}) {
	const projectDir = path.join(tempRoot, options.name);
	fs.mkdirSync(projectDir, { recursive: true });
	fs.writeFileSync(
		path.join(projectDir, "package.json"),
		JSON.stringify(
			{
				name: options.name,
				packageManager: "npm@10.9.0",
				scripts: options.scripts,
			},
			null,
			2,
		),
		"utf8",
	);
	if (options.withInstallMarker) {
		fs.mkdirSync(path.join(projectDir, "node_modules"), {
			recursive: true,
		});
	}
	return projectDir;
}

afterAll(() => {
	fs.rmSync(tempRoot, { force: true, recursive: true });
});

test("sync fails early with install guidance when local dependencies are missing", async () => {
	const projectDir = writeSyncFixture({
		name: "demo-sync-no-install",
		scripts: {
			sync: "tsx scripts/sync-project.ts",
		},
	});

	const error = await executeSyncCommand({ cwd: projectDir }).catch((thrown) => thrown);

	expect(error).toBeInstanceOf(Error);
	expect((error as Error).message).toContain("npm install");
	expect((error as Error).message).toContain("wp-typia sync");
	expect((error as Error).message).toContain("tsx");
});

test("dry-run sync previews commands without requiring installed dependencies", async () => {
	const projectDir = writeSyncFixture({
		name: "demo-sync-dry-run-preview",
		scripts: {
			sync: "tsx scripts/sync-project.ts",
		},
	});

	const result = await executeSyncCommand({
		check: true,
		cwd: projectDir,
		dryRun: true,
	});

	expect(result.dryRun).toBe(true);
	expect(result.executedCommands).toBeUndefined();
	expect(result.plannedCommands).toEqual([
		{
			args: ["run", "sync", "--", "--check"],
			command: "npm",
			displayCommand: "npm run sync -- --check",
			scriptName: "sync",
		},
	]);
});

test("sync can capture executed script output for structured callers", async () => {
	const projectDir = writeSyncFixture({
		name: "demo-sync-capture-output",
		scripts: {
			sync: "node scripts/record.mjs sync",
		},
		withInstallMarker: true,
	});
	const scriptsDir = path.join(projectDir, "scripts");
	fs.mkdirSync(scriptsDir, { recursive: true });
	fs.writeFileSync(
		path.join(scriptsDir, "record.mjs"),
		[
			"const [, , label] = process.argv;",
			"console.log(`ran:${label}`);",
			"console.error(`stderr:${label}`);",
		].join("\n"),
		"utf8",
	);

	const result = await executeSyncCommand({
		captureOutput: true,
		cwd: projectDir,
	});

	expect(result.executedCommands).toHaveLength(1);
	expect(result.executedCommands?.[0]).toMatchObject({
		args: ["run", "sync"],
		command: "npm",
		displayCommand: "npm run sync",
		exitCode: 0,
		scriptName: "sync",
		stderr: "stderr:sync\n",
	});
	expect(result.executedCommands?.[0]?.stdout).toContain("ran:sync\n");
});
