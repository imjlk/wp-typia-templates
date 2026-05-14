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

const PATTERN_BOOTSTRAP_CATEGORY = "register_block_pattern_category";

function buildPatternConfigEntry(patternSlug: string): string {
	return [
		"\t{",
		`\t\tfile: ${quoteTsString(`src/patterns/${patternSlug}.php`)},`,
		`\t\tslug: ${quoteTsString(patternSlug)},`,
		"\t},",
	].join("\n");
}

function buildPatternSource(
	patternSlug: string,
	namespace: string,
	textDomain: string,
): string {
	const patternTitle = toTitleCase(patternSlug);

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

register_block_pattern(
\t'${namespace}/${patternSlug}',
\tarray(
\t\t'title'       => __( ${JSON.stringify(patternTitle)}, '${textDomain}' ),
\t\t'description' => __( ${JSON.stringify(`A starter pattern for ${patternTitle}.`)}, '${textDomain}' ),
\t\t'categories'  => array( '${namespace}' ),
\t\t'content'     => '<!-- wp:paragraph --><p>' . esc_html__( 'Describe this pattern here.', '${textDomain}' ) . '</p><!-- /wp:paragraph -->',
\t)
);
`;
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
\tforeach ( glob( __DIR__ . '/src/patterns/*.php' ) ?: array() as $pattern_module ) {
\t\trequire $pattern_module;
\t}
}
`;

		if (!nextSource.includes(PATTERN_BOOTSTRAP_CATEGORY)) {
			const insertionAnchors = [
				/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
				/\?>\s*$/u,
			];
			let inserted = false;

			for (const anchor of insertionAnchors) {
				const candidate = nextSource.replace(anchor, (match) => `${patternFunctions}\n${match}`);
				if (candidate !== nextSource) {
					nextSource = candidate;
					inserted = true;
					break;
				}
			}

			if (!inserted) {
				nextSource = `${nextSource.trimEnd()}\n${patternFunctions}\n`;
			}
		}

		if (
			!nextSource.includes(patternCategoryFunctionName) ||
			!nextSource.includes(patternRegistrationFunctionName)
		) {
			throw new Error(
				`Unable to inject pattern bootstrap functions into ${path.basename(bootstrapPath)}.`,
			);
		}

		if (!nextSource.includes(patternCategoryHook)) {
			nextSource = `${nextSource.trimEnd()}\n${patternCategoryHook}\n`;
		}
		if (!nextSource.includes(patternRegistrationHook)) {
			nextSource = `${nextSource.trimEnd()}\n${patternRegistrationHook}\n`;
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
	cwd = process.cwd(),
	patternName,
}: RunAddPatternCommandOptions): Promise<{
	patternSlug: string;
	projectDir: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const patternSlug = assertValidGeneratedSlug(
		"Pattern name",
		normalizeBlockSlug(patternName),
		"wp-typia add pattern <name>",
	);

	const inventory = await readWorkspaceInventoryAsync(workspace.projectDir);
	assertPatternDoesNotExist(workspace.projectDir, patternSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const patternFilePath = path.join(
		workspace.projectDir,
		"src",
		"patterns",
		`${patternSlug}.php`,
	);
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
			),
			"utf8",
		);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			patternEntries: [buildPatternConfigEntry(patternSlug)],
		});

		return {
			patternSlug,
			projectDir: workspace.projectDir,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
