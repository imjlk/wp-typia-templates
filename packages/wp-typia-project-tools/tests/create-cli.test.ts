import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { runUtf8Command } from "../../../tests/helpers/process-utils";
import { getTemplateVariables, scaffoldProject } from "../src/runtime/index.js";
import { formatHelpText, getDoctorChecks, getNextSteps, runScaffoldFlow } from "../src/runtime/cli-core.js";
import { collectScaffoldAnswers } from "../src/runtime/scaffold.js";
import { copyRenderedDirectory } from "../src/runtime/template-render.js";
import {
	parseGitHubTemplateLocator,
	parseNpmTemplateLocator,
	parseTemplateLocator,
} from "../src/runtime/template-source.js";

const packageRoot = path.resolve(import.meta.dir, "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-create-"));
const entryPath = path.resolve(packageRoot, "..", "wp-typia", "bin", "wp-typia.js");
const createBlockExternalFixturePath = path.join(
	packageRoot,
	"tests",
	"fixtures",
	"create-block-external",
);
const createBlockSubsetFixturePath = path.join(
	packageRoot,
	"tests",
	"fixtures",
	"create-block-subset",
);
const createPackageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);
const workspaceTemplatePackageManifest = JSON.parse(
	fs.readFileSync(
		path.resolve(packageRoot, "..", "create-workspace-template", "package.json"),
		"utf8",
	),
);
const wpTypiaPackageManifest = JSON.parse(
	fs.readFileSync(path.resolve(packageRoot, "..", "wp-typia", "package.json"), "utf8"),
);
const apiClientPackageVersion = createPackageManifest.dependencies["@wp-typia/api-client"];
const blockRuntimePackageManifest = JSON.parse(
	fs.readFileSync(
		path.resolve(packageRoot, "..", "wp-typia-block-runtime", "package.json"),
		"utf8",
	),
);
const blockRuntimePackageVersion = `^${blockRuntimePackageManifest.version}`;
const blockTypesPackageVersion =
	createPackageManifest.dependencies["@wp-typia/block-types"];
const restPackageVersion = createPackageManifest.dependencies["@wp-typia/rest"];
const workspaceNodeModulesPath = path.resolve(packageRoot, "..", "..", "node_modules");
const workspaceBunNodeModulesPath = path.join(
	workspaceNodeModulesPath,
	".bun",
	"node_modules",
);
const workspacePackagePaths = {
	"@wp-typia/api-client": path.resolve(packageRoot, "..", "wp-typia-api-client"),
	"@wp-typia/block-runtime": path.resolve(packageRoot, "..", "wp-typia-block-runtime"),
	"@wp-typia/block-types": path.resolve(packageRoot, "..", "wp-typia-block-types"),
	"@wp-typia/project-tools": packageRoot,
	"@wp-typia/rest": path.resolve(packageRoot, "..", "wp-typia-rest"),
} as const;
const generatedProjectTypecheckSupportPackages = [
	"react",
	"react-dom",
	"@types/react",
	"@types/react-dom",
] as const;
const builtWorkspacePackages = new Set<string>();

function runCli(
	command: string,
	args: string[],
	options: Parameters<typeof runUtf8Command>[2] = {},
) {
	return runUtf8Command(command, args, options);
}

function getCommandErrorMessage(run: () => string): string {
	try {
		run();
		return "";
	} catch (error) {
		if (typeof error === "object" && error !== null) {
			const message =
				"message" in error && typeof error.message === "string" ? error.message : String(error);
			const stdout =
				"stdout" in error && typeof error.stdout === "string" ? error.stdout : "";
			const stderr =
				"stderr" in error && typeof error.stderr === "string" ? error.stderr : "";
			return [message, stdout, stderr].filter(Boolean).join("\n");
		}
		return String(error);
	}
}

function ensureDirSymlink(targetPath: string, sourcePath: string) {
	if (fs.existsSync(targetPath)) {
		return;
	}

	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.symlinkSync(sourcePath, targetPath, "dir");
}

function ensureFileSymlink(targetPath: string, sourcePath: string) {
	if (fs.existsSync(targetPath)) {
		return;
	}

	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.symlinkSync(sourcePath, targetPath, "file");
}

function resolveWorkspaceDependencyPath(packageName: string): string | null {
	const directPath = path.join(workspaceNodeModulesPath, packageName);
	if (fs.existsSync(directPath)) {
		return fs.realpathSync(directPath);
	}

	const bunPath = path.join(workspaceBunNodeModulesPath, packageName);
	if (fs.existsSync(bunPath)) {
		return fs.realpathSync(bunPath);
	}

	return null;
}

function ensureWorkspacePackageBuilt(
	packageName: keyof typeof workspacePackagePaths,
	packagePath: string,
) {
	if (builtWorkspacePackages.has(packageName)) {
		return;
	}

	if (fs.existsSync(path.join(packagePath, "dist"))) {
		builtWorkspacePackages.add(packageName);
		return;
	}

	runCli("bun", ["run", "build"], { cwd: packagePath });
	builtWorkspacePackages.add(packageName);
}

function ensureWorkspaceBinaryDirectory(targetDir: string) {
	const targetBinDir = path.join(targetDir, "node_modules", ".bin");
	fs.mkdirSync(targetBinDir, { recursive: true });
}

function linkPackageBins(
	targetDir: string,
	packageName: string,
	sourcePath: string,
) {
	const packageJsonPath = path.join(sourcePath, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
		bin?: Record<string, string> | string;
		name?: string;
	};
	const binField = packageJson.bin;
	if (!binField) {
		return;
	}

	const normalizedBins =
		typeof binField === "string"
			? {
				[(packageJson.name ?? packageName).split("/").slice(-1)[0] ?? packageName]: binField,
			}
			: binField;

	for (const [binName, relativeBinPath] of Object.entries(normalizedBins)) {
		ensureFileSymlink(
			path.join(targetDir, "node_modules", ".bin", binName),
			path.join(sourcePath, relativeBinPath),
		);
	}
}

function linkWorkspaceNodeModules(targetDir: string) {
	const nodeModulesPath = path.join(targetDir, "node_modules");

	if (!fs.existsSync(nodeModulesPath)) {
		fs.mkdirSync(nodeModulesPath, { recursive: true });
	}

	ensureWorkspaceBinaryDirectory(targetDir);

	const packageJsonPath = path.join(targetDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const dependencyNames = new Set([
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.devDependencies ?? {}),
		...generatedProjectTypecheckSupportPackages,
	]);

	for (const packageName of dependencyNames) {
		const workspacePackagePath =
			workspacePackagePaths[packageName as keyof typeof workspacePackagePaths];
		if (workspacePackagePath) {
			ensureWorkspacePackageBuilt(
				packageName as keyof typeof workspacePackagePaths,
				workspacePackagePath,
			);
			ensureDirSymlink(
				path.join(nodeModulesPath, ...packageName.split("/")),
				workspacePackagePath,
			);
			linkPackageBins(targetDir, packageName, workspacePackagePath);
			continue;
		}

		const sourcePath = resolveWorkspaceDependencyPath(packageName);
		if (!sourcePath) {
			continue;
		}

		ensureDirSymlink(path.join(nodeModulesPath, ...packageName.split("/")), sourcePath);
		linkPackageBins(targetDir, packageName, sourcePath);
	}
}

function runGeneratedScript(targetDir: string, scriptRelativePath: string, args: string[] = []) {
	linkWorkspaceNodeModules(targetDir);
	return runCli("bun", [path.join(targetDir, scriptRelativePath), ...args], {
		cwd: targetDir,
	});
}

function typecheckGeneratedProject(targetDir: string) {
	linkWorkspaceNodeModules(targetDir);
	return runCli(path.join(targetDir, "node_modules", ".bin", "tsc"), ["--noEmit"], {
		cwd: targetDir,
	});
}

async function scaffoldOfficialWorkspace(
	targetDir: string,
	{
		description = "Demo workspace",
		namespace = "demo-space",
		phpPrefix = "demo_space",
		slug = path.basename(targetDir),
		textDomain = "demo-space",
		title = "Demo Workspace",
		withMigrationUi = false,
	}: {
		description?: string;
		namespace?: string;
		phpPrefix?: string;
		slug?: string;
		textDomain?: string;
		title?: string;
		withMigrationUi?: boolean;
	} = {},
) {
	await scaffoldProject({
		projectDir: targetDir,
		templateId: workspaceTemplatePackageManifest.name,
		packageManager: "npm",
		noInstall: true,
		withMigrationUi,
		answers: {
			author: "Test Runner",
			description,
			namespace,
			phpPrefix,
			slug,
			textDomain,
			title,
		},
	});
}

describe("@wp-typia/project-tools scaffolding", () => {
	afterAll(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	test("scaffoldProject creates an npm-ready basic template", async () => {
		const targetDir = path.join(tempRoot, "demo-npm");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "basic",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo npm block",
				namespace: "demo-space",
				slug: "demo-npm",
				title: "Demo Npm",
			},
		});

		const packageJsonPath = path.join(targetDir, "package.json");
		const readmePath = path.join(targetDir, "README.md");

		expect(fs.existsSync(packageJsonPath)).toBe(true);
		expect(fs.existsSync(readmePath)).toBe(true);

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const readme = fs.readFileSync(readmePath, "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.tsx"), "utf8");
		const generatedHooks = fs.readFileSync(path.join(targetDir, "src", "hooks.ts"), "utf8");
		const generatedIndex = fs.readFileSync(path.join(targetDir, "src", "index.tsx"), "utf8");
		const generatedManifest = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "typia.manifest.json"), "utf8"),
		);
		const generatedEditorStyle = fs.readFileSync(
			path.join(targetDir, "src", "editor.scss"),
			"utf8",
		);
		const generatedSave = fs.readFileSync(path.join(targetDir, "src", "save.tsx"), "utf8");
		const generatedStyle = fs.readFileSync(path.join(targetDir, "src", "style.scss"), "utf8");
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedValidators = fs.readFileSync(path.join(targetDir, "src", "validators.ts"), "utf8");
		const generatedValidatorToolkit = fs.readFileSync(
			path.join(targetDir, "src", "validator-toolkit.ts"),
			"utf8",
		);
		const generatedPluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-npm.php"),
			"utf8",
		);
		const generatedWebpackConfig = fs.readFileSync(
			path.join(targetDir, "webpack.config.js"),
			"utf8",
		);

		expect(packageJson.name).toBe("demo-npm");
		expect(packageJson.packageManager).toBe("npm@11.6.1");
		expect(packageJson.devDependencies["@wp-typia/block-runtime"]).toBe(blockRuntimePackageVersion);
		expect(packageJson.devDependencies["@wp-typia/block-runtime"]).not.toBe("^0.0.0");
		expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(blockTypesPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/project-tools"]).toBeUndefined();
		expect(packageJson.devDependencies["chokidar-cli"]).toBe("^3.0.0");
		expect(packageJson.devDependencies.concurrently).toBe("^9.0.1");
		expect(packageJson.scripts.build).toBe(
			"npm run sync-types -- --check && wp-scripts build --experimental-modules",
		);
		expect(packageJson.scripts.dev).toBe(
			'concurrently -k -n sync-types,editor -c yellow,blue "npm run watch:sync-types" "npm run start:editor"',
		);
		expect(packageJson.scripts["start:editor"]).toBe("wp-scripts start --experimental-modules");
		expect(packageJson.scripts.start).toBe("npm run sync-types && wp-scripts start --experimental-modules");
		expect(packageJson.scripts.typecheck).toBe("npm run sync-types -- --check && tsc --noEmit");
		expect(packageJson.scripts["watch:sync-types"]).toBe(
			'chokidar "src/types.ts" --debounce 200 -c "npm run sync-types"',
		);
		expect(blockJson.textdomain).toBe("demo-npm");
		expect(blockJson.version).toBe("0.1.0");
		expect(blockJson.category).toBe("text");
		expect(blockJson.icon).toBe("smiley");
		expect(blockJson.editorStyle).toBe("file:./index.css");
		expect(generatedManifest.manifestVersion).toBe(2);
		expect(generatedManifest.sourceType).toBe("DemoNpmAttributes");
		expect(generatedManifest.attributes.content.typia.defaultValue).toBe("");
		expect(generatedManifest.attributes.alignment.wp.enum).toEqual([
			"left",
			"center",
			"right",
			"justify",
		]);
		expect(generatedHooks).toContain("type TypiaValidationError");
		expect(generatedHooks).toContain("useTypiaValidation");
		expect(generatedEdit).toContain("RichText");
		expect(generatedEdit).toContain("TextControl");
		expect(generatedEdit).toContain("label={__('Content'");
		expect(generatedEdit).toContain("help={__('Mirrors the main block content.'");
		expect(generatedEdit).toContain("placeholder={__('Add your content...'");
		expect(generatedEdit).toContain("@wp-typia/block-runtime/inspector");
		expect(generatedEdit).not.toContain("@wp-typia/project-tools/schema-core");
		expect(generatedEdit).toContain("InspectorFromManifest");
		expect(generatedEdit).toContain("useEditorFields");
		expect(generatedEdit).toContain("useTypedAttributeUpdater");
		expect(generatedSave).toContain("RichText.Content");
		expect(generatedSave).not.toContain("return null;");
		expect(generatedEdit).toContain('className="wp-block-demo-space-demo-npm__content"');
		expect(generatedSave).toContain('className="wp-block-demo-space-demo-npm__content"');
		expect(generatedEditorStyle).toContain(".wp-block-demo-space-demo-npm");
		expect(generatedStyle).toContain(".wp-block-demo-space-demo-npm");
		expect(generatedHooks).toContain("@wp-typia/block-runtime/validation");
		expect(generatedHooks).toContain("createUseTypiaValidationHook");
		expect(generatedIndex).toContain("@wp-typia/block-runtime/blocks");
		expect(generatedIndex).toContain("buildScaffoldBlockRegistration");
		expect(generatedIndex).toContain("type ScaffoldBlockMetadata");
		expect(generatedIndex).toContain("@wp-typia/block-types/blocks/supports");
		expect(generatedIndex).toContain("} satisfies BlockSupports;");
		expect(generatedIndex).toContain("Typia-powered type-safe block");
		expect(generatedTypes).not.toMatch(/[가-힣]/u);
		expect(generatedValidators).toContain('from "./validator-toolkit"');
		expect(generatedValidators).toContain("@wp-typia/block-runtime/identifiers");
		expect(generatedValidators).toContain("generateBlockId");
		expect(generatedValidators).not.toContain("createScaffoldValidatorToolkit");
		expect(generatedValidators).not.toContain("applyTemplateDefaultsFromManifest");
		expect(generatedValidators).not.toContain("generateRuntimeId");
		expect(generatedValidatorToolkit).toContain("createScaffoldValidatorToolkit");
		expect(generatedValidatorToolkit).toContain("typia.createValidate");
		expect(generatedPluginBootstrap).toContain("Plugin Name:       Demo Npm");
		expect(generatedPluginBootstrap).toContain("Text Domain:       demo-npm");
		expect(generatedPluginBootstrap).toContain("load_plugin_textdomain(");
		expect(generatedPluginBootstrap).toContain("register_block_type( $build_dir );");
		expect(generatedWebpackConfig).toContain("@wp-typia/block-runtime/blocks");
		expect(generatedWebpackConfig).toContain("createTypiaWebpackConfig");
		expect(generatedEdit).not.toMatch(/[가-힣]/u);
		expect(generatedSave).not.toMatch(/[가-힣]/u);
		expect(generatedValidators).not.toMatch(/[가-힣]/u);
		expect(blockJson.example.attributes.content).toBe("Example content");
		expect(fs.existsSync(path.join(targetDir, ".wp-env.json"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, ".wp-env.test.json"))).toBe(false);
		expect(readme).toContain("npm install");
		expect(readme).toContain("npm run dev");
		expect(readme).toContain("npm run start");
		expect(readme).toContain("## Optional First Sync");
		expect(readme).toContain("npm run sync-types");
		expect(readme).toContain("-- --fail-on-lossy");
		expect(readme).toContain("-- --strict --report json");
		expect(readme).not.toContain("npm run sync-rest");
		expect(readme).toContain("watches the relevant sync scripts during local development");
		expect(readme).toContain("do not create migration history");
		expect(readme).not.toContain("## PHP REST Extension Points");

		typecheckGeneratedProject(targetDir);
	});

	test("scaffoldProject can opt into migration UI for built-in single-block templates", async () => {
		const targetDir = path.join(tempRoot, "demo-migration-ui");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "basic",
			packageManager: "npm",
			noInstall: true,
			withMigrationUi: true,
			answers: {
				author: "Test Runner",
				description: "Demo migration UI block",
				namespace: "demo-space",
				slug: "demo-migration-ui",
				title: "Demo Migration UI",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.tsx"), "utf8");
		const generatedIndex = fs.readFileSync(path.join(targetDir, "src", "index.tsx"), "utf8");
		const migrationConfig = fs.readFileSync(
			path.join(targetDir, "src", "migrations", "config.ts"),
			"utf8",
		);

		expect(packageJson.dependencies["@wordpress/api-fetch"]).toBe("^7.42.0");
		expect(packageJson.devDependencies["@wp-typia/project-tools"]).toBeUndefined();
		expect(packageJson.scripts["migration:init"]).toBe(
			`npx --yes wp-typia@${wpTypiaPackageManifest.version} migrate init --current-migration-version v1`,
		);
		expect(packageJson.scripts["migration:doctor"]).toBe(
			`npx --yes wp-typia@${wpTypiaPackageManifest.version} migrate doctor --all`,
		);
		expect(readme).toContain("## Migration UI");
		expect(readme).toContain("initialized migration workspace at `v1`");
		expect(generatedEdit).toContain("MigrationDashboard");
		expect(generatedIndex).toContain("./migrations/generated/demo-migration-ui/deprecated");
		expect(generatedIndex).toContain("deprecated as NonNullable<BlockConfiguration<DemoMigrationUiAttributes>['deprecated']>");
		expect(migrationConfig).toContain("key: 'demo-migration-ui'");
		expect(migrationConfig).toContain("blockJsonFile: 'src/block.json'");
		expect(fs.existsSync(path.join(targetDir, "src", "admin", "migration-dashboard.tsx"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "migrations", "generated", "index.ts"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "typia-migration-registry.php"))).toBe(true);

		typecheckGeneratedProject(targetDir);
	});

	test(
		"generated sync-types scripts support strict and JSON report modes",
		async () => {
			const targetDir = path.join(tempRoot, "demo-sync-types-report");

			await scaffoldProject({
				projectDir: targetDir,
				templateId: "basic",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Demo sync-types report block",
					namespace: "create-block",
					slug: "demo-sync-types-report",
					title: "Demo Sync Types Report",
				},
			});

			const syncScriptPath = path.join(
				targetDir,
				"scripts",
				"sync-types-to-block-json.ts",
			);
			const syncScript = fs.readFileSync(syncScriptPath, "utf8");
			const typesPath = path.join(targetDir, "src", "types.ts");

			expect(syncScript).toContain("runSyncBlockMetadata");
			expect(syncScript).toContain("--strict");
			expect(syncScript).toContain("--report");
			expect(syncScript).toContain("--fail-on-lossy");
			expect(syncScript).toContain("--check");
			expect(syncScript).toContain("Unknown sync-types flag");
			expect(syncScript).toContain("Generated attributes");

			fs.writeFileSync(
				typesPath,
				[
					'import { tags } from "typia";',
					"",
					"export interface DemoSyncTypesReportAttributes {",
					'  title: string & tags.Default<"Hello world">;',
					"  settings: {",
					"    slug: string & tags.MinLength<1>;",
					"  };",
					'  endpoint?: string & tags.Format<"hostname">;',
					"}",
					"",
				].join("\n"),
			);

			const warningOutput = runGeneratedScript(
				targetDir,
				"scripts/sync-types-to-block-json.ts",
				["--report", "json"],
			);
			const warningReport = JSON.parse(warningOutput);

			expect(warningReport.status).toBe("warning");
			expect(warningReport.strict).toBe(false);
			expect(warningReport.failOnLossy).toBe(false);
			expect(warningReport.failOnPhpWarnings).toBe(false);
			expect(warningReport.lossyProjectionWarnings.length).toBeGreaterThan(0);
			expect(warningReport.phpGenerationWarnings).toContain(
				'endpoint: unsupported PHP validator format "hostname"',
			);

			let strictError: unknown;
			try {
				runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", [
					"--strict",
					"--report",
					"json",
				]);
			} catch (error) {
				strictError = error;
			}

			expect(strictError).toBeDefined();
			const strictStdout = (strictError as { stdout?: Buffer | string }).stdout ?? "";
			const strictReport = JSON.parse(
				typeof strictStdout === "string"
					? strictStdout
					: strictStdout.toString("utf8"),
			);

			expect(strictReport.status).toBe("error");
			expect(strictReport.failure).toBeNull();
			expect(strictReport.strict).toBe(true);
			expect(strictReport.failOnLossy).toBe(true);
			expect(strictReport.failOnPhpWarnings).toBe(true);
			expect(strictReport.lossyProjectionWarnings.length).toBeGreaterThan(0);
			expect(strictReport.phpGenerationWarnings.length).toBeGreaterThan(0);

			runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts");

			const checkOutput = runGeneratedScript(
				targetDir,
				"scripts/sync-types-to-block-json.ts",
				["--check", "--report", "json"],
			);
			const checkReport = JSON.parse(checkOutput);

			expect(checkReport.status).toBe("warning");
			expect(checkReport.failure).toBeNull();

			fs.writeFileSync(
				path.join(targetDir, "src", "block.json"),
				JSON.stringify({ attributes: {}, example: { attributes: {} } }, null, 2),
			);

			let staleError: unknown;
			try {
				runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", [
					"--check",
					"--report",
					"json",
				]);
			} catch (error) {
				staleError = error;
			}

			expect(staleError).toBeDefined();
			const staleStdout = (staleError as { stdout?: Buffer | string }).stdout ?? "";
			const staleReport = JSON.parse(
				typeof staleStdout === "string"
					? staleStdout
					: staleStdout.toString("utf8"),
			);

			expect(staleReport.status).toBe("error");
			expect(staleReport.failure?.code).toBe("stale-generated-artifact");
			expect(staleReport.failure?.message).toContain(path.join(targetDir, "src", "block.json"));
		},
		{ timeout: 15_000 },
	);

	test("scaffoldProject creates an interactivity template with typed validation wiring", async () => {
		const targetDir = path.join(tempRoot, "demo-interactivity");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "interactivity",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo interactivity block",
				namespace: "demo-space",
				slug: "demo-interactivity",
				title: "Demo Interactivity",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedHooks = fs.readFileSync(path.join(targetDir, "src", "hooks.ts"), "utf8");
		const generatedValidators = fs.readFileSync(path.join(targetDir, "src", "validators.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.tsx"), "utf8");
		const generatedInteractivity = fs.readFileSync(
			path.join(targetDir, "src", "interactivity.ts"),
			"utf8",
		);
		const generatedManifest = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "typia.manifest.json"), "utf8"),
		);
		const generatedSave = fs.readFileSync(path.join(targetDir, "src", "save.tsx"), "utf8");
		const generatedStyle = fs.readFileSync(path.join(targetDir, "src", "style.scss"), "utf8");
		const generatedIndex = fs.readFileSync(path.join(targetDir, "src", "index.tsx"), "utf8");
		const generatedPluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-interactivity.php"),
			"utf8",
		);
		const generatedWebpackConfig = fs.readFileSync(
			path.join(targetDir, "webpack.config.js"),
			"utf8",
		);
		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.name).toBe("demo-interactivity");
		expect(packageJson.scripts.dev).toBe(
			'concurrently -k -n sync-types,editor -c yellow,blue "npm run watch:sync-types" "npm run start:editor"',
		);
		expect(packageJson.scripts["watch:sync-types"]).toBe(
			'chokidar "src/types.ts" --debounce 200 -c "npm run sync-types"',
		);
		expect(blockJson.name).toBe("demo-space/demo-interactivity");
		expect(blockJson.textdomain).toBe("demo-interactivity");
		expect(blockJson.version).toBe("0.1.0");
		expect(blockJson.category).toBe("widgets");
		expect(blockJson.icon).toBe("smiley");
		expect(blockJson.editorStyle).toBeUndefined();
		expect(generatedManifest.manifestVersion).toBe(2);
		expect(generatedManifest.sourceType).toBe("DemoInteractivityAttributes");
		expect(generatedManifest.attributes.interactiveMode.wp.enum).toEqual([
			"click",
			"hover",
			"auto",
		]);
		expect(generatedManifest.attributes.clickCount.typia.constraints.typeTag).toBe("uint32");
		expect(generatedTypes).toContain("ValidationResult");
		expect(generatedHooks).toContain("useTypiaValidation");
		expect(generatedHooks).toContain("createUseTypiaValidationHook");
		expect(generatedValidators).toContain('from "./validator-toolkit"');
		expect(generatedValidators).toContain("@wp-typia/block-runtime/identifiers");
		expect(generatedValidators).toContain("generateScopedClientId");
		expect(generatedValidators).not.toContain("createScaffoldValidatorToolkit");
		expect(generatedValidators).not.toContain("generateUniqueId");
		expect(generatedEdit).toContain("@wp-typia/block-runtime/inspector");
		expect(generatedEdit).not.toContain("@wp-typia/project-tools/schema-core");
		expect(generatedEdit).toContain("InspectorFromManifest");
		expect(generatedEdit).toContain("useEditorFields");
		expect(generatedEdit).toContain("useTypiaValidation");
		expect(generatedEdit).toContain("useTypedAttributeUpdater");
		expect(generatedEdit).toContain("aria-pressed={isPreviewing}");
		expect(generatedEdit).toContain(
			"className: `wp-block-demo-space-demo-interactivity wp-block-demo-space-demo-interactivity--${interactiveMode}`",
		);
		expect(generatedEdit).toContain("wp-block-demo-space-demo-interactivity__content");
		expect(generatedValidators).toContain('from "./validator-toolkit"');
		expect(generatedIndex).toContain("@wp-typia/block-runtime/blocks");
		expect(generatedIndex).toContain("buildScaffoldBlockRegistration");
		expect(generatedIndex).toContain("type ScaffoldBlockMetadata");
		expect(generatedIndex).toContain("@wp-typia/block-types/blocks/supports");
		expect(generatedIndex).toContain("} satisfies BlockSupports;");
		expect(generatedPluginBootstrap).toContain("Plugin Name:       Demo Interactivity");
		expect(generatedPluginBootstrap).toContain("Text Domain:       demo-interactivity");
		expect(generatedPluginBootstrap).toContain("load_plugin_textdomain(");
		expect(generatedPluginBootstrap).toContain("register_block_type( $build_dir );");
		expect(generatedWebpackConfig).toContain("createTypiaWebpackConfig");
		expect(generatedInteractivity).not.toContain("onInit:");
		expect(generatedInteractivity).not.toContain("onInteraction:");
		expect(generatedInteractivity).not.toContain("onDestroy:");
		expect(generatedInteractivity).toContain("get clampedClicks()");
		expect(generatedSave).toContain('aria-label="Reset counter"');
		expect(generatedSave).toContain("className=\"screen-reader-text\"");
		expect(generatedSave).toContain("role=\"progressbar\"");
		expect(generatedSave).toContain("data-wp-bind--aria-valuenow=\"state.clampedClicks\"");
		expect(generatedSave).toContain('role="status"');
		expect(generatedSave).toContain('aria-live="polite"');
		expect(generatedSave).toContain('aria-hidden="true"');
		expect(generatedSave).toContain(
			"className: `wp-block-demo-space-demo-interactivity wp-block-demo-space-demo-interactivity--${attributes.interactiveMode}`",
		);
		expect(generatedSave).toContain("wp-block-demo-space-demo-interactivity__content");
		expect(generatedSave).not.toContain('data-wp-text="state.clicks"\n              aria-live=');
		expect(generatedSave).not.toContain("data-clicks");
		expect(generatedSave).not.toContain("data-is-animating");
		expect(generatedSave).not.toContain("data-is-visible");
		expect(generatedSave).not.toContain("data-unique-id");
		expect(generatedStyle).toContain(".wp-block-demo-space-demo-interactivity");
	});

	test("scaffoldProject supports the optional local wp-env preset without adding test files", async () => {
		const targetDir = path.join(tempRoot, "demo-local-wp-env");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "basic",
			packageManager: "npm",
			noInstall: true,
			withWpEnv: true,
			answers: {
				author: "Test Runner",
				description: "Demo local wp-env preset",
				namespace: "create-block",
				slug: "demo-local-wp-env",
				title: "Demo Local Wp Env",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const wpEnvConfig = JSON.parse(fs.readFileSync(path.join(targetDir, ".wp-env.json"), "utf8"));
		const gitignore = fs.readFileSync(path.join(targetDir, ".gitignore"), "utf8");

		expect(packageJson.devDependencies["@wordpress/env"]).toBe("^11.2.0");
		expect(packageJson.scripts["wp-env:start"]).toBe("wp-env start");
		expect(packageJson.scripts["wp-env:stop"]).toBe("wp-env stop");
		expect(packageJson.scripts["wp-env:reset"]).toBe("wp-env destroy all && wp-env start");
		expect(fs.existsSync(path.join(targetDir, ".wp-env.json"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, ".wp-env.test.json"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "playwright.config.ts"))).toBe(false);
		expect(wpEnvConfig.plugins).toEqual(["."]);
		expect(gitignore).not.toContain("playwright-report/");
		expect(gitignore).not.toContain("test-results/");
		expect(readme).toContain("## Local WordPress");
		expect(readme).not.toContain("## Local Test Preset");
	});

	test("scaffoldProject supports the optional test preset without adding the normal wp-env preset", async () => {
		const targetDir = path.join(tempRoot, "demo-test-preset");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "basic",
			packageManager: "npm",
			noInstall: true,
			withTestPreset: true,
			answers: {
				author: "Test Runner",
				description: "Demo test preset",
				namespace: "create-block",
				slug: "demo-test-preset",
				title: "Demo Test Preset",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const gitignore = fs.readFileSync(path.join(targetDir, ".gitignore"), "utf8");
		const wpEnvTestConfig = JSON.parse(
			fs.readFileSync(path.join(targetDir, ".wp-env.test.json"), "utf8"),
		);

		expect(packageJson.devDependencies["@wordpress/env"]).toBe("^11.2.0");
		expect(packageJson.devDependencies["@playwright/test"]).toBe("^1.54.2");
		expect(packageJson.scripts["wp-env:start:test"]).toBe("wp-env start --config=.wp-env.test.json");
		expect(packageJson.scripts["wp-env:wait:test"]).toBe(
			"node scripts/wait-for-wp-env.mjs http://localhost:8889 180000 .wp-env.test.json",
		);
		expect(packageJson.scripts["test:e2e"]).toBe(
			"npm run wp-env:start:test && npm run wp-env:wait:test && playwright test",
		);
		expect(fs.existsSync(path.join(targetDir, ".wp-env.json"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, ".wp-env.test.json"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "playwright.config.ts"))).toBe(true);
		expect(
			fs.existsSync(path.join(targetDir, "tests", "e2e", "smoke.spec.ts")),
		).toBe(true);
		expect(
			fs.existsSync(path.join(targetDir, "scripts", "wait-for-wp-env.mjs")),
		).toBe(true);
		expect(wpEnvTestConfig.plugins).toEqual(["."]);
		expect(gitignore).toContain("playwright-report/");
		expect(gitignore).toContain("test-results/");
		expect(readme).toContain("## Local Test Preset");
		expect(readme).not.toContain("## Local WordPress");
	});

	test(
		"scaffoldProject creates a persistence template with signed public writes and explicit storage mode",
		async () => {
			const targetDir = path.join(tempRoot, "demo-persistence-public");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "post-meta",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "post-meta",
				description: "Demo persistence block",
				namespace: "create-block",
				persistencePolicy: "public",
				slug: "demo-persistence-public",
				title: "Demo Persistence Public",
			},
			persistencePolicy: "public",
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-persistence-public.php"), "utf8");
		const generatedApi = fs.readFileSync(path.join(targetDir, "src", "api.ts"), "utf8");
		const generatedData = fs.readFileSync(path.join(targetDir, "src", "data.ts"), "utf8");
		const generatedSyncRest = fs.readFileSync(
			path.join(targetDir, "scripts", "sync-rest-contracts.ts"),
			"utf8",
		);
		const generatedRender = fs.readFileSync(path.join(targetDir, "src", "render.php"), "utf8");
		const generatedApiTypes = fs.readFileSync(
			path.join(targetDir, "src", "api-types.ts"),
			"utf8",
		);
		const generatedValidatorToolkit = fs.readFileSync(
			path.join(targetDir, "src", "validator-toolkit.ts"),
			"utf8",
		);
		const generatedManifest = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "typia.manifest.json"), "utf8"),
		);
		const generatedInteractivity = fs.readFileSync(
			path.join(targetDir, "src", "interactivity.ts"),
			"utf8",
		);
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedValidators = fs.readFileSync(
			path.join(targetDir, "src", "validators.ts"),
			"utf8",
		);
		const generatedStyle = fs.readFileSync(path.join(targetDir, "src", "style.scss"), "utf8");
		const generatedSave = fs.readFileSync(path.join(targetDir, "src", "save.tsx"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const restPublicHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-public.php"), "utf8");
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.name).toBe("demo-persistence-public");
		expect(packageJson.devDependencies["@wp-typia/api-client"]).toBe(apiClientPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/rest"]).toBe(restPackageVersion);
		expect(packageJson.devDependencies["chokidar-cli"]).toBe("^3.0.0");
		expect(packageJson.devDependencies.concurrently).toBe("^9.0.1");
		expect(packageJson.scripts.build).toBe(
			"npm run sync-types -- --check && npm run sync-rest -- --check && wp-scripts build --experimental-modules",
		);
		expect(packageJson.scripts.dev).toBe(
			'concurrently -k -n sync-types,sync-rest,editor -c yellow,magenta,blue "npm run watch:sync-types" "npm run watch:sync-rest" "npm run start:editor"',
		);
		expect(packageJson.scripts["start:editor"]).toBe("wp-scripts start --experimental-modules");
		expect(packageJson.scripts["watch:sync-types"]).toBe(
			'chokidar "src/types.ts" --debounce 200 -c "npm run sync-types"',
		);
		expect(packageJson.scripts["watch:sync-rest"]).toBe(
			'chokidar "src/api-types.ts" --debounce 200 -c "npm run sync-rest"',
		);
		expect(packageJson.scripts.typecheck).toBe(
			"npm run sync-types -- --check && npm run sync-rest -- --check && tsc --noEmit",
		);
		expect(blockJson.textdomain).toBe("demo-persistence-public");
		expect(blockJson.version).toBe("0.1.0");
		expect(blockJson.category).toBe("widgets");
		expect(blockJson.icon).toBe("database");
		expect(generatedManifest.manifestVersion).toBe(2);
		expect(generatedManifest.sourceType).toBe("DemoPersistencePublicAttributes");
		expect(generatedManifest.attributes.resourceKey.typia.defaultValue).toBe("primary");
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-public.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "languages", ".gitkeep"))).toBe(true);
		expect(pluginBootstrap).toContain("post-meta");
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-public");
		expect(pluginBootstrap).toContain("Tested up to:      6.9");
		expect(pluginBootstrap).toContain("Domain Path:       /languages");
		expect(pluginBootstrap).toContain("load_plugin_textdomain(");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-public.php';");
		expect(pluginBootstrap).toContain("return 'wpt_pcl_' . md5(");
		expect(pluginBootstrap).toContain("permission_callback' => 'demo_persistence_public_can_write_publicly'");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_WINDOW");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_MAX");
		expect(pluginBootstrap).not.toMatch(
			/'callback'\s*=>\s*'demo_persistence_public_handle_write_state'[\s\S]*?'permission_callback'\s*=>\s*'__return_true'/,
		);
		expect(restPublicHelper).toContain("function demo_persistence_public_verify_public_write_token");
		expect(restPublicHelper).toContain("function demo_persistence_public_consume_public_write_request_id");
		expect(restPublicHelper).toContain("function demo_persistence_public_enforce_public_write_rate_limit");
		expect(restPublicHelper).toContain("SELECT GET_LOCK(%s, 5)");
		expect(restPublicHelper).toContain("SELECT RELEASE_LOCK(%s)");
		expect(restPublicHelper).toContain("return 'wpt_pwl_' . md5(");
		expect(generatedApi).toContain("@wp-typia/rest");
		expect(generatedApi).toContain("from './api-client'");
		expect(generatedApi).toContain("getDemoPersistencePublicStateEndpoint");
		expect(generatedApi).toContain("writeDemoPersistencePublicStateEndpoint");
		expect(generatedApi).not.toContain("createEndpoint(");
		expect(generatedData).toContain("from '@wp-typia/rest/react'");
		expect(generatedInteractivity).toContain("@wp-typia/block-runtime/identifiers");
		expect(generatedInteractivity).toContain("generatePublicWriteRequestId");
		expect(generatedInteractivity).not.toContain("function createPublicWriteRequestId");
		expect(generatedValidatorToolkit).toContain("createScaffoldValidatorToolkit");
		expect(generatedValidators).toContain("@wp-typia/block-runtime/identifiers");
		expect(generatedValidators).toContain("generateResourceKey");
		expect(generatedValidators).not.toContain("const generateResourceKey");
		expect(generatedData).toContain("useDemoPersistencePublicStateQuery");
		expect(generatedData).toContain("useWriteDemoPersistencePublicStateMutation");
		expect(generatedSyncRest).toContain("syncTypeSchemas");
		expect(generatedSyncRest).toContain("defineEndpointManifest");
		expect(generatedSyncRest).toContain("syncEndpointClient");
		expect(generatedSyncRest).toContain("syncRestOpenApi");
		expect(generatedSyncRest).toContain("--check");
		expect(generatedSyncRest).toContain("@wp-typia/block-runtime/metadata-core");
		expect(generatedSyncRest).toContain("const REST_ENDPOINT_MANIFEST = defineEndpointManifest");
		expect(generatedSyncRest).toContain("manifest: REST_ENDPOINT_MANIFEST");
		expect(generatedSyncRest).not.toContain("const CONTRACTS =");
		expect(generatedSyncRest).not.toContain("const ENDPOINTS =");
		expect(generatedSyncRest).not.toContain("@wp-typia/project-tools/schema-core");
		expect(generatedSyncRest).toContain("src/api.openapi.json");
		expect(generatedSyncRest).not.toContain("openApiInfo: REST_ENDPOINT_MANIFEST.info");
		expect(generatedStyle).toContain(".wp-block-create-block-demo-persistence-public");
		expect(generatedStyle).toContain(".wp-block-create-block-demo-persistence-public-frontend");
		expect(generatedRender).toContain("publicWriteToken");
		expect(generatedRender).toContain('class="wp-block-create-block-demo-persistence-public-frontend"');
		expect(generatedRender).toContain("wp-block-create-block-demo-persistence-public-frontend__content");
		expect(generatedRender).toContain('role="status"');
		expect(generatedRender).toContain('aria-live="polite"');
		expect(generatedApiTypes).toContain("publicWriteRequestId: string");
		expect(generatedTypes).toContain("persistencePolicy: 'authenticated' | 'public';");
		expect(generatedSave).toContain("intentionally server-rendered");
		expect(generatedSave).toContain("return null;");
		expect(readme).toContain("npm run dev");
		expect(readme).toContain("npm run sync-types");
		expect(readme).toContain("npm run sync-rest");
		expect(readme).toContain("src/api-types.ts");
		expect(readme).toContain("`src/render.php` is the canonical frontend entry");
		expect(readme).toContain("`src/save.tsx` returns `null`");
		expect(readme).toContain("per-request ids, and coarse rate limiting by default");
		expect(readme).toContain("## PHP REST Extension Points");
		expect(readme).toContain("Edit `demo-persistence-public.php`");
		expect(readme).toContain("Edit `inc/rest-auth.php` or `inc/rest-public.php` when you need to customize write permissions or token/request-id/nonce checks");
		expect(pluginBootstrap).toContain("Customize storage helpers");
		expect(pluginBootstrap).toContain("Route handlers are the main product-level extension point");
		expect(restPublicHelper).toContain("Customize the public write gate here");

		runGeneratedScript(targetDir, "scripts/sync-rest-contracts.ts");
		runGeneratedScript(targetDir, "scripts/sync-rest-contracts.ts", ["--check"]);

		const generatedApiClient = fs.readFileSync(
			path.join(targetDir, "src", "api-client.ts"),
			"utf8",
		);
			expect(generatedApiClient).toContain("from '@wp-typia/api-client'");
			expect(generatedApiClient).toContain("export const getDemoPersistencePublicStateEndpoint");
			expect(generatedApiClient).toContain("export function writeDemoPersistencePublicState(");
		},
		{ timeout: 15_000 },
	);

	test("scaffoldProject creates a persistence template with authenticated writes by default", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-authenticated");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "custom-table",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "custom-table",
				description: "Demo authenticated persistence block",
				namespace: "create-block",
				persistencePolicy: "authenticated",
				slug: "demo-persistence-authenticated",
				title: "Demo Persistence Authenticated",
			},
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-authenticated.php"),
			"utf8",
		);
		const restAuthHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-auth.php"), "utf8");
		const generatedRender = fs.readFileSync(path.join(targetDir, "src", "render.php"), "utf8");
		const generatedApiTypes = fs.readFileSync(
			path.join(targetDir, "src", "api-types.ts"),
			"utf8",
		);
		const generatedManifest = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "typia.manifest.json"), "utf8"),
		);
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.tsx"), "utf8");
		const generatedStyle = fs.readFileSync(path.join(targetDir, "src", "style.scss"), "utf8");
		const generatedSave = fs.readFileSync(path.join(targetDir, "src", "save.tsx"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.name).toBe("demo-persistence-authenticated");
		expect(packageJson.scripts.dev).toBe(
			'concurrently -k -n sync-types,sync-rest,editor -c yellow,magenta,blue "npm run watch:sync-types" "npm run watch:sync-rest" "npm run start:editor"',
		);
		expect(blockJson.textdomain).toBe("demo-persistence-authenticated");
		expect(generatedManifest.manifestVersion).toBe(2);
		expect(generatedManifest.sourceType).toBe("DemoPersistenceAuthenticatedAttributes");
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-auth.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "languages", ".gitkeep"))).toBe(true);
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-authenticated");
		expect(pluginBootstrap).toContain("Tested up to:      6.9");
		expect(pluginBootstrap).toContain("Domain Path:       /languages");
		expect(pluginBootstrap).toContain("load_plugin_textdomain(");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-auth.php';");
		expect(pluginBootstrap).toContain("return 'wpt_pcl_' . md5(");
		expect(pluginBootstrap).toContain("permission_callback' => 'demo_persistence_authenticated_can_write_authenticated'");
		expect(pluginBootstrap).not.toMatch(
			/'callback'\s*=>\s*'demo_persistence_authenticated_handle_write_state'[\s\S]*?'permission_callback'\s*=>\s*'__return_true'/,
		);
		expect(restAuthHelper).toContain("function demo_persistence_authenticated_can_write_authenticated");
		expect(generatedStyle).toContain(".wp-block-create-block-demo-persistence-authenticated");
		expect(generatedStyle).toContain(
			".wp-block-create-block-demo-persistence-authenticated-frontend",
		);
		expect(generatedRender).toContain(
			'class="wp-block-create-block-demo-persistence-authenticated-frontend"',
		);
		expect(generatedRender).toContain("Sign in to persist this counter.");
		expect(generatedApiTypes).toContain("publicWriteRequestId?: string");
		expect(generatedApiTypes).not.toContain("{{#isPublicPersistencePolicy}}");
		expect(generatedTypes).toContain("persistencePolicy: 'authenticated' | 'public';");
		expect(generatedEdit).toContain("Stable persisted identifier used by the storage-backed counter endpoint.");
		expect(generatedEdit).toContain("Render mode: dynamic. `render.php` bootstraps post context, storage-backed state, and write-policy data before hydration.");
		expect(generatedSave).toContain("intentionally server-rendered");
		expect(generatedSave).toContain("return null;");
		expect(readme).toContain("npm run dev");
		expect(readme).toContain("## PHP REST Extension Points");
		expect(readme).toContain("Edit `demo-persistence-authenticated.php`");
		expect(readme).toContain("`src/render.php` is the canonical frontend entry");
		expect(readme).toContain("`src/save.tsx` returns `null`");
		expect(restAuthHelper).toContain("Customize authenticated write policy here");
	});

	test("scaffoldProject supports explicit text-domain overrides on persistence templates", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-text-domain");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "custom-table",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "custom-table",
				description: "Demo persistence text domain block",
				namespace: "create-block",
				persistencePolicy: "authenticated",
				slug: "demo-persistence-text-domain",
				textDomain: "demo-custom-text-domain",
				title: "Demo Persistence Text Domain",
			},
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-text-domain.php"),
			"utf8",
		);

		expect(blockJson.name).toBe("create-block/demo-persistence-text-domain");
		expect(blockJson.textdomain).toBe("demo-custom-text-domain");
		expect(pluginBootstrap).toContain("Text Domain:       demo-custom-text-domain");
		expect(pluginBootstrap).toContain(
			"function demo_persistence_text_domain_get_counter",
		);
	});

	test("scaffoldProject supports explicit php-prefix overrides on persistence templates", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-php-prefix");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "custom-table",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "custom-table",
				description: "Demo persistence php prefix block",
				namespace: "create-block",
				persistencePolicy: "authenticated",
				phpPrefix: "custom_counter_prefix",
				slug: "demo-persistence-php-prefix",
				title: "Demo Persistence Php Prefix",
			},
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-php-prefix.php"),
			"utf8",
		);

		expect(blockJson.textdomain).toBe("demo-persistence-php-prefix");
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-php-prefix");
		expect(pluginBootstrap).toContain("function custom_counter_prefix_get_counter");
		expect(pluginBootstrap).toContain("custom_counter_prefix_storage_version");
	});

	test("scaffoldProject rejects overly long php-prefix overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-php-prefix-too-long");

		await expect(
			scaffoldProject({
				projectDir: targetDir,
				templateId: "persistence",
				dataStorageMode: "custom-table",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					dataStorageMode: "custom-table",
					description: "Demo persistence php prefix length guard",
					namespace: "create-block",
					persistencePolicy: "authenticated",
					phpPrefix: "a".repeat(51),
					slug: "demo-persistence-php-prefix-too-long",
					title: "Demo Persistence Php Prefix Too Long",
				},
			}),
		).rejects.toThrow("Use 50 characters or fewer");
	});

	test("scaffoldProject supports combined identifier overrides on persistence templates", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-identifiers");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "post-meta",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "post-meta",
				description: "Demo persistence identifier overrides",
				namespace: "experiments",
				persistencePolicy: "public",
				phpPrefix: "ab_test_metrics",
				slug: "demo-persistence-identifiers",
				textDomain: "demo-persistence-text",
				title: "Demo Persistence Identifiers",
			},
			persistencePolicy: "public",
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-identifiers.php"),
			"utf8",
		);
		const restPublicHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-public.php"), "utf8");

		expect(blockJson.name).toBe("experiments/demo-persistence-identifiers");
		expect(blockJson.textdomain).toBe("demo-persistence-text");
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-text");
		expect(pluginBootstrap).toContain("function ab_test_metrics_get_counter");
		expect(restPublicHelper).toContain("function ab_test_metrics_create_public_write_token");
	});

	test("scaffoldProject creates a pure compound template with parent and hidden child blocks", async () => {
		const targetDir = path.join(tempRoot, "demo-compound");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo compound block",
				namespace: "create-block",
				slug: "demo-compound",
				title: "Demo Compound",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-compound.php"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const blockConfig = fs.readFileSync(path.join(targetDir, "scripts", "block-config.ts"), "utf8");
		const addChildScript = fs.readFileSync(
			path.join(targetDir, "scripts", "add-compound-child.ts"),
			"utf8",
		);
		const parentEdit = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound", "edit.tsx"),
			"utf8",
		);
		const parentHooks = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound", "hooks.ts"),
			"utf8",
		);
		const parentValidators = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound", "validators.ts"),
			"utf8",
		);
		const generatedRootHooks = fs.readFileSync(path.join(targetDir, "src", "hooks.ts"), "utf8");
		const generatedValidatorToolkit = fs.readFileSync(
			path.join(targetDir, "src", "validator-toolkit.ts"),
			"utf8",
		);
		const parentManifest = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound", "typia.manifest.json"),
				"utf8",
			),
		);
		const parentChildren = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound", "children.ts"),
			"utf8",
		);
		const parentStyle = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound", "style.scss"),
			"utf8",
		);
		const childEdit = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-item", "edit.tsx"),
			"utf8",
		);
		const childHooks = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-item", "hooks.ts"),
			"utf8",
		);
		const childValidators = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-item", "validators.ts"),
			"utf8",
		);
		const childManifest = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-item", "typia.manifest.json"),
				"utf8",
			),
		);
		const parentBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "blocks", "demo-compound", "block.json"), "utf8"),
		);
		const childBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-item", "block.json"),
				"utf8",
			),
		);
		const generatedWebpackConfig = fs.readFileSync(
			path.join(targetDir, "webpack.config.js"),
			"utf8",
		);

		expect(packageJson.scripts.build).toBe(
			"npm run sync-types -- --check && wp-scripts build --experimental-modules",
		);
		expect(packageJson.scripts.dev).toBe(
			'concurrently -k -n sync-types,editor -c yellow,blue "npm run watch:sync-types" "npm run start:editor"',
		);
		expect(packageJson.scripts["watch:sync-types"]).toBe(
			'chokidar "src/blocks/**/types.ts" "scripts/block-config.ts" --debounce 200 -c "npm run sync-types"',
		);
		expect(packageJson.scripts.typecheck).toBe("npm run sync-types -- --check && tsc --noEmit");
		expect(pluginBootstrap).toContain("build/blocks");
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-auth.php"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-public.php"))).toBe(false);
		expect(parentBlockJson.name).toBe("create-block/demo-compound");
		expect(parentBlockJson.version).toBe("0.1.0");
		expect(parentBlockJson.category).toBe("widgets");
		expect(parentBlockJson.icon).toBe("screenoptions");
		expect(parentManifest.sourceType).toBe("DemoCompoundAttributes");
		expect(parentManifest.attributes.heading.typia.defaultValue).toBe("Demo Compound");
		expect(childBlockJson.parent).toEqual(["create-block/demo-compound"]);
		expect(childBlockJson.version).toBe("0.1.0");
		expect(childBlockJson.category).toBe("widgets");
		expect(childBlockJson.icon).toBe("excerpt-view");
		expect(childBlockJson.style).toBeUndefined();
		expect(childBlockJson.supports.inserter).toBe(false);
		expect(childManifest.sourceType).toBe("DemoCompoundItemAttributes");
		expect(childManifest.attributes.title.typia.defaultValue).toBe("Demo Compound Item");
		expect(packageJson.scripts["add-child"]).toBe("tsx scripts/add-compound-child.ts");
		expect(fs.existsSync(path.join(targetDir, "scripts", "sync-rest-contracts.ts"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "src", "blocks", "demo-compound", "api.openapi.json"))).toBe(
			false,
		);
		expect(parentEdit).toContain("createAttributeUpdater");
		expect(parentEdit).toContain("useTypiaValidation");
		expect(parentEdit).toContain("ALLOWED_CHILD_BLOCKS");
		expect(parentEdit).toContain("DEFAULT_CHILD_TEMPLATE");
		expect(parentEdit).not.toMatch(/setAttributes\s*\(\s*\{/);
		expect(generatedRootHooks).toContain("useTypiaValidation");
		expect(parentHooks).toContain("useTypiaValidation");
		expect(parentHooks).toContain("from '../../hooks'");
		expect(parentValidators).toContain("validator-toolkit");
		expect(parentValidators).not.toContain("createScaffoldValidatorToolkit");
		expect(generatedValidatorToolkit).toContain("createScaffoldValidatorToolkit");
		expect(parentChildren).toContain("DEFAULT_CHILD_BLOCK_NAME");
		expect(parentChildren).toContain("add-child: insert new allowed child block names here");
		expect(parentStyle).toContain(".wp-block-create-block-demo-compound");
		expect(parentStyle).toContain(".wp-block-create-block-demo-compound-item");
		expect(childEdit).toContain("createAttributeUpdater");
		expect(childEdit).toContain("useTypiaValidation");
		expect(childEdit).not.toMatch(/setAttributes\s*\(\s*\{/);
		expect(childEdit).toContain("wp-block-create-block-demo-compound-item__title");
		expect(childHooks).toContain("useTypiaValidation");
		expect(childHooks).toContain("from '../../hooks'");
		expect(childValidators).toContain("validator-toolkit");
		expect(childValidators).not.toContain("createScaffoldValidatorToolkit");
		expect(childBlockJson.attributes.title.selector).toBe(
			".wp-block-create-block-demo-compound-item__title",
		);
		expect(childBlockJson.attributes.body.selector).toBe(
			".wp-block-create-block-demo-compound-item__body",
		);
		expect(addChildScript).toContain("createUseTypiaValidationHook");
		expect(addChildScript).toContain("createScaffoldValidatorToolkit");
		expect(addChildScript).toContain("buildScaffoldBlockRegistration");
		expect(addChildScript).toContain("type ScaffoldBlockMetadata");
		expect(addChildScript).toContain("ALLOWED_CHILD_MARKER");
		expect(addChildScript).toContain("BLOCK_CONFIG_MARKER");
		expect(addChildScript).toContain("buildBlockCssClassName");
		expect(generatedWebpackConfig).toContain("createTypiaWebpackConfig");
		expect(readme).toContain("npm run sync-types");
		expect(readme).not.toContain("npm run sync-rest");
		expect(readme).toContain("npm run dev");
		expect(readme).toContain("src/blocks/*/types.ts");
		expect(readme).toContain('npm run add-child -- --slug faq-item --title "FAQ Item"');
		expect(readme).not.toContain("## PHP REST Extension Points");
		expect(blockConfig).not.toContain("restManifest");

		typecheckGeneratedProject(targetDir);
	});

	test("compound scaffolds can opt into migration UI and keep add-child migration-aware", async () => {
		const targetDir = path.join(tempRoot, "demo-compound-migration");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			withMigrationUi: true,
			answers: {
				author: "Test Runner",
				description: "Demo compound migration block",
				namespace: "create-block",
				slug: "demo-compound-migration",
				title: "Demo Compound Migration",
			},
		});

		const migrationConfigPath = path.join(targetDir, "src", "migrations", "config.ts");
		const parentIndexPath = path.join(
			targetDir,
			"src",
			"blocks",
			"demo-compound-migration",
			"index.tsx",
		);
		const childIndexPath = path.join(
			targetDir,
			"src",
			"blocks",
			"demo-compound-migration-item",
			"index.tsx",
		);
		const parentEditPath = path.join(
			targetDir,
			"src",
			"blocks",
			"demo-compound-migration",
			"edit.tsx",
		);
		const addChildScriptPath = path.join(targetDir, "scripts", "add-compound-child.ts");

		expect(fs.readFileSync(parentIndexPath, "utf8")).toContain(
			"../../migrations/generated/demo-compound-migration/deprecated",
		);
		expect(fs.readFileSync(childIndexPath, "utf8")).toContain(
			"../../migrations/generated/demo-compound-migration-item/deprecated",
		);
		expect(fs.readFileSync(parentEditPath, "utf8")).toContain("MigrationDashboard");
		expect(fs.readFileSync(migrationConfigPath, "utf8")).toContain("key: 'demo-compound-migration'");
		expect(fs.readFileSync(migrationConfigPath, "utf8")).toContain("key: 'demo-compound-migration-item'");
		expect(fs.readFileSync(addChildScriptPath, "utf8")).toContain("appendMigrationBlockConfig");

		runGeneratedScript(targetDir, "scripts/add-compound-child.ts", [
			"--slug",
			"faq-item",
			"--title",
			"FAQ Item",
		]);

		const nextMigrationConfig = fs.readFileSync(migrationConfigPath, "utf8");
		expect(nextMigrationConfig).toContain("key: 'demo-compound-migration-faq-item'");
		expect(nextMigrationConfig).toContain("blockName: 'create-block/demo-compound-migration-faq-item'");
	});

	test("migration UI capability rejects non-built-in templates", async () => {
		const targetDir = path.join(tempRoot, "demo-migration-ui-remote");

		await expect(
			scaffoldProject({
				projectDir: targetDir,
				templateId: createBlockSubsetFixturePath,
				packageManager: "npm",
				noInstall: true,
				withMigrationUi: true,
				answers: {
					author: "Test Runner",
					description: "Demo remote migration ui block",
					namespace: "create-block",
					slug: "demo-migration-ui-remote",
					title: "Demo Migration UI Remote",
				},
			}),
		).rejects.toThrow(
			"`--with-migration-ui` is currently supported only for built-in templates and @wp-typia/create-workspace-template.",
		);
		expect(fs.existsSync(targetDir)).toBe(false);
	});

	test(
		"compound scaffolds enable authenticated persistence when only data storage is provided",
		async () => {
			const targetDir = path.join(tempRoot, "demo-compound-storage");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			dataStorageMode: "post-meta",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "post-meta",
				description: "Demo compound persistence block",
				namespace: "create-block",
				slug: "demo-compound-storage",
				title: "Demo Compound Storage",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-compound-storage.php"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const generatedSyncRest = fs.readFileSync(
			path.join(targetDir, "scripts", "sync-rest-contracts.ts"),
			"utf8",
		);
		const generatedBlockConfig = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);
		const generatedAddChild = fs.readFileSync(
			path.join(targetDir, "scripts", "add-compound-child.ts"),
			"utf8",
		);
		const generatedApiTypes = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage", "api-types.ts"),
			"utf8",
		);
		const parentEdit = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage", "edit.tsx"),
			"utf8",
		);
		const parentInteractivity = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage", "interactivity.ts"),
			"utf8",
		);
		const parentChildren = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage", "children.ts"),
			"utf8",
		);
		const parentManifest = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-storage", "typia.manifest.json"),
				"utf8",
			),
		);
		const childEdit = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage-item", "edit.tsx"),
			"utf8",
		);
		const childHooks = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage-item", "hooks.ts"),
			"utf8",
		);
		const childValidators = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage-item", "validators.ts"),
			"utf8",
		);
		const parentValidators = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage", "validators.ts"),
			"utf8",
		);
		const generatedValidatorToolkit = fs.readFileSync(
			path.join(targetDir, "src", "validator-toolkit.ts"),
			"utf8",
		);
		const childManifest = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-storage-item", "typia.manifest.json"),
				"utf8",
			),
		);
		const parentIndex = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-storage", "index.tsx"),
			"utf8",
		);
		const parentBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-storage", "block.json"),
				"utf8",
			),
		);
		const generatedWebpackConfig = fs.readFileSync(
			path.join(targetDir, "webpack.config.js"),
			"utf8",
		);

		expect(packageJson.devDependencies["@wp-typia/api-client"]).toBe(apiClientPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/rest"]).toBe(restPackageVersion);
		expect(packageJson.scripts.dev).toBe(
			'concurrently -k -n sync-types,sync-rest,editor -c yellow,magenta,blue "npm run watch:sync-types" "npm run watch:sync-rest" "npm run start:editor"',
		);
		expect(packageJson.scripts["watch:sync-types"]).toBe(
			'chokidar "src/blocks/**/types.ts" "scripts/block-config.ts" --debounce 200 -c "npm run sync-types"',
		);
		expect(packageJson.scripts["watch:sync-rest"]).toBe(
			'chokidar "src/blocks/**/api-types.ts" "scripts/block-config.ts" --debounce 200 -c "npm run sync-rest"',
		);
		expect(packageJson.scripts.build).toBe(
			"npm run sync-types -- --check && npm run sync-rest -- --check && wp-scripts build --experimental-modules",
		);
		expect(packageJson.scripts.typecheck).toBe(
			"npm run sync-types -- --check && npm run sync-rest -- --check && tsc --noEmit",
		);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-auth.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "languages", ".gitkeep"))).toBe(true);
		expect(pluginBootstrap).toContain("can_write_authenticated");
		expect(pluginBootstrap).toContain("Tested up to:      6.9");
		expect(pluginBootstrap).toContain("Domain Path:       /languages");
		expect(pluginBootstrap).toContain("load_plugin_textdomain(");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-auth.php';");
		expect(pluginBootstrap).toContain("return 'wpt_pcl_' . md5(");
		expect(parentBlockJson.render).toBe("file:./render.php");
		expect(parentBlockJson.viewScriptModule).toBe("file:./interactivity.js");
		expect(parentManifest.attributes.resourceKey.typia.defaultValue).toBe("primary");
		expect(generatedSyncRest).toContain("syncRestOpenApi");
		expect(generatedSyncRest).toContain("syncEndpointClient");
		expect(generatedSyncRest).toContain("manifest: block.restManifest");
		expect(generatedBlockConfig).toContain("src/blocks/demo-compound-storage/api.openapi.json");
		expect(generatedBlockConfig).toContain("restManifest: defineEndpointManifest");
		expect(generatedBlockConfig).toContain("add-child: insert new block config entries here");
		expect(generatedApiTypes).toContain("publicWriteRequestId?: string");
		expect(generatedApiTypes).not.toContain("{{#isPublicPersistencePolicy}}");
		expect(generatedBlockConfig).not.toContain("contracts: [");
		expect(generatedBlockConfig).not.toContain("openApiInfo:");
		expect(generatedBlockConfig.match(/restManifest: defineEndpointManifest/g)).toHaveLength(1);
		expect(parentEdit).toContain("createAttributeUpdater");
		expect(parentEdit).toContain("useTypiaValidation");
		expect(parentEdit).toContain("ALLOWED_CHILD_BLOCKS");
		expect(parentEdit).toContain("DEFAULT_CHILD_TEMPLATE");
		expect(parentEdit).not.toMatch(/setAttributes\s*\(\s*\{/);
		expect(parentInteractivity).toContain("@wp-typia/block-runtime/identifiers");
		expect(parentInteractivity).toContain("generatePublicWriteRequestId");
		expect(parentInteractivity).not.toContain("function createPublicWriteRequestId");
		expect(parentIndex).toContain("buildScaffoldBlockRegistration");
		expect(parentIndex).toContain("type ScaffoldBlockMetadata");
		expect(parentValidators).toContain("@wp-typia/block-runtime/identifiers");
		expect(parentValidators).toContain("generateResourceKey");
		expect(parentValidators).not.toContain("const generateResourceKey");
		expect(parentChildren).toContain("DEFAULT_CHILD_BLOCK_NAME");
		expect(childManifest.attributes.title.typia.defaultValue).toBe("Demo Compound Storage Item");
		expect(childEdit).toContain("createAttributeUpdater");
		expect(childEdit).toContain("useTypiaValidation");
		expect(childEdit).not.toMatch(/setAttributes\s*\(\s*\{/);
		expect(childHooks).toContain("useTypiaValidation");
		expect(childHooks).toContain("from '../../hooks'");
		expect(childValidators).toContain("validator-toolkit");
		expect(childValidators).not.toContain("createScaffoldValidatorToolkit");
		expect(generatedValidatorToolkit).toContain("createScaffoldValidatorToolkit");
		expect(generatedAddChild).toContain("ALLOWED_CHILD_MARKER");
		expect(generatedAddChild).toContain("buildScaffoldBlockRegistration");
		expect(generatedAddChild).toContain("type ScaffoldBlockMetadata");
		expect(packageJson.scripts["add-child"]).toBe("tsx scripts/add-compound-child.ts");
		expect(generatedWebpackConfig).toContain("createTypiaWebpackConfig");
		expect(readme).toContain("npm run dev");
		expect(readme).toContain("npm run sync-rest");
		expect(readme).toContain("src/blocks/*/api-types.ts");
		expect(readme).toContain('npm run add-child -- --slug faq-item --title "FAQ Item"');
		expect(readme).toContain("## PHP REST Extension Points");
		expect(readme).toContain("The hidden child block does not own REST routes or storage.");
		expect(pluginBootstrap).toContain("Customize storage helpers");

		runGeneratedScript(targetDir, "scripts/sync-rest-contracts.ts");

		const generatedApiClient = fs.readFileSync(
			path.join(
				targetDir,
				"src",
				"blocks",
				"demo-compound-storage",
				"api-client.ts",
			),
			"utf8",
		);
		const generatedParentApi = fs.readFileSync(
			path.join(
				targetDir,
				"src",
				"blocks",
				"demo-compound-storage",
				"api.ts",
			),
			"utf8",
		);
		const generatedParentData = fs.readFileSync(
			path.join(
				targetDir,
				"src",
				"blocks",
				"demo-compound-storage",
				"data.ts",
			),
			"utf8",
		);
		expect(generatedApiClient).toContain("from '@wp-typia/api-client'");
		expect(generatedApiClient).toContain("export const getDemoCompoundStorageStateEndpoint");
		expect(generatedParentApi).toContain("from './api-client'");
		expect(generatedParentApi).toContain("getDemoCompoundStorageStateEndpoint");
		expect(generatedParentApi).toContain("writeDemoCompoundStorageStateEndpoint");
		expect(generatedParentApi).not.toContain("createEndpoint(");
		expect(generatedParentData).toContain("from '@wp-typia/rest/react'");
		expect(generatedParentData).toContain("useDemoCompoundStorageStateQuery");
		expect(generatedParentData).toContain("useWriteDemoCompoundStorageStateMutation");
			expect(
				fs.existsSync(
					path.join(
						targetDir,
						"src",
						"blocks",
						"demo-compound-storage-item",
						"api-client.ts",
					),
				),
			).toBe(false);
		},
		{ timeout: 15_000 },
	);

	test(
		"compound add-child workflow scaffolds a new hidden child block and keeps the default template stable",
		async () => {
			const targetDir = path.join(tempRoot, "demo-compound-add-child");

			await scaffoldProject({
				projectDir: targetDir,
				templateId: "compound",
				dataStorageMode: "post-meta",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					dataStorageMode: "post-meta",
					description: "Demo compound add-child workflow",
					namespace: "create-block",
					slug: "demo-compound-add-child",
					title: "Demo Compound Add Child",
				},
			});

			const blockConfigPath = path.join(targetDir, "scripts", "block-config.ts");
			const childrenRegistryPath = path.join(
				targetDir,
				"src",
				"blocks",
				"demo-compound-add-child",
				"children.ts",
			);
			fs.writeFileSync(
				blockConfigPath,
				fs.readFileSync(blockConfigPath, "utf8").replace(
					/\t\/\/ add-child: insert new block config entries here/u,
					"  // add-child: insert new block config entries here",
				),
				"utf8",
			);
			fs.writeFileSync(
				childrenRegistryPath,
				fs.readFileSync(childrenRegistryPath, "utf8").replace(
					/\t\/\/ add-child: insert new allowed child block names here/u,
					"  // add-child: insert new allowed child block names here",
				),
				"utf8",
			);

			runGeneratedScript(targetDir, "scripts/add-compound-child.ts", [
				"--slug",
				"faq-item",
				"--title",
				"FAQ Item",
			]);

			const newChildDir = path.join(
				targetDir,
				"src",
				"blocks",
				"demo-compound-add-child-faq-item",
			);
			const blockConfig = fs.readFileSync(blockConfigPath, "utf8");
			const childrenRegistry = fs.readFileSync(childrenRegistryPath, "utf8");
			const newChildBlockJson = JSON.parse(
				fs.readFileSync(path.join(newChildDir, "block.json"), "utf8"),
			);
			const newChildEdit = fs.readFileSync(path.join(newChildDir, "edit.tsx"), "utf8");
			const newChildHooks = fs.readFileSync(path.join(newChildDir, "hooks.ts"), "utf8");
			const newChildIndex = fs.readFileSync(path.join(newChildDir, "index.tsx"), "utf8");
			const newChildSave = fs.readFileSync(path.join(newChildDir, "save.tsx"), "utf8");
			const newChildValidators = fs.readFileSync(path.join(newChildDir, "validators.ts"), "utf8");

			expect(fs.existsSync(path.join(newChildDir, "block.json"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "edit.tsx"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "hooks.ts"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "index.tsx"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "save.tsx"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "typia.manifest.json"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "types.ts"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "validators.ts"))).toBe(true);
			expect(newChildBlockJson.version).toBe("0.1.0");
			expect(newChildBlockJson.category).toBe("widgets");
			expect(newChildBlockJson.icon).toBe("excerpt-view");
			expect(blockConfig).toContain("demo-compound-add-child-faq-item");
			expect(blockConfig).toContain("DemoCompoundAddChildFaqItemAttributes");
			expect(childrenRegistry).toContain("'create-block/demo-compound-add-child-faq-item'");
			expect(newChildHooks).toContain("createUseTypiaValidationHook");
			expect(newChildValidators).toContain("createScaffoldValidatorToolkit");
			expect(newChildIndex).toContain("buildScaffoldBlockRegistration");
			expect(newChildIndex).toContain("type ScaffoldBlockMetadata");
			expect(newChildEdit).toContain("wp-block-create-block-demo-compound-add-child-faq-item");
			expect(newChildSave).toContain("wp-block-create-block-demo-compound-add-child-faq-item");
			expect(newChildBlockJson.attributes.title.selector).toBe(
				".wp-block-create-block-demo-compound-add-child-faq-item__title",
			);
			expect(newChildBlockJson.attributes.body.selector).toBe(
				".wp-block-create-block-demo-compound-add-child-faq-item__body",
			);
			expect(
				(childrenRegistry.match(/create-block\/demo-compound-add-child-faq-item/g) ?? []).length,
			).toBe(1);

			runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts");

			expect(fs.existsSync(path.join(newChildDir, "typia.manifest.json"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "typia.schema.json"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "typia.openapi.json"))).toBe(true);
			expect(fs.existsSync(path.join(newChildDir, "typia-validator.php"))).toBe(true);
		},
		{ timeout: 15_000 },
	);

	test("compound scaffolds enable public persistence when only a public policy is provided", async () => {
		const targetDir = path.join(tempRoot, "demo-compound-public");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo public compound block",
				namespace: "create-block",
				persistencePolicy: "public",
				slug: "demo-compound-public",
				title: "Demo Compound Public",
			},
			persistencePolicy: "public",
		});

		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-compound-public.php"), "utf8");
		const generatedApiTypes = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-public", "api-types.ts"),
			"utf8",
		);
		const restPublicHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-public.php"), "utf8");
		const parentRender = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-public", "render.php"),
			"utf8",
		);
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");

		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-public.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "languages", ".gitkeep"))).toBe(true);
		expect(pluginBootstrap).toContain("permission_callback' => 'demo_compound_public_can_write_publicly'");
		expect(pluginBootstrap).toContain("Tested up to:      6.9");
		expect(pluginBootstrap).toContain("Domain Path:       /languages");
		expect(pluginBootstrap).toContain("load_plugin_textdomain(");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-public.php';");
		expect(pluginBootstrap).toContain("return 'wpt_pcl_' . md5(");
		expect(pluginBootstrap).toContain("HOUR_IN_SECONDS");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_WINDOW");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_MAX");
		expect(pluginBootstrap).not.toMatch(
			/'callback'\s*=>\s*'demo_compound_public_handle_write_state'[\s\S]*?'permission_callback'\s*=>\s*'__return_true'/,
		);
		expect(restPublicHelper).toContain("function demo_compound_public_verify_public_write_token");
		expect(restPublicHelper).toContain("function demo_compound_public_consume_public_write_request_id");
		expect(restPublicHelper).toContain("SELECT GET_LOCK(%s, 5)");
		expect(restPublicHelper).toContain("return 'wpt_pwl_' . md5(");
		expect(parentRender).toContain("publicWriteToken");
		expect(parentRender).toContain("$allowed_inner_html = wp_kses_allowed_html( 'post' );");
		expect(parentRender).toContain("$allowed_attributes['data-wp-interactive'] = true;");
		expect(parentRender).toContain("wp_kses( $content, $allowed_inner_html )");
		expect(parentRender).toContain('role="status"');
		expect(parentRender).toContain('aria-live="polite"');
		expect(generatedApiTypes).toContain("publicWriteRequestId: string");
		expect(generatedApiTypes).not.toContain("{{#isPublicPersistencePolicy}}");
		expect(restPublicHelper).toContain("Customize the public write gate here");
		expect(readme).toContain("per-request ids, and coarse rate limiting by default");
	});

	test("compound scaffolds honor namespace, text-domain, and php-prefix overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-compound-identifiers");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo compound identifier overrides",
				namespace: "experiments",
				phpPrefix: "compound_panel_group",
				slug: "demo-compound-identifiers",
				textDomain: "demo-compound-text",
				title: "Demo Compound Identifiers",
			},
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-compound-identifiers.php"),
			"utf8",
		);
		const parentBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-identifiers", "block.json"),
				"utf8",
			),
		);
		const childBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-identifiers-item", "block.json"),
				"utf8",
			),
		);

		expect(parentBlockJson.name).toBe("experiments/demo-compound-identifiers");
		expect(parentBlockJson.textdomain).toBe("demo-compound-text");
		expect(childBlockJson.name).toBe("experiments/demo-compound-identifiers-item");
		expect(childBlockJson.textdomain).toBe("demo-compound-text");
		expect(pluginBootstrap).toContain("Text Domain:       demo-compound-text");
		expect(pluginBootstrap).toContain("function compound_panel_group_register_blocks");
	});

	test("runScaffoldFlow defaults persistence scaffolds to custom-table and authenticated in non-interactive mode", async () => {
		const projectInput = "demo-persistence-default";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			templateId: "persistence",
			yes: true,
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(flow.projectDir, `${projectInput}.php`),
			"utf8",
		);

		expect(flow.result.variables.dataStorageMode).toBe("custom-table");
		expect(flow.result.variables.persistencePolicy).toBe("authenticated");
		expect(pluginBootstrap).toContain("custom-table");
		expect(flow.nextSteps).toEqual([
			`cd ${projectInput}`,
			"npm install",
			"npm run dev",
		]);
		expect(flow.optionalOnboarding.steps).toEqual([
			"npm run sync-types",
			"npm run sync-rest",
		]);
	});

	test("runScaffoldFlow accepts prompted persistence policy selections in interactive mode", async () => {
		const projectInput = "demo-persistence-prompted";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			isInteractive: true,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			promptText: async (_message, defaultValue) => defaultValue,
			selectDataStorage: async () => "post-meta",
			selectPersistencePolicy: async () => "public",
			selectWithTestPreset: async () => true,
			selectWithWpEnv: async () => false,
			templateId: "persistence",
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(flow.projectDir, `${projectInput}.php`),
			"utf8",
		);
		const restPublicHelper = fs.readFileSync(
			path.join(flow.projectDir, "inc", "rest-public.php"),
			"utf8",
		);

		expect(flow.result.variables.dataStorageMode).toBe("post-meta");
		expect(flow.result.variables.persistencePolicy).toBe("public");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-public.php';");
		expect(restPublicHelper).toContain("function demo_persistence_prompted_verify_public_write_token");
		expect(fs.existsSync(path.join(flow.projectDir, ".wp-env.json"))).toBe(false);
		expect(fs.existsSync(path.join(flow.projectDir, ".wp-env.test.json"))).toBe(true);
		expect(flow.optionalOnboarding.steps).toEqual([
			"npm run sync-types",
			"npm run sync-rest",
		]);
	});

	test("interactive scaffold answers recover when the project name normalizes to an empty slug", async () => {
		const answers = await collectScaffoldAnswers({
			projectName: "!!!",
			promptText: async (message, defaultValue) => {
				if (message === "Block slug") {
					return "demo-recovered";
				}

				return defaultValue || "Recovered";
			},
			templateId: "basic",
		});

		expect(answers.slug).toBe("demo-recovered");
		expect(answers.phpPrefix).toBe("demo_recovered");
		expect(answers.textDomain).toBe("demo-recovered");
		expect(answers.title).toBe("Demo Recovered");
	});

	test("runScaffoldFlow keeps the default namespace equal to the slug for wrapper classes", async () => {
		const projectInput = "demo-default-class";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			templateId: "basic",
			yes: true,
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(flow.projectDir, "src", "block.json"), "utf8"),
		);
		const generatedEdit = fs.readFileSync(
			path.join(flow.projectDir, "src", "edit.tsx"),
			"utf8",
		);
		const generatedSave = fs.readFileSync(
			path.join(flow.projectDir, "src", "save.tsx"),
			"utf8",
		);
		const generatedStyle = fs.readFileSync(
			path.join(flow.projectDir, "src", "style.scss"),
			"utf8",
		);

		expect(blockJson.name).toBe("demo-default-class/demo-default-class");
		expect(generatedStyle).toContain(".wp-block-demo-default-class-demo-default-class");
		expect(generatedEdit).toContain(
			'className="wp-block-demo-default-class-demo-default-class__content"',
		);
		expect(generatedSave).toContain(
			'className="wp-block-demo-default-class-demo-default-class__content"',
		);
	});

	test("runScaffoldFlow keeps compound next steps minimal while surfacing optional sync guidance", async () => {
		const projectInput = "demo-compound-flow";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			templateId: "compound",
			yes: true,
		});

		expect(flow.nextSteps).toEqual([
			`cd ${projectInput}`,
			"npm install",
			"npm run dev",
		]);
		expect(flow.optionalOnboarding.steps).toEqual([ "npm run sync-types" ]);
		expect(flow.optionalOnboarding.note).toContain("do not create migration history");
	});

	test("runScaffoldFlow rejects unsupported persistence policies", async () => {
		const projectInput = "demo-persistence-invalid-policy";

		await expect(
			runScaffoldFlow({
				cwd: tempRoot,
				noInstall: true,
				packageManager: "npm",
				projectInput,
				templateId: "persistence",
				persistencePolicy: "invalid",
				yes: true,
			}),
		).rejects.toThrow(
			'Unsupported persistence policy "invalid". Expected one of: authenticated, public',
		);
	});

	test("runScaffoldFlow rejects removed built-in template ids", async () => {
		await expect(
			runScaffoldFlow({
				cwd: tempRoot,
				noInstall: true,
				packageManager: "npm",
				projectInput: "demo-removed-template",
				templateId: "data",
				yes: true,
			}),
		).rejects.toThrow(
			'Built-in template "data" was removed. Use --template persistence --persistence-policy public instead.',
		);
	});

	test("formatHelpText keeps migration UI flags out of external template usage", () => {
		const helpText = formatHelpText();
		const usageLines = helpText.split("\n").filter((line) => line.startsWith("  wp-typia "));
		const externalPathLine = usageLines.find((line) => line.includes("./path|github:owner/repo/path[#ref]>"));
		const externalPackageLine = usageLines.find((line) => line.includes("<npm-package>"));

		expect(externalPathLine).toBeDefined();
		expect(externalPathLine).not.toContain("--with-migration-ui");
		expect(externalPackageLine).toBeDefined();
		expect(externalPackageLine).not.toContain("--with-migration-ui");
	});

	test("cli-core barrel preserves doctor helper exports", () => {
		expect(typeof getDoctorChecks).toBe("function");
	});

	test("getNextSteps quotes project paths with spaces", () => {
		expect(
			getNextSteps({
				noInstall: true,
				packageManager: "bun",
				projectDir: "/tmp/demo project",
				projectInput: "demo project",
				templateId: "basic",
			}),
		).toEqual([
			"cd 'demo project'",
			"bun install",
			"bun run dev",
		]);
		expect(
			getNextSteps({
				noInstall: false,
				packageManager: "bun",
				projectDir: "/tmp/-demo",
				projectInput: "-demo",
				templateId: "basic",
			}),
		).toEqual([
			"cd '-demo'",
			"bun run dev",
		]);
	});

	test("runScaffoldFlow does not prompt for migration UI on external templates", async () => {
		let promptedForMigrationUi = false;

		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			isInteractive: true,
			noInstall: true,
			packageManager: "npm",
			projectInput: "demo-external-no-migration-ui-prompt",
			promptText: async (_message, defaultValue) => defaultValue,
			withMigrationUi: true,
			selectWithMigrationUi: async () => {
				promptedForMigrationUi = true;
				return true;
			},
			templateId: createBlockSubsetFixturePath,
		});

		expect(promptedForMigrationUi).toBe(false);
		expect(flow.result.variables.needsMigration).toBe("{{needsMigration}}");
	});

	test("getTemplateVariables rejects slugs that normalize to an empty identifier", () => {
		expect(() =>
			getTemplateVariables("basic", {
				author: "Test Runner",
				description: "Invalid slug",
				namespace: "create-block",
				phpPrefix: "demo_slug",
				slug: "!!!",
				textDomain: "demo-slug",
				title: "Invalid Slug",
			}),
		).toThrow("Block slug: Use lowercase letters, numbers, and hyphens only");
	});

	test("local create-block subset paths scaffold into a pnpm-ready wp-typia project", async () => {
		const targetDir = path.join(tempRoot, "demo-remote");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockSubsetFixturePath,
			packageManager: "pnpm",
			noInstall: true,
			withTestPreset: true,
			withWpEnv: true,
			answers: {
				author: "Test Runner",
				description: "Demo remote block",
				namespace: "create-block",
				slug: "demo-remote",
				title: "Demo Remote",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedIndex = fs.readFileSync(path.join(targetDir, "src", "index.js"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.packageManager).toBe("pnpm@8.3.1");
		expect(packageJson.devDependencies["@wp-typia/block-runtime"]).toBe(blockRuntimePackageVersion);
		expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(blockTypesPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/project-tools"]).toBeUndefined();
		expect(packageJson.scripts.build).toBe(
			"pnpm run sync-types --check && wp-scripts build --experimental-modules",
		);
		expect(generatedTypes).toContain("export interface DemoRemoteAttributes");
		expect(generatedTypes).toContain("\"content\"?: string & tags.Default<\"\">");
		expect(generatedIndex).toContain('import metadata from "./block.json";');
		expect(generatedBlockJson.name).toBe("create-block/demo-remote");
		expect(generatedBlockJson.title).toBe("Demo Remote");
		expect(generatedBlockJson.editorStyle).toBeUndefined();
		expect(generatedBlockJson.supports.align).toEqual(["wide", "full"]);
		expect(fs.existsSync(path.join(targetDir, ".wp-env.json"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, ".wp-env.test.json"))).toBe(false);
		expect(readme).not.toContain("## Local WordPress");
		expect(readme).not.toContain("## Local Test Preset");
	});

	test("local official external template configs scaffold with the default variant", async () => {
		const targetDir = path.join(tempRoot, "demo-external-default");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockExternalFixturePath,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo external block",
				namespace: "create-block",
				slug: "demo-external-default",
				title: "Demo External Default",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.js"), "utf8");
		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(result.selectedVariant).toBe("standard");
		expect(result.warnings).toContain(
			'Ignoring external template config key "pluginTemplatesPath": wp-typia owns package/tooling/sync setup for generated projects, so this external template setting is ignored.',
		);
		expect(fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
		expect(packageJson.devDependencies["@wp-typia/project-tools"]).toBeUndefined();
		expect(packageJson.dependencies?.["@wp-typia/project-tools"]).toBeUndefined();
		expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"standard">');
		expect(generatedTypes).toContain('"transformedLabel"?: string & tags.Default<"standard-transformed">');
		expect(generatedEdit).toContain("template-standard");
		expect(generatedEdit).toContain("standard-transformed");
		expect(generatedBlockJson.editorStyle).toBeUndefined();
		expect(generatedBlockJson.supports.multiple).toBe(false);
	});

	test("local official external template configs honor --variant overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-external-hero");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockExternalFixturePath,
			variant: "hero",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo external variant block",
				namespace: "create-block",
				slug: "demo-external-hero",
				title: "Demo External Hero",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(result.selectedVariant).toBe("hero");
		expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
		expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"hero">');
		expect(generatedTypes).toContain('"transformedLabel"?: string & tags.Default<"hero-transformed">');
		expect(generatedEdit).toContain("template-hero");
		expect(generatedBlockJson.supports.multiple).toBe(true);
	});

	test("official workspace template scaffolds through the local npm template resolver", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-template");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo empty workspace",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-template",
				textDomain: "demo-space",
				title: "Demo Workspace Template",
			},
		});

		const packageJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "package.json"), "utf8"),
		);
		const bootstrapSource = fs.readFileSync(
			path.join(targetDir, "demo-workspace-template.php"),
			"utf8",
		);
		const buildWorkspaceSource = fs.readFileSync(
			path.join(targetDir, "scripts", "build-workspace.mjs"),
			"utf8",
		);
		const blockConfigSource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);

		expect(result.templateId).toBe(workspaceTemplatePackageManifest.name);
		expect(packageJson.wpTypia).toEqual({
			projectType: "workspace",
			templatePackage: workspaceTemplatePackageManifest.name,
			namespace: "demo-space",
			textDomain: "demo-space",
			phpPrefix: "demo_space",
		});
		expect(blockConfigSource).toContain("// wp-typia add block entries");
		expect(blockConfigSource).toContain("// wp-typia add variation entries");
		expect(blockConfigSource).toContain("// wp-typia add pattern entries");
		expect(buildWorkspaceSource).toContain("--blocks-manifest");
		expect(bootstrapSource).toContain("wp_register_block_metadata_collection");
		expect(bootstrapSource).toContain("wp_register_block_types_from_metadata_collection");
		expect(bootstrapSource).toContain("register_block_pattern_category");
		expect(bootstrapSource).toContain("/src/patterns/*.php");
		expect(fs.existsSync(path.join(targetDir, "src", "blocks", ".gitkeep"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "patterns", ".gitkeep"))).toBe(true);
	});

	test("official workspace templates accept local path references with migration UI", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-template-local-path");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: path.resolve(packageRoot, "..", "create-workspace-template"),
			packageManager: "npm",
			noInstall: true,
			withMigrationUi: true,
			answers: {
				author: "Test Runner",
				description: "Demo empty workspace local path",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-template-local-path",
				textDomain: "demo-space",
				title: "Demo Workspace Template Local Path",
			},
		});

		const packageJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "package.json"), "utf8"),
		);

		expect(packageJson.wpTypia?.templatePackage).toBe(workspaceTemplatePackageManifest.name);
		expect(packageJson.scripts["migration:doctor"]).toContain("wp-typia");
	});

	test("official workspace template escapes apostrophes in pattern category labels", async () => {
		const targetDir = path.join(tempRoot, "johns-workspace-template");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Workspace title escaping",
				namespace: "johns-space",
				phpPrefix: "johns_space",
				slug: "johns-workspace-template",
				textDomain: "johns-space",
				title: "John's Blocks",
			},
		});

		const bootstrapSource = fs.readFileSync(
			path.join(targetDir, "johns-workspace-template.php"),
			"utf8",
		);

		expect(bootstrapSource).toContain("sprintf(");
		expect(bootstrapSource).toContain("__( '%s Patterns', 'johns-space' )");
		expect(bootstrapSource).toContain("\"John's Blocks\"");
	});

	test("canonical CLI can add a basic block to an official workspace template", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-basic");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace add basic",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-basic",
				textDomain: "demo-space",
				title: "Demo Workspace Add Basic",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		const blockConfigSource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);
		const indexSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
			"utf8",
		);
		const blockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
				"utf8",
			),
		);

		expect(blockConfigSource).toContain('slug: "counter-card"');
		expect(indexSource).toContain("import '../../collection';");
		expect(blockJson.name).toBe("demo-space/counter-card");
		typecheckGeneratedProject(targetDir);
		runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", ["--check"]);
	}, 20_000);

	test("canonical CLI can add a variation to an official workspace template", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-variation");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace add variation",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-variation",
				textDomain: "demo-space",
				title: "Demo Workspace Add Variation",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});
		runCli(
			"node",
			[entryPath, "add", "variation", "hero-card", "--block", "counter-card"],
			{ cwd: targetDir },
		);

		const blockConfigSource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);
		const blockIndexSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
			"utf8",
		);
		const variationsIndexSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "variations", "index.ts"),
			"utf8",
		);
		const variationSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "variations", "hero-card.ts"),
			"utf8",
		);

		expect(blockConfigSource).toContain('block: "counter-card"');
		expect(blockConfigSource).toContain('slug: "hero-card"');
		expect(blockIndexSource).toContain("registerWorkspaceVariations");
		expect(blockIndexSource).toContain("registerWorkspaceVariations();");
		expect(variationsIndexSource).toContain("workspaceVariation_hero_card");
		expect(variationSource).toContain("BlockVariation");
		expect(variationSource).toContain("A starter variation for Hero Card.");

		const doctorOutput = runCli("node", [entryPath, "doctor"], {
			cwd: targetDir,
		});
		const doctorChecks = JSON.parse(doctorOutput) as {
			checks: Array<{ detail: string; label: string; status: string }>;
		};
		expect(
			doctorChecks.checks.find((check) => check.label === "Workspace inventory")?.status,
		).toBe("pass");
		expect(
			doctorChecks.checks.find((check) => check.label === "Variation counter-card/hero-card")?.status,
		).toBe("pass");
		expect(
			doctorChecks.checks.find((check) => check.label === "Variation entrypoint counter-card")?.status,
		).toBe("pass");

		runCli("npm", ["run", "build"], { cwd: targetDir });
	}, 30_000);

	test("variation workflow keeps registry identifiers unique for similar slugs", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-variation-collision-safe");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace variation collision safe",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-variation-collision-safe",
				textDomain: "demo-space",
				title: "Demo Workspace Variation Collision Safe",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});
		runCli(
			"node",
			[entryPath, "add", "variation", "hero-2-card", "--block", "counter-card"],
			{ cwd: targetDir },
		);
		runCli(
			"node",
			[entryPath, "add", "variation", "hero2-card", "--block", "counter-card"],
			{ cwd: targetDir },
		);

		const variationsIndexSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "variations", "index.ts"),
			"utf8",
		);

		expect(variationsIndexSource).toContain(
			"import { workspaceVariation_hero_2_card } from './hero-2-card';",
		);
		expect(variationsIndexSource).toContain(
			"import { workspaceVariation_hero2_card } from './hero2-card';",
		);

		runCli("npm", ["run", "build"], { cwd: targetDir });
	}, 30_000);

	test("duplicate add block failures preserve existing workspace blocks", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-duplicate");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace add duplicate",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-duplicate",
				textDomain: "demo-space",
				title: "Demo Workspace Add Duplicate",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		const originalIndexSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
			"utf8",
		);
		const originalBlockConfigSource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);

		expect(() =>
			runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
				cwd: targetDir,
			}),
		).toThrow('A block already exists at src/blocks/counter-card. Choose a different name.');

		expect(
			fs.readFileSync(path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"), "utf8"),
		).toBe(originalIndexSource);
		expect(
			fs.readFileSync(path.join(targetDir, "scripts", "block-config.ts"), "utf8"),
		).toBe(originalBlockConfigSource);
	});

	test("variation workflow rejects unknown blocks and preserves existing variation files on duplicate failure", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-variation-duplicate");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace variation duplicate",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-variation-duplicate",
				textDomain: "demo-space",
				title: "Demo Workspace Variation Duplicate",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		expect(
			getCommandErrorMessage(() =>
				runCli(
					"node",
					[entryPath, "add", "variation", "hero-card", "--block", "missing-card"],
					{ cwd: targetDir },
				),
			),
		).toContain("missing-card");
		expect(
			getCommandErrorMessage(() =>
				runCli(
					"node",
					[entryPath, "add", "variation", "2024-hero", "--block", "counter-card"],
					{ cwd: targetDir },
				),
			),
		).toContain("Variation name must start with a letter");

		runCli(
			"node",
			[entryPath, "add", "variation", "hero-card", "--block", "counter-card"],
			{ cwd: targetDir },
		);

		const originalVariationSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "counter-card", "variations", "hero-card.ts"),
			"utf8",
		);
		const originalInventorySource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);

		expect(
			getCommandErrorMessage(() =>
				runCli(
					"node",
					[entryPath, "add", "variation", "hero-card", "--block", "counter-card"],
					{ cwd: targetDir },
				),
			),
		).toContain("A variation already exists");

		expect(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "counter-card", "variations", "hero-card.ts"),
				"utf8",
			),
		).toBe(originalVariationSource);
		expect(
			fs.readFileSync(path.join(targetDir, "scripts", "block-config.ts"), "utf8"),
		).toBe(originalInventorySource);
	}, 15_000);

	test("canonical CLI can add a compound persistence block to an official workspace template", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-compound");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace add compound",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-compound",
				textDomain: "demo-space",
				title: "Demo Workspace Add Compound",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli(
			"node",
			[
				entryPath,
				"add",
				"block",
				"faq-stack",
				"--template",
				"compound",
				"--data-storage",
				"custom-table",
				"--persistence-policy",
				"public",
			],
			{
				cwd: targetDir,
			},
		);

		const blockConfigSource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);
		const serverModuleSource = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "faq-stack", "server.php"),
			"utf8",
		);
		const parentBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "faq-stack", "block.json"),
				"utf8",
			),
		);

		expect(blockConfigSource).toContain("defineEndpointManifest");
		expect(blockConfigSource).toContain('slug: "faq-stack-item"');
		expect(serverModuleSource).toContain("rest-public.php");
		expect(parentBlockJson.name).toBe("demo-space/faq-stack");
		runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", ["--check"]);
		runGeneratedScript(targetDir, "scripts/sync-rest-contracts.ts", ["--check"]);
	}, 30_000);

	test("add block updates migration config in a migration-enabled workspace template", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-migration");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			withMigrationUi: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace add migration",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-migration",
				textDomain: "demo-space",
				title: "Demo Workspace Add Migration",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "release-note", "--template", "basic"], {
			cwd: targetDir,
		});

		const migrationConfigSource = fs.readFileSync(
			path.join(targetDir, "src", "migrations", "config.ts"),
			"utf8",
		);

		expect(migrationConfigSource).toContain("key: 'release-note'");
		expect(
			fs.existsSync(
				path.join(
					targetDir,
					"src",
					"migrations",
					"versions",
					"v1",
					"release-note",
					"typia.manifest.json",
				),
			),
		).toBe(true);

		const doctorOutput = runCli("node", [entryPath, "migrate", "doctor", "--all"], {
			cwd: targetDir,
		});
		expect(doctorOutput).toContain("PASS Migration config");
		const rootDoctorOutput = runCli("node", [entryPath, "doctor"], {
			cwd: targetDir,
		});
		const rootDoctorChecks = JSON.parse(rootDoctorOutput) as {
			checks: Array<{ label: string; status: string }>;
		};
		expect(
			rootDoctorChecks.checks.find((check) => check.label === "Migration workspace")?.status,
		).toBe("pass");
		expect(doctorOutput).toContain("PASS Migration doctor summary");
	}, 20_000);

	test("canonical CLI can add a pattern to an official workspace template", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-add-pattern");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace add pattern",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-add-pattern",
				textDomain: "demo-space",
				title: "Demo Workspace Add Pattern",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		expect(
			getCommandErrorMessage(() =>
				runCli("node", [entryPath, "add", "pattern", "2024-hero"], {
					cwd: targetDir,
				}),
			),
		).toContain("Pattern name must start with a letter");

		runCli("node", [entryPath, "add", "pattern", "hero-layout"], {
			cwd: targetDir,
		});

		const blockConfigSource = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);
		const bootstrapSource = fs.readFileSync(
			path.join(targetDir, "demo-workspace-add-pattern.php"),
			"utf8",
		);
		const patternSource = fs.readFileSync(
			path.join(targetDir, "src", "patterns", "hero-layout.php"),
			"utf8",
		);

		expect(blockConfigSource).toContain('slug: "hero-layout"');
		expect(blockConfigSource).toContain('file: "src/patterns/hero-layout.php"');
		expect(bootstrapSource).toContain("register_block_pattern_category");
		expect(bootstrapSource).toContain("/src/patterns/*.php");
		expect(patternSource).toContain("demo-space/hero-layout");

		const doctorOutput = runCli("node", [entryPath, "doctor"], {
			cwd: targetDir,
		});
		const doctorChecks = JSON.parse(doctorOutput) as {
			checks: Array<{ detail: string; label: string; status: string }>;
		};
		expect(
			doctorChecks.checks.find((check) => check.label === "Pattern bootstrap")?.status,
		).toBe("pass");
		expect(
			doctorChecks.checks.find((check) => check.label === "Pattern hero-layout")?.status,
		).toBe("pass");
	}, 15_000);

	test("doctor passes on a healthy multi-block workspace", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-multi-block");

		await scaffoldOfficialWorkspace(targetDir, {
			description: "Demo workspace doctor multi block",
			slug: "demo-workspace-doctor-multi-block",
			title: "Demo Workspace Doctor Multi Block",
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});
		runCli("node", [entryPath, "add", "block", "author-bio", "--template", "interactivity"], {
			cwd: targetDir,
		});

		const checks = await getDoctorChecks(targetDir);

		expect(checks.find((check) => check.label === "Workspace inventory")?.status).toBe("pass");
		expect(
			checks.find((check) => check.label === "Workspace package metadata")?.status,
		).toBe("pass");
		expect(checks.find((check) => check.label === "Block counter-card")?.status).toBe("pass");
		expect(
			checks.find((check) => check.label === "Block metadata counter-card")?.status,
		).toBe("pass");
		expect(
			checks.find((check) => check.label === "Block collection counter-card")?.status,
		).toBe("pass");
		expect(checks.find((check) => check.label === "Block author-bio")?.status).toBe("pass");
		expect(
			checks.find((check) => check.label === "Block metadata author-bio")?.status,
		).toBe("pass");
		expect(
			checks.find((check) => check.label === "Block collection author-bio")?.status,
		).toBe("pass");
	}, 20_000);

	test("doctor fails when block.json names drift from workspace conventions", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-block-name-drift");

		await scaffoldOfficialWorkspace(targetDir, {
			description: "Demo workspace doctor block name drift",
			slug: "demo-workspace-doctor-block-name-drift",
			title: "Demo Workspace Doctor Block Name Drift",
		});

		linkWorkspaceNodeModules(targetDir);
		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		const blockJsonPath = path.join(targetDir, "src", "blocks", "counter-card", "block.json");
		const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
		blockJson.name = "demo-space/counter-card-renamed";
		fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, 2), "utf8");

		const checks = await getDoctorChecks(targetDir);
		const metadataCheck = checks.find((check) => check.label === "Block metadata counter-card");

		expect(metadataCheck?.status).toBe("fail");
		expect(metadataCheck?.detail).toContain('block.json name must equal "demo-space/counter-card"');
	}, 20_000);

	test("doctor fails when block.json textdomains drift from workspace conventions", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-textdomain-drift");

		await scaffoldOfficialWorkspace(targetDir, {
			description: "Demo workspace doctor textdomain drift",
			slug: "demo-workspace-doctor-textdomain-drift",
			title: "Demo Workspace Doctor Textdomain Drift",
		});

		linkWorkspaceNodeModules(targetDir);
		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		const blockJsonPath = path.join(targetDir, "src", "blocks", "counter-card", "block.json");
		const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
		blockJson.textdomain = "other-space";
		fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, 2), "utf8");

		const checks = await getDoctorChecks(targetDir);
		const metadataCheck = checks.find((check) => check.label === "Block metadata counter-card");

		expect(metadataCheck?.status).toBe("fail");
		expect(metadataCheck?.detail).toContain('block.json textdomain must equal "demo-space"');
	}, 20_000);

	test("doctor fails when generated block artifacts are missing", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-artifact-drift");

		await scaffoldOfficialWorkspace(targetDir, {
			description: "Demo workspace doctor artifact drift",
			slug: "demo-workspace-doctor-artifact-drift",
			title: "Demo Workspace Doctor Artifact Drift",
		});

		linkWorkspaceNodeModules(targetDir);
		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		fs.rmSync(path.join(targetDir, "src", "blocks", "counter-card", "typia-validator.php"));

		const checks = await getDoctorChecks(targetDir);
		const blockCheck = checks.find((check) => check.label === "Block counter-card");

		expect(blockCheck?.status).toBe("fail");
		expect(blockCheck?.detail).toContain("typia-validator.php");
	}, 20_000);

	test("doctor fails when block entrypoints lose the shared collection import", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-collection-drift");

		await scaffoldOfficialWorkspace(targetDir, {
			description: "Demo workspace doctor collection drift",
			slug: "demo-workspace-doctor-collection-drift",
			title: "Demo Workspace Doctor Collection Drift",
		});

		linkWorkspaceNodeModules(targetDir);
		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});

		const blockEntryPath = path.join(targetDir, "src", "blocks", "counter-card", "index.tsx");
		const entrySource = fs.readFileSync(blockEntryPath, "utf8");
		fs.writeFileSync(
			blockEntryPath,
			entrySource.replace("import '../../collection';\n", ""),
			"utf8",
		);

		const checks = await getDoctorChecks(targetDir);
		const collectionCheck = checks.find((check) => check.label === "Block collection counter-card");

		expect(collectionCheck?.status).toBe("fail");
		expect(collectionCheck?.detail).toContain("import '../../collection';");
	}, 20_000);

	test("doctor fails on missing variation and pattern inventory files", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-drift");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace doctor drift",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-doctor-drift",
				textDomain: "demo-space",
				title: "Demo Workspace Doctor Drift",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		runCli("node", [entryPath, "add", "block", "counter-card", "--template", "basic"], {
			cwd: targetDir,
		});
		runCli(
			"node",
			[entryPath, "add", "variation", "hero-card", "--block", "counter-card"],
			{ cwd: targetDir },
		);
		runCli("node", [entryPath, "add", "pattern", "hero-layout"], {
			cwd: targetDir,
		});

		fs.rmSync(path.join(targetDir, "src", "blocks", "counter-card", "variations", "hero-card.ts"));
		fs.rmSync(path.join(targetDir, "src", "patterns", "hero-layout.php"));

		const errorMessage = getCommandErrorMessage(() =>
			runCli("node", [entryPath, "doctor"], {
				cwd: targetDir,
			}),
		);

		expect(errorMessage).toContain("Doctor found one or more failing checks.");
		expect(errorMessage).toContain("Variation counter-card/hero-card");
		expect(errorMessage).toContain("Pattern hero-layout");
	}, 15_000);

	test("doctor fails when workspace inventory entries are malformed", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-invalid-inventory");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace invalid inventory",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-doctor-invalid-inventory",
				textDomain: "demo-space",
				title: "Demo Workspace Invalid Inventory",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		const blockConfigPath = path.join(targetDir, "scripts", "block-config.ts");
		const blockConfigSource = fs.readFileSync(blockConfigPath, "utf8");
		fs.writeFileSync(
			blockConfigPath,
			blockConfigSource.replace(
				"// wp-typia add pattern entries",
				`\t{\n\t\tslug: "broken-pattern",\n\t},\n\t// wp-typia add pattern entries`,
			),
			"utf8",
		);

		const errorMessage = getCommandErrorMessage(() =>
			runCli("node", [entryPath, "doctor"], {
				cwd: targetDir,
			}),
		);

		expect(errorMessage).toContain("Workspace inventory");
		expect(errorMessage).toContain("PATTERNS[0] is missing required");
	});

	test("doctor fails when workspace inventory exports use non-array initializers", async () => {
		const targetDir = path.join(tempRoot, "demo-workspace-doctor-invalid-export-shape");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: workspaceTemplatePackageManifest.name,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo workspace invalid export shape",
				namespace: "demo-space",
				phpPrefix: "demo_space",
				slug: "demo-workspace-doctor-invalid-export-shape",
				textDomain: "demo-space",
				title: "Demo Workspace Invalid Export Shape",
			},
		});

		linkWorkspaceNodeModules(targetDir);

		const blockConfigPath = path.join(targetDir, "scripts", "block-config.ts");
		const blockConfigSource = fs.readFileSync(blockConfigPath, "utf8");
		fs.writeFileSync(
			blockConfigPath,
			blockConfigSource.replace(
				"export const VARIATIONS: WorkspaceVariationConfig[] = [\n\t// wp-typia add variation entries\n];",
				"export const VARIATIONS: WorkspaceVariationConfig[] = {} as never;",
			),
			"utf8",
		);

		const errorMessage = getCommandErrorMessage(() =>
			runCli("node", [entryPath, "doctor"], {
				cwd: targetDir,
			}),
		);

		expect(errorMessage).toContain("Workspace inventory");
		expect(errorMessage).toContain("must export VARIATIONS as an array literal");
	});

	test("rendered template paths cannot escape the target directory", async () => {
		const templateRoot = fs.mkdtempSync(path.join(tempRoot, "render-escape-template-"));
		const targetDir = fs.mkdtempSync(path.join(tempRoot, "render-escape-target-"));

		fs.writeFileSync(
			path.join(templateRoot, "{{fileName}}.mustache"),
			"escaped",
			"utf8",
		);

		await expect(
			copyRenderedDirectory(templateRoot, targetDir, {
				fileName: "../outside",
			}),
		).rejects.toThrow("Rendered template path escapes target directory");
	});

	test("rejects unsupported variant usage for built-in templates", async () => {
		await expect(
			scaffoldProject({
				projectDir: path.join(tempRoot, "demo-invalid-built-in-variant"),
				templateId: "basic",
				variant: "hero",
				packageManager: "bun",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Invalid built-in variant usage",
					namespace: "create-block",
					slug: "invalid-built-in-variant",
					title: "Invalid Built In Variant",
				},
			}),
		).rejects.toThrow('--variant is only supported for official external template configs.');
	});

	test("rejects unsupported variant usage for raw create-block subset sources", async () => {
		await expect(
			scaffoldProject({
				projectDir: path.join(tempRoot, "demo-invalid-remote-variant"),
				templateId: createBlockSubsetFixturePath,
				variant: "hero",
				packageManager: "bun",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Invalid remote variant usage",
					namespace: "create-block",
					slug: "invalid-remote-variant",
					title: "Invalid Remote Variant",
				},
			}),
		).rejects.toThrow('--variant is only supported for official external template configs.');
	});

	test("node entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("node", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("node", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("interactivity");
		expect(templatesOutput).toContain("persistence");
		expect(templatesOutput).toContain("compound");
		expect(templatesOutput).not.toContain("advanced");
		expect(templatesOutput).not.toContain("full");
		expect(doctorOutput).toContain("\"label\": \"Bun\"");
		expect(doctorOutput).toContain("\"label\": \"Template basic\"");
	});

	test("node entry supports the explicit create command", () => {
		const targetDir = path.join(tempRoot, "demo-node-create-command");

		runCli("node", [
			entryPath,
			"create",
			targetDir,
			"--template",
			"basic",
			"--package-manager",
			"npm",
			"--yes",
			"--no-install",
		]);

		expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "block.json"))).toBe(true);
	});

	test("node entry exposes Bunli-owned help and rejects the removed migrations alias", () => {
		const helpOutput = runCli("node", [entryPath, "--help"]);
		const errorMessage = getCommandErrorMessage(() =>
			runCli("node", [entryPath, "migrations", "init"], { stdio: "pipe" }),
		);

		expect(helpOutput).toContain("Scaffold a new wp-typia project.");
		expect(helpOutput).toContain("Run migration workflows for migration-capable wp-typia projects.");
		expect(helpOutput).toContain("Inspect or sync schema-driven MCP metadata for wp-typia.");
		expect(helpOutput).toContain("Manage agent skill files");
		expect(helpOutput).toContain("Generate shell completion scripts");
		expect(errorMessage).toContain("`wp-typia migrations` was removed in favor of `wp-typia migrate`.");
	});

	test("bun entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("bun", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("bun", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("interactivity");
		expect(templatesOutput).toContain("persistence");
		expect(templatesOutput).toContain("compound");
		expect(templatesOutput).not.toContain("advanced");
		expect(templatesOutput).not.toContain("full");
		expect(doctorOutput).toContain("\"label\": \"Bun\"");
		expect(doctorOutput).toContain("\"label\": \"Template basic\"");
	});

	test("bun entry exposes Bunli-owned help and rejects the removed migrations alias", () => {
		const helpOutput = runCli("bun", [entryPath, "--help"]);
		const errorMessage = getCommandErrorMessage(() =>
			runCli("bun", [entryPath, "migrations", "init"], { stdio: "pipe" }),
		);

		expect(helpOutput).toContain("Scaffold a new wp-typia project.");
		expect(helpOutput).toContain("Run migration workflows for migration-capable wp-typia projects.");
		expect(helpOutput).toContain("Inspect or sync schema-driven MCP metadata for wp-typia.");
		expect(helpOutput).toContain("Manage agent skill files");
		expect(helpOutput).toContain("Generate shell completion scripts");
		expect(errorMessage).toContain("`wp-typia migrations` was removed in favor of `wp-typia migrate`.");
	});

	test("parses github template locators with refs", () => {
		expect(parseGitHubTemplateLocator("github:owner/repo/templates/card#main")).toEqual({
			owner: "owner",
			repo: "repo",
			ref: "main",
			sourcePath: "templates/card",
		});
	});

	test("removed built-in template ids are rejected consistently during template locator parsing", () => {
		expect(() => parseTemplateLocator("persisted")).toThrow(
			'Built-in template "persisted" was removed. Use --template persistence --persistence-policy authenticated instead.',
		);
	});

	test("parses npm template locators for package specs", () => {
		expect(parseNpmTemplateLocator("@scope/template-package@^1.2.0")).toEqual({
			fetchSpec: "^1.2.0",
			name: "@scope/template-package",
			raw: "@scope/template-package@^1.2.0",
			rawSpec: "^1.2.0",
			type: "range",
		});
	});

	test("npm package template specs can scaffold through the registry resolver", async () => {
		const npmTemplateRoot = fs.mkdtempSync(path.join(tempRoot, "npm-template-source-"));
		const registryBase = "https://registry.npmjs.org";
		const tarballUrl = `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`;
		const metadataUrl = `${registryBase}/${encodeURIComponent("@demo/create-block-template")}`;
		const tarballPath = path.join(npmTemplateRoot, "create-block-template-1.2.3.tgz");
		const packageDir = path.join(npmTemplateRoot, "package");
		const originalFetch = globalThis.fetch;
		const originalRegistry = process.env.NPM_CONFIG_REGISTRY;
		const targetDir = path.join(tempRoot, "demo-external-npm");

		fs.mkdirSync(packageDir, { recursive: true });
		fs.cpSync(createBlockExternalFixturePath, packageDir, { recursive: true });
		fs.writeFileSync(
			path.join(packageDir, "package.json"),
			JSON.stringify(
				{
					name: "@demo/create-block-template",
					version: "1.2.3",
				},
				null,
				2,
			),
		);
		execFileSync("tar", ["-czf", tarballPath, "-C", npmTemplateRoot, "package"]);
		process.env.NPM_CONFIG_REGISTRY = registryBase;

		globalThis.fetch = (async (input) => {
			const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (requestUrl === metadataUrl) {
				return new Response(
					JSON.stringify({
						"dist-tags": {
							latest: "1.2.3",
						},
						versions: {
							"1.2.3": {
								dist: {
									tarball: tarballUrl,
								},
							},
						},
					}),
					{
						status: 200,
						headers: {
							"content-type": "application/json",
						},
					},
				);
			}

			if (requestUrl === tarballUrl) {
				return new Response(fs.readFileSync(tarballPath), { status: 200 });
			}

			throw new Error(`Unexpected fetch URL in npm template resolver test: ${requestUrl}`);
		}) as typeof fetch;

		try {
			const result = await scaffoldProject({
				projectDir: targetDir,
				templateId: "@demo/create-block-template@^1.2.0",
				variant: "hero",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Demo external npm template",
					namespace: "create-block",
					slug: "demo-external-npm",
					title: "Demo External Npm",
				},
			});

			const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
			expect(result.selectedVariant).toBe("hero");
			expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"hero">');
			expect(fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
			if (originalRegistry === undefined) {
				delete process.env.NPM_CONFIG_REGISTRY;
			} else {
				process.env.NPM_CONFIG_REGISTRY = originalRegistry;
			}
		}
	});

	test("npm package template specs reject explicit ranges that do not match published versions", async () => {
		const registryBase = "https://registry.npmjs.org";
		const metadataUrl = `${registryBase}/${encodeURIComponent("@demo/create-block-template")}`;
		const originalFetch = globalThis.fetch;
		const originalRegistry = process.env.NPM_CONFIG_REGISTRY;

		process.env.NPM_CONFIG_REGISTRY = registryBase;
		globalThis.fetch = (async (input) => {
			const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (requestUrl === metadataUrl) {
				return new Response(
					JSON.stringify({
						"dist-tags": {
							latest: "1.2.3",
						},
						versions: {
							"1.2.3": {
								dist: {
									tarball: `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`,
								},
							},
						},
					}),
					{
						status: 200,
						headers: {
							"content-type": "application/json",
						},
					},
				);
			}

			throw new Error(`Unexpected fetch URL in npm template resolver range test: ${requestUrl}`);
		}) as typeof fetch;

		try {
			await expect(
				scaffoldProject({
					projectDir: path.join(tempRoot, "demo-external-range-miss"),
					templateId: "@demo/create-block-template@^9.0.0",
					packageManager: "npm",
					noInstall: true,
					answers: {
						author: "Test Runner",
						description: "Demo external npm range miss",
						namespace: "create-block",
						slug: "demo-external-range-miss",
						title: "Demo External Range Miss",
					},
				}),
			).rejects.toThrow('Requested "^9.0.0"');
		} finally {
			globalThis.fetch = originalFetch;
			if (originalRegistry === undefined) {
				delete process.env.NPM_CONFIG_REGISTRY;
			} else {
				process.env.NPM_CONFIG_REGISTRY = originalRegistry;
			}
		}
	});

	test("bun entry translates kebab-case identifier flags while scaffolding", () => {
		const targetDir = path.join(tempRoot, "demo-bun-entry");

		runCli("bun", [
			entryPath,
			targetDir,
			"--template",
			"persistence",
			"--namespace",
			"experiments",
			"--text-domain",
			"demo-bun-entry-text",
			"--php-prefix",
			"demo_bun_entry_php",
			"--yes",
			"--no-install",
			"--package-manager",
			"bun",
		], {
			stdio: "inherit",
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-bun-entry.php"),
			"utf8",
		);

		expect(packageJson.packageManager).toBe("bun@1.3.11");
		expect(blockJson.name).toBe("experiments/demo-bun-entry");
		expect(blockJson.textdomain).toBe("demo-bun-entry-text");
		expect(pluginBootstrap).toContain("Text Domain:       demo-bun-entry-text");
		expect(pluginBootstrap).toContain("function demo_bun_entry_php_get_counter");
		expect(fs.existsSync(path.join(targetDir, "README.md"))).toBe(true);
	});

	test("node entry requires --package-manager with --yes", () => {
		expect(() => {
			runCli("node", [
				entryPath,
				"demo-missing-pm",
				"--template",
				"basic",
				"--yes",
				"--no-install",
			], {
				stdio: "pipe",
			});
		}).toThrow();
	});

	test("node entry rejects missing values for identifier override flags", () => {
		expect(() => {
			runCli("node", [
				entryPath,
				"demo-missing-namespace",
				"--template",
				"basic",
				"--namespace",
				"--yes",
				"--no-install",
				"--package-manager",
				"npm",
			], {
				stdio: "pipe",
			});
		}).toThrow();
	});
});
