import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

import {
	cleanupScaffoldTempRoot,
	createScaffoldTempRoot,
} from "./helpers/scaffold-test-harness.js";
import {
	buildBuiltInBlockArtifacts,
	stringifyBuiltInBlockJsonDocument,
} from "../src/runtime/built-in-block-artifacts.js";
import { buildBuiltInCodeArtifacts } from "../src/runtime/built-in-block-code-artifacts.js";
import {
	buildTemplateVariablesFromBlockSpec,
	createBuiltInBlockSpec,
} from "../src/runtime/block-generator-service.js";
import { scaffoldProject } from "../src/runtime/index.js";
import { transformPackageManagerText } from "../src/runtime/package-managers.js";
import { stringifyStarterManifest } from "../src/runtime/starter-manifests.js";
import type { BuiltInTemplateId } from "../src/runtime/template-registry.js";
import type { ScaffoldAnswers } from "../src/runtime/scaffold.js";

const templatesRoot = path.resolve(import.meta.dir, "..", "templates");

function buildAnswers(templateId: BuiltInTemplateId): ScaffoldAnswers {
	return {
		author: "Emitter Test",
		dataStorageMode:
			templateId === "persistence" || templateId === "compound"
				? "post-meta"
				: undefined,
		description: `Demo ${templateId} block`,
		namespace: "demo-space",
		persistencePolicy:
			templateId === "persistence" || templateId === "compound"
				? "public"
				: undefined,
		phpPrefix: "demo_space",
		slug: `demo-${templateId}`,
		textDomain: "demo-space",
		title: `Demo ${templateId[0]!.toUpperCase()}${templateId.slice(1)}`,
	};
}

function buildArtifacts(templateId: BuiltInTemplateId) {
	const answers = buildAnswers(templateId);
	const spec = createBuiltInBlockSpec({
		answers,
		dataStorageMode: answers.dataStorageMode,
		persistencePolicy: answers.persistencePolicy,
		templateId,
	});
	const variables = buildTemplateVariablesFromBlockSpec(spec);

	return {
		artifacts: buildBuiltInBlockArtifacts({
			templateId,
			variables,
		}),
		codeArtifacts: buildBuiltInCodeArtifacts({
			templateId,
			variables,
		}),
		answers,
		variables,
	};
}

describe("built-in block artifacts", () => {
	const tempRoot = createScaffoldTempRoot("wp-typia-built-in-artifacts-");

	afterAll(() => {
		cleanupScaffoldTempRoot(tempRoot);
	});

	test("built-in template trees no longer ship structural Mustache files", () => {
		for (const relativePath of [
			"basic/src/types.ts.mustache",
			"basic/src/block.json.mustache",
			"basic/src/hooks.ts.mustache",
			"basic/src/edit.tsx.mustache",
			"basic/src/save.tsx.mustache",
			"basic/src/index.tsx.mustache",
			"basic/src/validators.ts.mustache",
			"basic/src/editor.scss.mustache",
			"basic/src/style.scss.mustache",
			"basic/src/render.php.mustache",
			"interactivity/src/types.ts.mustache",
			"interactivity/src/block.json.mustache",
			"interactivity/src/edit.tsx.mustache",
			"interactivity/src/save.tsx.mustache",
			"interactivity/src/index.tsx.mustache",
			"interactivity/src/interactivity.ts.mustache",
			"interactivity/src/validators.ts.mustache",
			"interactivity/src/editor.scss.mustache",
			"interactivity/src/style.scss.mustache",
			"persistence/src/types.ts.mustache",
			"persistence/src/block.json.mustache",
			"persistence/src/edit.tsx.mustache",
			"persistence/src/style.scss.mustache",
			"persistence/src/render.php.mustache",
			"_shared/base/src/hooks.ts.mustache",
			"_shared/persistence/core/src/index.tsx.mustache",
			"_shared/persistence/core/src/save.tsx.mustache",
			"_shared/persistence/core/src/interactivity.ts.mustache",
			"_shared/persistence/core/src/validators.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}/types.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}/block.json.mustache",
			"compound/src/blocks/{{slugKebabCase}}/edit.tsx.mustache",
			"compound/src/blocks/{{slugKebabCase}}/save.tsx.mustache",
			"compound/src/blocks/{{slugKebabCase}}/index.tsx.mustache",
			"compound/src/blocks/{{slugKebabCase}}/hooks.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}/validators.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}/children.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/types.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/block.json.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/edit.tsx.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/save.tsx.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/index.tsx.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/hooks.ts.mustache",
			"compound/src/blocks/{{slugKebabCase}}-item/validators.ts.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/types.ts.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/block.json.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/edit.tsx.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/save.tsx.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/hooks.ts.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/validators.ts.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/interactivity.ts.mustache",
			"_shared/compound/persistence/src/blocks/{{slugKebabCase}}/render.php.mustache",
			"compound/src/blocks/{{slugKebabCase}}/style.scss.mustache",
		]) {
			expect(fs.existsSync(path.join(templatesRoot, relativePath))).toBe(false);
		}
	});

	test.each([
		["basic", 1],
		["interactivity", 1],
		["persistence", 1],
		["compound", 2],
	] as const)(
		"buildBuiltInBlockArtifacts emits stable structural artifacts for %s",
		(templateId, expectedCount) => {
			const { artifacts, variables } = buildArtifacts(templateId);

			expect(artifacts).toHaveLength(expectedCount);
			expect(artifacts[0]?.typesSource.endsWith("\n")).toBe(true);
			expect(
				JSON.parse(
					stringifyBuiltInBlockJsonDocument(artifacts[0]!.blockJsonDocument),
				),
			).toEqual(artifacts[0]!.blockJsonDocument);

			if (templateId === "basic") {
				expect(artifacts[0]?.relativeDir).toBe("src");
				expect(artifacts[0]?.typesSource).toContain(
					`export interface ${variables.pascalCase}Attributes`,
				);
				expect(artifacts[0]?.typesSource).toContain(
					'tags.MaxLength<1000> & tags.Default<"">',
				);
				expect(artifacts[0]?.typesSource).not.toContain(
					'tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">',
				);
				expect(artifacts[0]?.typesSource).toContain(
					'import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";',
				);
				expect(artifacts[0]?.blockJsonDocument).toEqual(
					expect.objectContaining({
						name: `${variables.namespace}/${variables.slug}`,
						textdomain: variables.textDomain,
					}),
				);
			}

			if (templateId === "interactivity") {
				expect(artifacts[0]?.typesSource).toContain(
					`export interface ${variables.pascalCase}Context`,
				);
				expect(artifacts[0]?.typesSource).toContain(
					'tags.MaxLength<1000> & tags.Default<"">',
				);
				expect(artifacts[0]?.typesSource).not.toContain(
					'tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">',
				);
				expect(artifacts[0]?.blockJsonDocument).toEqual(
					expect.objectContaining({
						viewScriptModule: "file:./interactivity.js",
					}),
				);
			}

			if (templateId === "persistence") {
				const persistenceArtifact = artifacts[0]!;
				const resourceKeyAttribute =
					persistenceArtifact.manifestDocument.attributes?.["resourceKey"];
				const resourceKeyBlockJson =
					(
						persistenceArtifact.blockJsonDocument.attributes as
							| Record<string, Record<string, unknown>>
							| undefined
					)?.resourceKey;

				expect(persistenceArtifact.typesSource).toContain(
					`export interface ${variables.pascalCase}ClientState`,
				);
				expect(persistenceArtifact.blockJsonDocument).toEqual(
					expect.objectContaining({
						render: "file:./render.php",
						viewScriptModule: "file:./interactivity.js",
					}),
				);
				expect(resourceKeyAttribute?.typia.defaultValue).toBe("primary");
				expect(resourceKeyBlockJson?.default).toBe("");
			}

			if (templateId === "compound") {
				const parentResourceKeyBlockJson =
					(
						artifacts[0]?.blockJsonDocument.attributes as
							| Record<string, Record<string, unknown>>
							| undefined
					)?.resourceKey;

				expect(artifacts[0]?.relativeDir).toBe(
					`src/blocks/${variables.slugKebabCase}`,
				);
				expect(artifacts[1]?.relativeDir).toBe(
					`src/blocks/${variables.slugKebabCase}-item`,
				);
				expect(artifacts[0]?.typesSource).toContain(
					`export interface ${variables.pascalCase}ClientState`,
				);
				expect(artifacts[1]?.typesSource).toContain(
					`export interface ${variables.pascalCase}ItemAttributes`,
				);
				expect(artifacts[1]?.blockJsonDocument).toEqual(
					expect.objectContaining({
						parent: [`${variables.namespace}/${variables.slugKebabCase}`],
					}),
				);
				expect(parentResourceKeyBlockJson?.default).toBe("");
			}
		},
	);

	test("compound persistence render emitter quotes heading fallbacks safely", () => {
		const answers = buildAnswers("compound");
		answers.title = `John's "Compound"`;
		const spec = createBuiltInBlockSpec({
			answers,
			dataStorageMode: answers.dataStorageMode,
			persistencePolicy: answers.persistencePolicy,
			templateId: "compound",
		});
		const variables = buildTemplateVariablesFromBlockSpec(spec);
		const renderArtifact = buildBuiltInCodeArtifacts({
			templateId: "compound",
			variables,
		}).find(
			(artifact) =>
				artifact.relativePath ===
				`src/blocks/${variables.slugKebabCase}/render.php`,
		);

		expect(renderArtifact?.source).toContain(
			"$heading            = isset( $normalized['heading'] ) ? (string) $normalized['heading'] : 'John\\'s \"Compound\"';",
		);
		expect(renderArtifact?.source).not.toContain(
			"$heading            = isset( $normalized['heading'] ) ? (string) $normalized['heading'] : 'John's \"Compound\"';",
		);
	});

	test.each([
		[
			"basic",
			[
				"src/hooks.ts",
				"src/edit.tsx",
				"src/save.tsx",
				"src/index.tsx",
				"src/validators.ts",
				"src/editor.scss",
				"src/style.scss",
				"src/render.php",
			],
		],
		[
			"interactivity",
			[
				"src/hooks.ts",
				"src/edit.tsx",
				"src/save.tsx",
				"src/index.tsx",
				"src/interactivity.ts",
				"src/validators.ts",
				"src/editor.scss",
				"src/style.scss",
			],
		],
		[
			"persistence",
			[
				"src/hooks.ts",
				"src/edit.tsx",
				"src/save.tsx",
				"src/index.tsx",
				"src/interactivity.ts",
				"src/validators.ts",
				"src/style.scss",
				"src/render.php",
			],
		],
		[
			"compound",
			[
				"src/hooks.ts",
				"src/blocks/demo-compound/edit.tsx",
				"src/blocks/demo-compound/save.tsx",
				"src/blocks/demo-compound/index.tsx",
				"src/blocks/demo-compound/hooks.ts",
				"src/blocks/demo-compound/validators.ts",
				"src/blocks/demo-compound/children.ts",
				"src/blocks/demo-compound/interactivity.ts",
				"src/blocks/demo-compound-item/edit.tsx",
				"src/blocks/demo-compound-item/save.tsx",
				"src/blocks/demo-compound-item/index.tsx",
				"src/blocks/demo-compound-item/hooks.ts",
				"src/blocks/demo-compound-item/validators.ts",
				"src/blocks/demo-compound/style.scss",
				"src/blocks/demo-compound/render.php",
			],
		],
	] as const)(
		"buildBuiltInCodeArtifacts emits expected emitter ownership set for %s",
		(templateId, expectedPaths) => {
			const { codeArtifacts } = buildArtifacts(templateId);
			const relativePaths = codeArtifacts.map((artifact) => artifact.relativePath);

			expect(relativePaths).toEqual([...expectedPaths]);

			for (const artifact of codeArtifacts) {
				expect(artifact.source.endsWith("\n")).toBe(true);
				expect(artifact.source).not.toContain("{{");
			}

			if (templateId === "interactivity") {
				const interactivityArtifact = codeArtifacts.find(
					(artifact) => artifact.relativePath === "src/interactivity.ts",
				);
				const styleArtifact = codeArtifacts.find(
					(artifact) => artifact.relativePath === "src/style.scss",
				);

				expect(interactivityArtifact?.source).toContain("withSyncEvent");
				expect(interactivityArtifact?.source).toContain(
					"event.stopPropagation();",
				);
				expect(styleArtifact?.source).toContain("&__progress-bar");
			}

			if (templateId === "basic") {
				const renderArtifact = codeArtifacts.find(
					(artifact) => artifact.relativePath === "src/render.php",
				);

				expect(renderArtifact?.source).toContain(
					"Server render placeholder.",
				);
			}

			if (templateId === "compound") {
				const renderArtifact = codeArtifacts.find(
					(artifact) =>
						artifact.relativePath === "src/blocks/demo-compound/render.php",
				);

				expect(renderArtifact?.source).toContain(
					"$heading            = isset( $normalized['heading'] ) ? (string) $normalized['heading'] : 'Demo Compound';",
				);
			}
		},
	);

	test.each(["basic", "interactivity", "persistence", "compound"] as const)(
		"scaffoldProject writes emitter-owned structural and TS/TSX artifacts for %s",
		async (templateId) => {
			const targetDir = path.join(tempRoot, `scaffold-${templateId}`);
			const { artifacts, answers, codeArtifacts } = buildArtifacts(templateId);

			await scaffoldProject({
				answers,
				dataStorageMode: answers.dataStorageMode,
				noInstall: true,
				packageManager: "npm",
				persistencePolicy: answers.persistencePolicy,
				projectDir: targetDir,
				templateId,
			});

			for (const artifact of artifacts) {
				const artifactDir = path.join(targetDir, artifact.relativeDir);
				expect(
					fs.readFileSync(path.join(artifactDir, "types.ts"), "utf8"),
				).toBe(artifact.typesSource);
				expect(
					fs.readFileSync(path.join(artifactDir, "block.json"), "utf8"),
				).toBe(
					stringifyBuiltInBlockJsonDocument(artifact.blockJsonDocument),
				);
				expect(
					fs.readFileSync(
						path.join(artifactDir, "typia.manifest.json"),
						"utf8",
					),
				).toBe(stringifyStarterManifest(artifact.manifestDocument));
			}

			for (const artifact of codeArtifacts) {
				expect(
					fs.readFileSync(path.join(targetDir, artifact.relativePath), "utf8"),
				).toBe(transformPackageManagerText(artifact.source, "npm"));
			}
		},
		{ timeout: 30_000 },
	);
});
