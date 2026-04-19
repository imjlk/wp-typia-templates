import {
  PACKAGE_MANAGER_IDS,
  getPackageManager,
} from './package-managers.js';
import type { PackageManagerId } from './package-managers.js';
import {
  normalizeBlockSlug,
  resolveScaffoldIdentifiers,
  validateBlockSlug,
  validateNamespace,
} from './scaffold-identifiers.js';
import {
  OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
  TEMPLATE_IDS,
  getTemplateById,
  isBuiltInTemplateId,
} from './template-registry.js';
import {
  getRemovedBuiltInTemplateMessage,
  isRemovedBuiltInTemplateId,
} from './template-defaults.js';
import {
  toSnakeCase,
  toTitleCase,
} from './string-case.js';
import type {
  CollectScaffoldAnswersOptions,
  ResolvePackageManagerOptions,
  ResolveTemplateOptions,
  ScaffoldAnswers,
} from './scaffold.js';

const WORKSPACE_TEMPLATE_ALIAS = 'workspace';

export function detectAuthor(): string {
  try {
    return (
      execSync('git config user.name', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || 'Your Name'
    );
  } catch {
    return 'Your Name';
  }
}

export function getDefaultAnswers(
  projectName: string,
  templateId: string,
): ScaffoldAnswers {
  const template = isBuiltInTemplateId(templateId) ? getTemplateById(templateId) : null;
  const slugDefault = normalizeBlockSlug(projectName) || 'my-wp-typia-block';
  return {
    author: detectAuthor(),
    dataStorageMode: templateId === 'persistence' ? 'custom-table' : undefined,
    description: template?.description ?? 'A WordPress block scaffolded from a remote template',
    namespace: slugDefault,
    persistencePolicy: templateId === 'persistence' ? 'authenticated' : undefined,
    phpPrefix: toSnakeCase(slugDefault),
    slug: slugDefault,
    textDomain: slugDefault,
    title: toTitleCase(slugDefault),
  };
}

function normalizeTemplateSelection(templateId: string): string {
  return templateId === WORKSPACE_TEMPLATE_ALIAS
    ? OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
    : templateId;
}

export async function resolveTemplateId({
  templateId,
  yes = false,
  isInteractive = false,
  selectTemplate,
}: ResolveTemplateOptions): Promise<string> {
  if (templateId) {
    const normalizedTemplateId = normalizeTemplateSelection(templateId);
    if (isRemovedBuiltInTemplateId(templateId)) {
      throw new Error(getRemovedBuiltInTemplateMessage(templateId));
    }
    if (isBuiltInTemplateId(normalizedTemplateId)) {
      return getTemplateById(normalizedTemplateId).id;
    }
    return normalizedTemplateId;
  }

  if (yes) {
    return 'basic';
  }

  if (!isInteractive || !selectTemplate) {
    throw new Error(
      `Template is required in non-interactive mode. Use --template <${TEMPLATE_IDS.join('|')}|./path|github:owner/repo/path[#ref]|npm-package>.`,
    );
  }

  return normalizeTemplateSelection(await selectTemplate());
}

export async function resolvePackageManagerId({
  packageManager,
  yes = false,
  isInteractive = false,
  selectPackageManager,
}: ResolvePackageManagerOptions): Promise<PackageManagerId> {
  if (packageManager) {
    return getPackageManager(packageManager).id;
  }

  if (yes) {
    return 'npm';
  }

  if (!isInteractive || !selectPackageManager) {
    throw new Error(
      `Package manager is required in non-interactive mode. Use --package-manager <${PACKAGE_MANAGER_IDS.join('|')}>.`,
    );
  }

  return selectPackageManager();
}

export async function collectScaffoldAnswers({
  projectName,
  templateId,
  yes = false,
  dataStorageMode,
  namespace,
  persistencePolicy,
  phpPrefix,
  promptText,
  textDomain,
}: CollectScaffoldAnswersOptions): Promise<ScaffoldAnswers> {
  const defaults = getDefaultAnswers(projectName, templateId);

  if (yes) {
    const identifiers = resolveScaffoldIdentifiers({
      namespace: namespace ?? defaults.namespace,
      phpPrefix,
      slug: defaults.slug,
      textDomain,
    });
    return {
      ...defaults,
      dataStorageMode: dataStorageMode ?? defaults.dataStorageMode,
      namespace: identifiers.namespace,
      persistencePolicy: persistencePolicy ?? defaults.persistencePolicy,
      phpPrefix: identifiers.phpPrefix,
      textDomain: identifiers.textDomain,
    };
  }

  if (!promptText) {
    throw new Error('Interactive answers require a promptText callback.');
  }

  const identifiers = resolveScaffoldIdentifiers({
    namespace:
      namespace ?? (await promptText('Namespace', defaults.namespace, validateNamespace)),
    phpPrefix,
    slug: await promptText('Block slug', defaults.slug, validateBlockSlug),
    textDomain,
  });

  return {
    author: await promptText('Author', defaults.author),
    dataStorageMode: dataStorageMode ?? defaults.dataStorageMode,
    description: await promptText('Description', defaults.description),
    namespace: identifiers.namespace,
    persistencePolicy: persistencePolicy ?? defaults.persistencePolicy,
    phpPrefix: identifiers.phpPrefix,
    slug: identifiers.slug,
    textDomain: identifiers.textDomain,
    title: await promptText('Block title', toTitleCase(identifiers.slug)),
  };
}
import { execSync } from 'node:child_process';
