import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import {
	cleanupScaffoldTempRoot,
	createScaffoldTempRoot,
} from "./helpers/scaffold-test-harness.js";

function writeProjectToolsManifest(
	projectToolsRoot: string,
	options: {
		apiClientVersion: string;
		projectToolsVersion: string;
	},
): void {
	fs.writeFileSync(
		path.join(projectToolsRoot, "package.json"),
		`${JSON.stringify(
			{
				dependencies: {
					"@wp-typia/api-client": options.apiClientVersion,
				},
				name: "@wp-typia/project-tools",
				version: options.projectToolsVersion,
			},
			null,
			2,
		)}\n`,
		"utf8",
	);
}

describe("package version cache invalidation", () => {
	const tempRoot = createScaffoldTempRoot("wp-typia-package-versions-");

	afterAll(() => {
		cleanupScaffoldTempRoot(tempRoot);
	});

	test("refreshes linked package metadata and exposes explicit cache clearing", () => {
		const linkedProjectToolsRoot = fs.mkdtempSync(
			path.join(tempRoot, "linked-project-tools-"),
		);
		writeProjectToolsManifest(linkedProjectToolsRoot, {
			apiClientVersion: "^0.4.0",
			projectToolsVersion: "1.2.3",
		});

		const packageVersionsModuleUrl = pathToFileURL(
			path.join(import.meta.dir, "..", "src", "runtime", "package-versions.ts"),
		).href;
		const script = `
			import assert from "node:assert/strict";
			import fs from "node:fs";
			import path from "node:path";
			import {
				clearPackageVersionsCache,
				getPackageVersions,
				invalidatePackageVersionsCache,
			} from ${JSON.stringify(packageVersionsModuleUrl)};

			const projectToolsRoot = ${JSON.stringify(linkedProjectToolsRoot)};
			const first = getPackageVersions();
			const second = getPackageVersions();
			assert.equal(first, second);
			assert.equal(first.projectToolsPackageVersion, "^1.2.3");
			assert.equal(first.apiClientPackageVersion, "^0.4.0");

			fs.writeFileSync(
				path.join(projectToolsRoot, "package.json"),
				JSON.stringify(
					{
						dependencies: {
							"@wp-typia/api-client": "0.5.0"
						},
						name: "@wp-typia/project-tools",
						version: "1.2.4"
					},
					null,
					2
				) + "\\n",
				"utf8"
			);

			const refreshedByFingerprint = getPackageVersions();
			assert.notEqual(refreshedByFingerprint, first);
			assert.equal(refreshedByFingerprint.projectToolsPackageVersion, "^1.2.4");
			assert.equal(refreshedByFingerprint.apiClientPackageVersion, "^0.5.0");

			clearPackageVersionsCache();
			const refreshedByClear = getPackageVersions();
			assert.notEqual(refreshedByClear, refreshedByFingerprint);
			assert.equal(refreshedByClear.projectToolsPackageVersion, "^1.2.4");

			invalidatePackageVersionsCache();
			const refreshedByAlias = getPackageVersions();
			assert.notEqual(refreshedByAlias, refreshedByClear);
			assert.equal(refreshedByAlias.projectToolsPackageVersion, "^1.2.4");
		`;

		const result = spawnSync(process.execPath, ["--eval", script], {
			cwd: linkedProjectToolsRoot,
			encoding: "utf8",
			env: {
				...process.env,
				WP_TYPIA_PROJECT_TOOLS_PACKAGE_ROOT: linkedProjectToolsRoot,
			},
		});

		expect(result.stderr).toBe("");
		expect(result.stdout).toBe("");
		expect(result.status).toBe(0);
	});
});
