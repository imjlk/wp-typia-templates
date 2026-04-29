import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

import { applyInitPlan, getInitPlan } from "../src/runtime/cli-init.js";
import { getPackageVersions } from "../src/runtime/package-versions.js";
import {
	cleanupScaffoldTempRoot,
	createScaffoldTempRoot,
	wpTypiaPackageManifest,
} from "./helpers/scaffold-test-harness.js";

function scaffoldRetrofitProject(
	projectDir: string,
	options: {
		blockName?: string;
		interfaceName: string;
		layout?: "root" | "src";
		packageJson?: Record<string, unknown>;
	} = {
		interfaceName: "RetrofitInitAttributes",
	},
): void {
	const blockName =
		options.blockName ?? `create-block/${path.basename(projectDir)}`;
	const layout = options.layout ?? "src";
	const blockJsonPath =
		layout === "src"
			? path.join(projectDir, "src", "block.json")
			: path.join(projectDir, "block.json");

	fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });
	fs.writeFileSync(
		path.join(projectDir, "package.json"),
		`${JSON.stringify(
			{
				name: path.basename(projectDir),
				private: true,
				scripts: {},
				...(options.packageJson ?? {}),
			},
			null,
			2,
		)}\n`,
		"utf8",
	);
	fs.writeFileSync(
		blockJsonPath,
		`${JSON.stringify(
			{
				name: blockName,
			},
			null,
			2,
		)}\n`,
		"utf8",
	);
	fs.writeFileSync(
		path.join(projectDir, "src", "types.ts"),
		`export interface ${options.interfaceName} {}\n`,
		"utf8",
	);
	fs.writeFileSync(
		path.join(projectDir, "src", "save.tsx"),
		"export default function Save() { return null; }\n",
		"utf8",
	);
}

describe("wp-typia init", () => {
	const tempRoot = createScaffoldTempRoot("wp-typia-init-plan-");

	afterAll(() => {
		cleanupScaffoldTempRoot(tempRoot);
	});

	test("detects single-block retrofit candidates and plans the minimum sync surface", () => {
		const projectDir = path.join(tempRoot, "retrofit-single-block");
		scaffoldRetrofitProject(projectDir, {
			interfaceName: "RetrofitSingleBlockAttributes",
		});

		const plan = getInitPlan(projectDir);

		expect(plan.status).toBe("preview");
		expect(plan.commandMode).toBe("preview-only");
		expect(plan.detectedLayout.kind).toBe("single-block");
		expect(plan.detectedLayout.blockNames).toEqual([
			"create-block/retrofit-single-block",
		]);
		expect(plan.blockTargets).toEqual([
			expect.objectContaining({
				attributeTypeName: "RetrofitSingleBlockAttributes",
				blockJsonFile: "src/block.json",
				manifestFile: "src/typia.manifest.json",
				slug: "retrofit-single-block",
				typesFile: "src/types.ts",
			}),
		]);
		expect(
			plan.plannedFiles.map(({ action, path: filePath }) => ({
				action,
				path: filePath,
			})),
		).toEqual([
			{ action: "add", path: "scripts/block-config.ts" },
			{ action: "add", path: "scripts/sync-types-to-block-json.ts" },
			{ action: "add", path: "scripts/sync-project.ts" },
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
		expect(plan.nextSteps[0]).toContain("wp-typia init --apply");
		expect(plan.nextSteps).toContain(
			`npx --yes wp-typia@${wpTypiaPackageManifest.version} doctor`,
		);
		expect(plan.notes).toContain(
			"Preview only: `wp-typia init` does not write files yet.",
		);
		expect(
			plan.notes.some((note) =>
				note.includes("snapshotted and rolled back automatically"),
			),
		).toBe(true);
	});

	test("honors package-manager overrides and reports helper-file updates in the preview plan", () => {
		const projectDir = path.join(tempRoot, "retrofit-package-manager-override");
		scaffoldRetrofitProject(projectDir, {
			interfaceName: "RetrofitPackageManagerAttributes",
		});
		fs.mkdirSync(path.join(projectDir, "scripts"), { recursive: true });
		fs.writeFileSync(
			path.join(projectDir, "scripts", "block-config.ts"),
			"export const BLOCKS = [];\n",
			"utf8",
		);

		const plan = getInitPlan(projectDir, {
			packageManager: "pnpm",
		});

		expect(plan.packageManager).toBe("pnpm");
		expect(
			plan.plannedFiles.find((filePlan) => filePlan.path === "scripts/block-config.ts"),
		).toEqual(
			expect.objectContaining({
				action: "update",
			}),
		);
		expect(
			plan.packageChanges.scripts.find((script) => script.name === "typecheck")
				?.requiredValue,
		).toBe("pnpm run sync --check && tsc --noEmit");
		expect(plan.nextSteps).toContain(
			`pnpm dlx wp-typia@${wpTypiaPackageManifest.version} doctor`,
		);
	});

	test("applies retrofit helper files and preserves legacy root block paths", async () => {
		const projectDir = path.join(tempRoot, "retrofit-legacy-root");
		scaffoldRetrofitProject(projectDir, {
			interfaceName: "RetrofitLegacyRootAttributes",
			layout: "root",
		});

		const plan = await applyInitPlan(projectDir, {
			packageManager: "pnpm",
		});
		const packageJson = JSON.parse(
			fs.readFileSync(path.join(projectDir, "package.json"), "utf8"),
		) as {
			packageManager?: string;
			scripts?: Record<string, string>;
		};
		const blockConfigSource = fs.readFileSync(
			path.join(projectDir, "scripts", "block-config.ts"),
			"utf8",
		);

		expect(plan.status).toBe("applied");
		expect(plan.commandMode).toBe("apply");
		expect(plan.packageManager).toBe("pnpm");
		expect(plan.notes).toContain(
			"Apply mode writes package.json and generated helper files with rollback-on-failure protection.",
		);
		expect(packageJson.packageManager).toBe("pnpm@8.3.1");
		expect(packageJson.scripts?.sync).toBe("tsx scripts/sync-project.ts");
		expect(packageJson.scripts?.typecheck).toBe(
			"pnpm run sync --check && tsc --noEmit",
		);
		expect(blockConfigSource).toContain(`blockJsonFile: "block.json"`);
		expect(blockConfigSource).toContain(`manifestFile: "typia.manifest.json"`);
		expect(
			fs.existsSync(path.join(projectDir, "scripts", "sync-project.ts")),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "scripts", "sync-types-to-block-json.ts"),
			),
		).toBe(true);
	});

	test("rolls back package.json changes when apply mode cannot finish writing helper files", async () => {
		const projectDir = path.join(tempRoot, "retrofit-rollback");
		scaffoldRetrofitProject(projectDir, {
			interfaceName: "RetrofitRollbackAttributes",
		});
		const scriptsDir = path.join(projectDir, "scripts");
		const packageJsonPath = path.join(projectDir, "package.json");
		const originalPackageJsonSource = fs.readFileSync(packageJsonPath, "utf8");

		fs.mkdirSync(scriptsDir, { recursive: true });
		fs.chmodSync(scriptsDir, 0o555);

		try {
			await expect(applyInitPlan(projectDir)).rejects.toThrow(
				/restored the previous package\.json\/helper-file snapshot/i,
			);
			expect(fs.readFileSync(packageJsonPath, "utf8")).toBe(
				originalPackageJsonSource,
			);
			expect(
				fs.existsSync(path.join(projectDir, "scripts", "block-config.ts")),
			).toBe(false);
		} finally {
			fs.chmodSync(scriptsDir, 0o755);
		}
	});

	test("reports already-initialized projects without planning redundant changes", () => {
		const projectDir = path.join(tempRoot, "retrofit-already-initialized");
		const versions = getPackageVersions();
		fs.mkdirSync(projectDir, { recursive: true });
		fs.writeFileSync(
			path.join(projectDir, "package.json"),
			`${JSON.stringify(
				{
					name: "retrofit-already-initialized",
					private: true,
					scripts: {
						sync: "tsx scripts/sync-project.ts",
						"sync-types": "tsx scripts/sync-types-to-block-json.ts",
						typecheck: "npm run sync -- --check && tsc --noEmit",
					},
					devDependencies: {
						"@typia/unplugin": versions.typiaUnpluginPackageVersion,
						"@wp-typia/block-runtime": versions.blockRuntimePackageVersion,
						"@wp-typia/block-types": versions.blockTypesPackageVersion,
						tsx: versions.tsxPackageVersion,
						typescript: versions.typescriptPackageVersion,
						typia: versions.typiaPackageVersion,
					},
				},
				null,
				2,
			)}\n`,
			"utf8",
		);

		const plan = getInitPlan(projectDir);

		expect(plan.status).toBe("already-initialized");
		expect(plan.commandMode).toBe("preview-only");
		expect(plan.detectedLayout.kind).toBe("generated-project");
		expect(plan.packageChanges.addDevDependencies).toEqual([]);
		expect(plan.packageChanges.scripts).toEqual([]);
		expect(plan.plannedFiles).toEqual([]);
	});
});
