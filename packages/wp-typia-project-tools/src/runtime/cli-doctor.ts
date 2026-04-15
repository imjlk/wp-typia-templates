import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";
import { parseScaffoldBlockMetadata } from "@wp-typia/block-runtime/blocks";

import {
	getBuiltInTemplateLayerDirs,
	isOmittableBuiltInTemplateLayerDir,
} from "./template-builtins.js";
import {
	HOOKED_BLOCK_ANCHOR_PATTERN,
	HOOKED_BLOCK_POSITION_SET,
} from "./hooked-blocks.js";
import { isBuiltInTemplateId, listTemplates } from "./template-registry.js";
import { readWorkspaceInventory, type WorkspaceInventory } from "./workspace-inventory.js";
import {
	getInvalidWorkspaceProjectReason,
	parseWorkspacePackageJson,
	WORKSPACE_TEMPLATE_PACKAGE,
	tryResolveWorkspaceProject,
	type WorkspacePackageJson,
	type WorkspaceProject,
} from "./workspace-project.js";
import {
	createCliCommandError,
	formatDoctorCheckLine,
	formatDoctorSummaryLine,
	getDoctorFailureDetailLines,
} from "./cli-diagnostics.js";

/**
 * One doctor check rendered by the CLI diagnostics flow.
 */
export interface DoctorCheck {
	/** Human-readable status detail rendered next to the label. */
	detail: string;
	/** Short label for the dependency, directory, or template check. */
	label: string;
	/** Final pass/fail status for this diagnostic row. */
	status: "pass" | "fail";
}

interface RunDoctorOptions {
	renderLine?: (check: DoctorCheck) => void;
	renderSummaryLine?: (summaryLine: string) => void;
}

const WORKSPACE_COLLECTION_IMPORT_LINE = "import '../../collection';";
const WORKSPACE_COLLECTION_IMPORT_PATTERN = /^\s*import\s+["']\.\.\/\.\.\/collection["']\s*;?\s*$/m;
const WORKSPACE_BINDING_SERVER_GLOB = "/src/bindings/*/server.php";
const WORKSPACE_BINDING_EDITOR_SCRIPT = "build/bindings/index.js";
const WORKSPACE_BINDING_EDITOR_ASSET = "build/bindings/index.asset.php";
const WORKSPACE_GENERATED_BLOCK_ARTIFACTS = [
	"block.json",
	"typia.manifest.json",
	"typia.schema.json",
	"typia-validator.php",
	"typia.openapi.json",
] as const;

function readCommandVersion(command: string, args: string[] = ["--version"]): string | null {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
}

function compareMajorVersion(actualVersion: string, minimumMajor: number): boolean {
	const parsed = Number.parseInt(actualVersion.replace(/^v/, "").split(".")[0] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= minimumMajor;
}

async function checkWritableDirectory(directory: string): Promise<boolean> {
	try {
		await access(directory, fsConstants.W_OK);
		return true;
	} catch {
		return false;
	}
}

async function checkTempDirectory(): Promise<boolean> {
	const tempFile = path.join(os.tmpdir(), `wp-typia-${Date.now()}.tmp`);
	try {
		await writeFile(tempFile, "ok", "utf8");
		await rm(tempFile, { force: true });
		return true;
	} catch {
		return false;
	}
}

function createDoctorCheck(
	label: string,
	status: DoctorCheck["status"],
	detail: string,
): DoctorCheck {
	return { detail, label, status };
}

function getWorkspaceBootstrapRelativePath(packageName: string): string {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	return `${packageBaseName}.php`;
}

function checkExistingFiles(
	projectDir: string,
	label: string,
	filePaths: Array<string | undefined>,
): DoctorCheck {
	const missing = filePaths
		.filter((filePath): filePath is string => typeof filePath === "string")
		.filter((filePath) => !fs.existsSync(path.join(projectDir, filePath)));
	return createDoctorCheck(
		label,
		missing.length === 0 ? "pass" : "fail",
		missing.length === 0 ? "All referenced files exist" : `Missing: ${missing.join(", ")}`,
	);
}

function checkWorkspacePackageMetadata(
	workspace: WorkspaceProject,
	packageJson: WorkspacePackageJson,
): DoctorCheck {
	const issues: string[] = [];
	const packageName = packageJson.name;
	const bootstrapRelativePath = getWorkspaceBootstrapRelativePath(
		typeof packageName === "string" && packageName.length > 0 ? packageName : workspace.packageName,
	);
	const wpTypia = packageJson.wpTypia;

	if (typeof packageName !== "string" || packageName.length === 0) {
		issues.push("package.json must define a string name for workspace bootstrap resolution");
	}
	if (wpTypia?.projectType !== "workspace") {
		issues.push('wpTypia.projectType must be "workspace"');
	}
	if (wpTypia?.templatePackage !== WORKSPACE_TEMPLATE_PACKAGE) {
		issues.push(`wpTypia.templatePackage must be "${WORKSPACE_TEMPLATE_PACKAGE}"`);
	}
	if (wpTypia?.namespace !== workspace.workspace.namespace) {
		issues.push(`wpTypia.namespace must equal "${workspace.workspace.namespace}"`);
	}
	if (wpTypia?.textDomain !== workspace.workspace.textDomain) {
		issues.push(`wpTypia.textDomain must equal "${workspace.workspace.textDomain}"`);
	}
	if (wpTypia?.phpPrefix !== workspace.workspace.phpPrefix) {
		issues.push(`wpTypia.phpPrefix must equal "${workspace.workspace.phpPrefix}"`);
	}
	if (!fs.existsSync(path.join(workspace.projectDir, bootstrapRelativePath))) {
		issues.push(`Missing bootstrap file ${bootstrapRelativePath}`);
	}

	return createDoctorCheck(
		"Workspace package metadata",
		issues.length === 0 ? "pass" : "fail",
		issues.length === 0
			? `package.json metadata aligns with ${workspace.packageName} and ${bootstrapRelativePath}`
			: issues.join("; "),
	);
}

function getWorkspaceBlockRequiredFiles(
	block: WorkspaceInventory["blocks"][number],
): string[] {
	const blockDir = path.join("src", "blocks", block.slug);

	return Array.from(
		new Set(
			[
				block.typesFile,
				block.apiTypesFile,
				block.openApiFile,
				path.join(blockDir, "index.tsx"),
				...WORKSPACE_GENERATED_BLOCK_ARTIFACTS.map((fileName) => path.join(blockDir, fileName)),
			].filter((filePath): filePath is string => typeof filePath === "string"),
		),
	);
}

function checkWorkspaceBlockMetadata(
	projectDir: string,
	workspace: WorkspaceProject,
	block: WorkspaceInventory["blocks"][number],
): DoctorCheck {
	const blockJsonRelativePath = path.join("src", "blocks", block.slug, "block.json");
	const blockJsonPath = path.join(projectDir, blockJsonRelativePath);

	if (!fs.existsSync(blockJsonPath)) {
		return createDoctorCheck(
			`Block metadata ${block.slug}`,
			"fail",
			`Missing ${blockJsonRelativePath}`,
		);
	}

	let blockJson: { name: string; textdomain?: string };
	try {
		blockJson = parseScaffoldBlockMetadata<{ textdomain?: string }>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
	} catch (error) {
		return createDoctorCheck(
			`Block metadata ${block.slug}`,
			"fail",
			error instanceof Error ? error.message : String(error),
		);
	}

	const expectedName = `${workspace.workspace.namespace}/${block.slug}`;
	const issues: string[] = [];
	if (blockJson.name !== expectedName) {
		issues.push(`block.json name must equal "${expectedName}"`);
	}
	if (blockJson.textdomain !== workspace.workspace.textDomain) {
		issues.push(`block.json textdomain must equal "${workspace.workspace.textDomain}"`);
	}

	return createDoctorCheck(
		`Block metadata ${block.slug}`,
		issues.length === 0 ? "pass" : "fail",
		issues.length === 0
			? `block.json matches ${expectedName} and ${workspace.workspace.textDomain}`
			: issues.join("; "),
	);
}

function checkWorkspaceBlockHooks(
	projectDir: string,
	blockSlug: string,
): DoctorCheck {
	const blockJsonRelativePath = path.join("src", "blocks", blockSlug, "block.json");
	const blockJsonPath = path.join(projectDir, blockJsonRelativePath);

	if (!fs.existsSync(blockJsonPath)) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"fail",
			`Missing ${blockJsonRelativePath}`,
		);
	}

	let blockJson: Record<string, unknown> & { blockHooks?: unknown };
	try {
		blockJson = parseScaffoldBlockMetadata<Record<string, unknown> & { blockHooks?: unknown }>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
	} catch (error) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"fail",
			error instanceof Error ? error.message : String(error),
		);
	}

	const blockHooks = blockJson.blockHooks;
	if (blockHooks === undefined) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"pass",
			"No blockHooks metadata configured",
		);
	}
	if (!blockHooks || typeof blockHooks !== "object" || Array.isArray(blockHooks)) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"fail",
			`${blockJsonRelativePath} must define blockHooks as an object when present.`,
		);
	}

	const blockName =
		typeof blockJson.name === "string" && blockJson.name.trim().length > 0
			? blockJson.name.trim()
			: null;
	const invalidEntries = Object.entries(blockHooks).filter(
		([anchor, position]) =>
			(blockName !== null && anchor.trim() === blockName) ||
			anchor.trim().length === 0 ||
			anchor !== anchor.trim() ||
			!HOOKED_BLOCK_ANCHOR_PATTERN.test(anchor) ||
			typeof position !== "string" ||
			!HOOKED_BLOCK_POSITION_SET.has(position),
	);

	return createDoctorCheck(
		`Block hooks ${blockSlug}`,
		invalidEntries.length === 0 ? "pass" : "fail",
		invalidEntries.length === 0
			? `blockHooks metadata is valid${Object.keys(blockHooks).length > 0 ? ` (${Object.keys(blockHooks).join(", ")})` : ""}`
			: `Invalid blockHooks entries: ${invalidEntries
					.map(([anchor, position]) => `${anchor || "<empty>"} => ${String(position)}`)
					.join(", ")}`,
	);
}

function checkWorkspaceBlockCollectionImport(
	projectDir: string,
	blockSlug: string,
): DoctorCheck {
	const entryRelativePath = path.join("src", "blocks", blockSlug, "index.tsx");
	const entryPath = path.join(projectDir, entryRelativePath);

	if (!fs.existsSync(entryPath)) {
		return createDoctorCheck(
			`Block collection ${blockSlug}`,
			"fail",
			`Missing ${entryRelativePath}`,
		);
	}

	const source = fs.readFileSync(entryPath, "utf8");
	const hasCollectionImport = WORKSPACE_COLLECTION_IMPORT_PATTERN.test(source);
	return createDoctorCheck(
		`Block collection ${blockSlug}`,
		hasCollectionImport ? "pass" : "fail",
		hasCollectionImport
			? "Shared block collection import is present"
			: `Missing a shared collection import like ${WORKSPACE_COLLECTION_IMPORT_LINE}`,
	);
}

function checkWorkspacePatternBootstrap(projectDir: string, packageName: string): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck("Pattern bootstrap", "fail", `Missing ${path.basename(bootstrapPath)}`);
	}
	const source = fs.readFileSync(bootstrapPath, "utf8");
	const hasCategoryAnchor = source.includes("register_block_pattern_category");
	const hasPatternGlob = source.includes("/src/patterns/*.php");
	return createDoctorCheck(
		"Pattern bootstrap",
		hasCategoryAnchor && hasPatternGlob ? "pass" : "fail",
		hasCategoryAnchor && hasPatternGlob
			? "Pattern category and loader hooks are present"
			: "Missing pattern category registration or src/patterns loader hook",
	);
}

function checkWorkspaceBindingBootstrap(projectDir: string, packageName: string): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"Binding bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const hasServerGlob = source.includes(WORKSPACE_BINDING_SERVER_GLOB);
	const hasEditorEnqueueHook = source.includes("enqueue_block_editor_assets");
	const hasEditorScript = source.includes(WORKSPACE_BINDING_EDITOR_SCRIPT);
	const hasEditorAsset = source.includes(WORKSPACE_BINDING_EDITOR_ASSET);

	return createDoctorCheck(
		"Binding bootstrap",
		hasServerGlob && hasEditorEnqueueHook && hasEditorScript && hasEditorAsset ? "pass" : "fail",
		hasServerGlob && hasEditorEnqueueHook && hasEditorScript && hasEditorAsset
			? "Binding source PHP and editor bootstrap hooks are present"
			: "Missing binding source PHP require glob or editor enqueue hook",
	);
}

function checkWorkspaceBindingSourcesIndex(
	projectDir: string,
	bindingSources: WorkspaceInventory["bindingSources"],
): DoctorCheck {
	const indexRelativePath = [path.join("src", "bindings", "index.ts"), path.join("src", "bindings", "index.js")].find(
		(relativePath) => fs.existsSync(path.join(projectDir, relativePath)),
	);

	if (!indexRelativePath) {
		return createDoctorCheck(
			"Binding sources index",
			"fail",
			"Missing src/bindings/index.ts or src/bindings/index.js",
		);
	}

	const indexPath = path.join(projectDir, indexRelativePath);
	const source = fs.readFileSync(indexPath, "utf8");
	const missingImports = bindingSources.filter(
		(bindingSource) => !source.includes(`./${bindingSource.slug}/editor`),
	);

	return createDoctorCheck(
		"Binding sources index",
		missingImports.length === 0 ? "pass" : "fail",
		missingImports.length === 0
			? "Binding source editor registrations are aggregated"
			: `Missing editor imports for: ${missingImports.map((entry) => entry.slug).join(", ")}`,
	);
}

function checkVariationEntrypoint(projectDir: string, blockSlug: string): DoctorCheck {
	const entryPath = path.join(projectDir, "src", "blocks", blockSlug, "index.tsx");
	if (!fs.existsSync(entryPath)) {
		return createDoctorCheck(
			`Variation entrypoint ${blockSlug}`,
			"fail",
			`Missing ${path.relative(projectDir, entryPath)}`,
		);
	}
	const source = fs.readFileSync(entryPath, "utf8");
	const hasImport = source.includes("./variations");
	const hasCall = source.includes("registerWorkspaceVariations()");
	return createDoctorCheck(
		`Variation entrypoint ${blockSlug}`,
		hasImport && hasCall ? "pass" : "fail",
		hasImport && hasCall
			? "Variations registration hook is present"
			: "Missing ./variations import or registerWorkspaceVariations() call",
	);
}

function checkMigrationWorkspaceHint(
	workspace: WorkspaceProject,
	packageJson: WorkspacePackageJson,
): DoctorCheck | null {
	const hasMigrationScript = typeof packageJson.scripts?.["migration:doctor"] === "string";
	const migrationConfigRelativePath = path.join("src", "migrations", "config.ts");
	const hasMigrationConfig = fs.existsSync(
		path.join(workspace.projectDir, migrationConfigRelativePath),
	);

	if (!hasMigrationScript && !hasMigrationConfig) {
		return null;
	}

	return createDoctorCheck(
		"Migration workspace",
		hasMigrationConfig ? "pass" : "fail",
		hasMigrationConfig
			? "Run `wp-typia migrate doctor --all` for migration target, snapshot, fixture, and generated artifact checks"
			: `Missing ${migrationConfigRelativePath} for the configured migration workspace`,
	);
}

/**
 * Collect all runtime doctor checks for the current environment.
 *
 * The returned array includes command availability checks, directory
 * writability checks, and built-in template asset checks in display order.
 *
 * @param cwd Working directory to validate for writability.
 * @returns Ordered doctor check rows ready for CLI rendering.
 */
export async function getDoctorChecks(cwd: string): Promise<DoctorCheck[]> {
	const checks: DoctorCheck[] = [];
	const bunVersion = readCommandVersion("bun");
	const nodeVersion = readCommandVersion("node");
	const gitVersion = readCommandVersion("git");
	const cwdWritable = await checkWritableDirectory(cwd);
	const tempWritable = await checkTempDirectory();

	checks.push({
		status: bunVersion && compareMajorVersion(bunVersion, 1) ? "pass" : "fail",
		label: "Bun",
		detail: bunVersion ? `Detected ${bunVersion}` : "Not available",
	});
	checks.push({
		status: nodeVersion && compareMajorVersion(nodeVersion, 20) ? "pass" : "fail",
		label: "Node",
		detail: nodeVersion ? `Detected ${nodeVersion}` : "Not available",
	});
	checks.push({
		status: gitVersion ? "pass" : "fail",
		label: "git",
		detail: gitVersion ?? "Not available",
	});
	checks.push({
		status: cwdWritable ? "pass" : "fail",
		label: "Current directory",
		detail: cwdWritable ? "Writable" : "Not writable",
	});
	checks.push({
		status: tempWritable ? "pass" : "fail",
		label: "Temp directory",
		detail: tempWritable ? "Writable" : "Not writable",
	});

	for (const template of listTemplates()) {
		if (!isBuiltInTemplateId(template.id)) {
			const templateDirExists = fs.existsSync(template.templateDir);
			const hasAssets =
				templateDirExists &&
				fs.existsSync(path.join(template.templateDir, "package.json.mustache"));
			checks.push({
				status: !templateDirExists || hasAssets ? "pass" : "fail",
				label: `Template ${template.id}`,
				detail: !templateDirExists
					? "External template metadata only; local overlay package is not installed."
					: hasAssets
						? template.templateDir
						: "Missing core template assets",
			});
			continue;
		}

		const builtInTemplateId = template.id;
		const layerDirs =
			builtInTemplateId === "persistence"
				? Array.from(
						new Set([
							...getBuiltInTemplateLayerDirs(builtInTemplateId, { persistencePolicy: "authenticated" }),
							...getBuiltInTemplateLayerDirs(builtInTemplateId, { persistencePolicy: "public" }),
						]),
					)
				: builtInTemplateId === "compound"
					? Array.from(
							new Set([
								...getBuiltInTemplateLayerDirs(builtInTemplateId),
								...getBuiltInTemplateLayerDirs(builtInTemplateId, {
									persistenceEnabled: true,
									persistencePolicy: "authenticated",
								}),
								...getBuiltInTemplateLayerDirs(builtInTemplateId, {
									persistenceEnabled: true,
									persistencePolicy: "public",
								}),
							]),
					)
					: getBuiltInTemplateLayerDirs(builtInTemplateId);
		const missingRequiredLayer = layerDirs.some(
			(layerDir) =>
				!fs.existsSync(layerDir) &&
				!isOmittableBuiltInTemplateLayerDir(builtInTemplateId, layerDir),
		);
		const existingLayerDirs = layerDirs.filter((layerDir) => fs.existsSync(layerDir));
		const hasAssets =
			!missingRequiredLayer &&
			existingLayerDirs.some((layerDir) =>
				fs.existsSync(path.join(layerDir, "package.json.mustache")),
			) &&
			existingLayerDirs.some((layerDir) => fs.existsSync(path.join(layerDir, "src")));
		checks.push({
			status: hasAssets ? "pass" : "fail",
			label: `Template ${template.id}`,
			detail: hasAssets
				? existingLayerDirs.join(" + ")
				: "Missing core template assets",
		});
	}

	let workspace: WorkspaceProject | null = null;
	let invalidWorkspaceReason: string | null = null;
	try {
		invalidWorkspaceReason = getInvalidWorkspaceProjectReason(cwd);
		workspace = tryResolveWorkspaceProject(cwd);
	} catch (error) {
		checks.push(
			createDoctorCheck(
				"Workspace package metadata",
				"fail",
				error instanceof Error ? error.message : String(error),
			),
		);
		return checks;
	}
	if (!workspace) {
		if (invalidWorkspaceReason) {
			checks.push(
				createDoctorCheck(
					"Workspace package metadata",
					"fail",
					invalidWorkspaceReason,
				),
			);
		}
		return checks;
	}

	checks.push(
		createDoctorCheck(
			"Workspace marker",
			"pass",
			`Official workspace detected for ${workspace.workspace.namespace}`,
		),
	);

	let workspacePackageJson: WorkspacePackageJson;
	try {
		workspacePackageJson = parseWorkspacePackageJson(workspace.projectDir);
	} catch (error) {
		checks.push(
			createDoctorCheck(
				"Workspace package metadata",
				"fail",
				error instanceof Error ? error.message : String(error),
			),
		);
		return checks;
	}

	checks.push(checkWorkspacePackageMetadata(workspace, workspacePackageJson));

	try {
		const inventory = readWorkspaceInventory(workspace.projectDir);
		checks.push(
			createDoctorCheck(
				"Workspace inventory",
				"pass",
				`${inventory.blocks.length} block(s), ${inventory.variations.length} variation(s), ${inventory.patterns.length} pattern(s), ${inventory.bindingSources.length} binding source(s)`,
			),
		);

		for (const block of inventory.blocks) {
			checks.push(
				checkExistingFiles(workspace.projectDir, `Block ${block.slug}`, [
					...getWorkspaceBlockRequiredFiles(block),
				]),
			);
			checks.push(checkWorkspaceBlockMetadata(workspace.projectDir, workspace, block));
			checks.push(checkWorkspaceBlockHooks(workspace.projectDir, block.slug));
			checks.push(checkWorkspaceBlockCollectionImport(workspace.projectDir, block.slug));
		}

		const registeredBlockSlugs = new Set(inventory.blocks.map((block) => block.slug));
		const variationTargetBlocks = new Set<string>();
		for (const variation of inventory.variations) {
			if (!registeredBlockSlugs.has(variation.block)) {
				checks.push(
					createDoctorCheck(
						`Variation ${variation.block}/${variation.slug}`,
						"fail",
						`Variation references unknown block "${variation.block}"`,
					),
				);
				continue;
			}

			variationTargetBlocks.add(variation.block);
			checks.push(
				checkExistingFiles(
					workspace.projectDir,
					`Variation ${variation.block}/${variation.slug}`,
					[variation.file],
				),
			);
		}
		for (const blockSlug of variationTargetBlocks) {
			checks.push(checkVariationEntrypoint(workspace.projectDir, blockSlug));
		}

		const shouldCheckPatternBootstrap =
			inventory.patterns.length > 0 ||
			fs.existsSync(path.join(workspace.projectDir, "src", "patterns"));
		if (shouldCheckPatternBootstrap) {
			checks.push(checkWorkspacePatternBootstrap(workspace.projectDir, workspace.packageName));
		}
		for (const pattern of inventory.patterns) {
			checks.push(
				checkExistingFiles(workspace.projectDir, `Pattern ${pattern.slug}`, [pattern.file]),
			);
		}

		if (inventory.bindingSources.length > 0) {
			checks.push(checkWorkspaceBindingBootstrap(workspace.projectDir, workspace.packageName));
			checks.push(
				checkWorkspaceBindingSourcesIndex(workspace.projectDir, inventory.bindingSources),
			);
		}
		for (const bindingSource of inventory.bindingSources) {
			checks.push(
				checkExistingFiles(workspace.projectDir, `Binding source ${bindingSource.slug}`, [
					bindingSource.serverFile,
					bindingSource.editorFile,
				]),
			);
		}

		const migrationWorkspaceCheck = checkMigrationWorkspaceHint(
			workspace,
			workspacePackageJson,
		);
		if (migrationWorkspaceCheck) {
			checks.push(migrationWorkspaceCheck);
		}
	} catch (error) {
		checks.push(
			createDoctorCheck(
				"Workspace inventory",
				"fail",
				error instanceof Error ? error.message : String(error),
			),
		);
	}

	return checks;
}

/**
 * Run doctor checks, render each line, and fail when any check does not pass.
 *
 * @param cwd Working directory to validate.
 * @param options Optional renderer override for each emitted check row.
 * @returns The completed list of doctor checks.
 * @throws {Error} When one or more checks fail.
 */
export async function runDoctor(
	cwd: string,
	options: RunDoctorOptions = {},
): Promise<DoctorCheck[]> {
	const renderLine =
		options.renderLine ?? ((check: DoctorCheck) => console.log(formatDoctorCheckLine(check)));
	const renderSummaryLine =
		options.renderSummaryLine ??
		(options.renderLine ? () => undefined : (summaryLine: string) => console.log(summaryLine));
	const checks = await getDoctorChecks(cwd);

	for (const check of checks) {
		renderLine(check);
	}

	renderSummaryLine(formatDoctorSummaryLine(checks));

	const failureDetailLines = getDoctorFailureDetailLines(checks);
	if (failureDetailLines.length > 0) {
		throw createCliCommandError({
			command: "doctor",
			detailLines: failureDetailLines,
			summary: "One or more doctor checks failed.",
		});
	}

	return checks;
}
