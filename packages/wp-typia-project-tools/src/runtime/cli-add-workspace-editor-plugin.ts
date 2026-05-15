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
import { toPascalCase, toTitleCase } from "./string-case.js";
import {
	findPhpFunctionRange,
	hasPhpFunctionDefinition,
	replacePhpFunctionDefinition,
} from "./php-utils.js";
import {
	assertEditorPluginDoesNotExist,
	assertValidEditorPluginSlot,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	rollbackWorkspaceMutation,
	type RunAddEditorPluginCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	appendPhpSnippetBeforeClosingTag,
	insertPhpSnippetBeforeWorkspaceAnchors,
} from "./cli-add-workspace-mutation.js";
import { pathExists, readOptionalUtf8File } from "./fs-async.js";

const EDITOR_PLUGIN_EDITOR_SCRIPT = "build/editor-plugins/index.js";
const EDITOR_PLUGIN_EDITOR_ASSET = "build/editor-plugins/index.asset.php";
const EDITOR_PLUGIN_EDITOR_STYLE = "build/editor-plugins/style-index.css";
const EDITOR_PLUGIN_EDITOR_STYLE_RTL = "build/editor-plugins/style-index-rtl.css";

function buildEditorPluginConfigEntry(
	editorPluginSlug: string,
	slot: string,
): string {
	return [
		"\t{",
		`\t\tfile: ${quoteTsString(`src/editor-plugins/${editorPluginSlug}/index.tsx`)},`,
		`\t\tslug: ${quoteTsString(editorPluginSlug)},`,
		`\t\tslot: ${quoteTsString(slot)},`,
		"\t},",
	].join("\n");
}

function buildEditorPluginTypesSource(editorPluginSlug: string): string {
	const typeName = `${toPascalCase(editorPluginSlug)}EditorPluginModel`;

	return `export interface ${typeName} {
\tprimaryActionLabel: string;
\tsummary: string;
}
`;
}

function buildEditorPluginDataSource(
	editorPluginSlug: string,
	slot: string,
): string {
	const typeName = `${toPascalCase(editorPluginSlug)}EditorPluginModel`;
	const pluginTitle = toTitleCase(editorPluginSlug);
	const modelFactoryName = `get${toPascalCase(editorPluginSlug)}EditorPluginModel`;
	const enabledFactoryName = `is${toPascalCase(editorPluginSlug)}Enabled`;

	return `import type { ${typeName} } from './types';

export const EDITOR_PLUGIN_SLOT = ${quoteTsString(slot)} as const;
export const REQUIRED_CAPABILITY = 'edit_posts' as const;

const DEFAULT_EDITOR_PLUGIN_MODEL: ${typeName} = {
\tprimaryActionLabel: ${quoteTsString(`Review ${pluginTitle}`)},
\tsummary: ${quoteTsString(`Replace this summary with your ${pluginTitle} workflow state.`)},
};

export function ${modelFactoryName}(): ${typeName} {
\treturn DEFAULT_EDITOR_PLUGIN_MODEL;
}

export function ${enabledFactoryName}(): boolean {
\treturn true;
}
`;
}

function buildEditorPluginSurfaceSource(
	editorPluginSlug: string,
	slot: string,
	textDomain: string,
): string {
	const pascalName = toPascalCase(editorPluginSlug);
	const modelFactoryName = `get${pascalName}EditorPluginModel`;
	const enabledFactoryName = `is${pascalName}Enabled`;
	const componentName = `${pascalName}Surface`;

	if (slot === "document-setting-panel") {
		return `import { Button } from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import { ${modelFactoryName}, ${enabledFactoryName} } from './data';
import './style.scss';

export interface ${componentName}Props {
\tsurfaceName: string;
\ttitle: string;
}

export function ${componentName}( {
\tsurfaceName,
\ttitle,
}: ${componentName}Props ) {
\tif ( ! ${enabledFactoryName}() ) {
\t\treturn null;
\t}

\tconst editorPluginModel = ${modelFactoryName}();

\treturn (
\t\t<PluginDocumentSettingPanel
\t\t\tclassName="wp-typia-editor-plugin-shell"
\t\t\tname={ surfaceName }
\t\t\ttitle={ title }
\t\t>
\t\t\t<p>{ editorPluginModel.summary }</p>
\t\t\t<Button variant="secondary">
\t\t\t\t{ editorPluginModel.primaryActionLabel }
\t\t\t</Button>
\t\t\t<p className="wp-typia-editor-plugin-shell__hint">
\t\t\t\t{ __( 'Use data.ts to add post type, capability, or editor context guards before showing this panel.', ${quoteTsString(textDomain)} ) }
\t\t\t</p>
\t\t</PluginDocumentSettingPanel>
\t);
}
`;
	}

	return `import { Button, PanelBody } from '@wordpress/components';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import { ${modelFactoryName}, ${enabledFactoryName} } from './data';
import './style.scss';

export interface ${componentName}Props {
\tsurfaceName: string;
\ttitle: string;
}

export function ${componentName}( {
\tsurfaceName,
\ttitle,
}: ${componentName}Props ) {
\tif ( ! ${enabledFactoryName}() ) {
\t\treturn null;
\t}

\tconst editorPluginModel = ${modelFactoryName}();

\treturn (
\t\t<>
\t\t\t<PluginSidebarMoreMenuItem target={ surfaceName }>
\t\t\t\t{ title }
\t\t\t</PluginSidebarMoreMenuItem>
\t\t\t<PluginSidebar name={ surfaceName } title={ title }>
\t\t\t\t<div className="wp-typia-editor-plugin-shell">
\t\t\t\t\t<PanelBody
\t\t\t\t\t\tinitialOpen
\t\t\t\t\t\ttitle={ __( 'Document workflow', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t>
\t\t\t\t\t\t<p>{ editorPluginModel.summary }</p>
\t\t\t\t\t\t<Button variant="secondary">
\t\t\t\t\t\t\t{ editorPluginModel.primaryActionLabel }
\t\t\t\t\t\t</Button>
\t\t\t\t\t</PanelBody>
\t\t\t\t</div>
\t\t\t</PluginSidebar>
\t\t</>
\t);
}
`;
}

function buildEditorPluginEntrySource(
	editorPluginSlug: string,
	namespace: string,
	textDomain: string,
): string {
	const pascalName = toPascalCase(editorPluginSlug);
	const componentName = `${pascalName}Surface`;
	const pluginName = `${namespace}-${editorPluginSlug}`;
	const surfaceName = `${pluginName}-surface`;
	const pluginTitle = toTitleCase(editorPluginSlug);

	return `import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';

import { REQUIRED_CAPABILITY } from './data';
import { ${componentName} } from './Surface';

const EDITOR_PLUGIN_NAME = ${quoteTsString(pluginName)};
const EDITOR_PLUGIN_SURFACE_NAME = ${quoteTsString(surfaceName)};
const EDITOR_PLUGIN_TITLE = __( ${quoteTsString(pluginTitle)}, ${quoteTsString(textDomain)} );

registerPlugin( EDITOR_PLUGIN_NAME, {
\ticon: 'admin-generic',
\trender: () => (
\t\t<${componentName}
\t\t\tsurfaceName={ EDITOR_PLUGIN_SURFACE_NAME }
\t\t\ttitle={ EDITOR_PLUGIN_TITLE }
\t\t/>
\t),
} );

export { REQUIRED_CAPABILITY };
`;
}

function buildEditorPluginStyleSource(): string {
	return `.wp-typia-editor-plugin-shell {
\tpadding: 16px;
}

.wp-typia-editor-plugin-shell p {
\tmargin: 0 0 12px;
}

.wp-typia-editor-plugin-shell__hint {
\tcolor: #757575;
\tfont-size: 12px;
}
`;
}

function buildEditorPluginRegistrySource(editorPluginSlugs: string[]): string {
	const importLines = editorPluginSlugs
		.map((editorPluginSlug) => `import './${editorPluginSlug}';`)
		.join("\n");

	return `${importLines}${importLines ? "\n\n" : ""}// wp-typia add editor-plugin entries\n`;
}

export async function ensureEditorPluginBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
		const enqueueFunctionName = `${workspace.workspace.phpPrefix}_enqueue_editor_plugins_editor`;
		const enqueueHook = `add_action( 'enqueue_block_editor_assets', '${enqueueFunctionName}' );`;
		const enqueueFunction = `

function ${enqueueFunctionName}() {
\t$script_path = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_SCRIPT}';
\t$asset_path  = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_ASSET}';
\t$style_path  = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_STYLE}';
\t$style_rtl_path = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_STYLE_RTL}';

\tif ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
\t\treturn;
\t}

\t$asset = require $asset_path;
\tif ( ! is_array( $asset ) ) {
\t\t$asset = array();
\t}

\twp_enqueue_script(
\t\t'${workspaceBaseName}-editor-plugins',
\t\tplugins_url( '${EDITOR_PLUGIN_EDITOR_SCRIPT}', __FILE__ ),
\t\tisset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ? $asset['dependencies'] : array(),
\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $script_path ),
\t\ttrue
\t);

\tif ( file_exists( $style_path ) ) {
\t\twp_enqueue_style(
\t\t\t'${workspaceBaseName}-editor-plugins',
\t\t\tplugins_url( '${EDITOR_PLUGIN_EDITOR_STYLE}', __FILE__ ),
\t\t\tarray(),
\t\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $style_path )
\t\t);
\t\tif ( file_exists( $style_rtl_path ) ) {
\t\t\twp_style_add_data( '${workspaceBaseName}-editor-plugins', 'rtl', 'replace' );
\t\t}
\t}
}
`;

		if (!hasPhpFunctionDefinition(nextSource, enqueueFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, enqueueFunction);
		} else {
			const requiredReferences = [
				EDITOR_PLUGIN_EDITOR_SCRIPT,
				EDITOR_PLUGIN_EDITOR_ASSET,
				EDITOR_PLUGIN_EDITOR_STYLE,
				EDITOR_PLUGIN_EDITOR_STYLE_RTL,
				"wp_style_add_data",
			];
			const functionRange = findPhpFunctionRange(nextSource, enqueueFunctionName);
			const functionSource = functionRange
				? nextSource.slice(functionRange.start, functionRange.end)
				: "";
			const missingReferences = requiredReferences.filter(
				(reference) => !functionSource.includes(reference),
			);
			if (missingReferences.length > 0) {
				const replacedSource = replacePhpFunctionDefinition(
					nextSource,
					enqueueFunctionName,
					enqueueFunction,
				);
				if (!replacedSource) {
					throw new Error(
						`Unable to repair ${path.basename(bootstrapPath)} for ${enqueueFunctionName}.`,
					);
				}
				nextSource = replacedSource;
			}
		}

		if (!nextSource.includes(enqueueHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, enqueueHook);
		}

		return nextSource;
	});
}

export async function ensureEditorPluginBuildScriptAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");

	await patchFile(buildScriptPath, (source) => {
		if (/['"]src\/editor-plugins\/index\.(?:ts|js)['"]/u.test(source)) {
			return source;
		}

		const legacySharedEntriesPattern =
			/\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]/u;
		const nextSource = source.replace(
			legacySharedEntriesPattern,
			`[
\t\t'src/bindings/index.ts',
\t\t'src/bindings/index.js',
\t\t'src/editor-plugins/index.ts',
\t\t'src/editor-plugins/index.js',
\t]`,
		);

		if (nextSource === source) {
			throw new Error(
				`Unable to update ${path.relative(workspace.projectDir, buildScriptPath)} for editor plugin shared entries.`,
			);
		}

		return nextSource;
	});
}

export async function ensureEditorPluginWebpackAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");

	await patchFile(webpackConfigPath, (source) => {
		if (/['"]editor-plugins\/index['"]/u.test(source)) {
			return source;
		}

		const legacySharedEntriesBlockPattern =
			/for\s*\(\s*const\s+relativePath\s+of\s+\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]\s*\)\s*\{[\s\S]*?entries\.push\(\s*\[\s*['"]bindings\/index['"]\s*,\s*entryPath\s*\]\s*\);\s*break;\s*\}/u;
		const nextSharedEntriesBlock = [
			"\tfor ( const [ entryName, candidates ] of [",
			"\t\t[",
			"\t\t\t'bindings/index',",
			"\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],",
			"\t\t],",
			"\t\t[",
			"\t\t\t'editor-plugins/index',",
			"\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],",
			"\t\t],",
			"\t] ) {",
			"\t\tfor ( const relativePath of candidates ) {",
			"\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );",
			"\t\t\tif ( ! fs.existsSync( entryPath ) ) {",
			"\t\t\t\tcontinue;",
			"\t\t\t}",
			"",
			"\t\t\tentries.push( [ entryName, entryPath ] );",
			"\t\t\tbreak;",
			"\t\t}",
			"\t}",
		].join("\n");
		const nextSource = source.replace(
			legacySharedEntriesBlockPattern,
			nextSharedEntriesBlock,
		);

		if (nextSource === source) {
			throw new Error(
				`Unable to update ${path.relative(workspace.projectDir, webpackConfigPath)} for editor plugin shared entries.`,
			);
		}

		return nextSource;
	});
}

export async function resolveEditorPluginRegistryPath(projectDir: string): Promise<string> {
	const editorPluginsDir = path.join(projectDir, "src", "editor-plugins");
	for (const candidatePath of [
		path.join(editorPluginsDir, "index.ts"),
		path.join(editorPluginsDir, "index.js"),
	]) {
		if (await pathExists(candidatePath)) {
			return candidatePath;
		}
	}
	return path.join(editorPluginsDir, "index.ts");
}

async function readEditorPluginRegistrySlugs(
	registryPath: string,
): Promise<string[]> {
	const source = await readOptionalUtf8File(registryPath);
	if (source === null) {
		return [];
	}

	return Array.from(
		source.matchAll(
			/^\s*import\s+['"]\.\/([^/'"]+)(?:\/index(?:\.[cm]?[jt]sx?)?)?['"];?\s*$/gmu,
		),
	).map((match) => match[1]);
}

export async function writeEditorPluginRegistry(
	projectDir: string,
	editorPluginSlug: string,
): Promise<void> {
	const editorPluginsDir = path.join(projectDir, "src", "editor-plugins");
	const registryPath = await resolveEditorPluginRegistryPath(projectDir);
	await fsp.mkdir(editorPluginsDir, { recursive: true });

	const existingEditorPluginSlugs = (
		await readWorkspaceInventoryAsync(projectDir)
	).editorPlugins.map((entry) => entry.slug);
	const existingRegistrySlugs = await readEditorPluginRegistrySlugs(registryPath);
	const nextEditorPluginSlugs = Array.from(
		new Set([...existingEditorPluginSlugs, ...existingRegistrySlugs, editorPluginSlug]),
	).sort();
	await fsp.writeFile(
		registryPath,
		buildEditorPluginRegistrySource(nextEditorPluginSlugs),
		"utf8",
	);
}

/**
 * Add one document-level editor plugin scaffold to an official workspace project.
 *
 * @param options Command options for the editor-plugin scaffold workflow.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.editorPluginName Human-entered editor-plugin name that will be
 * normalized and validated before files are written.
 * @param options.slot Optional editor plugin shell slot. Defaults to `sidebar`.
 * @returns A promise that resolves with the normalized `editorPluginSlug`, chosen
 * `slot`, and owning `projectDir` after the scaffold files and inventory entry
 * are written successfully.
 * @throws {Error} When the command is run outside an official workspace, when the
 * slug or slot is invalid, or when a conflicting file or inventory entry exists.
 */
export async function runAddEditorPluginCommand({
	cwd = process.cwd(),
	editorPluginName,
	slot,
}: RunAddEditorPluginCommandOptions): Promise<{
	editorPluginSlug: string;
	projectDir: string;
	slot: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const editorPluginSlug = assertValidGeneratedSlug(
		"Editor plugin name",
		normalizeBlockSlug(editorPluginName),
		"wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>]",
	);
	const resolvedSlot = assertValidEditorPluginSlot(slot);

	const inventory = await readWorkspaceInventoryAsync(workspace.projectDir);
	assertEditorPluginDoesNotExist(workspace.projectDir, editorPluginSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");
	const editorPluginsIndexPath = await resolveEditorPluginRegistryPath(
		workspace.projectDir,
	);
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");
	const editorPluginDir = path.join(
		workspace.projectDir,
		"src",
		"editor-plugins",
		editorPluginSlug,
	);
	const entryFilePath = path.join(editorPluginDir, "index.tsx");
	const surfaceFilePath = path.join(editorPluginDir, "Surface.tsx");
	const dataFilePath = path.join(editorPluginDir, "data.ts");
	const typesFilePath = path.join(editorPluginDir, "types.ts");
	const styleFilePath = path.join(editorPluginDir, "style.scss");
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			bootstrapPath,
			buildScriptPath,
			editorPluginsIndexPath,
			webpackConfigPath,
		]),
		snapshotDirs: [],
		targetPaths: [editorPluginDir],
	};

	try {
		await fsp.mkdir(editorPluginDir, { recursive: true });
		await ensureEditorPluginBootstrapAnchors(workspace);
		await ensureEditorPluginBuildScriptAnchors(workspace);
		await ensureEditorPluginWebpackAnchors(workspace);
		await fsp.writeFile(
			entryFilePath,
			buildEditorPluginEntrySource(
				editorPluginSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await fsp.writeFile(
			surfaceFilePath,
			buildEditorPluginSurfaceSource(
				editorPluginSlug,
				resolvedSlot,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await fsp.writeFile(
			dataFilePath,
			buildEditorPluginDataSource(editorPluginSlug, resolvedSlot),
			"utf8",
		);
		await fsp.writeFile(
			typesFilePath,
			buildEditorPluginTypesSource(editorPluginSlug),
			"utf8",
		);
		await fsp.writeFile(styleFilePath, buildEditorPluginStyleSource(), "utf8");
		await writeEditorPluginRegistry(workspace.projectDir, editorPluginSlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			editorPluginEntries: [
				buildEditorPluginConfigEntry(editorPluginSlug, resolvedSlot),
			],
		});

		return {
			editorPluginSlug,
			projectDir: workspace.projectDir,
			slot: resolvedSlot,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
