import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

import { getInitPlan } from "../src/runtime/cli-init.js";
import { getPackageVersions } from "../src/runtime/package-versions.js";
import {
	cleanupScaffoldTempRoot,
	createScaffoldTempRoot,
	wpTypiaPackageManifest,
} from "./helpers/scaffold-test-harness.js";

describe("wp-typia init", () => {
	const tempRoot = createScaffoldTempRoot("wp-typia-init-plan-");

	afterAll(() => {
		cleanupScaffoldTempRoot(tempRoot);
	});

	test("detects single-block retrofit candidates and plans the minimum sync surface", () => {
		const projectDir = path.join(tempRoot, "retrofit-single-block");
		fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });
		fs.writeFileSync(
			path.join(projectDir, "package.json"),
			JSON.stringify(
				{
					name: "retrofit-single-block",
					private: true,
					scripts: {},
				},
				null,
				2,
			),
		);
		fs.writeFileSync(
			path.join(projectDir, "src", "block.json"),
			JSON.stringify(
				{
					name: "create-block/retrofit-single-block",
				},
				null,
				2,
			),
		);
		fs.writeFileSync(path.join(projectDir, "src", "types.ts"), "export {};\n");
		fs.writeFileSync(path.join(projectDir, "src", "save.tsx"), "export default null;\n");

		const plan = getInitPlan(projectDir);

		expect(plan.status).toBe("preview");
		expect(plan.detectedLayout.kind).toBe("single-block");
		expect(plan.detectedLayout.blockNames).toEqual([
			"create-block/retrofit-single-block",
		]);
		expect(plan.packageChanges.scripts.map((script) => script.name)).toEqual([
			"sync",
			"sync-types",
			"typecheck",
		]);
		expect(
			plan.packageChanges.addDevDependencies.some(
				(dependency) => dependency.name === "@wp-typia/block-runtime",
			),
		).toBe(true);
		expect(plan.generatedArtifacts).toContain("src/typia.manifest.json");
		expect(plan.nextSteps).toContain(
			`npx --yes wp-typia@${wpTypiaPackageManifest.version} doctor`,
		);
		expect(plan.notes).toContain(
			"Preview only: `wp-typia init` does not write files yet.",
		);
	});

	test("reports already-initialized projects without planning redundant changes", () => {
		const projectDir = path.join(tempRoot, "retrofit-already-initialized");
		const versions = getPackageVersions();
		fs.mkdirSync(projectDir, { recursive: true });
		fs.writeFileSync(
			path.join(projectDir, "package.json"),
			JSON.stringify(
				{
					name: "retrofit-already-initialized",
					private: true,
					scripts: {
						sync: "tsx scripts/sync-project.ts",
						"sync-types": "tsx scripts/sync-types-to-block-json.ts",
						typecheck: "npm run sync -- --check && tsc --noEmit",
					},
					devDependencies: {
						"@typia/unplugin": "^12.0.1",
						"@wp-typia/block-runtime": versions.blockRuntimePackageVersion,
						"@wp-typia/block-types": versions.blockTypesPackageVersion,
						tsx: "^4.20.5",
						typescript: "^5.9.2",
						typia: "^12.0.1",
					},
				},
				null,
				2,
			),
		);

		const plan = getInitPlan(projectDir);

		expect(plan.status).toBe("already-initialized");
		expect(plan.detectedLayout.kind).toBe("generated-project");
		expect(plan.packageChanges.addDevDependencies).toEqual([]);
		expect(plan.packageChanges.scripts).toEqual([]);
		expect(plan.plannedFiles).toEqual([]);
	});
});
