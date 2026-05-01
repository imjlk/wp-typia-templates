import fs from "node:fs";
import path from "node:path";

import { parseScaffoldBlockMetadata } from "@wp-typia/block-runtime/blocks";

import {
	checkExistingFiles,
	createDoctorCheck,
	WORKSPACE_FULL_BLOCK_NAME_PATTERN,
	WORKSPACE_GENERATED_BLOCK_ARTIFACTS,
} from "./cli-doctor-workspace-shared.js";
import {
	HOOKED_BLOCK_ANCHOR_PATTERN,
	HOOKED_BLOCK_POSITION_SET,
} from "./hooked-blocks.js";

import type { DoctorCheck } from "./cli-doctor.js";
import type { WorkspaceInventory } from "./workspace-inventory.js";
import type { WorkspaceProject } from "./workspace-project.js";

const WORKSPACE_COLLECTION_IMPORT_LINE = "import '../../collection';";
const WORKSPACE_COLLECTION_IMPORT_PATTERN = /^\s*import\s+["']\.\.\/\.\.\/collection["']\s*;?\s*$/m;
const WORKSPACE_VARIATIONS_IMPORT_PATTERN =
	/^\s*import\s*\{\s*registerWorkspaceVariations\s*\}\s*from\s*["']\.\/variations["']\s*;?\s*$/mu;
const WORKSPACE_VARIATIONS_CALL_PATTERN = /registerWorkspaceVariations\s*\(\s*\)\s*;?/u;
const WORKSPACE_BLOCK_STYLES_IMPORT_PATTERN =
	/^\s*import\s*\{\s*registerWorkspaceBlockStyles\s*\}\s*from\s*["']\.\/styles["']\s*;?\s*$/mu;
const WORKSPACE_BLOCK_STYLES_CALL_PATTERN =
	/registerWorkspaceBlockStyles\s*\(\s*\)\s*;?/u;
const WORKSPACE_BLOCK_TRANSFORMS_IMPORT_PATTERN =
	/^\s*import\s*\{\s*applyWorkspaceBlockTransforms\s*\}\s*from\s*["']\.\/transforms["']\s*;?\s*$/mu;
const WORKSPACE_BLOCK_TRANSFORMS_CALL_PATTERN =
	/applyWorkspaceBlockTransforms\s*\(\s*registration\s*\.\s*settings\s*\)\s*;?/u;
const WORKSPACE_BLOCK_IFRAME_COMPATIBILITY_DOC_URL =
	"https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/block-migration-for-iframe-editor-compatibility/";
const WORKSPACE_BLOCK_IFRAME_DIAGNOSTIC_CODES = {
	API_VERSION: "wp-typia.workspace.block.iframe.api-version",
	BLOCK_PROPS: "wp-typia.workspace.block.iframe.block-props",
	EDITOR_GLOBALS: "wp-typia.workspace.block.iframe.editor-globals",
	EDITOR_STYLES: "wp-typia.workspace.block.iframe.editor-styles",
} as const;
const WORKSPACE_BLOCK_EDITOR_SOURCE_FILE_PATTERN = /\.[cm]?[jt]sx?$/u;
const WORKSPACE_BLOCK_EDITOR_SOURCE_BASENAMES = new Set([
	"edit",
	"editor",
	"index",
	"save",
]);
const WORKSPACE_BLOCK_EDITOR_SOURCE_DIRECTORIES = new Set([
	"components",
	"controls",
	"editor",
	"inspector",
]);
const WORKSPACE_BLOCK_LOCAL_STYLE_FILES = [
	"editor.css",
	"editor.scss",
	"index.css",
	"style.css",
	"style.scss",
];
const WORKSPACE_BLOCK_IFRAME_GLOBAL_DOM_PATTERN =
	/\b(?:document|window)\b|\b(?:parent|top)\b(?!\s*:)/gu;
const WORKSPACE_BLOCK_PROPS_PATTERN =
	/\buse(?:Block|InnerBlocks)Props(?:\.save)?\s*\(/u;

type WorkspaceBlockIframeMetadata = Record<string, unknown> & {
	apiVersion?: unknown;
	editorStyle?: unknown;
	style?: unknown;
};

interface WorkspaceBlockEditorSource {
	relativePath: string;
	source: string;
}

function maskSourceSegment(segment: string): string {
	return segment.replace(/[^\n\r]/gu, " ");
}

function maskTypeScriptComments(source: string): string {
	return source
		.replace(/\/\*[\s\S]*?\*\//gu, maskSourceSegment)
		.replace(/\/\/[^\n\r]*/gu, maskSourceSegment);
}

// Preserve offsets while hiding non-executable text from hook checks.
function maskTypeScriptCommentsAndLiterals(source: string): string {
	let maskedSource = "";
	let index = 0;

	while (index < source.length) {
		const current = source[index];
		const next = source[index + 1];

		if (current === "/" && next === "/") {
			const start = index;
			index += 2;

			while (
				index < source.length &&
				source[index] !== "\n" &&
				source[index] !== "\r"
			) {
				index += 1;
			}

			maskedSource += maskSourceSegment(source.slice(start, index));
			continue;
		}

		if (current === "/" && next === "*") {
			const start = index;
			index += 2;

			while (
				index < source.length &&
				!(source[index] === "*" && source[index + 1] === "/")
			) {
				index += 1;
			}

			index = Math.min(index + 2, source.length);
			maskedSource += maskSourceSegment(source.slice(start, index));
			continue;
		}

		if (current === "'" || current === '"' || current === "`") {
			const start = index;
			const quote = current;
			index += 1;

			while (index < source.length) {
				const char = source[index];

				if (char === "\\") {
					index += 2;
					continue;
				}

				index += 1;

				if (char === quote) {
					break;
				}
			}

			maskedSource += maskSourceSegment(source.slice(start, index));
			continue;
		}

		maskedSource += current;
		index += 1;
	}

	return maskedSource;
}

function hasUncommentedPattern(source: string, pattern: RegExp): boolean {
	return pattern.test(maskTypeScriptComments(source));
}

function hasExecutablePattern(source: string, pattern: RegExp): boolean {
	return pattern.test(maskTypeScriptCommentsAndLiterals(source));
}

function normalizePathSeparators(relativePath: string): string {
	return relativePath.split(path.sep).join("/");
}

function hasRegisteredBlockAsset(value: unknown): boolean {
	if (typeof value === "string") {
		return value.trim().length > 0;
	}
	if (Array.isArray(value)) {
		return value.some((entry) => hasRegisteredBlockAsset(entry));
	}
	return false;
}

function readWorkspaceBlockIframeMetadata(
	projectDir: string,
	blockSlug: string,
): {
	blockJsonRelativePath: string;
	document?: WorkspaceBlockIframeMetadata;
	error?: string;
} {
	const blockJsonRelativePath = path.join("src", "blocks", blockSlug, "block.json");
	const blockJsonPath = path.join(projectDir, blockJsonRelativePath);

	if (!fs.existsSync(blockJsonPath)) {
		return {
			blockJsonRelativePath,
			error: `Missing ${blockJsonRelativePath}`,
		};
	}

	try {
		const document = parseScaffoldBlockMetadata<WorkspaceBlockIframeMetadata>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
		return {
			blockJsonRelativePath,
			document,
		};
	} catch (error) {
		return {
			blockJsonRelativePath,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

function isWorkspaceBlockEditorSource(relativePath: string): boolean {
	if (!WORKSPACE_BLOCK_EDITOR_SOURCE_FILE_PATTERN.test(relativePath)) {
		return false;
	}

	const normalizedRelativePath = normalizePathSeparators(relativePath);
	const normalizedDirName = path.posix.dirname(normalizedRelativePath);
	const normalizedBaseName = path.posix.basename(
		normalizedRelativePath,
		path.posix.extname(normalizedRelativePath),
	);
	if (WORKSPACE_BLOCK_EDITOR_SOURCE_BASENAMES.has(normalizedBaseName)) {
		return true;
	}

	const pathSegments = normalizedDirName.split("/");
	return pathSegments.some((segment) =>
		WORKSPACE_BLOCK_EDITOR_SOURCE_DIRECTORIES.has(segment),
	);
}

function isWorkspaceBlockSaveSource(relativePath: string): boolean {
	const normalizedBaseName = path.basename(relativePath, path.extname(relativePath));
	return normalizedBaseName === "save";
}

function collectWorkspaceBlockEditorSources(
	projectDir: string,
	blockSlug: string,
): WorkspaceBlockEditorSource[] {
	const blockDir = path.join(projectDir, "src", "blocks", blockSlug);
	if (!fs.existsSync(blockDir)) {
		return [];
	}

	const collected: WorkspaceBlockEditorSource[] = [];
	const queue: string[] = [blockDir];

	while (queue.length > 0) {
		const currentDir = queue.pop();
		if (!currentDir) {
			continue;
		}

		for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
			const absolutePath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				queue.push(absolutePath);
				continue;
			}
			if (!entry.isFile()) {
				continue;
			}

			const relativePath = path.relative(projectDir, absolutePath);
			if (!isWorkspaceBlockEditorSource(relativePath)) {
				continue;
			}

			collected.push({
				relativePath: normalizePathSeparators(relativePath),
				source: fs.readFileSync(absolutePath, "utf8"),
			});
		}
	}

	return collected.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function getSourceLineNumber(source: string, index: number): number {
	let line = 1;
	for (let cursor = 0; cursor < index; cursor += 1) {
		if (source[cursor] === "\n") {
			line += 1;
		}
	}
	return line;
}

function isGlobalDomAccessCandidate(
	source: string,
	index: number,
	identifier: string,
): boolean {
	const lineStart = source.lastIndexOf("\n", index - 1) + 1;
	const lineEndCandidate = source.indexOf("\n", index);
	const lineEnd = lineEndCandidate === -1 ? source.length : lineEndCandidate;
	const lineSource = source.slice(lineStart, lineEnd);
	const trimmedLine = lineSource.trimStart();

	if (trimmedLine.startsWith("import ")) {
		return false;
	}
	if (trimmedLine.startsWith("const ") || trimmedLine.startsWith("let ") || trimmedLine.startsWith("var ")) {
		return false;
	}
	if (trimmedLine.startsWith("function ") || trimmedLine.startsWith("class ")) {
		return false;
	}

	const precedingCharacter = index > 0 ? source[index - 1] : "";
	if (precedingCharacter === "." || precedingCharacter === "'" || precedingCharacter === '"') {
		return false;
	}

	return (
		identifier === "document" ||
		identifier === "window" ||
		identifier === "parent" ||
		identifier === "top"
	);
}

function findWorkspaceBlockGlobalDomAccesses(
	editorSources: WorkspaceBlockEditorSource[],
): string[] {
	return editorSources.flatMap(({ relativePath, source }) => {
		const maskedSource = maskTypeScriptCommentsAndLiterals(source);
		const matches = maskedSource.matchAll(WORKSPACE_BLOCK_IFRAME_GLOBAL_DOM_PATTERN);
		const findings: string[] = [];

		for (const match of matches) {
			const identifier = match[0];
			const matchIndex = match.index ?? -1;
			if (matchIndex < 0) {
				continue;
			}
			if (!isGlobalDomAccessCandidate(source, matchIndex, identifier)) {
				continue;
			}

			findings.push(`${relativePath}:${getSourceLineNumber(source, matchIndex)}`);
		}

		return findings;
	});
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

function checkWorkspaceBlockIframeCompatibility(
	projectDir: string,
	blockSlug: string,
): DoctorCheck[] {
	const metadataResult = readWorkspaceBlockIframeMetadata(projectDir, blockSlug);
	if (!metadataResult.document) {
		return [
			createDoctorCheck(
				`Block iframe/API v3 ${blockSlug}`,
				"warn",
				metadataResult.error ?? `Unable to inspect ${metadataResult.blockJsonRelativePath}`,
				WORKSPACE_BLOCK_IFRAME_DIAGNOSTIC_CODES.API_VERSION,
			),
		];
	}

	const blockJson = metadataResult.document;
	const apiVersion =
		typeof blockJson.apiVersion === "number" && Number.isFinite(blockJson.apiVersion)
			? blockJson.apiVersion
			: null;
	const blockDir = path.join(projectDir, "src", "blocks", blockSlug);
	const localStyleFiles = WORKSPACE_BLOCK_LOCAL_STYLE_FILES.filter((fileName) =>
		fs.existsSync(path.join(blockDir, fileName)),
	).map((fileName) => normalizePathSeparators(path.join("src", "blocks", blockSlug, fileName)));
	const hasRegisteredEditorStyles =
		hasRegisteredBlockAsset(blockJson.style) ||
		hasRegisteredBlockAsset(blockJson.editorStyle);
	const editorSources = collectWorkspaceBlockEditorSources(projectDir, blockSlug);
	const editorWrapperSources = editorSources.filter(
		(source) => !isWorkspaceBlockSaveSource(source.relativePath),
	);
	const globalDomAccesses = findWorkspaceBlockGlobalDomAccesses(editorSources);
	const hasBlockPropsUsage = editorSources.some(({ source }) =>
		hasExecutablePattern(source, WORKSPACE_BLOCK_PROPS_PATTERN),
	);
	const hasEditorBlockPropsUsage = editorWrapperSources.some(({ source }) =>
		hasExecutablePattern(source, WORKSPACE_BLOCK_PROPS_PATTERN),
	);
	const blockWrapperStatus: DoctorCheck["status"] =
		editorWrapperSources.length === 0 || hasEditorBlockPropsUsage ? "pass" : "warn";
	const blockWrapperDetail =
		editorSources.length === 0
			? "No editor-facing block source files found; general file checks will report missing entrypoints"
			: editorWrapperSources.length === 0
				? "No editor wrapper source files found; general file checks will report missing entrypoints"
				: hasEditorBlockPropsUsage
					? "Editor-facing sources use block wrapper props"
					: hasBlockPropsUsage
						? "Only save-facing useBlockProps.save() usage was detected. Confirm the editor wrapper also receives useBlockProps() or useInnerBlocksProps() before relying on iframe editor rendering."
						: "No useBlockProps(), useBlockProps.save(), or useInnerBlocksProps() usage was detected in editor-facing sources. Confirm the block wrapper receives WordPress block editor props before relying on iframe editor rendering.";

	return [
		createDoctorCheck(
			`Block iframe API version ${blockSlug}`,
			apiVersion !== null && apiVersion >= 3 ? "pass" : "warn",
			apiVersion !== null && apiVersion >= 3
				? "block.json declares apiVersion 3 for iframe editor readiness"
				: `Set ${metadataResult.blockJsonRelativePath} apiVersion to 3 after testing the block in iframe-enabled Post Editor and Site Editor contexts. WordPress recommends API v3 for iframe editor compatibility. See ${WORKSPACE_BLOCK_IFRAME_COMPATIBILITY_DOC_URL}`,
			WORKSPACE_BLOCK_IFRAME_DIAGNOSTIC_CODES.API_VERSION,
		),
		createDoctorCheck(
			`Block iframe styles ${blockSlug}`,
			localStyleFiles.length === 0 || hasRegisteredEditorStyles ? "pass" : "warn",
			localStyleFiles.length === 0
				? "No local block stylesheet source files found to register"
				: hasRegisteredEditorStyles
					? "block.json registers block styles for iframe editor loading"
					: `Found stylesheet source files (${localStyleFiles.join(", ")}) but block.json does not declare style or editorStyle. Register block content styles so iframe editors do not depend on parent admin styles.`,
			WORKSPACE_BLOCK_IFRAME_DIAGNOSTIC_CODES.EDITOR_STYLES,
		),
		createDoctorCheck(
			`Block iframe globals ${blockSlug}`,
			globalDomAccesses.length === 0 ? "pass" : "warn",
			globalDomAccesses.length === 0
				? "No direct window/document/parent DOM access detected in editor-facing block sources"
				: `Direct global DOM access detected at ${globalDomAccesses.join(", ")}. Prefer element.ownerDocument/defaultView via refs or useRefEffect for iframe editor content.`,
			WORKSPACE_BLOCK_IFRAME_DIAGNOSTIC_CODES.EDITOR_GLOBALS,
		),
		createDoctorCheck(
			`Block iframe wrapper ${blockSlug}`,
			blockWrapperStatus,
			blockWrapperDetail,
			WORKSPACE_BLOCK_IFRAME_DIAGNOSTIC_CODES.BLOCK_PROPS,
		),
	];
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
	const hasImport = hasUncommentedPattern(source, WORKSPACE_VARIATIONS_IMPORT_PATTERN);
	const hasCall = hasExecutablePattern(source, WORKSPACE_VARIATIONS_CALL_PATTERN);
	return createDoctorCheck(
		`Variation entrypoint ${blockSlug}`,
		hasImport && hasCall ? "pass" : "fail",
		hasImport && hasCall
			? "Variations registration hook is present"
			: "Missing ./variations import or registerWorkspaceVariations() call",
	);
}

function checkBlockStyleEntrypoint(projectDir: string, blockSlug: string): DoctorCheck {
	const entryPath = path.join(projectDir, "src", "blocks", blockSlug, "index.tsx");
	if (!fs.existsSync(entryPath)) {
		return createDoctorCheck(
			`Block style entrypoint ${blockSlug}`,
			"fail",
			`Missing ${path.relative(projectDir, entryPath)}`,
		);
	}
	const source = fs.readFileSync(entryPath, "utf8");
	const hasImport = hasUncommentedPattern(source, WORKSPACE_BLOCK_STYLES_IMPORT_PATTERN);
	const hasCall = hasExecutablePattern(source, WORKSPACE_BLOCK_STYLES_CALL_PATTERN);
	return createDoctorCheck(
		`Block style entrypoint ${blockSlug}`,
		hasImport && hasCall ? "pass" : "fail",
		hasImport && hasCall
			? "Block style registration hook is present"
			: "Missing ./styles import or registerWorkspaceBlockStyles() call",
	);
}

function checkBlockTransformEntrypoint(
	projectDir: string,
	blockSlug: string,
): DoctorCheck {
	const entryPath = path.join(projectDir, "src", "blocks", blockSlug, "index.tsx");
	if (!fs.existsSync(entryPath)) {
		return createDoctorCheck(
			`Block transform entrypoint ${blockSlug}`,
			"fail",
			`Missing ${path.relative(projectDir, entryPath)}`,
		);
	}
	const source = fs.readFileSync(entryPath, "utf8");
	const hasImport = hasUncommentedPattern(
		source,
		WORKSPACE_BLOCK_TRANSFORMS_IMPORT_PATTERN,
	);
	const hasCall = hasExecutablePattern(source, WORKSPACE_BLOCK_TRANSFORMS_CALL_PATTERN);
	return createDoctorCheck(
		`Block transform entrypoint ${blockSlug}`,
		hasImport && hasCall ? "pass" : "fail",
		hasImport && hasCall
			? "Block transform registration hook is present"
			: "Missing ./transforms import or applyWorkspaceBlockTransforms(registration.settings) call",
	);
}

function checkBlockTransformConfig(
	workspace: WorkspaceProject,
	transform: WorkspaceInventory["blockTransforms"][number],
): DoctorCheck {
	const expectedTo = `${workspace.workspace.namespace}/${transform.block}`;
	const issues: string[] = [];
	if (!WORKSPACE_FULL_BLOCK_NAME_PATTERN.test(transform.from)) {
		issues.push("from must use full namespace/block format");
	}
	if (transform.to !== expectedTo) {
		issues.push(`to must equal "${expectedTo}" for workspace block "${transform.block}"`);
	}

	return createDoctorCheck(
		`Block transform config ${transform.block}/${transform.slug}`,
		issues.length === 0 ? "pass" : "fail",
		issues.length === 0
			? `${transform.from} transforms into ${transform.to}`
			: issues.join("; "),
	);
}

/**
 * Collect block-, variation-, transform-, and pattern-related workspace doctor checks.
 *
 * @param workspace Resolved workspace metadata and filesystem paths.
 * @param inventory Parsed workspace inventory from `scripts/block-config.ts`.
 * @returns Ordered `DoctorCheck[]` rows for extracted block diagnostics.
 */
export function getWorkspaceBlockDoctorChecks(
	workspace: WorkspaceProject,
	inventory: WorkspaceInventory,
): DoctorCheck[] {
	const checks: DoctorCheck[] = [];

	for (const block of inventory.blocks) {
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Block ${block.slug}`,
				getWorkspaceBlockRequiredFiles(block),
			),
		);
		checks.push(checkWorkspaceBlockMetadata(workspace.projectDir, workspace, block));
		checks.push(checkWorkspaceBlockHooks(workspace.projectDir, block.slug));
		checks.push(checkWorkspaceBlockCollectionImport(workspace.projectDir, block.slug));
		checks.push(...checkWorkspaceBlockIframeCompatibility(workspace.projectDir, block.slug));
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

	const blockStyleTargetBlocks = new Set<string>();
	for (const blockStyle of inventory.blockStyles) {
		if (!registeredBlockSlugs.has(blockStyle.block)) {
			checks.push(
				createDoctorCheck(
					`Block style ${blockStyle.block}/${blockStyle.slug}`,
					"fail",
					`Block style references unknown block "${blockStyle.block}"`,
				),
			);
			continue;
		}

		blockStyleTargetBlocks.add(blockStyle.block);
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Block style ${blockStyle.block}/${blockStyle.slug}`,
				[blockStyle.file],
			),
		);
	}
	for (const blockSlug of blockStyleTargetBlocks) {
		checks.push(
			checkExistingFiles(workspace.projectDir, `Block style registry ${blockSlug}`, [
				path.join("src", "blocks", blockSlug, "styles", "index.ts"),
			]),
		);
		checks.push(checkBlockStyleEntrypoint(workspace.projectDir, blockSlug));
	}

	const blockTransformTargetBlocks = new Set<string>();
	for (const blockTransform of inventory.blockTransforms) {
		if (!registeredBlockSlugs.has(blockTransform.block)) {
			checks.push(
				createDoctorCheck(
					`Block transform ${blockTransform.block}/${blockTransform.slug}`,
					"fail",
					`Block transform references unknown block "${blockTransform.block}"`,
				),
			);
			continue;
		}

		blockTransformTargetBlocks.add(blockTransform.block);
		checks.push(checkBlockTransformConfig(workspace, blockTransform));
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Block transform ${blockTransform.block}/${blockTransform.slug}`,
				[blockTransform.file],
			),
		);
	}
	for (const blockSlug of blockTransformTargetBlocks) {
		checks.push(
			checkExistingFiles(workspace.projectDir, `Block transform registry ${blockSlug}`, [
				path.join("src", "blocks", blockSlug, "transforms", "index.ts"),
			]),
		);
		checks.push(checkBlockTransformEntrypoint(workspace.projectDir, blockSlug));
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

	return checks;
}
