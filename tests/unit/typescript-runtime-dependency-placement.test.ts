import { describe, expect, test } from "bun:test";

import {
	collectTypeScriptImportFiles,
	evaluateTypeScriptRuntimePackagePolicy,
	sourceImportsTypeScriptAtRuntime,
	TYPESCRIPT_DEPENDENCY_POLICY,
} from "../../scripts/lib/typescript-runtime-policy.mjs";

describe("typescript-runtime-policy", () => {
	test("detects shipped runtime source imports of typescript", () => {
		const importFiles = collectTypeScriptImportFiles(
			"packages/wp-typia-block-runtime",
			["src"],
		);

		expect(importFiles).toContain("src/metadata-analysis.ts");
		expect(importFiles).toContain("src/metadata-parser.ts");
	});

	test("detects side-effect imports but ignores type-only TypeScript imports", () => {
		expect(sourceImportsTypeScriptAtRuntime('import "typescript";')).toBe(true);
		expect(
			sourceImportsTypeScriptAtRuntime(
				'import type { SourceFile } from "typescript";',
			),
		).toBe(false);
		expect(
			sourceImportsTypeScriptAtRuntime(
				'export type { SourceFile } from "typescript";',
			),
		).toBe(false);
	});

	test("fails when a runtime-critical package keeps typescript only in devDependencies", () => {
		const policy = {
			packageDir: "packages/example-runtime",
			packageName: "@example/runtime",
			reason: "its shipped runtime uses the TypeScript compiler API",
			requiredTypeScriptImportFiles: ["src/runtime.ts"],
			runtimeSourceRoots: ["src"],
			typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.dependency,
		};

		const result = evaluateTypeScriptRuntimePackagePolicy(policy, {
			packedManifest: {
				devDependencies: {
					typescript: "^5.9.2",
				},
			},
			sourceManifest: {
				devDependencies: {
					typescript: "^5.9.2",
				},
			},
			typeScriptImportFiles: ["src/runtime.ts"],
		});

		expect(result.errors).toContain(
			"@example/runtime must keep typescript in dependencies because its shipped runtime uses the TypeScript compiler API. Found devDependencies in source package.json.",
		);
		expect(result.errors).toContain(
			"Packed @example/runtime manifest must keep typescript in dependencies because its shipped runtime uses the TypeScript compiler API. Found devDependencies.",
		);
	});

	test("fails when required runtime TypeScript import evidence is stale", () => {
		const policy = {
			packageDir: "packages/example-runtime",
			packageName: "@example/runtime",
			reason: "its shipped runtime uses the TypeScript compiler API",
			requiredTypeScriptImportFiles: ["src/runtime.ts", "src/metadata.ts"],
			runtimeSourceRoots: ["src"],
			typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.dependency,
		};

		const result = evaluateTypeScriptRuntimePackagePolicy(policy, {
			packedManifest: {
				dependencies: {
					typescript: "^5.9.2",
				},
			},
			sourceManifest: {
				dependencies: {
					typescript: "^5.9.2",
				},
			},
			typeScriptImportFiles: ["src/runtime.ts"],
		});

		expect(result.errors).toContain(
			"@example/runtime audit is stale: expected shipped runtime sources to import typescript from src/metadata.ts.",
		);
	});

	test("fails when a non-runtime package lists typescript in dependencies", () => {
		const policy = {
			packageDir: "packages/example-cli",
			packageName: "@example/cli",
			reason:
				"the published package does not import the TypeScript compiler API in shipped runtime sources",
			requiredTypeScriptImportFiles: [],
			runtimeSourceRoots: ["src"],
			typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.nonRuntime,
		};

		const result = evaluateTypeScriptRuntimePackagePolicy(policy, {
			packedManifest: {
				dependencies: {
					typescript: "^5.9.2",
				},
			},
			sourceManifest: {
				dependencies: {
					typescript: "^5.9.2",
				},
			},
			typeScriptImportFiles: [],
		});

		expect(result.errors).toContain(
			"@example/cli must not list typescript in dependencies because the published package does not import the TypeScript compiler API in shipped runtime sources.",
		);
		expect(result.errors).toContain(
			"Packed @example/cli manifest must not list typescript in dependencies because the published package does not import the TypeScript compiler API in shipped runtime sources.",
		);
	});

	test("fails when a non-runtime package starts importing typescript in shipped sources", () => {
		const policy = {
			packageDir: "packages/example-client",
			packageName: "@example/client",
			reason: "the published package does not import the TypeScript compiler API in shipped runtime sources",
			requiredTypeScriptImportFiles: [],
			runtimeSourceRoots: ["src"],
			typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.nonRuntime,
		};

		const result = evaluateTypeScriptRuntimePackagePolicy(policy, {
			packedManifest: {},
			sourceManifest: {
				devDependencies: {
					typescript: "^5.9.2",
				},
			},
			typeScriptImportFiles: ["src/index.ts"],
		});

		expect(result.errors).toContain(
			"@example/client must not import the TypeScript compiler API in shipped runtime sources; found src/index.ts.",
		);
	});
});
