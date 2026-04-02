import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { scaffoldProject } from "../src/runtime/index.js";
import { runScaffoldFlow } from "../src/runtime/cli-core.js";
import { copyRenderedDirectory } from "../src/runtime/template-render.js";
import {
	parseGitHubTemplateLocator,
	parseNpmTemplateLocator,
} from "../src/runtime/template-source.js";

const packageRoot = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-create-"));
const entryPath = path.join(packageRoot, "dist", "cli.js");
const createBlockExternalFixturePath = path.join(
	packageRoot,
	"tests",
	"fixtures",
	"create-block-external",
);
const createBlockSubsetFixturePath = path.join(
	packageRoot,
	"tests",
	"fixtures",
	"create-block-subset",
);
const createPackageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);
const createPackageVersion = `^${createPackageManifest.version}`;
const blockTypesPackageVersion =
	createPackageManifest.dependencies["@wp-typia/block-types"];
const restPackageVersion = createPackageManifest.dependencies["@wp-typia/rest"];

function runCli(
	command: string,
	args: string[],
	options: Parameters<typeof execFileSync>[2] = {},
) {
	return execFileSync(command, args, {
		encoding: "utf8",
		...options,
	});
}

describe("@wp-typia/create scaffolding", () => {
	afterAll(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	test("scaffoldProject creates an npm-ready basic template", async () => {
		const targetDir = path.join(tempRoot, "demo-npm");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "basic",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo npm block",
				namespace: "create-block",
				slug: "demo-npm",
				title: "Demo Npm",
			},
		});

		const packageJsonPath = path.join(targetDir, "package.json");
		const readmePath = path.join(targetDir, "README.md");

		expect(fs.existsSync(packageJsonPath)).toBe(true);
		expect(fs.existsSync(readmePath)).toBe(true);

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const readme = fs.readFileSync(readmePath, "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.tsx"), "utf8");
		const generatedHooks = fs.readFileSync(path.join(targetDir, "src", "hooks.ts"), "utf8");
		const generatedValidators = fs.readFileSync(path.join(targetDir, "src", "validators.ts"), "utf8");

		expect(packageJson.name).toBe("demo-npm");
		expect(packageJson.packageManager).toBe("npm@11.6.1");
		expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(blockTypesPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/create"]).toBe(createPackageVersion);
		expect(packageJson.scripts.build).toBe("npm run sync-types && wp-scripts build --experimental-modules");
		expect(packageJson.scripts.start).toBe("npm run sync-types && wp-scripts start --experimental-modules");
		expect(blockJson.textdomain).toBe("demo-npm");
		expect(generatedHooks).toContain("type ValidationResult");
		expect(generatedHooks).toContain("useTypiaValidation");
		expect(generatedEdit).toContain("@wp-typia/create/runtime/editor");
		expect(generatedEdit).toContain("createEditorModel");
		expect(generatedValidators).toContain("toValidationResult");
		expect(generatedValidators).toContain("createValidatedAttributeUpdater");
		expect(generatedValidators).toContain("clone");
		expect(generatedValidators).toContain("prune");
		expect(readme).toContain("npm install");
		expect(readme).toContain("npm run start");
		expect(readme).toContain("## Optional First Sync");
		expect(readme).toContain("npm run sync-types");
		expect(readme).not.toContain("npm run sync-rest");
		expect(readme).toContain("already run the relevant sync scripts");
		expect(readme).toContain("do not create migration history");
		expect(readme).not.toContain("## PHP REST Extension Points");
	});

	test("scaffoldProject creates an interactivity template with typed validation wiring", async () => {
		const targetDir = path.join(tempRoot, "demo-interactivity");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "interactivity",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo interactivity block",
				namespace: "create-block",
				slug: "demo-interactivity",
				title: "Demo Interactivity",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedHooks = fs.readFileSync(path.join(targetDir, "src", "hooks.ts"), "utf8");
		const generatedValidators = fs.readFileSync(path.join(targetDir, "src", "validators.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.tsx"), "utf8");
		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.name).toBe("demo-interactivity");
		expect(blockJson.textdomain).toBe("demo-interactivity");
		expect(generatedTypes).toContain("ValidationResult");
		expect(generatedHooks).toContain("useTypiaValidation");
		expect(generatedValidators).toContain("toValidationResult");
		expect(generatedValidators).toContain("createValidatedAttributeUpdater");
		expect(generatedValidators).toContain("clone");
		expect(generatedValidators).toContain("prune");
		expect(generatedEdit).toContain("@wp-typia/create/runtime/editor");
		expect(generatedEdit).toContain("createEditorModel");
		expect(generatedEdit).toContain("useTypiaValidation");
		expect(generatedEdit).toContain("createAttributeUpdater");
	});

	test("scaffoldProject creates a persistence template with signed public writes and explicit storage mode", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-public");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "post-meta",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "post-meta",
				description: "Demo persistence block",
				namespace: "create-block",
				persistencePolicy: "public",
				slug: "demo-persistence-public",
				title: "Demo Persistence Public",
			},
			persistencePolicy: "public",
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-persistence-public.php"), "utf8");
		const generatedApi = fs.readFileSync(path.join(targetDir, "src", "api.ts"), "utf8");
		const generatedSyncRest = fs.readFileSync(
			path.join(targetDir, "scripts", "sync-rest-contracts.ts"),
			"utf8",
		);
		const generatedRender = fs.readFileSync(path.join(targetDir, "src", "render.php"), "utf8");
		const generatedApiTypes = fs.readFileSync(
			path.join(targetDir, "src", "api-types.ts"),
			"utf8",
		);
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const restPublicHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-public.php"), "utf8");
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.name).toBe("demo-persistence-public");
		expect(packageJson.devDependencies["@wp-typia/rest"]).toBe(restPackageVersion);
		expect(packageJson.scripts.build).toBe(
			"npm run sync-types && npm run sync-rest && wp-scripts build --experimental-modules",
		);
		expect(blockJson.textdomain).toBe("demo-persistence-public");
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-public.php"))).toBe(true);
		expect(pluginBootstrap).toContain("post-meta");
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-public");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-public.php';");
		expect(pluginBootstrap).toContain("permission_callback' => 'demo_persistence_public_can_write_publicly'");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_WINDOW");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_MAX");
		expect(pluginBootstrap).not.toMatch(
			/'callback'\s*=>\s*'demo_persistence_public_handle_write_state'[\s\S]*?'permission_callback'\s*=>\s*'__return_true'/,
		);
		expect(restPublicHelper).toContain("function demo_persistence_public_verify_public_write_token");
		expect(restPublicHelper).toContain("function demo_persistence_public_consume_public_write_request_id");
		expect(restPublicHelper).toContain("function demo_persistence_public_enforce_public_write_rate_limit");
		expect(generatedApi).toContain("@wp-typia/rest");
		expect(generatedSyncRest).toContain("syncTypeSchemas");
		expect(generatedSyncRest).toContain("defineEndpointManifest");
		expect(generatedSyncRest).toContain("syncRestOpenApi");
		expect(generatedSyncRest).toContain("const REST_ENDPOINT_MANIFEST = defineEndpointManifest");
		expect(generatedSyncRest).toContain("manifest: REST_ENDPOINT_MANIFEST");
		expect(generatedSyncRest).not.toContain("const CONTRACTS =");
		expect(generatedSyncRest).not.toContain("const ENDPOINTS =");
		expect(generatedSyncRest).toContain("src/api.openapi.json");
		expect(generatedSyncRest).not.toContain("openApiInfo: REST_ENDPOINT_MANIFEST.info");
		expect(generatedRender).toContain("publicWriteToken");
		expect(generatedApiTypes).toContain("publicWriteRequestId?: string");
		expect(generatedTypes).toContain("persistencePolicy: 'authenticated' | 'public';");
		expect(readme).toContain("npm run sync-types");
		expect(readme).toContain("npm run sync-rest");
		expect(readme).toContain("src/api-types.ts");
		expect(readme).toContain("per-request ids, and coarse rate limiting by default");
		expect(readme).toContain("## PHP REST Extension Points");
		expect(readme).toContain("Edit `demo-persistence-public.php`");
		expect(readme).toContain("Edit `inc/rest-auth.php` or `inc/rest-public.php` when you need to customize write permissions or token/request-id/nonce checks");
		expect(pluginBootstrap).toContain("Customize storage helpers");
		expect(pluginBootstrap).toContain("Route handlers are the main product-level extension point");
		expect(restPublicHelper).toContain("Customize the public write gate here");
	});

	test("scaffoldProject creates a persistence template with authenticated writes by default", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-authenticated");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "custom-table",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "custom-table",
				description: "Demo authenticated persistence block",
				namespace: "create-block",
				persistencePolicy: "authenticated",
				slug: "demo-persistence-authenticated",
				title: "Demo Persistence Authenticated",
			},
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-authenticated.php"),
			"utf8",
		);
		const restAuthHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-auth.php"), "utf8");
		const generatedRender = fs.readFileSync(path.join(targetDir, "src", "render.php"), "utf8");
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.name).toBe("demo-persistence-authenticated");
		expect(blockJson.textdomain).toBe("demo-persistence-authenticated");
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-auth.php"))).toBe(true);
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-authenticated");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-auth.php';");
		expect(pluginBootstrap).toContain("permission_callback' => 'demo_persistence_authenticated_can_write_authenticated'");
		expect(pluginBootstrap).not.toMatch(
			/'callback'\s*=>\s*'demo_persistence_authenticated_handle_write_state'[\s\S]*?'permission_callback'\s*=>\s*'__return_true'/,
		);
		expect(restAuthHelper).toContain("function demo_persistence_authenticated_can_write_authenticated");
		expect(generatedRender).toContain("Sign in to persist this counter.");
		expect(generatedTypes).toContain("persistencePolicy: 'authenticated' | 'public';");
		expect(readme).toContain("## PHP REST Extension Points");
		expect(readme).toContain("Edit `demo-persistence-authenticated.php`");
		expect(restAuthHelper).toContain("Customize authenticated write policy here");
	});

	test("scaffoldProject supports explicit text-domain overrides on persistence templates", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-text-domain");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "custom-table",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "custom-table",
				description: "Demo persistence text domain block",
				namespace: "create-block",
				persistencePolicy: "authenticated",
				slug: "demo-persistence-text-domain",
				textDomain: "demo-custom-text-domain",
				title: "Demo Persistence Text Domain",
			},
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-text-domain.php"),
			"utf8",
		);

		expect(blockJson.name).toBe("create-block/demo-persistence-text-domain");
		expect(blockJson.textdomain).toBe("demo-custom-text-domain");
		expect(pluginBootstrap).toContain("Text Domain:       demo-custom-text-domain");
		expect(pluginBootstrap).toContain(
			"function demo_persistence_text_domain_get_counter",
		);
	});

	test("scaffoldProject supports explicit php-prefix overrides on persistence templates", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-php-prefix");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "custom-table",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "custom-table",
				description: "Demo persistence php prefix block",
				namespace: "create-block",
				persistencePolicy: "authenticated",
				phpPrefix: "custom_counter_prefix",
				slug: "demo-persistence-php-prefix",
				title: "Demo Persistence Php Prefix",
			},
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-php-prefix.php"),
			"utf8",
		);

		expect(blockJson.textdomain).toBe("demo-persistence-php-prefix");
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-php-prefix");
		expect(pluginBootstrap).toContain("function custom_counter_prefix_get_counter");
		expect(pluginBootstrap).toContain("custom_counter_prefix_storage_version");
	});

	test("scaffoldProject rejects overly long php-prefix overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-php-prefix-too-long");

		await expect(
			scaffoldProject({
				projectDir: targetDir,
				templateId: "persistence",
				dataStorageMode: "custom-table",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					dataStorageMode: "custom-table",
					description: "Demo persistence php prefix length guard",
					namespace: "create-block",
					persistencePolicy: "authenticated",
					phpPrefix: "a".repeat(51),
					slug: "demo-persistence-php-prefix-too-long",
					title: "Demo Persistence Php Prefix Too Long",
				},
			}),
		).rejects.toThrow("Use 50 characters or fewer");
	});

	test("scaffoldProject supports combined identifier overrides on persistence templates", async () => {
		const targetDir = path.join(tempRoot, "demo-persistence-identifiers");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "persistence",
			dataStorageMode: "post-meta",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "post-meta",
				description: "Demo persistence identifier overrides",
				namespace: "experiments",
				persistencePolicy: "public",
				phpPrefix: "ab_test_metrics",
				slug: "demo-persistence-identifiers",
				textDomain: "demo-persistence-text",
				title: "Demo Persistence Identifiers",
			},
			persistencePolicy: "public",
		});

		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-persistence-identifiers.php"),
			"utf8",
		);
		const restPublicHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-public.php"), "utf8");

		expect(blockJson.name).toBe("experiments/demo-persistence-identifiers");
		expect(blockJson.textdomain).toBe("demo-persistence-text");
		expect(pluginBootstrap).toContain("Text Domain:       demo-persistence-text");
		expect(pluginBootstrap).toContain("function ab_test_metrics_get_counter");
		expect(restPublicHelper).toContain("function ab_test_metrics_create_public_write_token");
	});

	test("scaffoldProject creates a pure compound template with parent and hidden child blocks", async () => {
		const targetDir = path.join(tempRoot, "demo-compound");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo compound block",
				namespace: "create-block",
				slug: "demo-compound",
				title: "Demo Compound",
			},
		});

			const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
			const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-compound.php"), "utf8");
			const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
			const blockConfig = fs.readFileSync(path.join(targetDir, "scripts", "block-config.ts"), "utf8");
			const parentBlockJson = JSON.parse(
				fs.readFileSync(path.join(targetDir, "src", "blocks", "demo-compound", "block.json"), "utf8"),
			);
		const childBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-item", "block.json"),
				"utf8",
			),
		);

		expect(packageJson.scripts.build).toBe("npm run sync-types && wp-scripts build --experimental-modules");
		expect(pluginBootstrap).toContain("build/blocks");
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-auth.php"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-public.php"))).toBe(false);
		expect(parentBlockJson.name).toBe("create-block/demo-compound");
		expect(childBlockJson.parent).toEqual(["create-block/demo-compound"]);
		expect(childBlockJson.supports.inserter).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "scripts", "sync-rest-contracts.ts"))).toBe(false);
		expect(fs.existsSync(path.join(targetDir, "src", "blocks", "demo-compound", "api.openapi.json"))).toBe(
			false,
		);
			expect(readme).toContain("npm run sync-types");
			expect(readme).not.toContain("npm run sync-rest");
			expect(readme).toContain("src/blocks/*/types.ts");
			expect(readme).not.toContain("## PHP REST Extension Points");
			expect(blockConfig).not.toContain("restManifest");
		});

	test("compound scaffolds enable authenticated persistence when only data storage is provided", async () => {
		const targetDir = path.join(tempRoot, "demo-compound-storage");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			dataStorageMode: "post-meta",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				dataStorageMode: "post-meta",
				description: "Demo compound persistence block",
				namespace: "create-block",
				slug: "demo-compound-storage",
				title: "Demo Compound Storage",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-compound-storage.php"), "utf8");
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
		const generatedSyncRest = fs.readFileSync(
			path.join(targetDir, "scripts", "sync-rest-contracts.ts"),
			"utf8",
		);
		const generatedBlockConfig = fs.readFileSync(
			path.join(targetDir, "scripts", "block-config.ts"),
			"utf8",
		);
		const parentBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-storage", "block.json"),
				"utf8",
			),
		);

		expect(packageJson.devDependencies["@wp-typia/rest"]).toBe(restPackageVersion);
		expect(packageJson.scripts.build).toBe(
			"npm run sync-types && npm run sync-rest && wp-scripts build --experimental-modules",
		);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-auth.php"))).toBe(true);
		expect(pluginBootstrap).toContain("can_write_authenticated");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
			expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-auth.php';");
			expect(parentBlockJson.render).toBe("file:./render.php");
			expect(parentBlockJson.viewScriptModule).toBe("file:./interactivity.js");
			expect(generatedSyncRest).toContain("syncRestOpenApi");
			expect(generatedSyncRest).toContain("manifest: block.restManifest");
			expect(generatedBlockConfig).toContain("src/blocks/demo-compound-storage/api.openapi.json");
			expect(generatedBlockConfig).toContain("restManifest: defineEndpointManifest");
			expect(generatedBlockConfig).not.toContain("contracts: [");
			expect(generatedBlockConfig).not.toContain("openApiInfo:");
			expect(generatedBlockConfig.match(/restManifest: defineEndpointManifest/g)).toHaveLength(1);
			expect(readme).toContain("npm run sync-rest");
			expect(readme).toContain("src/blocks/*/api-types.ts");
		expect(readme).toContain("## PHP REST Extension Points");
		expect(readme).toContain("The hidden child block does not own REST routes or storage.");
		expect(pluginBootstrap).toContain("Customize storage helpers");
	});

	test("compound scaffolds enable public persistence when only a public policy is provided", async () => {
		const targetDir = path.join(tempRoot, "demo-compound-public");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo public compound block",
				namespace: "create-block",
				persistencePolicy: "public",
				slug: "demo-compound-public",
				title: "Demo Compound Public",
			},
			persistencePolicy: "public",
		});

		const pluginBootstrap = fs.readFileSync(path.join(targetDir, "demo-compound-public.php"), "utf8");
		const generatedApiTypes = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-public", "api-types.ts"),
			"utf8",
		);
		const restPublicHelper = fs.readFileSync(path.join(targetDir, "inc", "rest-public.php"), "utf8");
		const parentRender = fs.readFileSync(
			path.join(targetDir, "src", "blocks", "demo-compound-public", "render.php"),
			"utf8",
		);
		const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");

		expect(fs.existsSync(path.join(targetDir, "inc", "rest-shared.php"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "inc", "rest-public.php"))).toBe(true);
		expect(pluginBootstrap).toContain("permission_callback' => 'demo_compound_public_can_write_publicly'");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-shared.php';");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-public.php';");
		expect(pluginBootstrap).toContain("HOUR_IN_SECONDS");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_WINDOW");
		expect(pluginBootstrap).toContain("PUBLIC_WRITE_RATE_LIMIT_MAX");
		expect(pluginBootstrap).not.toMatch(
			/'callback'\s*=>\s*'demo_compound_public_handle_write_state'[\s\S]*?'permission_callback'\s*=>\s*'__return_true'/,
		);
		expect(restPublicHelper).toContain("function demo_compound_public_verify_public_write_token");
		expect(restPublicHelper).toContain("function demo_compound_public_consume_public_write_request_id");
		expect(parentRender).toContain("publicWriteToken");
		expect(generatedApiTypes).toContain("publicWriteRequestId?: string");
		expect(restPublicHelper).toContain("Customize the public write gate here");
		expect(readme).toContain("per-request ids, and coarse rate limiting by default");
	});

	test("compound scaffolds honor namespace, text-domain, and php-prefix overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-compound-identifiers");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "compound",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo compound identifier overrides",
				namespace: "experiments",
				phpPrefix: "compound_panel_group",
				slug: "demo-compound-identifiers",
				textDomain: "demo-compound-text",
				title: "Demo Compound Identifiers",
			},
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-compound-identifiers.php"),
			"utf8",
		);
		const parentBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-identifiers", "block.json"),
				"utf8",
			),
		);
		const childBlockJson = JSON.parse(
			fs.readFileSync(
				path.join(targetDir, "src", "blocks", "demo-compound-identifiers-item", "block.json"),
				"utf8",
			),
		);

		expect(parentBlockJson.name).toBe("experiments/demo-compound-identifiers");
		expect(parentBlockJson.textdomain).toBe("demo-compound-text");
		expect(childBlockJson.name).toBe("experiments/demo-compound-identifiers-item");
		expect(childBlockJson.textdomain).toBe("demo-compound-text");
		expect(pluginBootstrap).toContain("Text Domain:       demo-compound-text");
		expect(pluginBootstrap).toContain("function compound_panel_group_register_blocks");
	});

	test("runScaffoldFlow defaults persistence scaffolds to custom-table and authenticated in non-interactive mode", async () => {
		const projectInput = "demo-persistence-default";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			templateId: "persistence",
			yes: true,
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(flow.projectDir, `${projectInput}.php`),
			"utf8",
		);

		expect(flow.result.variables.dataStorageMode).toBe("custom-table");
		expect(flow.result.variables.persistencePolicy).toBe("authenticated");
		expect(pluginBootstrap).toContain("custom-table");
		expect(flow.nextSteps).toEqual([
			`cd ${projectInput}`,
			"npm install",
			"npm run start",
		]);
		expect(flow.optionalOnboarding.steps).toEqual([
			"npm run sync-types",
			"npm run sync-rest",
		]);
	});

	test("runScaffoldFlow accepts prompted persistence policy selections in interactive mode", async () => {
		const projectInput = "demo-persistence-prompted";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			isInteractive: true,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			promptText: async (_message, defaultValue) => defaultValue,
			selectDataStorage: async () => "post-meta",
			selectPersistencePolicy: async () => "public",
			templateId: "persistence",
		});

		const pluginBootstrap = fs.readFileSync(
			path.join(flow.projectDir, `${projectInput}.php`),
			"utf8",
		);
		const restPublicHelper = fs.readFileSync(
			path.join(flow.projectDir, "inc", "rest-public.php"),
			"utf8",
		);

		expect(flow.result.variables.dataStorageMode).toBe("post-meta");
		expect(flow.result.variables.persistencePolicy).toBe("public");
		expect(pluginBootstrap).toContain("require_once __DIR__ . '/inc/rest-public.php';");
		expect(restPublicHelper).toContain("function demo_persistence_prompted_verify_public_write_token");
		expect(flow.optionalOnboarding.steps).toEqual([
			"npm run sync-types",
			"npm run sync-rest",
		]);
	});

	test("runScaffoldFlow keeps compound next steps minimal while surfacing optional sync guidance", async () => {
		const projectInput = "demo-compound-flow";
		const flow = await runScaffoldFlow({
			cwd: tempRoot,
			noInstall: true,
			packageManager: "npm",
			projectInput,
			templateId: "compound",
			yes: true,
		});

		expect(flow.nextSteps).toEqual([
			`cd ${projectInput}`,
			"npm install",
			"npm run start",
		]);
		expect(flow.optionalOnboarding.steps).toEqual([ "npm run sync-types" ]);
		expect(flow.optionalOnboarding.note).toContain("do not create migration history");
	});

	test("runScaffoldFlow rejects unsupported persistence policies", async () => {
		const projectInput = "demo-persistence-invalid-policy";

		await expect(
			runScaffoldFlow({
				cwd: tempRoot,
				noInstall: true,
				packageManager: "npm",
				projectInput,
				templateId: "persistence",
				persistencePolicy: "invalid",
				yes: true,
			}),
		).rejects.toThrow(
			'Unsupported persistence policy "invalid". Expected one of: authenticated, public',
		);
	});

	test("runScaffoldFlow rejects removed built-in template ids", async () => {
		await expect(
			runScaffoldFlow({
				cwd: tempRoot,
				noInstall: true,
				packageManager: "npm",
				projectInput: "demo-removed-template",
				templateId: "data",
				yes: true,
			}),
		).rejects.toThrow(
			'Built-in template "data" was removed. Use --template persistence --persistence-policy public instead.',
		);
	});

	test("local create-block subset paths scaffold into a pnpm-ready wp-typia project", async () => {
		const targetDir = path.join(tempRoot, "demo-remote");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockSubsetFixturePath,
			packageManager: "pnpm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo remote block",
				namespace: "create-block",
				slug: "demo-remote",
				title: "Demo Remote",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedIndex = fs.readFileSync(path.join(targetDir, "src", "index.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.packageManager).toBe("pnpm@8.3.1");
		expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(blockTypesPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/create"]).toBe(createPackageVersion);
		expect(packageJson.scripts.build).toBe(
			"pnpm run sync-types && wp-scripts build --experimental-modules",
		);
		expect(generatedTypes).toContain("export interface DemoRemoteAttributes");
		expect(generatedTypes).toContain("\"content\"?: string & tags.Default<\"\">");
		expect(generatedIndex).toContain('import metadata from "./block.json";');
		expect(generatedBlockJson.name).toBe("create-block/demo-remote");
		expect(generatedBlockJson.title).toBe("Demo Remote");
		expect(generatedBlockJson.supports.align).toEqual(["wide", "full"]);
	});

	test("local official external template configs scaffold with the default variant", async () => {
		const targetDir = path.join(tempRoot, "demo-external-default");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockExternalFixturePath,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo external block",
				namespace: "create-block",
				slug: "demo-external-default",
				title: "Demo External Default",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(result.selectedVariant).toBe("standard");
		expect(result.warnings).toContain(
			'Ignoring external template config key "pluginTemplatesPath": wp-typia owns package/tooling/sync setup for generated projects, so this external template setting is ignored.',
		);
		expect(fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
		expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"standard">');
		expect(generatedTypes).toContain('"transformedLabel"?: string & tags.Default<"standard-transformed">');
		expect(generatedEdit).toContain("template-standard");
		expect(generatedEdit).toContain("standard-transformed");
		expect(generatedBlockJson.supports.multiple).toBe(false);
	});

	test("local official external template configs honor --variant overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-external-hero");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockExternalFixturePath,
			variant: "hero",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo external variant block",
				namespace: "create-block",
				slug: "demo-external-hero",
				title: "Demo External Hero",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(result.selectedVariant).toBe("hero");
		expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
		expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"hero">');
		expect(generatedTypes).toContain('"transformedLabel"?: string & tags.Default<"hero-transformed">');
		expect(generatedEdit).toContain("template-hero");
		expect(generatedBlockJson.supports.multiple).toBe(true);
	});

	test("rendered template paths cannot escape the target directory", async () => {
		const templateRoot = fs.mkdtempSync(path.join(tempRoot, "render-escape-template-"));
		const targetDir = fs.mkdtempSync(path.join(tempRoot, "render-escape-target-"));

		fs.writeFileSync(
			path.join(templateRoot, "{{fileName}}.mustache"),
			"escaped",
			"utf8",
		);

		await expect(
			copyRenderedDirectory(templateRoot, targetDir, {
				fileName: "../outside",
			}),
		).rejects.toThrow("Rendered template path escapes target directory");
	});

	test("rejects unsupported variant usage for built-in templates", async () => {
		await expect(
			scaffoldProject({
				projectDir: path.join(tempRoot, "demo-invalid-built-in-variant"),
				templateId: "basic",
				variant: "hero",
				packageManager: "bun",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Invalid built-in variant usage",
					namespace: "create-block",
					slug: "invalid-built-in-variant",
					title: "Invalid Built In Variant",
				},
			}),
		).rejects.toThrow('--variant is only supported for official external template configs.');
	});

	test("rejects unsupported variant usage for raw create-block subset sources", async () => {
		await expect(
			scaffoldProject({
				projectDir: path.join(tempRoot, "demo-invalid-remote-variant"),
				templateId: createBlockSubsetFixturePath,
				variant: "hero",
				packageManager: "bun",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Invalid remote variant usage",
					namespace: "create-block",
					slug: "invalid-remote-variant",
					title: "Invalid Remote Variant",
				},
			}),
		).rejects.toThrow('--variant is only supported for official external template configs.');
	});

	test("node entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("node", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("node", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("interactivity");
		expect(templatesOutput).toContain("persistence");
		expect(templatesOutput).toContain("compound");
		expect(templatesOutput).not.toContain("advanced");
		expect(templatesOutput).not.toContain("full");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("bun entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("bun", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("bun", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("interactivity");
		expect(templatesOutput).toContain("persistence");
		expect(templatesOutput).toContain("compound");
		expect(templatesOutput).not.toContain("advanced");
		expect(templatesOutput).not.toContain("full");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("parses github template locators with refs", () => {
		expect(parseGitHubTemplateLocator("github:owner/repo/templates/card#main")).toEqual({
			owner: "owner",
			repo: "repo",
			ref: "main",
			sourcePath: "templates/card",
		});
	});

	test("parses npm template locators for package specs", () => {
		expect(parseNpmTemplateLocator("@scope/template-package@^1.2.0")).toEqual({
			fetchSpec: "^1.2.0",
			name: "@scope/template-package",
			raw: "@scope/template-package@^1.2.0",
			type: "range",
		});
	});

	test("npm package template specs can scaffold through the registry resolver", async () => {
		const npmTemplateRoot = fs.mkdtempSync(path.join(tempRoot, "npm-template-source-"));
		const registryBase = "https://registry.npmjs.org";
		const tarballUrl = `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`;
		const metadataUrl = `${registryBase}/${encodeURIComponent("@demo/create-block-template")}`;
		const tarballPath = path.join(npmTemplateRoot, "create-block-template-1.2.3.tgz");
		const packageDir = path.join(npmTemplateRoot, "package");
		const originalFetch = globalThis.fetch;
		const originalRegistry = process.env.NPM_CONFIG_REGISTRY;
		const targetDir = path.join(tempRoot, "demo-external-npm");

		fs.mkdirSync(packageDir, { recursive: true });
		fs.cpSync(createBlockExternalFixturePath, packageDir, { recursive: true });
		fs.writeFileSync(
			path.join(packageDir, "package.json"),
			JSON.stringify(
				{
					name: "@demo/create-block-template",
					version: "1.2.3",
				},
				null,
				2,
			),
		);
		execFileSync("tar", ["-czf", tarballPath, "-C", npmTemplateRoot, "package"]);
		process.env.NPM_CONFIG_REGISTRY = registryBase;

		globalThis.fetch = (async (input) => {
			const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (requestUrl === metadataUrl) {
				return new Response(
					JSON.stringify({
						"dist-tags": {
							latest: "1.2.3",
						},
						versions: {
							"1.2.3": {
								dist: {
									tarball: tarballUrl,
								},
							},
						},
					}),
					{
						status: 200,
						headers: {
							"content-type": "application/json",
						},
					},
				);
			}

			if (requestUrl === tarballUrl) {
				return new Response(fs.readFileSync(tarballPath), { status: 200 });
			}

			throw new Error(`Unexpected fetch URL in npm template resolver test: ${requestUrl}`);
		}) as typeof fetch;

		try {
			const result = await scaffoldProject({
				projectDir: targetDir,
				templateId: "@demo/create-block-template@^1.2.0",
				variant: "hero",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Demo external npm template",
					namespace: "create-block",
					slug: "demo-external-npm",
					title: "Demo External Npm",
				},
			});

			const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
			expect(result.selectedVariant).toBe("hero");
			expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"hero">');
			expect(fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
			if (originalRegistry === undefined) {
				delete process.env.NPM_CONFIG_REGISTRY;
			} else {
				process.env.NPM_CONFIG_REGISTRY = originalRegistry;
			}
		}
	});

	test("npm package template specs reject explicit ranges that do not match published versions", async () => {
		const registryBase = "https://registry.npmjs.org";
		const metadataUrl = `${registryBase}/${encodeURIComponent("@demo/create-block-template")}`;
		const originalFetch = globalThis.fetch;
		const originalRegistry = process.env.NPM_CONFIG_REGISTRY;

		process.env.NPM_CONFIG_REGISTRY = registryBase;
		globalThis.fetch = (async (input) => {
			const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (requestUrl === metadataUrl) {
				return new Response(
					JSON.stringify({
						"dist-tags": {
							latest: "1.2.3",
						},
						versions: {
							"1.2.3": {
								dist: {
									tarball: `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`,
								},
							},
						},
					}),
					{
						status: 200,
						headers: {
							"content-type": "application/json",
						},
					},
				);
			}

			throw new Error(`Unexpected fetch URL in npm template resolver range test: ${requestUrl}`);
		}) as typeof fetch;

		try {
			await expect(
				scaffoldProject({
					projectDir: path.join(tempRoot, "demo-external-range-miss"),
					templateId: "@demo/create-block-template@^9.0.0",
					packageManager: "npm",
					noInstall: true,
					answers: {
						author: "Test Runner",
						description: "Demo external npm range miss",
						namespace: "create-block",
						slug: "demo-external-range-miss",
						title: "Demo External Range Miss",
					},
				}),
			).rejects.toThrow('Requested "^9.0.0"');
		} finally {
			globalThis.fetch = originalFetch;
			if (originalRegistry === undefined) {
				delete process.env.NPM_CONFIG_REGISTRY;
			} else {
				process.env.NPM_CONFIG_REGISTRY = originalRegistry;
			}
		}
	});

	test("bun entry translates kebab-case identifier flags while scaffolding", () => {
		const targetDir = path.join(tempRoot, "demo-bun-entry");

		runCli("bun", [
			entryPath,
			targetDir,
			"--template",
			"persistence",
			"--namespace",
			"experiments",
			"--text-domain",
			"demo-bun-entry-text",
			"--php-prefix",
			"demo_bun_entry_php",
			"--yes",
			"--no-install",
			"--package-manager",
			"bun",
		], {
			stdio: "inherit",
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);
		const pluginBootstrap = fs.readFileSync(
			path.join(targetDir, "demo-bun-entry.php"),
			"utf8",
		);

		expect(packageJson.packageManager).toBe("bun@1.3.10");
		expect(blockJson.name).toBe("experiments/demo-bun-entry");
		expect(blockJson.textdomain).toBe("demo-bun-entry-text");
		expect(pluginBootstrap).toContain("Text Domain:       demo-bun-entry-text");
		expect(pluginBootstrap).toContain("function demo_bun_entry_php_get_counter");
		expect(fs.existsSync(path.join(targetDir, "README.md"))).toBe(true);
	});

	test("node entry requires --package-manager with --yes", () => {
		expect(() => {
			runCli("node", [
				entryPath,
				"demo-missing-pm",
				"--template",
				"basic",
				"--yes",
				"--no-install",
			], {
				stdio: "pipe",
			});
		}).toThrow();
	});

	test("node entry rejects missing values for identifier override flags", () => {
		expect(() => {
			runCli("node", [
				entryPath,
				"demo-missing-namespace",
				"--template",
				"basic",
				"--namespace",
				"--yes",
				"--no-install",
				"--package-manager",
				"npm",
			], {
				stdio: "pipe",
			});
		}).toThrow();
	});
});
