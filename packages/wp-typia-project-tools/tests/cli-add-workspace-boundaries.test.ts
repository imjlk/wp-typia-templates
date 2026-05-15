import { expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const runtimeRoot = path.join(import.meta.dir, '..', 'src', 'runtime');

test('cli-add-workspace delegates workspace add workflows to focused helpers', () => {
  const addWorkspaceSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace.ts'),
    'utf8',
  );
  const assetsSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-assets.ts'),
    'utf8',
  );
  const patternSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-pattern.ts'),
    'utf8',
  );
  const bindingSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-binding-source.ts'),
    'utf8',
  );
  const bindingSourceAnchorsSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-binding-source-anchors.ts'),
    'utf8',
  );
  const bindingSourceEmittersSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-binding-source-source-emitters.ts'),
    'utf8',
  );
  const bindingSourceTypesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-binding-source-types.ts'),
    'utf8',
  );
  const editorPluginSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-editor-plugin.ts'),
    'utf8',
  );
  const editorPluginAnchorsSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-editor-plugin-anchors.ts'),
    'utf8',
  );
  const editorPluginEmittersSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-editor-plugin-source-emitters.ts'),
    'utf8',
  );
	const restSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest.ts'),
		'utf8',
	);
	const restGeneratedSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest-generated.ts'),
		'utf8',
	);
	const restManualSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest-manual.ts'),
		'utf8',
	);
	const restPhpTemplatesSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest-php-templates.ts'),
		'utf8',
	);
	const restAnchorsSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest-anchors.ts'),
		'utf8',
	);
	const restSourceEmittersSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest-source-emitters.ts'),
		'utf8',
	);
	const restTypesSource = fs.readFileSync(
		path.join(runtimeRoot, 'cli-add-workspace-rest-types.ts'),
		'utf8',
	);
  const postMetaSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-post-meta.ts'),
    'utf8',
  );
  const postMetaAnchorsSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-post-meta-anchors.ts'),
    'utf8',
  );
  const postMetaSourceEmittersSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-post-meta-source-emitters.ts'),
    'utf8',
  );
  const aiSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-ai.ts'),
    'utf8',
  );
  const aiAnchorsSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-ai-anchors.ts'),
    'utf8',
  );
  const aiSourceEmittersSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-ai-source-emitters.ts'),
    'utf8',
  );
  const aiScaffoldSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-ai-scaffold.ts'),
    'utf8',
  );
  const abilityScaffoldSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-ability-scaffold.ts'),
    'utf8',
  );
  const adminViewSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view.ts'),
    'utf8',
  );
  const adminViewSourceHelpers = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-source.ts'),
    'utf8',
  );
  const adminViewTemplatesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-templates.ts'),
    'utf8',
  );
  const adminViewCoreDataTemplatesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-templates-core-data.ts'),
    'utf8',
  );
  const adminViewDefaultTemplatesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-templates-default.ts'),
    'utf8',
  );
  const adminViewRestTemplatesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-templates-rest.ts'),
    'utf8',
  );
  const adminViewSettingsTemplatesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-templates-settings.ts'),
    'utf8',
  );
  const adminViewSharedTemplatesSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-templates-shared.ts'),
    'utf8',
  );
  const adminViewScaffoldSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-admin-view-scaffold.ts'),
    'utf8',
  );
  const mutationSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-mutation.ts'),
    'utf8',
  );
  const variationSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-variation.ts'),
    'utf8',
  );
  const blockStyleSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-block-style.ts'),
    'utf8',
  );
  const blockTransformSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-block-transform.ts'),
    'utf8',
  );
  const hookedBlockSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-hooked-block.ts'),
    'utf8',
  );
  const registrationHooksSource = fs.readFileSync(
    path.join(runtimeRoot, 'cli-add-workspace-registration-hooks.ts'),
    'utf8',
  );

  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-ability.js"',
  );
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-admin-view.js"',
  );
  expect(addWorkspaceSource).toContain('from "./cli-add-workspace-assets.js"');
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-contract.js"',
  );
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-integration-env.js"',
  );
  expect(addWorkspaceSource).toContain('from "./cli-add-workspace-rest.js"');
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-post-meta.js"',
  );
  expect(addWorkspaceSource).toContain('from "./cli-add-workspace-ai.js"');
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-variation.js"',
  );
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-block-style.js"',
  );
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-block-transform.js"',
  );
  expect(addWorkspaceSource).toContain(
    'from "./cli-add-workspace-hooked-block.js"',
  );
  expect(addWorkspaceSource).toContain('runAddAbilityCommand');
  expect(addWorkspaceSource).toContain('runAddAiFeatureCommand');
  expect(addWorkspaceSource).toContain('runAddAdminViewCommand');
  expect(addWorkspaceSource).toContain('runAddBindingSourceCommand');
  expect(addWorkspaceSource).toContain('runAddBlockStyleCommand');
  expect(addWorkspaceSource).toContain('runAddBlockTransformCommand');
  expect(addWorkspaceSource).toContain('runAddContractCommand');
  expect(addWorkspaceSource).toContain('runAddEditorPluginCommand');
  expect(addWorkspaceSource).toContain('runAddHookedBlockCommand');
  expect(addWorkspaceSource).toContain('runAddIntegrationEnvCommand');
  expect(addWorkspaceSource).toContain('runAddPatternCommand');
  expect(addWorkspaceSource).toContain('runAddPostMetaCommand');
  expect(addWorkspaceSource).toContain('runAddRestResourceCommand');
  expect(addWorkspaceSource).toContain('runAddVariationCommand');
  expect(addWorkspaceSource).not.toContain('function buildPatternSource(');
  expect(addWorkspaceSource).not.toContain(
    'function buildAiFeatureTypesSource(',
  );
  expect(addWorkspaceSource).not.toContain(
    'function buildBindingSourceServerSource(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensureAiFeatureBootstrapAnchors(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensureBindingSourceBootstrapAnchors(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensureEditorPluginBootstrapAnchors(',
  );
  expect(addWorkspaceSource).not.toContain(
    'function buildRestResourceTypesSource(',
  );
  expect(addWorkspaceSource).not.toContain('function buildPostMetaTypesSource(');
  expect(addWorkspaceSource).not.toContain(
    'async function ensureRestResourceBootstrapAnchors(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensurePostMetaBootstrapAnchors(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensureAdminViewBootstrapAnchors(',
  );
  expect(addWorkspaceSource).not.toContain('function buildVariationSource(');
  expect(addWorkspaceSource).not.toContain('function buildBlockStyleSource(');
  expect(addWorkspaceSource).not.toContain('function buildBlockTransformSource(');
  expect(addWorkspaceSource).not.toContain(
    'async function ensureVariationRegistrationHook(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensureBlockStyleRegistrationHook(',
  );
  expect(addWorkspaceSource).not.toContain(
    'async function ensureBlockTransformRegistrationHook(',
  );
  expect(addWorkspaceSource).not.toMatch(
    /export\s*\{[^}]*ensureAdminViewBootstrapAnchors[^}]*\}/u,
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddAbilityCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddAdminViewCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddAiFeatureCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddContractCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddPatternCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddIntegrationEnvCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddBindingSourceCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddEditorPluginCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddRestResourceCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddPostMetaCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddVariationCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddBlockStyleCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddBlockTransformCommand(',
  );
  expect(addWorkspaceSource).not.toContain(
    'export async function runAddHookedBlockCommand(',
  );
  expect(assetsSource).toContain(
    'from "./cli-add-workspace-binding-source.js"',
  );
  expect(assetsSource).toContain(
    'from "./cli-add-workspace-editor-plugin.js"',
  );
  expect(assetsSource).toContain('from "./cli-add-workspace-pattern.js"');
  expect(assetsSource).not.toContain('function buildPatternSource(');
  expect(assetsSource).not.toContain('function buildBindingSourceServerSource(');
  expect(assetsSource).not.toContain('function buildEditorPluginEntrySource(');
  expect(patternSource).toContain('function buildPatternSource(');
  expect(patternSource).toContain('async function ensurePatternBootstrapAnchors(');
  expect(patternSource).toContain('export async function runAddPatternCommand(');
  expect(patternSource).not.toContain('function buildBindingSourceServerSource(');
  expect(patternSource).not.toContain('function buildEditorPluginEntrySource(');
  expect(bindingSource).toContain(
    'from "./cli-add-workspace-binding-source-anchors.js"',
  );
  expect(bindingSource).toContain(
    'from "./cli-add-workspace-binding-source-source-emitters.js"',
  );
  expect(bindingSource).toContain(
    'from "./cli-add-workspace-binding-source-types.js"',
  );
  expect(bindingSource).toContain(
    'export async function runAddBindingSourceCommand(',
  );
  expect(bindingSource).toContain('await ensureBindingSourceBootstrapAnchors(');
  expect(bindingSource).toContain('await resolveBindingSourceRegistryPath(');
  expect(bindingSource).toContain('await writeBindingSourceRegistry(');
  expect(bindingSource).not.toContain('function buildBindingSourceServerSource(');
  expect(bindingSource).not.toContain(
    'async function ensureBindingSourceBootstrapAnchors(',
  );
  expect(bindingSource).not.toContain('function buildBindingSourceIndexSource(');
  expect(bindingSource).not.toContain(
    'async function resolveBindingSourceRegistryPath(',
  );
  expect(bindingSource).not.toContain(
    'async function writeBindingSourceRegistry(',
  );
  expect(bindingSourceEmittersSource).toContain(
    'export function buildBindingSourceServerSource(',
  );
  expect(bindingSourceEmittersSource).toContain(
    'export function buildBindingSourceEditorSource(',
  );
  expect(bindingSourceEmittersSource).toContain(
    'export function buildBindingSourceConfigEntry(',
  );
  expect(bindingSourceEmittersSource).not.toContain(
    'async function ensureBindingSourceBootstrapAnchors(',
  );
  expect(bindingSourceAnchorsSource).toContain(
    'export async function ensureBindingSourceBootstrapAnchors(',
  );
  expect(bindingSourceAnchorsSource).toContain(
    'export async function resolveBindingSourceRegistryPath(',
  );
  expect(bindingSourceAnchorsSource).toContain(
    'export async function writeBindingSourceRegistry(',
  );
  expect(bindingSourceAnchorsSource).not.toContain(
    'function buildBindingSourceServerSource(',
  );
  expect(bindingSourceTypesSource).toContain('export type BindingTarget');
  expect(bindingSourceTypesSource).toContain('export type BindingPostMetaSource');
  expect(bindingSource).not.toContain('function buildPatternSource(');
  expect(bindingSource).not.toContain('function buildEditorPluginEntrySource(');
  expect(editorPluginSource).toContain(
    'from "./cli-add-workspace-editor-plugin-anchors.js"',
  );
  expect(editorPluginSource).toContain(
    'from "./cli-add-workspace-editor-plugin-source-emitters.js"',
  );
  expect(editorPluginSource).toContain('await ensureEditorPluginBootstrapAnchors(');
  expect(editorPluginSource).toContain('await ensureEditorPluginBuildScriptAnchors(');
  expect(editorPluginSource).toContain('await ensureEditorPluginWebpackAnchors(');
  expect(editorPluginSource).toContain('await resolveEditorPluginRegistryPath(');
  expect(editorPluginSource).toContain('await writeEditorPluginRegistry(');
  expect(editorPluginSource).toContain(
    'export async function runAddEditorPluginCommand(',
  );
  expect(editorPluginSource).not.toContain('function buildEditorPluginEntrySource(');
  expect(editorPluginSource).not.toContain(
    'async function ensureEditorPluginBootstrapAnchors(',
  );
  expect(editorPluginSource).not.toContain(
    'async function ensureEditorPluginBuildScriptAnchors(',
  );
  expect(editorPluginSource).not.toContain(
    'async function ensureEditorPluginWebpackAnchors(',
  );
  expect(editorPluginSource).toMatch(
    /export\s*\{[^}]*ensureEditorPluginBootstrapAnchors[^}]*\}\s*from\s+["']\.\/cli-add-workspace-editor-plugin-anchors\.js["']/u,
  );
  expect(editorPluginEmittersSource).toContain(
    'export function buildEditorPluginEntrySource(',
  );
  expect(editorPluginEmittersSource).toContain(
    'export function buildEditorPluginSurfaceSource(',
  );
  expect(editorPluginEmittersSource).toContain(
    'export function buildEditorPluginConfigEntry(',
  );
  expect(editorPluginEmittersSource).not.toContain(
    'async function ensureEditorPluginBootstrapAnchors(',
  );
  expect(editorPluginAnchorsSource).toContain(
    'export async function ensureEditorPluginBootstrapAnchors(',
  );
  expect(editorPluginAnchorsSource).toContain(
    'export async function ensureEditorPluginBuildScriptAnchors(',
  );
  expect(editorPluginAnchorsSource).toContain(
    'export async function ensureEditorPluginWebpackAnchors(',
  );
  expect(editorPluginAnchorsSource).toContain(
    'export async function resolveEditorPluginRegistryPath(',
  );
  expect(editorPluginAnchorsSource).toContain(
    'export async function writeEditorPluginRegistry(',
  );
  expect(editorPluginAnchorsSource).not.toContain(
    'function buildEditorPluginEntrySource(',
  );
  expect(editorPluginSource).not.toContain('function buildPatternSource(');
  expect(editorPluginSource).not.toContain(
    'function buildBindingSourceServerSource(',
  );
	expect(restSource).toContain(
		'from "./cli-add-workspace-rest-generated.js"',
	);
	expect(restSource).toContain('from "./cli-add-workspace-rest-manual.js"');
	expect(restSource).toContain('from "./cli-add-workspace-rest-types.js"');
	expect(restSource).not.toContain('function buildRestResourceTypesSource(');
	expect(restSource).not.toContain('function buildRestResourcePhpSource(');
	expect(restSource).not.toContain(
		'async function ensureRestResourceBootstrapAnchors(',
	);
	expect(restSource).not.toContain('syncManualRestContractArtifacts');
	expect(restSource).not.toContain('syncRestResourceArtifacts');
	expect(restSource).toContain(
		'export async function runAddRestResourceCommand(',
	);
	expect(restGeneratedSource).toContain(
		'export async function scaffoldGeneratedRestResource(',
	);
	expect(restGeneratedSource).toContain(
		'from "./cli-add-workspace-rest-php-templates.js"',
	);
	expect(restGeneratedSource).toContain('syncRestResourceArtifacts');
	expect(restManualSource).toContain(
		'export async function scaffoldManualRestContract(',
	);
	expect(restManualSource).toContain('syncManualRestContractArtifacts');
	expect(restPhpTemplatesSource).toContain(
		'export function buildRestResourcePhpSource(',
	);
	expect(restTypesSource).toContain(
		'export interface RunAddRestResourceCommandResult',
	);
	expect(restSourceEmittersSource).toContain(
		'function buildRestResourceTypesSource(',
	);
  expect(restSourceEmittersSource).toContain(
    'function buildRestResourceApiSource(',
  );
  expect(restSourceEmittersSource).toContain(
    'function buildRestResourceDataSource(',
  );
  expect(restAnchorsSource).toContain(
    'async function ensureRestResourceBootstrapAnchors(',
  );
  expect(restAnchorsSource).toContain(
    'async function ensureRestResourceSyncScriptAnchors(',
  );
  expect(postMetaSource).toContain(
    'from "./cli-add-workspace-post-meta-anchors.js"',
  );
  expect(postMetaSource).toContain(
    'from "./cli-add-workspace-post-meta-source-emitters.js"',
  );
  expect(postMetaSource).toContain(
    'export async function runAddPostMetaCommand(',
  );
  expect(postMetaSource).not.toContain('function buildPostMetaTypesSource(');
  expect(postMetaSource).not.toContain(
    'async function ensurePostMetaBootstrapAnchors(',
  );
  expect(postMetaSourceEmittersSource).toContain(
    'function buildPostMetaTypesSource(',
  );
  expect(postMetaSourceEmittersSource).toContain(
    'function buildPostMetaPhpSource(',
  );
  expect(postMetaAnchorsSource).toContain(
    'async function ensurePostMetaBootstrapAnchors(',
  );
  expect(postMetaAnchorsSource).toContain(
    'async function ensurePostMetaSyncScriptAnchors(',
  );
  expect(aiScaffoldSource).toContain('from "./cli-add-workspace-ai-anchors.js"');
  expect(aiScaffoldSource).toContain(
    'from "./cli-add-workspace-ai-source-emitters.js"',
  );
  expect(aiScaffoldSource).not.toContain('function buildAiFeatureTypesSource(');
  expect(aiScaffoldSource).not.toContain(
    'async function ensureAiFeatureBootstrapAnchors(',
  );
  expect(aiScaffoldSource).toContain(
    'from "./cli-add-workspace-ai-templates.js"',
  );
  expect(aiSource).toContain('export async function runAddAiFeatureCommand(');
  expect(aiSourceEmittersSource).toContain(
    'function buildAiFeatureTypesSource(',
  );
  expect(aiSourceEmittersSource).toContain('function buildAiFeatureApiSource(');
  expect(aiSourceEmittersSource).toContain(
    'function buildAiFeatureDataSource(',
  );
  expect(aiAnchorsSource).toContain(
    'async function ensureAiFeatureBootstrapAnchors(',
  );
  expect(aiAnchorsSource).toContain(
    'async function ensureAiFeatureSyncRestAnchors(',
  );
  expect(adminViewSource).toContain(
    'export async function runAddAdminViewCommand(',
  );
  expect(adminViewSource).toContain(
    "from './cli-add-workspace-admin-view-source.js'",
  );
  expect(adminViewSource).toContain(
    "from './cli-add-workspace-admin-view-scaffold.js'",
  );
  expect(adminViewSource).not.toContain('function buildAdminViewScreenSource(');
  expect(adminViewSource).not.toContain(
    'async function ensureAdminViewBootstrapAnchors(',
  );
  expect(adminViewSourceHelpers).toContain(
    'export function parseAdminViewSource(',
  );
  expect(adminViewSourceHelpers).toContain(
    'export function assertAdminViewPackageAvailability(',
  );
  expect(adminViewScaffoldSource).toContain(
    "from './cli-add-workspace-admin-view-templates.js'",
  );
  expect(adminViewScaffoldSource).toContain("from './package-versions.js'");
  expect(adminViewScaffoldSource).toContain(
    'async function ensureAdminViewBootstrapAnchors(',
  );
  expect(adminViewScaffoldSource).toContain(
    'export async function scaffoldAdminViewWorkspace(',
  );
  expect(adminViewTemplatesSource).toContain(
    'export function buildAdminViewScreenSource(',
  );
  expect(adminViewTemplatesSource).toContain(
    'export function buildAdminViewPhpSource(',
  );
  expect(adminViewDefaultTemplatesSource).toContain(
    'export function buildDefaultAdminViewDataSource(',
  );
  expect(adminViewRestTemplatesSource).toContain(
    'export function buildRestAdminViewDataSource(',
  );
  expect(adminViewCoreDataTemplatesSource).toContain(
    'export function buildCoreDataAdminViewDataSource(',
  );
  expect(adminViewSettingsTemplatesSource).toContain(
    'export function buildRestSettingsAdminViewScreenSource(',
  );
  expect(adminViewSharedTemplatesSource).toContain(
    'export function buildAdminViewPhpSource(',
  );
  expect(adminViewTemplatesSource).not.toContain(
    'export async function runAddAdminViewCommand(',
  );
  expect(variationSource).toContain('function buildVariationSource(');
  expect(variationSource).toContain(
    'async function ensureVariationRegistrationHook(',
  );
  expect(variationSource).toContain(
    'export async function runAddVariationCommand(',
  );
  expect(variationSource).toContain(
    'from "./cli-add-workspace-registration-hooks.js"',
  );
  expect(variationSource).not.toContain('function buildBlockStyleSource(');
  expect(variationSource).not.toContain('function buildBlockTransformSource(');
  expect(blockStyleSource).toContain('function buildBlockStyleSource(');
  expect(blockStyleSource).toContain(
    'async function ensureBlockStyleRegistrationHook(',
  );
  expect(blockStyleSource).toContain(
    'export async function runAddBlockStyleCommand(',
  );
  expect(blockStyleSource).toContain(
    'from "./cli-add-workspace-registration-hooks.js"',
  );
  expect(blockStyleSource).not.toContain('function buildVariationSource(');
  expect(blockStyleSource).not.toContain('function buildBlockTransformSource(');
  expect(blockTransformSource).toContain('function buildBlockTransformSource(');
  expect(blockTransformSource).toContain(
    'async function ensureBlockTransformRegistrationHook(',
  );
  expect(blockTransformSource).toContain(
    'export async function runAddBlockTransformCommand(',
  );
  expect(blockTransformSource).toContain(
    'from "./cli-add-workspace-registration-hooks.js"',
  );
  expect(blockTransformSource).not.toContain('function buildVariationSource(');
  expect(blockTransformSource).not.toContain('function buildBlockStyleSource(');
  expect(hookedBlockSource).toContain(
    'export async function runAddHookedBlockCommand(',
  );
  expect(hookedBlockSource).not.toContain('function buildVariationSource(');
  expect(hookedBlockSource).not.toContain('function buildBlockStyleSource(');
  expect(hookedBlockSource).not.toContain('function buildBlockTransformSource(');
  expect(registrationHooksSource).toContain(
    'export function findExecutableCallRange(',
  );
  expect(registrationHooksSource).toContain(
    'export async function ensureWorkspaceEntrypointCall(',
  );
  expect(registrationHooksSource).toContain(
    'export async function ensureWorkspaceRegistrationSettingsCall(',
  );
  for (const scaffoldSource of [
    abilityScaffoldSource,
    adminViewScaffoldSource,
    aiScaffoldSource,
  ]) {
    expect(scaffoldSource).toContain('executeWorkspaceMutationPlan');
    expect(scaffoldSource).not.toContain('rollbackWorkspaceMutation');
    expect(scaffoldSource).not.toContain('snapshotWorkspaceFiles');
  }
  expect(mutationSource).toContain('insertPhpSnippetBeforeWorkspaceAnchors');
  expect(mutationSource).toContain('appendPhpSnippetBeforeClosingTag');
	for (const bootstrapAnchorSource of [
		aiAnchorsSource,
		bindingSourceAnchorsSource,
		editorPluginAnchorsSource,
		patternSource,
		postMetaAnchorsSource,
		restAnchorsSource,
	]) {
    expect(bootstrapAnchorSource).toContain(
      'insertPhpSnippetBeforeWorkspaceAnchors',
    );
    expect(bootstrapAnchorSource).toContain('appendPhpSnippetBeforeClosingTag');
    expect(bootstrapAnchorSource).not.toContain('const insertPhpSnippet');
    expect(bootstrapAnchorSource).not.toContain('const appendPhpSnippet');
  }
});
