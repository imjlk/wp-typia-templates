import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';

import type { WorkspaceProject } from './workspace-project.js';
import {
  appendWorkspaceInventoryEntries,
  readWorkspaceInventory,
} from './workspace-inventory.js';
import {
  buildAdminViewConfigEntry,
  buildAdminViewConfigSource,
  buildAdminViewEntrySource,
  buildAdminViewPhpSource,
  buildAdminViewRegistrySource,
  buildAdminViewScreenSource,
  buildAdminViewStyleSource,
  buildAdminViewTypesSource,
  buildCoreDataAdminViewDataSource,
  buildCoreDataAdminViewScreenSource,
  buildDefaultAdminViewDataSource,
  buildRestAdminViewDataSource,
} from './cli-add-workspace-admin-view-templates.js';
import {
  ADMIN_VIEWS_PHP_GLOB,
  isAdminViewCoreDataSource,
  type AdminViewCoreDataSource,
  type AdminViewRestResource,
  type AdminViewSource,
} from './cli-add-workspace-admin-view-types.js';
import {
  getWorkspaceBootstrapPath,
  patchFile,
} from './cli-add-shared.js';
import {
  appendPhpSnippetBeforeClosingTag,
  executeWorkspaceMutationPlan,
  insertPhpSnippetBeforeWorkspaceAnchors,
} from './cli-add-workspace-mutation.js';
import {
  DEFAULT_WORDPRESS_CORE_DATA_VERSION,
  DEFAULT_WORDPRESS_DATA_VERSION,
  DEFAULT_WORDPRESS_DATAVIEWS_VERSION,
  DEFAULT_WP_TYPIA_DATAVIEWS_VERSION,
  resolveManagedPackageVersionRange,
} from './package-versions.js';
import {
  findPhpFunctionRange,
  hasPhpFunctionDefinition,
  replacePhpFunctionDefinition,
} from './php-utils.js';

function detectJsonIndent(source: string): string | number {
  const indentMatch = /\n([ \t]+)"/u.exec(source);
  return indentMatch?.[1] ?? 2;
}

async function ensureAdminViewPackageDependencies(
  workspace: WorkspaceProject,
  adminViewSource: AdminViewSource | undefined,
): Promise<void> {
  const packageJsonPath = path.join(workspace.projectDir, 'package.json');
  const wpTypiaDataViewsVersion = resolveManagedPackageVersionRange({
    fallback: DEFAULT_WP_TYPIA_DATAVIEWS_VERSION,
    packageName: '@wp-typia/dataviews',
    workspacePackageDirName: 'wp-typia-dataviews',
  });
  const wordpressDataViewsVersion = resolveManagedPackageVersionRange({
    fallback: DEFAULT_WORDPRESS_DATAVIEWS_VERSION,
    packageName: '@wordpress/dataviews',
  });
  const wordpressCoreDataVersion = resolveManagedPackageVersionRange({
    fallback: DEFAULT_WORDPRESS_CORE_DATA_VERSION,
    packageName: '@wordpress/core-data',
  });
  const wordpressDataVersion = resolveManagedPackageVersionRange({
    fallback: DEFAULT_WORDPRESS_DATA_VERSION,
    packageName: '@wordpress/data',
  });

  await patchFile(packageJsonPath, (source) => {
    const packageJson = JSON.parse(source) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const coreDataDependencies: Record<string, string> =
      isAdminViewCoreDataSource(adminViewSource)
        ? {
            '@wordpress/core-data':
              packageJson.dependencies?.['@wordpress/core-data'] ??
              wordpressCoreDataVersion,
            '@wordpress/data':
              packageJson.dependencies?.['@wordpress/data'] ??
              wordpressDataVersion,
          }
        : {};
    const nextDependencies = {
      ...(packageJson.dependencies ?? {}),
      '@wordpress/dataviews':
        packageJson.dependencies?.['@wordpress/dataviews'] ??
        wordpressDataViewsVersion,
      ...coreDataDependencies,
    };
    const nextDevDependencies = {
      ...(packageJson.devDependencies ?? {}),
      '@wp-typia/dataviews':
        packageJson.devDependencies?.['@wp-typia/dataviews'] ??
        wpTypiaDataViewsVersion,
    };
    if (
      JSON.stringify(nextDependencies) ===
        JSON.stringify(packageJson.dependencies ?? {}) &&
      JSON.stringify(nextDevDependencies) ===
        JSON.stringify(packageJson.devDependencies ?? {})
    ) {
      return source;
    }

    packageJson.dependencies = nextDependencies;
    packageJson.devDependencies = nextDevDependencies;
    return `${JSON.stringify(packageJson, null, detectJsonIndent(source))}\n`;
  });
}

async function ensureAdminViewBootstrapAnchors(
  workspace: WorkspaceProject,
): Promise<void> {
  const bootstrapPath = getWorkspaceBootstrapPath(workspace);

  await patchFile(bootstrapPath, (source) => {
    let nextSource = source;
    const loadFunctionName = `${workspace.workspace.phpPrefix}_load_admin_views`;
    const loadHook = `add_action( 'plugins_loaded', '${loadFunctionName}' );`;
    const loadHookPattern = new RegExp(
      `add_action\\(\\s*['"]plugins_loaded['"]\\s*,\\s*['"]${loadFunctionName}['"]\\s*\\)\\s*;`,
      'u',
    );
    const loadFunction = `

function ${loadFunctionName}() {
\tforeach ( glob( __DIR__ . '${ADMIN_VIEWS_PHP_GLOB}' ) ?: array() as $admin_view_module ) {
\t\trequire_once $admin_view_module;
\t}
}
`;
    if (!hasPhpFunctionDefinition(nextSource, loadFunctionName)) {
      nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, loadFunction);
    } else {
      const functionRange = findPhpFunctionRange(nextSource, loadFunctionName);
      const functionSource = functionRange
        ? nextSource.slice(functionRange.start, functionRange.end)
        : '';
      if (!functionSource.includes(ADMIN_VIEWS_PHP_GLOB)) {
        const replacedSource = replacePhpFunctionDefinition(
          nextSource,
          loadFunctionName,
          loadFunction,
        );
        if (!replacedSource) {
          throw new Error(
            `Unable to repair ${path.basename(bootstrapPath)} for ${loadFunctionName}.`,
          );
        }
        nextSource = replacedSource;
      }
    }

    if (!loadHookPattern.test(nextSource)) {
      nextSource = appendPhpSnippetBeforeClosingTag(nextSource, loadHook);
    }

    return nextSource;
  });
}

async function ensureAdminViewBuildScriptAnchors(
  workspace: WorkspaceProject,
): Promise<void> {
  const buildScriptPath = path.join(
    workspace.projectDir,
    'scripts',
    'build-workspace.mjs',
  );

  await patchFile(buildScriptPath, (source) => {
    if (/['"]src\/admin-views\/index\.(?:ts|js)['"]/u.test(source)) {
      return source;
    }

    const currentSharedEntriesPattern =
      /(\r?\n\s*['"]src\/editor-plugins\/index\.js['"])\s*,?/u;
    let nextSource = source.replace(
      currentSharedEntriesPattern,
      `$1,
\t\t'src/admin-views/index.ts',
\t\t'src/admin-views/index.js',`,
    );
    if (nextSource !== source) {
      return nextSource;
    }

    const legacySharedEntriesPattern =
      /\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]/u;
    nextSource = source.replace(
      legacySharedEntriesPattern,
      `[
\t\t'src/bindings/index.ts',
\t\t'src/bindings/index.js',
\t\t'src/editor-plugins/index.ts',
\t\t'src/editor-plugins/index.js',
\t\t'src/admin-views/index.ts',
\t\t'src/admin-views/index.js',
\t]`,
    );
    if (nextSource !== source) {
      return nextSource;
    }

    throw new Error(
      `Unable to update ${path.relative(workspace.projectDir, buildScriptPath)} for admin view shared entries.`,
    );
  });
}

async function ensureAdminViewWebpackAnchors(
  workspace: WorkspaceProject,
): Promise<void> {
  const webpackConfigPath = path.join(
    workspace.projectDir,
    'webpack.config.js',
  );

  await patchFile(webpackConfigPath, (source) => {
    if (/['"]admin-views\/index['"]/u.test(source)) {
      return source;
    }

    const editorPluginEntryPattern =
      /(\n\s*\[\s*['"]editor-plugins\/index['"][\s\S]*?['"]src\/editor-plugins\/index\.js['"][\s\S]*?\]\s*\])\s*,?/u;
    let nextSource = source.replace(
      editorPluginEntryPattern,
      `$1,
\t\t[
\t\t\t'admin-views/index',
\t\t\t[ 'src/admin-views/index.ts', 'src/admin-views/index.js' ],
\t\t],`,
    );
    if (nextSource !== source) {
      return nextSource;
    }

    const legacySharedEntriesBlockPattern =
      /for\s*\(\s*const\s+relativePath\s+of\s+\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]\s*\)\s*\{[\s\S]*?entries\.push\(\s*\[\s*['"]bindings\/index['"]\s*,\s*entryPath\s*\]\s*\);\s*break;\s*\}/u;
    const nextSharedEntriesBlock = `\tfor ( const [ entryName, candidates ] of [\n\t\t[\n\t\t\t'bindings/index',\n\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'editor-plugins/index',\n\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'admin-views/index',\n\t\t\t[ 'src/admin-views/index.ts', 'src/admin-views/index.js' ],\n\t\t],\n\t] ) {\n\t\tfor ( const relativePath of candidates ) {\n\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\t\tcontinue;\n\t\t\t}\n\n\t\t\tentries.push( [ entryName, entryPath ] );\n\t\t\tbreak;\n\t\t}\n\t}`;
    nextSource = source.replace(
      legacySharedEntriesBlockPattern,
      nextSharedEntriesBlock,
    );
    if (nextSource === source) {
      throw new Error(
        `Unable to update ${path.relative(workspace.projectDir, webpackConfigPath)} for admin view shared entries.`,
      );
    }

    return nextSource;
  });
}

function resolveAdminViewRegistryPath(projectDir: string): string {
  const adminViewsDir = path.join(projectDir, 'src', 'admin-views');
  return (
    [
      path.join(adminViewsDir, 'index.ts'),
      path.join(adminViewsDir, 'index.js'),
    ].find((candidatePath) => fs.existsSync(candidatePath)) ??
    path.join(adminViewsDir, 'index.ts')
  );
}

function readAdminViewRegistrySlugs(registryPath: string): string[] {
  if (!fs.existsSync(registryPath)) {
    return [];
  }

  const source = fs.readFileSync(registryPath, 'utf8');
  return Array.from(
    source.matchAll(
      /^\s*import\s+['"]\.\/([^/'"]+)(?:\/index(?:\.[cm]?[jt]sx?)?)?['"];?\s*$/gmu,
    ),
  ).map((match) => match[1]);
}

async function writeAdminViewRegistry(
  projectDir: string,
  adminViewSlug: string,
): Promise<void> {
  const adminViewsDir = path.join(projectDir, 'src', 'admin-views');
  const registryPath = resolveAdminViewRegistryPath(projectDir);
  await fsp.mkdir(adminViewsDir, { recursive: true });

  const existingAdminViewSlugs = readWorkspaceInventory(
    projectDir,
  ).adminViews.map((entry) => entry.slug);
  const existingRegistrySlugs = readAdminViewRegistrySlugs(registryPath);
  const nextAdminViewSlugs = Array.from(
    new Set([
      ...existingAdminViewSlugs,
      ...existingRegistrySlugs,
      adminViewSlug,
    ]),
  ).sort();
  await fsp.writeFile(
    registryPath,
    buildAdminViewRegistrySource(nextAdminViewSlugs),
    'utf8',
  );
}

export async function scaffoldAdminViewWorkspace(options: {
  adminViewSlug: string;
  coreDataSource?: AdminViewCoreDataSource;
  parsedSource?: AdminViewSource;
  restResource?: AdminViewRestResource;
  workspace: WorkspaceProject;
}): Promise<void> {
  const {
    adminViewSlug,
    coreDataSource,
    parsedSource,
    restResource,
    workspace,
  } = options;
  const blockConfigPath = path.join(
    workspace.projectDir,
    'scripts',
    'block-config.ts',
  );
  const bootstrapPath = getWorkspaceBootstrapPath(workspace);
  const buildScriptPath = path.join(
    workspace.projectDir,
    'scripts',
    'build-workspace.mjs',
  );
  const packageJsonPath = path.join(workspace.projectDir, 'package.json');
  const webpackConfigPath = path.join(
    workspace.projectDir,
    'webpack.config.js',
  );
  const adminViewsIndexPath = resolveAdminViewRegistryPath(
    workspace.projectDir,
  );
  const adminViewDir = path.join(
    workspace.projectDir,
    'src',
    'admin-views',
    adminViewSlug,
  );
  const adminViewPhpPath = path.join(
    workspace.projectDir,
    'inc',
    'admin-views',
    `${adminViewSlug}.php`,
  );
  await executeWorkspaceMutationPlan({
    filePaths: [
      adminViewsIndexPath,
      blockConfigPath,
      bootstrapPath,
      buildScriptPath,
      packageJsonPath,
      webpackConfigPath,
    ],
    targetPaths: [adminViewDir, adminViewPhpPath],
    run: async () => {
      await fsp.mkdir(adminViewDir, { recursive: true });
      await fsp.mkdir(path.dirname(adminViewPhpPath), { recursive: true });
      await ensureAdminViewPackageDependencies(workspace, parsedSource);
      await ensureAdminViewBootstrapAnchors(workspace);
      await ensureAdminViewBuildScriptAnchors(workspace);
      await ensureAdminViewWebpackAnchors(workspace);
      await fsp.writeFile(
        path.join(adminViewDir, 'types.ts'),
        buildAdminViewTypesSource(adminViewSlug, restResource, coreDataSource),
        'utf8',
      );
      await fsp.writeFile(
        path.join(adminViewDir, 'config.ts'),
        buildAdminViewConfigSource(
          adminViewSlug,
          workspace.workspace.textDomain,
          parsedSource,
          restResource,
        ),
        'utf8',
      );
      await fsp.writeFile(
        path.join(adminViewDir, 'data.ts'),
        coreDataSource
          ? buildCoreDataAdminViewDataSource(adminViewSlug, coreDataSource)
          : restResource
            ? buildRestAdminViewDataSource(adminViewSlug, restResource)
            : buildDefaultAdminViewDataSource(adminViewSlug),
        'utf8',
      );
      await fsp.writeFile(
        path.join(adminViewDir, 'Screen.tsx'),
        coreDataSource
          ? buildCoreDataAdminViewScreenSource(
              adminViewSlug,
              workspace.workspace.textDomain,
            )
          : buildAdminViewScreenSource(
              adminViewSlug,
              workspace.workspace.textDomain,
            ),
        'utf8',
      );
      await fsp.writeFile(
        path.join(adminViewDir, 'index.tsx'),
        buildAdminViewEntrySource(adminViewSlug),
        'utf8',
      );
      await fsp.writeFile(
        path.join(adminViewDir, 'style.scss'),
        buildAdminViewStyleSource(),
        'utf8',
      );
      await fsp.writeFile(
        adminViewPhpPath,
        buildAdminViewPhpSource(adminViewSlug, workspace),
        'utf8',
      );
      await writeAdminViewRegistry(workspace.projectDir, adminViewSlug);
      await appendWorkspaceInventoryEntries(workspace.projectDir, {
        adminViewEntries: [
          buildAdminViewConfigEntry(adminViewSlug, parsedSource),
        ],
      });
    },
  });
}
