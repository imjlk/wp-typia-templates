import { promises as fsp } from "node:fs";
import path from "node:path";

import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";
import {
	appendWorkspaceInventoryEntries,
	readWorkspaceInventoryAsync,
} from "./workspace-inventory.js";
import { toTitleCase } from "./string-case.js";
import { hasPhpFunctionDefinition } from "./php-utils.js";
import {
	assertPatternDoesNotExist,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	rollbackWorkspaceMutation,
	type RunAddPatternCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	PATTERN_CATALOG_SCOPE_IDS,
	type PatternCatalogScope,
} from "./pattern-catalog.js";
import {
	appendPhpSnippetBeforeClosingTag,
	insertPhpSnippetBeforeWorkspaceAnchors,
} from "./cli-add-workspace-mutation.js";

type ResolvedPatternCatalogOptions = {
	contentFile: string;
	patternScope: PatternCatalogScope;
	sectionRole?: string;
	tags: string[];
	thumbnailUrl?: string;
	title: string;
};

const PATTERN_TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;

function assertValidPatternRelativePath(
	label: string,
	value: string,
	usage: string,
): string {
	const normalizedPath = value.trim().replace(/\\/gu, "/");
	if (
		normalizedPath.length === 0 ||
		path.isAbsolute(normalizedPath) ||
		normalizedPath.split("/").includes("..") ||
		/[<>:"|?*\u0000-\u001F]/u.test(normalizedPath)
	) {
		throw new Error(
			`${label} must be a safe relative project path. Use \`${usage}\`.`,
		);
	}

	return normalizedPath;
}

function buildPatternConfigEntry(
	patternSlug: string,
	options: ResolvedPatternCatalogOptions,
): string {
	const lines = [
		"\t{",
		`\t\tcontentFile: ${quoteTsString(options.contentFile)},`,
		`\t\tfile: ${quoteTsString(options.contentFile)},`,
		`\t\tscope: ${quoteTsString(options.patternScope)},`,
		...(options.sectionRole
			? [`\t\tsectionRole: ${quoteTsString(options.sectionRole)},`]
			: []),
		`\t\tslug: ${quoteTsString(patternSlug)},`,
		`\t\ttags: [${options.tags.map((tag) => quoteTsString(tag)).join(", ")}],`,
		...(options.thumbnailUrl
			? [`\t\tthumbnailUrl: ${quoteTsString(options.thumbnailUrl)},`]
			: []),
		`\t\ttitle: ${quoteTsString(options.title)},`,
		"\t},",
	];

	return lines.join("\n");
}

function buildPatternSource(
	patternSlug: string,
	namespace: string,
	textDomain: string,
	title: string,
): string {
	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

register_block_pattern(
\t'${namespace}/${patternSlug}',
\tarray(
\t\t'title'       => __( ${JSON.stringify(title)}, '${textDomain}' ),
\t\t'description' => __( ${JSON.stringify(`A starter pattern for ${title}.`)}, '${textDomain}' ),
\t\t'categories'  => array( '${namespace}' ),
\t\t'content'     => '<!-- wp:paragraph --><p>' . esc_html__( 'Describe this pattern here.', '${textDomain}' ) . '</p><!-- /wp:paragraph -->',
\t)
);
`;
}

function resolvePatternScope(scope: string | undefined): PatternCatalogScope {
	if (scope === undefined || scope.trim() === "") {
		return "full";
	}
	const normalizedScope = scope.trim();
	if (
		(PATTERN_CATALOG_SCOPE_IDS as readonly string[]).includes(normalizedScope)
	) {
		return normalizedScope as PatternCatalogScope;
	}
	throw new Error(
		`Pattern scope must be one of: ${PATTERN_CATALOG_SCOPE_IDS.join(", ")}.`,
	);
}

function normalizeOptionalSlug(
	label: string,
	value: string | undefined,
	usage: string,
): string | undefined {
	if (value === undefined || value.trim() === "") {
		return undefined;
	}
	return assertValidGeneratedSlug(label, normalizeBlockSlug(value), usage);
}

function normalizePatternTags(tags: readonly string[] | string | undefined): string[] {
	const rawTags =
		typeof tags === "string"
			? tags.split(",")
			: Array.isArray(tags)
				? [...tags]
				: [];
	const normalizedTags = rawTags
		.map((tag) => normalizeBlockSlug(tag))
		.filter((tag) => tag.length > 0);

	for (const tag of normalizedTags) {
		if (!PATTERN_TAG_PATTERN.test(tag)) {
			throw new Error(
				`Pattern tag "${tag}" must contain only lowercase letters, numbers, and hyphens.`,
			);
		}
	}

	return [...new Set(normalizedTags)].sort();
}

function resolvePatternContentFile(
	patternSlug: string,
	patternScope: PatternCatalogScope,
	contentFile: string | undefined,
): string {
	if (contentFile && contentFile.trim() !== "") {
		return assertValidPatternRelativePath(
			"Pattern content file",
			contentFile,
			"wp-typia add pattern <name> [--scope <full|section>]",
		);
	}

	const scopeDirectory = patternScope === "section" ? "sections" : "full";
	return path.join("src", "patterns", scopeDirectory, `${patternSlug}.php`);
}

function resolvePatternCatalogOptions(
	patternSlug: string,
	options: RunAddPatternCommandOptions,
): ResolvedPatternCatalogOptions {
	const patternScope = resolvePatternScope(options.patternScope);
	const sectionRole = normalizeOptionalSlug(
		"Pattern section role",
		options.sectionRole,
		"wp-typia add pattern <name> --scope section --section-role <role>",
	);
	if (patternScope === "section" && !sectionRole) {
		throw new Error(
			"`wp-typia add pattern --scope section` requires --section-role <role>.",
		);
	}
	if (patternScope !== "section" && sectionRole) {
		throw new Error("`--section-role` requires `--scope section`.");
	}

	const title =
		options.catalogTitle && options.catalogTitle.trim() !== ""
			? options.catalogTitle.trim()
			: toTitleCase(patternSlug);

	return {
		contentFile: resolvePatternContentFile(
			patternSlug,
			patternScope,
			options.contentFile,
		),
		patternScope,
		...(sectionRole ? { sectionRole } : {}),
		tags: normalizePatternTags(options.tags),
		...(options.thumbnailUrl && options.thumbnailUrl.trim() !== ""
			? { thumbnailUrl: options.thumbnailUrl.trim() }
			: {}),
		title,
	};
}

async function ensurePatternBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const patternCategoryFunctionName = `${workspace.workspace.phpPrefix}_register_pattern_category`;
		const patternRegistrationFunctionName = `${workspace.workspace.phpPrefix}_register_patterns`;
		const patternCategoryHook = `add_action( 'init', '${patternCategoryFunctionName}' );`;
		const patternRegistrationHook = `add_action( 'init', '${patternRegistrationFunctionName}', 20 );`;
		const patternFunctions = `

function ${patternCategoryFunctionName}() {
\tif ( function_exists( 'register_block_pattern_category' ) ) {
\t\tregister_block_pattern_category(
\t\t\t'${workspace.workspace.namespace}',
\t\t\tarray(
\t\t\t\t'label' => __( ${JSON.stringify(`${toTitleCase(workspaceBaseName)} Patterns`)}, '${workspace.workspace.textDomain}' ),
\t\t\t)
\t\t);
\t}
}

function ${patternRegistrationFunctionName}() {
\t$pattern_modules = array_merge(
\t\tglob( __DIR__ . '/src/patterns/*.php' ) ?: array(),
\t\tglob( __DIR__ . '/src/patterns/*/*.php' ) ?: array()
\t);
\tforeach ( $pattern_modules as $pattern_module ) {
\t\trequire $pattern_module;
\t}
}
`;

		if (
			!hasPhpFunctionDefinition(nextSource, patternCategoryFunctionName) &&
			!hasPhpFunctionDefinition(nextSource, patternRegistrationFunctionName)
		) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(
				nextSource,
				patternFunctions,
			);
		}

		if (
			!hasPhpFunctionDefinition(nextSource, patternCategoryFunctionName) ||
			!hasPhpFunctionDefinition(nextSource, patternRegistrationFunctionName)
		) {
			throw new Error(
				`Unable to inject pattern bootstrap functions into ${path.basename(bootstrapPath)}.`,
			);
		}

		if (!nextSource.includes(patternCategoryHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(
				nextSource,
				patternCategoryHook,
			);
		}
		if (!nextSource.includes(patternRegistrationHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(
				nextSource,
				patternRegistrationHook,
			);
		}

		return nextSource;
	});
}

/**
 * Add one PHP block pattern shell to an official workspace project.
 *
 * @param options Command options for the pattern scaffold workflow.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.patternName Human-entered pattern name that will be normalized
 * and validated before files are written.
 * @returns A promise that resolves with the normalized `patternSlug` and
 * owning `projectDir` after the pattern file and inventory entry have been
 * written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the pattern slug is invalid, or when a conflicting file or inventory entry
 * already exists.
 */
export async function runAddPatternCommand({
	catalogTitle,
	contentFile,
	cwd = process.cwd(),
	patternName,
	patternScope,
	sectionRole,
	tags,
	thumbnailUrl,
}: RunAddPatternCommandOptions): Promise<{
	contentFile: string;
	patternSlug: string;
	patternScope: PatternCatalogScope;
	projectDir: string;
	sectionRole?: string;
	tags: string[];
	title: string;
	thumbnailUrl?: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const patternSlug = assertValidGeneratedSlug(
		"Pattern name",
		normalizeBlockSlug(patternName),
		"wp-typia add pattern <name>",
	);
	const patternCatalogOptions = resolvePatternCatalogOptions(patternSlug, {
		catalogTitle,
		contentFile,
		cwd,
		patternName,
		patternScope,
		sectionRole,
		tags,
		thumbnailUrl,
	});

	const inventory = await readWorkspaceInventoryAsync(workspace.projectDir);
	assertPatternDoesNotExist(workspace.projectDir, patternSlug, inventory);
	const contentFilePath = path.join(
		workspace.projectDir,
		patternCatalogOptions.contentFile,
	);
	if (await fsp.stat(contentFilePath).then(
		() => true,
		(error) => {
			if ((error as { code?: string }).code === "ENOENT") {
				return false;
			}
			throw error;
		},
	)) {
		throw new Error(
			`A pattern already exists at ${patternCatalogOptions.contentFile}. Choose a different name.`,
		);
	}

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const patternFilePath = contentFilePath;
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([blockConfigPath, bootstrapPath]),
		snapshotDirs: [],
		targetPaths: [patternFilePath],
	};

	try {
		await fsp.mkdir(path.dirname(patternFilePath), { recursive: true });
		await ensurePatternBootstrapAnchors(workspace);
		await fsp.writeFile(
			patternFilePath,
			buildPatternSource(
				patternSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
				patternCatalogOptions.title,
			),
			"utf8",
		);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			patternEntries: [
				buildPatternConfigEntry(patternSlug, patternCatalogOptions),
			],
		});

		return {
			contentFile: patternCatalogOptions.contentFile,
			patternSlug,
			patternScope: patternCatalogOptions.patternScope,
			projectDir: workspace.projectDir,
			...(patternCatalogOptions.sectionRole
				? { sectionRole: patternCatalogOptions.sectionRole }
				: {}),
			tags: patternCatalogOptions.tags,
			title: patternCatalogOptions.title,
			...(patternCatalogOptions.thumbnailUrl
				? { thumbnailUrl: patternCatalogOptions.thumbnailUrl }
				: {}),
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
