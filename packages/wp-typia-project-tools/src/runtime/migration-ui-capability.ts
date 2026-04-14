import { promises as fsp } from "node:fs";
import path from "node:path";

import { getPackageVersions } from "./package-versions.js";
import { formatPackageExecCommand } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import { seedProjectMigrations } from "./migrations.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import {
	SHARED_MIGRATION_UI_TEMPLATE_ROOT,
} from "./template-registry.js";
import type { MigrationBlockConfig } from "./migration-types.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";

interface PackageJsonShape {
	dependencies?: Record<string, string>;
	scripts?: Record<string, string>;
}

interface ApplyMigrationUiCapabilityOptions {
	packageManager: PackageManagerId;
	projectDir: string;
	templateId: string;
	variables: ScaffoldTemplateVariables;
}

const INITIAL_MIGRATION_VERSION = "v1";
const BLOCK_METADATA_IMPORT_LINE = "import metadata from './block-metadata';";

async function mutatePackageJson(
	projectDir: string,
	mutate: (packageJson: PackageJsonShape) => void,
): Promise<void> {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8")) as PackageJsonShape;
	mutate(packageJson);
	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");
}

async function patchFile(
	filePath: string,
	transform: (source: string) => string,
): Promise<void> {
	const source = await fsp.readFile(filePath, "utf8");
	const nextSource = transform(source);
	if (nextSource === source) {
		throw new Error(`Unable to apply migration UI patch for ${filePath}`);
	}
	await fsp.writeFile(filePath, nextSource, "utf8");
}

function injectAfter(source: string, needle: string, insertion: string): string {
	if (source.includes(insertion)) {
		return source;
	}
	if (!source.includes(needle)) {
		return source;
	}
	return source.replace(needle, `${needle}\n${insertion}`);
}

function injectBefore(source: string, needle: string, insertion: string): string {
	if (source.includes(insertion)) {
		return source;
	}
	if (!source.includes(needle)) {
		return source;
	}
	return source.replace(needle, `${insertion}\n${needle}`);
}

function buildMigrationBlocks(
	templateId: string,
	variables: ScaffoldTemplateVariables,
): MigrationBlockConfig[] {
	if (templateId === "compound") {
		return [
			{
				blockJsonFile: `src/blocks/${variables.slugKebabCase}/block.json`,
				blockName: `${variables.namespace}/${variables.slugKebabCase}`,
				key: variables.slugKebabCase,
				manifestFile: `src/blocks/${variables.slugKebabCase}/typia.manifest.json`,
				saveFile: `src/blocks/${variables.slugKebabCase}/save.tsx`,
				typesFile: `src/blocks/${variables.slugKebabCase}/types.ts`,
			},
			{
				blockJsonFile: `src/blocks/${variables.slugKebabCase}-item/block.json`,
				blockName: `${variables.namespace}/${variables.slugKebabCase}-item`,
				key: `${variables.slugKebabCase}-item`,
				manifestFile: `src/blocks/${variables.slugKebabCase}-item/typia.manifest.json`,
				saveFile: `src/blocks/${variables.slugKebabCase}-item/save.tsx`,
				typesFile: `src/blocks/${variables.slugKebabCase}-item/types.ts`,
			},
		];
	}

	return [
		{
			blockJsonFile: "src/block.json",
			blockName: `${variables.namespace}/${variables.slugKebabCase}`,
			key: variables.slugKebabCase,
			manifestFile: "src/typia.manifest.json",
			saveFile: "src/save.tsx",
			typesFile: "src/types.ts",
		},
	];
}

async function applySingleBlockPatches(
	projectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const editPath = path.join(projectDir, "src", "edit.tsx");
	const indexPath = path.join(projectDir, "src", "index.tsx");
	const deprecatedImport = `import { deprecated } from './migrations/generated/${variables.slugKebabCase}/deprecated';`;
	const deprecatedLine = "  deprecated,";
	const dashboardImport = `import { MigrationDashboard } from './admin/migration-dashboard';`;
	const migrationPanel = `\n        <PanelBody title={__('Migration Manager', '${variables.textDomain}')}>\n          <MigrationDashboard />\n        </PanelBody>\n      </InspectorControls>`;

	await patchFile(indexPath, (source) => {
		let nextSource = injectAfter(source, BLOCK_METADATA_IMPORT_LINE, deprecatedImport);
		nextSource = injectBefore(nextSource, "  edit: Edit,", deprecatedLine);
		return nextSource;
	});

	await patchFile(editPath, (source) => {
		let nextSource = injectAfter(source, "import { useTypiaValidation } from './hooks';", dashboardImport);
		nextSource = nextSource.replace("</InspectorControls>", migrationPanel);
		return nextSource;
	});
}

async function applyCompoundPatches(
	projectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const parentEditPath = path.join(projectDir, "src", "blocks", variables.slugKebabCase, "edit.tsx");
	const parentIndexPath = path.join(projectDir, "src", "blocks", variables.slugKebabCase, "index.tsx");
	const childIndexPath = path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`, "index.tsx");
	const addChildScriptPath = path.join(projectDir, "scripts", "add-compound-child.ts");

	await patchFile(parentIndexPath, (source) => {
		let nextSource = injectAfter(
			source,
			BLOCK_METADATA_IMPORT_LINE,
			`import { deprecated } from '../../migrations/generated/${variables.slugKebabCase}/deprecated';`,
		);
		nextSource = injectBefore(
			nextSource,
			"\tedit: Edit,",
			"\tdeprecated,",
		);
		return nextSource;
	});

	await patchFile(childIndexPath, (source) => {
		let nextSource = injectAfter(
			source,
			BLOCK_METADATA_IMPORT_LINE,
			`import { deprecated } from '../../migrations/generated/${variables.slugKebabCase}-item/deprecated';`,
		);
		nextSource = injectBefore(
			nextSource,
			"\tedit: Edit,",
			"\tdeprecated,",
		);
		return nextSource;
	});

	await patchFile(parentEditPath, (source) => {
		let nextSource = injectAfter(
			source,
			"import { useTypiaValidation } from './hooks';",
			`import { MigrationDashboard } from '../../admin/migration-dashboard';`,
		);
		nextSource = nextSource.replace(
			"</InspectorControls>",
			`\n\t\t\t\t<PanelBody title={ __( 'Migration Manager', '${variables.textDomain}' ) }>\n\t\t\t\t\t<MigrationDashboard />\n\t\t\t\t</PanelBody>\n\t\t\t</InspectorControls>`,
		);
		return nextSource;
	});

	await patchFile(addChildScriptPath, (source) => {
		let nextSource = injectAfter(
			source,
			"const PROJECT_ROOT = process.cwd();",
			"const MIGRATION_CONFIG_FILE = path.join( PROJECT_ROOT, 'src', 'migrations', 'config.ts' );",
		);
		nextSource = nextSource.replace(
			"import metadata from './block-metadata';\nimport '${ PARENT_STYLE_IMPORT }';",
			"import metadata from './block-metadata';\nimport { deprecated } from '../../migrations/generated/${ childFolderSlug }/deprecated';\nimport '${ PARENT_STYLE_IMPORT }';",
		);
		nextSource = nextSource.replace(
			"\tedit: Edit,\n\tsave: Save,",
			"\tdeprecated,\n\tedit: Edit,\n\tsave: Save,",
		);
		nextSource = injectAfter(
			nextSource,
			"function insertBeforeMarker( filePath: string, marker: string, insertionLines: string[] ) {",
			"",
		);
		if ( ! nextSource.includes( "function appendMigrationBlockConfig" ) ) {
			const appendMigrationHelper = [
				"function appendMigrationBlockConfig( filePath: string, childBlockName: string, childFolderSlug: string ) {",
				"\tif ( ! fs.existsSync( filePath ) ) {",
				"\t\treturn;",
				"\t}",
				"",
				"\tconst source = fs.readFileSync( filePath, 'utf8' );",
				"\tconst blockEntry = [",
				"\t\t`\\t\\t{`,",
				"\t\t`\\t\\t\\tkey: '${ childFolderSlug }',`,",
				"\t\t`\\t\\t\\tblockName: '${ childBlockName }',`,",
				"\t\t`\\t\\t\\tblockJsonFile: 'src/blocks/${ childFolderSlug }/block.json',`,",
				"\t\t`\\t\\t\\tmanifestFile: 'src/blocks/${ childFolderSlug }/typia.manifest.json',`,",
				"\t\t`\\t\\t\\tsaveFile: 'src/blocks/${ childFolderSlug }/save.tsx',`,",
				"\t\t`\\t\\t\\ttypesFile: 'src/blocks/${ childFolderSlug }/types.ts',`,",
				"\t\t`\\t\\t},`,",
				"\t].join( '\\n' );",
				"\tif ( source.includes( `key: '${ childFolderSlug }'` ) ) {",
				"\t\treturn;",
				"\t}",
				"\tconst nextSource = source.replace( /\\tblocks:\\s*\\[([\\s\\S]*?)\\n\\t\\],/m, ( match ) => {",
				"\t\treturn match.replace( /\\n\\t\\],$/, `\\n${ blockEntry }\\n\\t],` );",
				"\t} );",
				"\tfs.writeFileSync( filePath, nextSource, 'utf8' );",
				"}",
				"",
				"function renderBlockJson(",
			].join( "\n" );
			nextSource = nextSource.replace(
				"function renderBlockJson(",
				appendMigrationHelper,
			);
		}
		nextSource = nextSource.replace(
			"console.log( `✅ Added compound child block ${ childBlockName }` );",
			"appendMigrationBlockConfig( MIGRATION_CONFIG_FILE, childBlockName, childFolderSlug );\n\n\tconsole.log( `✅ Added compound child block ${ childBlockName }` );",
		);
		return nextSource;
	});
}

/**
 * Layer the migration dashboard capability onto a freshly scaffolded project.
 *
 * This copies the shared migration UI files, wires template-specific editor
 * hooks, and injects pinned migration scripts that shell out to the matching
 * `wp-typia` CLI version.
 */
export async function applyMigrationUiCapability({
	packageManager,
	projectDir,
	templateId,
	variables,
}: ApplyMigrationUiCapabilityOptions): Promise<void> {
	const commonTemplateDir = path.join(
		SHARED_MIGRATION_UI_TEMPLATE_ROOT,
		"common",
	);
	await copyInterpolatedDirectory(commonTemplateDir, projectDir, variables);

	await mutatePackageJson(projectDir, (packageJson) => {
		const wpTypiaPackageVersion = getPackageVersions().wpTypiaPackageVersion;
		const canonicalCliSpecifier =
			wpTypiaPackageVersion === "^0.0.0"
				? "wp-typia"
				: `wp-typia@${wpTypiaPackageVersion.replace(/^[~^]/u, "")}`;
		const migrationCli = (args: string) =>
			formatPackageExecCommand(packageManager, canonicalCliSpecifier, `migrate ${args}`);
		packageJson.dependencies = {
			...(packageJson.dependencies ?? {}),
			"@wordpress/api-fetch": "^7.42.0",
		};
		packageJson.scripts = {
			...(packageJson.scripts ?? {}),
			"migration:init": migrationCli(`init --current-migration-version ${INITIAL_MIGRATION_VERSION}`),
			"migration:snapshot": migrationCli("snapshot"),
			"migration:diff": migrationCli("diff"),
			"migration:scaffold": migrationCli("scaffold"),
			"migration:doctor": migrationCli("doctor --all"),
			"migration:fixtures": migrationCli("fixtures --all"),
			"migration:verify": migrationCli("verify --all"),
			"migration:fuzz": migrationCli("fuzz --all"),
		};
	});

	if (templateId === "compound") {
		await applyCompoundPatches(projectDir, variables);
	} else {
		await applySingleBlockPatches(projectDir, variables);
	}

	await seedProjectMigrations(projectDir, INITIAL_MIGRATION_VERSION, buildMigrationBlocks(templateId, variables));
}
