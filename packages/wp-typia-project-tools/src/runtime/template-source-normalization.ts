/// <reference path="./external-template-modules.d.ts" />

import fs from 'node:fs'
import path from 'node:path'

import { loadExternalTemplateLayerManifest } from './template-layers.js'
import { getPackageVersions } from './package-versions.js'
import { getExternalTemplateEntry } from './template-source-external.js'
import { getTemplateProjectType } from './template-source-remote.js'
export { renderCreateBlockExternalTemplate } from './template-source-external.js'
export {
  getTemplateProjectType,
  getDefaultCategory,
  normalizeCreateBlockSubset,
  normalizeWpTypiaTemplateSeed,
} from './template-source-remote.js'
import type {
  TemplateSourceFormat,
  TemplateVariableContext,
} from './template-source-contracts.js'

export function getTemplateVariableContext(variables: {
  [key: string]: string
}): TemplateVariableContext {
  const {
    apiClientPackageVersion,
    blockRuntimePackageVersion,
    blockTypesPackageVersion,
    projectToolsPackageVersion,
    restPackageVersion,
  } = getPackageVersions()
  return {
    ...variables,
    apiClientPackageVersion:
      variables.apiClientPackageVersion ?? apiClientPackageVersion,
    blockRuntimePackageVersion:
      variables.blockRuntimePackageVersion ?? blockRuntimePackageVersion,
    blockTypesPackageVersion:
      variables.blockTypesPackageVersion ?? blockTypesPackageVersion,
    projectToolsPackageVersion:
      variables.projectToolsPackageVersion ?? projectToolsPackageVersion,
    description: variables.description,
    keyword: variables.keyword,
    namespace: variables.namespace,
    pascalCase: variables.pascalCase,
    phpPrefix: variables.phpPrefix,
    restPackageVersion: variables.restPackageVersion ?? restPackageVersion,
    slug: variables.slug,
    textDomain: variables.textDomain,
    title: variables.title,
  }
}

export async function detectTemplateSourceFormat(
  sourceDir: string,
): Promise<TemplateSourceFormat> {
  if (fs.existsSync(path.join(sourceDir, 'package.json.mustache'))) {
    return 'wp-typia'
  }

  if (await loadExternalTemplateLayerManifest(sourceDir)) {
    throw new Error(
      `Template source at ${sourceDir} is an external layer package. External layers currently compose only through built-in scaffolds via the runtime API, not as standalone template ids.`,
    )
  }

  if (getExternalTemplateEntry(sourceDir)) {
    return 'create-block-external'
  }

  if (getTemplateProjectType(sourceDir) !== null) {
    return 'wp-typia'
  }

  const sourceRoot = fs.existsSync(path.join(sourceDir, 'src'))
    ? path.join(sourceDir, 'src')
    : sourceDir
  const blockJsonCandidates = [
    path.join(sourceDir, 'block.json'),
    path.join(sourceRoot, 'block.json'),
  ]
  const hasBlockJson = blockJsonCandidates.some((candidate) =>
    fs.existsSync(candidate),
  )
  const hasIndexFile = ['index.js', 'index.jsx', 'index.ts', 'index.tsx'].some(
    (filename) => fs.existsSync(path.join(sourceRoot, filename)),
  )
  const hasEditFile = ['edit.js', 'edit.jsx', 'edit.ts', 'edit.tsx'].some(
    (filename) => fs.existsSync(path.join(sourceRoot, filename)),
  )
  const hasSaveFile = ['save.js', 'save.jsx', 'save.ts', 'save.tsx'].some(
    (filename) => fs.existsSync(path.join(sourceRoot, filename)),
  )

  if (hasBlockJson && hasIndexFile && hasEditFile && hasSaveFile) {
    return 'create-block-subset'
  }

  throw new Error(
    `Unsupported template source at ${sourceDir}. Expected a wp-typia template directory, an official create-block external template config, or a create-block subset with block.json and src/index/edit/save files.`,
  )
}
