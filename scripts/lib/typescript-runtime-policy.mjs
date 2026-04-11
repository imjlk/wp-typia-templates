import fs from "node:fs";
import path from "node:path";

export const TYPESCRIPT_DEPENDENCY_POLICY = {
	dependency: "dependency",
	nonRuntime: "non-runtime",
};

export const TYPESCRIPT_RUNTIME_PACKAGE_POLICIES = [
	{
		packageDir: "packages/wp-typia-block-runtime",
		packageName: "@wp-typia/block-runtime",
		reason:
			"metadata parser/analysis/core public metadata sync paths use the TypeScript compiler API at runtime",
		requiredTypeScriptImportFiles: [
			"src/metadata-analysis.ts",
			"src/metadata-parser.ts",
		],
		runtimeSourceRoots: ["src"],
		typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.dependency,
	},
	{
		packageDir: "packages/wp-typia-project-tools",
		packageName: "@wp-typia/project-tools",
		reason:
			"workspace inventory helpers used by add/doctor/migrations and exported workspace selection flows use the TypeScript compiler API at runtime",
		requiredTypeScriptImportFiles: ["src/runtime/workspace-inventory.ts"],
		runtimeSourceRoots: ["src/runtime"],
		typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.dependency,
	},
	{
		packageDir: "packages/wp-typia",
		packageName: "wp-typia",
		reason:
			"the published CLI does not import the TypeScript compiler API in shipped runtime sources",
		requiredTypeScriptImportFiles: [],
		runtimeSourceRoots: ["src"],
		typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.nonRuntime,
	},
	{
		packageDir: "packages/wp-typia-rest",
		packageName: "@wp-typia/rest",
		reason:
			"the published REST client helpers do not import the TypeScript compiler API in shipped runtime sources",
		requiredTypeScriptImportFiles: [],
		runtimeSourceRoots: ["src"],
		typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.nonRuntime,
	},
	{
		packageDir: "packages/wp-typia-api-client",
		packageName: "@wp-typia/api-client",
		reason:
			"the published transport-neutral client helpers do not import the TypeScript compiler API in shipped runtime sources",
		requiredTypeScriptImportFiles: [],
		runtimeSourceRoots: ["src"],
		typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.nonRuntime,
	},
	{
		packageDir: "packages/wp-typia-block-types",
		packageName: "@wp-typia/block-types",
		reason:
			"the published semantic type package ships declarations and runtime shims without the TypeScript compiler API",
		requiredTypeScriptImportFiles: [],
		runtimeSourceRoots: ["src"],
		typescriptPlacement: TYPESCRIPT_DEPENDENCY_POLICY.nonRuntime,
	},
];

const TYPESCRIPT_IMPORT_PATTERN =
	/\bfrom\s*["']typescript["']|\brequire\(\s*["']typescript["']\s*\)|\bimport\(\s*["']typescript["']\s*\)/u;

function toPosixRelativePath(basePath, targetPath) {
	return path.relative(basePath, targetPath).split(path.sep).join("/");
}

function walkFiles(rootDir) {
	if (!fs.existsSync(rootDir)) {
		return [];
	}

	const files = [];
	const stack = [rootDir];
	while (stack.length > 0) {
		const currentPath = stack.pop();
		if (!currentPath) {
			continue;
		}

		for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
			const absolutePath = path.join(currentPath, entry.name);
			if (entry.isDirectory()) {
				stack.push(absolutePath);
				continue;
			}

			if (
				entry.isFile() &&
				/\.(?:c|m)?tsx?$/u.test(entry.name) &&
				!entry.name.endsWith(".d.ts")
			) {
				files.push(absolutePath);
			}
		}
	}

	return files.sort((left, right) => left.localeCompare(right));
}

export function collectTypeScriptImportFiles(packageDir, runtimeSourceRoots) {
	const absolutePackageDir = path.resolve(packageDir);
	const files = new Set();

	for (const root of runtimeSourceRoots) {
		const absoluteRoot = path.join(absolutePackageDir, root);
		for (const filePath of walkFiles(absoluteRoot)) {
			const source = fs.readFileSync(filePath, "utf8");
			if (TYPESCRIPT_IMPORT_PATTERN.test(source)) {
				files.add(toPosixRelativePath(absolutePackageDir, filePath));
			}
		}
	}

	return [...files].sort((left, right) => left.localeCompare(right));
}

export function getTypeScriptDependencyPlacement(packageJson) {
	if (typeof packageJson?.dependencies?.typescript === "string") {
		return "dependencies";
	}

	if (typeof packageJson?.devDependencies?.typescript === "string") {
		return "devDependencies";
	}

	return "missing";
}

export function evaluateTypeScriptRuntimePackagePolicy(
	policy,
	{
		packedManifest,
		sourceManifest,
		typeScriptImportFiles,
	},
) {
	const errors = [];
	const sourcePlacement = getTypeScriptDependencyPlacement(sourceManifest);
	const packedPlacement = getTypeScriptDependencyPlacement(packedManifest);
	const sortedImportFiles = [...typeScriptImportFiles].sort((left, right) =>
		left.localeCompare(right),
	);

	if (policy.typescriptPlacement === TYPESCRIPT_DEPENDENCY_POLICY.dependency) {
		if (sourcePlacement !== "dependencies") {
			errors.push(
				`${policy.packageName} must keep typescript in dependencies because ${policy.reason}. Found ${sourcePlacement} in source package.json.`,
			);
		}

		if (packedPlacement !== "dependencies") {
			errors.push(
				`Packed ${policy.packageName} manifest must keep typescript in dependencies because ${policy.reason}. Found ${packedPlacement}.`,
			);
		}

		const missingRequiredFiles = policy.requiredTypeScriptImportFiles.filter(
			(filePath) => !sortedImportFiles.includes(filePath),
		);
		if (missingRequiredFiles.length > 0) {
			errors.push(
				`${policy.packageName} audit is stale: expected shipped runtime sources to import typescript from ${missingRequiredFiles.join(", ")}.`,
			);
		}
	} else {
		if (sourcePlacement === "dependencies") {
			errors.push(
				`${policy.packageName} must not list typescript in dependencies because ${policy.reason}.`,
			);
		}

		if (packedPlacement === "dependencies") {
			errors.push(
				`Packed ${policy.packageName} manifest must not list typescript in dependencies because ${policy.reason}.`,
			);
		}

		if (sortedImportFiles.length > 0) {
			errors.push(
				`${policy.packageName} must not import the TypeScript compiler API in shipped runtime sources; found ${sortedImportFiles.join(", ")}.`,
			);
		}
	}

	return {
		errors,
		packedPlacement,
		sourcePlacement,
		typeScriptImportFiles: sortedImportFiles,
	};
}
