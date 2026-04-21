import { afterAll, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { executeSyncCommand } from "../src/runtime-bridge-sync";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-sync-bridge-"));

afterAll(() => {
	fs.rmSync(tempRoot, { force: true, recursive: true });
});

test("sync fails early with install guidance when local dependencies are missing", async () => {
	const projectDir = path.join(tempRoot, "demo-sync-no-install");
	fs.mkdirSync(projectDir, { recursive: true });
	fs.writeFileSync(
		path.join(projectDir, "package.json"),
		JSON.stringify(
			{
				name: "demo-sync-no-install",
				packageManager: "npm@10.9.0",
				scripts: {
					sync: "tsx scripts/sync-project.ts",
				},
			},
			null,
			2,
		),
		"utf8",
	);

	const error = await executeSyncCommand({ cwd: projectDir }).catch((thrown) => thrown);

	expect(error).toBeInstanceOf(Error);
	expect((error as Error).message).toContain("npm install");
	expect((error as Error).message).toContain("wp-typia sync");
	expect((error as Error).message).toContain("tsx");
});
