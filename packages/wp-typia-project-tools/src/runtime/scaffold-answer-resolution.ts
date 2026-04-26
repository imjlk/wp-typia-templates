import { execSync } from 'node:child_process';
import path from 'node:path';

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
  CLI_DIAGNOSTIC_CODES,
  createCliDiagnosticCodeError,
} from './cli-diagnostics.js';
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
import { parseNpmTemplateLocator } from './template-source-locators.js';
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
const TEMPLATE_SELECTION_HINT = `--template <${[
  ...TEMPLATE_IDS,
  WORKSPACE_TEMPLATE_ALIAS,
].join('|')}|./path|github:owner/repo/path[#ref]|npm-package>`;
const TEMPLATE_SUGGESTION_IDS = [...TEMPLATE_IDS, WORKSPACE_TEMPLATE_ALIAS] as const;
const QUERY_POST_TYPE_RULE =
  'Use lowercase, 1-20 chars, and only a-z, 0-9, "_" or "-".';
const USER_FACING_TEMPLATE_IDS = [
  ...TEMPLATE_IDS,
  WORKSPACE_TEMPLATE_ALIAS,
] as const;

/**
 * Detect the current author name from local Git config.
 *
 * @returns The configured Git author name, or `"Your Name"` when unavailable.
 */
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

/**
 * Compute the default scaffold answers for one project and template pair.
 *
 * @param projectName User-supplied project directory or block name seed.
 * @param templateId Selected scaffold template identifier.
 * @returns Normalized default answers for scaffold prompts and non-interactive flows.
 */
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
    queryPostType: templateId === 'query-loop' ? 'post' : undefined,
    slug: slugDefault,
    textDomain: slugDefault,
    title: toTitleCase(slugDefault),
  };
}

function validateQueryPostType(value: string): true | string {
  const rawValue = value.trim();
  const normalizedValue = rawValue.toLowerCase();
  if (normalizedValue.length === 0) {
    return 'Query post type is required.';
  }

  if (!/^[a-z0-9_-]{1,20}$/u.test(normalizedValue)) {
    return rawValue === normalizedValue
      ? `Query post type "${rawValue}" is invalid. ${QUERY_POST_TYPE_RULE}`
      : `Query post type "${rawValue}" normalizes to "${normalizedValue}", which is invalid. ${QUERY_POST_TYPE_RULE}`;
  }

  return true;
}

function normalizeQueryPostType(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const validationResult = validateQueryPostType(value);
  if (validationResult !== true) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
      validationResult,
    );
  }

  return value.trim().toLowerCase();
}

function normalizeTemplateSelection(templateId: string): string {
  return templateId === WORKSPACE_TEMPLATE_ALIAS
    ? OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
    : templateId;
}

function looksLikeWindowsAbsoluteTemplatePath(templateId: string): boolean {
  return /^[a-z]:[\\/]/iu.test(templateId) || /^\\\\[^\\]+\\[^\\]+/u.test(templateId);
}

function looksLikeExplicitNonNpmExternalTemplateLocator(templateId: string): boolean {
  return (
    path.isAbsolute(templateId) ||
    looksLikeWindowsAbsoluteTemplatePath(templateId) ||
    templateId.startsWith('./') ||
    templateId.startsWith('../') ||
    templateId.startsWith('@') ||
    templateId.startsWith('github:') ||
    templateId.includes('/')
  );
}

function looksLikeExplicitExternalTemplateLocator(templateId: string): boolean {
  return (
    looksLikeExplicitNonNpmExternalTemplateLocator(templateId) ||
    parseNpmTemplateLocator(templateId) !== null
  );
}

function getEditDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    current[0] = leftIndex + 1;

    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex] === right[rightIndex] ? 0 : 1;
      current[rightIndex + 1] = Math.min(
        current[rightIndex] + 1,
        previous[rightIndex + 1] + 1,
        previous[rightIndex] + substitutionCost,
      );
    }

    for (let index = 0; index < current.length; index += 1) {
      previous[index] = current[index] as number;
    }
  }

  return previous[right.length] as number;
}

function findMistypedBuiltInTemplateSuggestion(templateId: string): string | null {
  const normalizedTemplateId = templateId.trim().toLowerCase();
  if (
    normalizedTemplateId.length === 0 ||
    looksLikeExplicitNonNpmExternalTemplateLocator(normalizedTemplateId)
  ) {
    return null;
  }

  let bestCandidate: { distance: number; id: string } | null = null;

  for (const candidateId of TEMPLATE_SUGGESTION_IDS) {
    const distance = getEditDistance(normalizedTemplateId, candidateId);
    if (
      bestCandidate === null ||
      distance < bestCandidate.distance
    ) {
      bestCandidate = {
        distance,
        id: candidateId,
      };
    }
  }

  return bestCandidate && bestCandidate.distance <= 2
    ? bestCandidate.id
    : null;
}

function getMistypedBuiltInTemplateMessage(templateId: string): string | null {
  const suggestion = findMistypedBuiltInTemplateSuggestion(templateId);
  if (!suggestion) {
    return null;
  }

  const suggestionDescription =
    suggestion === WORKSPACE_TEMPLATE_ALIAS
      ? 'official workspace scaffold'
      : 'built-in scaffold';

  return `Unknown template "${templateId}". Did you mean "${suggestion}"? Use \`--template ${suggestion}\` for the ${suggestionDescription}, or pass a local path, \`github:owner/repo/path[#ref]\`, or an npm package spec for an external template.`;
}

function getUnknownTemplateMessage(templateId: string): string {
  return [
    `Unknown template "${templateId}". Expected one of: ${USER_FACING_TEMPLATE_IDS.join(', ')}.`,
    'Run `wp-typia templates list` to inspect available templates.',
    'Pass an explicit external template locator such as `./path`, `github:owner/repo/path[#ref]`, or `@scope/template` for custom templates.',
  ].join(' ');
}

/**
 * Resolve the scaffold template id from flags, defaults, and interactive selection.
 *
 * @param options Template resolution options for interactive and non-interactive flows.
 * @returns The normalized template identifier to scaffold.
 */
export async function resolveTemplateId({
  templateId,
  yes = false,
  isInteractive = false,
  selectTemplate,
}: ResolveTemplateOptions): Promise<string> {
  if (templateId) {
    const normalizedTemplateId = normalizeTemplateSelection(templateId);
    if (isRemovedBuiltInTemplateId(templateId)) {
      throw createCliDiagnosticCodeError(
        CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
        getRemovedBuiltInTemplateMessage(templateId),
      );
    }
    if (normalizedTemplateId === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE) {
      return normalizedTemplateId;
    }
    if (isBuiltInTemplateId(normalizedTemplateId)) {
      return getTemplateById(normalizedTemplateId).id;
    }
    const mistypedBuiltInTemplateMessage = getMistypedBuiltInTemplateMessage(templateId);
    if (mistypedBuiltInTemplateMessage) {
      throw createCliDiagnosticCodeError(
        CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
        mistypedBuiltInTemplateMessage,
      );
    }
    if (!looksLikeExplicitExternalTemplateLocator(normalizedTemplateId)) {
      throw createCliDiagnosticCodeError(
        CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
        getUnknownTemplateMessage(templateId),
      );
    }
    return normalizedTemplateId;
  }

  if (yes) {
    return 'basic';
  }

  if (!isInteractive || !selectTemplate) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      `Template is required in non-interactive mode. Use ${TEMPLATE_SELECTION_HINT}.`,
    );
  }

  return normalizeTemplateSelection(await selectTemplate());
}

/**
 * Resolve the package manager id from flags, defaults, and interactive selection.
 *
 * @param options Package manager resolution options for interactive and non-interactive flows.
 * @returns The normalized package manager id.
 */
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
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      `Package manager is required in non-interactive mode. Use --package-manager <${PACKAGE_MANAGER_IDS.join('|')}>.`,
    );
  }

  return selectPackageManager();
}

/**
 * Collect scaffold answers from defaults, CLI overrides, and optional prompts.
 *
 * @param options Answer collection inputs including prompt callbacks and explicit overrides.
 * @returns The normalized scaffold answers used for rendering and file generation.
 */
export async function collectScaffoldAnswers({
  projectName,
  templateId,
  yes = false,
  dataStorageMode,
  namespace,
  persistencePolicy,
  phpPrefix,
  promptText,
  queryPostType,
  textDomain,
}: CollectScaffoldAnswersOptions): Promise<ScaffoldAnswers> {
  const defaults = getDefaultAnswers(projectName, templateId);

  if (yes || (!isBuiltInTemplateId(templateId) && !promptText)) {
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
      queryPostType: normalizeQueryPostType(queryPostType ?? defaults.queryPostType),
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
    queryPostType:
      templateId === 'query-loop'
        ? normalizeQueryPostType(
            await promptText(
              'Query post type',
              queryPostType ?? defaults.queryPostType ?? 'post',
              validateQueryPostType,
            ),
          )
        : normalizeQueryPostType(queryPostType ?? defaults.queryPostType),
    slug: identifiers.slug,
    textDomain: identifiers.textDomain,
    title: await promptText('Block title', toTitleCase(identifiers.slug)),
  };
}
