import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { executeCreateCommand } from "../src/runtime-bridge";

const ambiguousLayerFixturePath = path.resolve(
	import.meta.dir,
	"..",
	"..",
	"wp-typia-project-tools",
	"tests",
	"fixtures",
	"wp-typia-layer-ambiguous",
);

describe("wp-typia create command bridge", () => {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-create-bridge-"));

	afterAll(() => {
		fs.rmSync(tempRoot, { force: true, recursive: true });
	});

test("keeps ambiguous external layers fail-fast when a synthetic prompt is supplied", async () => {
		const defaultPrompt = {
			close() {},
			select<T extends string>(
				_message: string,
				options: Array<{ value: T }>,
				defaultValue = 1,
			) {
				const fallback = options[Math.max(0, defaultValue - 1)] ?? options[0];
				return Promise.resolve(fallback.value);
			},
			text(_message: string, defaultValue: string) {
				return Promise.resolve(defaultValue);
			},
		};

		const error = await executeCreateCommand({
			cwd: tempRoot,
			emitOutput: false,
			flags: {
				"external-layer-source": ambiguousLayerFixturePath,
				"no-install": true,
				"package-manager": "npm",
				template: "basic",
			},
			interactive: true,
			projectDir: "demo-tui-ambiguous-layer",
			prompt: defaultPrompt,
		}).catch((error) => error);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe(
			"External layer package defines multiple selectable layers (acme/internal-base, acme/alpha, acme/beta). Pass an explicit externalLayerId or rerun through the interactive CLI selector.",
		);
	});
});
