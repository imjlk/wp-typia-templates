import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import {
	blockTypesPackageVersion,
	buildGeneratedProject,
	cleanupScaffoldTempRoot,
	createScaffoldTempRoot,
	typecheckGeneratedProject,
} from "./helpers/scaffold-test-harness.js";
import { scaffoldProject } from "../src/runtime/index.js";

describe("@wp-typia/project-tools scaffold query-loop", () => {
	const tempRoot = createScaffoldTempRoot("wp-typia-scaffold-query-loop-");

	afterAll(() => {
		cleanupScaffoldTempRoot(tempRoot);
	});

	test(
		"scaffoldProject creates a Query Loop variation scaffold with a stable variation namespace",
		async () => {
			const targetDir = path.join(tempRoot, "demo-query-loop");

			await scaffoldProject({
				projectDir: targetDir,
				templateId: "query-loop",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Demo Query Loop variation",
					namespace: "demo-space",
					phpPrefix: "demo_space",
					queryPostType: "book",
					slug: "demo-query-loop",
					textDomain: "demo-query-loop",
					title: "Demo Query Loop",
				},
			});

			const packageJson = JSON.parse(
				fs.readFileSync(path.join(targetDir, "package.json"), "utf8"),
			);
			const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
			const variationSource = fs.readFileSync(
				path.join(targetDir, "src", "index.ts"),
				"utf8",
			);
			const pluginBootstrap = fs.readFileSync(
				path.join(targetDir, "demo-query-loop.php"),
				"utf8",
			);
			const gridPatternSource = fs.readFileSync(
				path.join(targetDir, "src", "patterns", "grid.php"),
				"utf8",
			);
			const listPatternSource = fs.readFileSync(
				path.join(targetDir, "src", "patterns", "list.php"),
				"utf8",
			);

			expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(
				blockTypesPackageVersion,
			);
			expect(packageJson.devDependencies["@wp-typia/block-runtime"]).toBeUndefined();
			expect(packageJson.scripts.sync).toBeUndefined();
			expect(packageJson.scripts["watch:sync-types"]).toBeUndefined();
			expect(packageJson.scripts.start).toBe("wp-scripts start --experimental-modules");
			expect(packageJson.scripts.dev).toBe("wp-scripts start --experimental-modules");
			expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");
			expect(fs.existsSync(path.join(targetDir, "src", "block.json"))).toBe(false);
			expect(fs.existsSync(path.join(targetDir, "src", "typia.manifest.json"))).toBe(false);
			expect(variationSource).toMatch(
				/registerBlockVariation\('core\/query', queryLoopVariation\);/,
			);
			expect(variationSource).toMatch(
				/const VARIATION_NAME = ["']demo-space\/demo-query-loop["'];/,
			);
			expect(variationSource).toMatch(/namespace:\s*VARIATION_NAME/);
			expect(variationSource).toMatch(/postType:\s*["']book["']/);
			expect(variationSource).toContain("allowedControls:");
			expect(variationSource).toMatch(/isActive:\s*\[\s*['"]namespace['"]\s*\]/);
			expect(variationSource).toMatch(/['"]core\/post-template['"]/);
			expect(pluginBootstrap).toMatch(/enqueue_block_editor_assets/);
			expect(pluginBootstrap).toMatch(/wp_register_script\s*\(/);
			expect(pluginBootstrap).toContain("register_block_pattern_category");
			expect(pluginBootstrap).toContain("/src/patterns/*.php");
			expect(pluginBootstrap).not.toContain("register_block_type");
			expect(gridPatternSource).toContain("demo-space/demo-query-loop-grid");
			expect(gridPatternSource).toContain('"namespace":"demo-space/demo-query-loop"');
			expect(gridPatternSource).toContain('"postType":"book"');
			expect(listPatternSource).toContain("demo-space/demo-query-loop-list");
			expect(listPatternSource).toContain('"namespace":"demo-space/demo-query-loop"');
			expect(readme).toContain("## Artifact Refresh");
			expect(readme).toContain(
				"This scaffold does not generate `block.json` or Typia manifests.",
			);
			expect(readme).toContain(
				"`src/index.ts` remains the source of truth for the Query Loop variation name",
			);
			expect(readme).toContain("Use `src/patterns/*.php` for richer connected layout presets");
			execFileSync("php", ["-l", path.join(targetDir, "demo-query-loop.php")], {
				stdio: "ignore",
			});
			execFileSync("php", ["-l", path.join(targetDir, "src", "patterns", "grid.php")], {
				stdio: "ignore",
			});
			execFileSync("php", ["-l", path.join(targetDir, "src", "patterns", "list.php")], {
				stdio: "ignore",
			});

			typecheckGeneratedProject(targetDir);
			buildGeneratedProject(targetDir);

			expect(fs.existsSync(path.join(targetDir, "build", "index.js"))).toBe(true);
			expect(fs.existsSync(path.join(targetDir, "build", "index.asset.php"))).toBe(
				true,
			);
		},
		{ timeout: 40_000 },
	);
});
