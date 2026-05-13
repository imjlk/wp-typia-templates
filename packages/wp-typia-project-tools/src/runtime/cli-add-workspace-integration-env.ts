import { promises as fsp } from "node:fs";
import path from "node:path";

import {
	assertValidGeneratedSlug,
	assertValidIntegrationEnvService,
	normalizeBlockSlug,
	type IntegrationEnvServiceId,
	type RunAddIntegrationEnvCommandOptions,
} from "./cli-add-shared.js";
import {
	formatRunScript,
	type PackageManagerId,
} from "./package-managers.js";
import { pathExists, readOptionalUtf8File } from "./fs-async.js";
import { readJsonFile } from "./json-utils.js";
import { executeWorkspaceMutationPlan } from "./cli-add-workspace-mutation.js";
import { resolveWorkspaceProject } from "./workspace-project.js";
import { toTitleCase } from "./string-case.js";

interface IntegrationEnvPackageJson {
	devDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
}

/**
 * Runtime result returned after adding an integration environment starter.
 *
 * @property integrationEnvSlug Normalized slug used for generated script and
 * documentation paths.
 * @property projectDir Absolute official workspace directory that was updated.
 * @property service Canonical local service starter id selected for the scaffold.
 * @property warnings Optional non-fatal preservation notices for existing files
 * or scripts.
 * @property withReleaseZip Whether release zip packaging scripts were added.
 * @property withWpEnv Whether the generated scaffold included the wp-env preset.
 */
export interface RunAddIntegrationEnvCommandResult {
	integrationEnvSlug: string;
	projectDir: string;
	service: IntegrationEnvServiceId;
	warnings?: string[];
	withReleaseZip: boolean;
	withWpEnv: boolean;
}

const WP_ENV_PACKAGE_VERSION = "^11.2.0";

function buildWpEnvConfigSource(): string {
	return `${JSON.stringify(
		{
			$schema: "https://schemas.wp.org/trunk/wp-env.json",
			core: null,
			port: 8888,
			testsEnvironment: false,
			plugins: ["."],
			config: {
				WP_DEBUG: true,
				WP_DEBUG_LOG: true,
				WP_DEBUG_DISPLAY: false,
				SCRIPT_DEBUG: true,
				WP_ENVIRONMENT_TYPE: "local",
			},
		},
		null,
		2,
	)}\n`;
}

function buildDockerComposeSource(): string {
	return `services:
  integration-service:
    image: node:22-alpine
    working_dir: /workspace
    volumes:
      - .:/workspace
    command: >
      node -e "require('node:http').createServer((request, response) => {
        response.writeHead(request.url === '/health' ? 200 : 404, {
          'content-type': 'application/json'
        });
        response.end(JSON.stringify({
          ok: request.url === '/health',
          service: 'wp-typia-integration-starter'
        }));
      }).listen(3000, '0.0.0.0')"
    ports:
      - "3000:3000"
`;
}

function buildIntegrationSmokeScriptSource(
	integrationEnvSlug: string,
): string {
	return `import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(
	fileURLToPath(new URL("../..", import.meta.url)),
);
const ENV_FILE = path.join(ROOT_DIR, ".env");

function parseEnvValue(value) {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

function readEnvFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	return Object.fromEntries(
		fs
			.readFileSync(filePath, "utf8")
			.split(/\\r?\\n/u)
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.startsWith("#"))
			.map((line) => {
				const separatorIndex = line.indexOf("=");
				if (separatorIndex === -1) {
					return null;
				}

				return [
					line.slice(0, separatorIndex).trim(),
					parseEnvValue(line.slice(separatorIndex + 1)),
				];
			})
			.filter(Boolean),
	);
}

const envFile = readEnvFile(ENV_FILE);

function getEnv(name, fallback) {
	return process.env[name] ?? envFile[name] ?? fallback;
}

function resolveEndpointUrl(baseUrl, endpointPath) {
	const normalizedBaseUrl = new URL(baseUrl);
	if (!normalizedBaseUrl.pathname.endsWith("/")) {
		normalizedBaseUrl.pathname = \`\${normalizedBaseUrl.pathname}/\`;
	}

	const relativePath = endpointPath.replace(/^\\/+/u, "");
	return new URL(relativePath, normalizedBaseUrl);
}

async function assertJsonEndpoint(label, url) {
	const response = await fetch(url, {
		headers: {
			accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(
			\`\${label} failed at \${url} with HTTP \${response.status}.\`,
		);
	}

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		throw new Error(
			\`\${label} at \${url} did not return JSON (content-type: \${contentType || "missing"}).\`,
		);
	}

	return response.json();
}

const baseUrl = new URL(
	getEnv("WP_TYPIA_SMOKE_BASE_URL", "http://localhost:8888"),
);
const serviceUrl = getEnv("WP_TYPIA_SERVICE_URL", "").trim();

// Extend this starter with project-specific generated REST clients or schema
// checks as the workspace grows. For example, read JSON schemas under
// src/rest/<resource>/api-schemas or import TS clients through a tsx-powered
// smoke runner when you need authenticated route coverage.

await assertJsonEndpoint(
	"WordPress REST index",
	resolveEndpointUrl(baseUrl, "wp-json/"),
);

if (serviceUrl.length > 0) {
	await assertJsonEndpoint(
		"Local integration service healthcheck",
		resolveEndpointUrl(serviceUrl, "health"),
	);
}

console.log("wp-typia integration smoke passed: ${integrationEnvSlug}");
`;
}

function buildEnvExampleSource(service: IntegrationEnvServiceId): string {
	return [
		"# wp-typia integration smoke settings",
		"WP_TYPIA_SMOKE_BASE_URL=http://localhost:8888",
		"WP_TYPIA_SMOKE_USERNAME=admin",
		"WP_TYPIA_SMOKE_PASSWORD=password",
		...(service === "docker-compose"
			? [
					"",
					"# Optional docker-compose integration service starter.",
					"WP_TYPIA_SERVICE_URL=http://localhost:3000",
			  ]
			: [
					"",
					"# Set this when your smoke test needs a project-specific service.",
					"# WP_TYPIA_SERVICE_URL=http://localhost:3000",
			  ]),
		"",
	].join("\n");
}

function buildIntegrationEnvReadmeSource({
	integrationEnvSlug,
	service,
	withReleaseZip,
	withWpEnv,
}: {
	integrationEnvSlug: string;
	service: IntegrationEnvServiceId;
	withReleaseZip: boolean;
	withWpEnv: boolean;
}): string {
	const title = toTitleCase(integrationEnvSlug);
	const setupSteps = [
		"Copy `.env.example` to `.env` and adjust the URLs or credentials for your local project.",
		...(withWpEnv
			? [
					"Run `npm run wp-env:start` to start the generated WordPress environment.",
			  ]
			: [
					"Point `WP_TYPIA_SMOKE_BASE_URL` at the WordPress environment you already run locally.",
			  ]),
		...(service === "docker-compose"
			? [
					"Run `npm run service:start` if you want the placeholder docker-compose service available at `WP_TYPIA_SERVICE_URL`.",
			  ]
			: [
					"Set `WP_TYPIA_SERVICE_URL` only when your integration smoke needs a local service dependency.",
			  ]),
		`Run \`npm run smoke:${integrationEnvSlug}\` to execute the starter smoke check.`,
		...(withReleaseZip
			? [
					"Run `npm run release:zip` after smoke checks pass to build a distributable plugin zip.",
			  ]
			: []),
	];

	return `# ${title} Integration Environment

This starter keeps local WordPress integration smoke checks opt-in and editable.
It does not change default block scaffolds or require wp-env unless this add
workflow was run with \`--wp-env\`.

## Setup

${setupSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Adapting the Starter

- Extend \`scripts/integration-smoke/${integrationEnvSlug}.mjs\` with the REST,
  editor, or service assertions that matter for this project.
- Keep secrets in \`.env\`; \`.env.example\` should document only safe defaults.
- If your project uses a real service stack, replace the placeholder
  \`docker-compose.integration.yml\` service with your database, queue, API, or
  emulator containers.
- Keep the smoke script focused on high-signal integration checks so CI and
  local debugging stay fast.
${withReleaseZip ? "- Treat `release:zip:check` as a CI guard before packaging release artifacts.\n" : ""}
`;
}

async function appendMissingLines(filePath: string, lines: readonly string[]) {
	const current = (await readOptionalUtf8File(filePath)) ?? "";
	const missingLines = lines.filter(
		(line) =>
			!current.includes(`${line}\n`) && !current.endsWith(line),
	);
	if (missingLines.length === 0) {
		return;
	}

	const separator = current.length === 0 || current.endsWith("\n") ? "" : "\n";
	await fsp.mkdir(path.dirname(filePath), { recursive: true });
	await fsp.writeFile(
		filePath,
		`${current}${separator}${missingLines.join("\n")}\n`,
		"utf8",
	);
}

async function writeFileIfAbsent({
	filePath,
	source,
	warnings,
}: {
	filePath: string;
	source: string;
	warnings: string[];
}) {
	if (await pathExists(filePath)) {
		warnings.push(
			`Preserved existing ${path.basename(filePath)}; review it manually if you need different local integration settings.`,
		);
		return;
	}

	await fsp.mkdir(path.dirname(filePath), { recursive: true });
	await fsp.writeFile(filePath, source, "utf8");
}

async function writeNewScaffoldFile(filePath: string, source: string) {
	if (await pathExists(filePath)) {
		throw new Error(
			`An integration environment scaffold already exists at ${filePath}. Choose a different name.`,
		);
	}

	await fsp.mkdir(path.dirname(filePath), { recursive: true });
	await fsp.writeFile(filePath, source, "utf8");
}

function addScriptIfMissing({
	scriptName,
	scripts,
	scriptValue,
	warnings,
}: {
	scriptName: string;
	scripts: Record<string, string>;
	scriptValue: string;
	warnings: string[];
}) {
	if (scripts[scriptName] === undefined) {
		scripts[scriptName] = scriptValue;
		return;
	}

	if (scripts[scriptName] !== scriptValue) {
		warnings.push(
			`Preserved existing package script "${scriptName}"; add "${scriptValue}" manually if you want the generated integration command.`,
		);
	}
}

async function mutatePackageJson(
	projectDir: string,
	mutate: (packageJson: IntegrationEnvPackageJson) => void,
) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = await readJsonFile<IntegrationEnvPackageJson>(packageJsonPath, {
		context: "integration env package manifest",
	});

	mutate(packageJson);

	await fsp.writeFile(
		packageJsonPath,
		`${JSON.stringify(packageJson, null, "\t")}\n`,
		"utf8",
	);
}

function addIntegrationEnvPackageJsonEntries({
	integrationEnvSlug,
	packageManager,
	packageJson,
	withReleaseZip,
	service,
	warnings,
	withWpEnv,
}: {
	integrationEnvSlug: string;
	packageManager: PackageManagerId;
	packageJson: IntegrationEnvPackageJson;
	service: IntegrationEnvServiceId;
	withReleaseZip: boolean;
	warnings: string[];
	withWpEnv: boolean;
}) {
	const devDependencies = {
		...(packageJson.devDependencies ?? {}),
	};
	if (withWpEnv && devDependencies["@wordpress/env"] === undefined) {
		devDependencies["@wordpress/env"] = WP_ENV_PACKAGE_VERSION;
	}
	packageJson.devDependencies = devDependencies;
	const scripts = {
		...(packageJson.scripts ?? {}),
	};

	addScriptIfMissing({
		scriptName: `smoke:${integrationEnvSlug}`,
		scriptValue: `node scripts/integration-smoke/${integrationEnvSlug}.mjs`,
		scripts,
		warnings,
	});
	addScriptIfMissing({
		scriptName: "smoke:integration",
		scriptValue: formatRunScript(packageManager, `smoke:${integrationEnvSlug}`),
		scripts,
		warnings,
	});

	if (withWpEnv) {
		addScriptIfMissing({
			scriptName: "wp-env:start",
			scriptValue: "wp-env start",
			scripts,
			warnings,
		});
		addScriptIfMissing({
			scriptName: "wp-env:stop",
			scriptValue: "wp-env stop",
			scripts,
			warnings,
		});
		addScriptIfMissing({
			scriptName: "wp-env:reset",
			scriptValue: "wp-env destroy all && wp-env start",
			scripts,
			warnings,
		});
	}

	if (withReleaseZip) {
		addScriptIfMissing({
			scriptName: "release:zip",
			scriptValue: `${formatRunScript(packageManager, "sync-rest:package")} && ${formatRunScript(packageManager, "build")} && wp-scripts plugin-zip`,
			scripts,
			warnings,
		});
		addScriptIfMissing({
			scriptName: "release:zip:check",
			scriptValue: `${formatRunScript(packageManager, "sync-rest:package:check")} && ${formatRunScript(packageManager, "build")}`,
			scripts,
			warnings,
		});
		addScriptIfMissing({
			scriptName: "qa:check",
			scriptValue: `${formatRunScript(packageManager, "wp-typia:doctor:workspace")} && ${formatRunScript(packageManager, "release:zip:check")}`,
			scripts,
			warnings,
		});
	}

	if (service === "docker-compose") {
		addScriptIfMissing({
			scriptName: "service:start",
			scriptValue: "docker compose -f docker-compose.integration.yml up -d",
			scripts,
			warnings,
		});
		addScriptIfMissing({
			scriptName: "service:stop",
			scriptValue: "docker compose -f docker-compose.integration.yml down",
			scripts,
			warnings,
		});
	}

	packageJson.scripts = scripts;
}

/**
 * Add an opt-in local WordPress integration environment starter to an official
 * workspace.
 */
export async function runAddIntegrationEnvCommand({
	cwd = process.cwd(),
	integrationEnvName,
	service,
	withReleaseZip = false,
	withWpEnv = false,
}: RunAddIntegrationEnvCommandOptions): Promise<RunAddIntegrationEnvCommandResult> {
	const workspace = resolveWorkspaceProject(cwd);
	const integrationEnvSlug = assertValidGeneratedSlug(
		"Integration environment name",
		normalizeBlockSlug(integrationEnvName),
		"wp-typia add integration-env <name> [--wp-env] [--release-zip]",
	);
	const serviceId = assertValidIntegrationEnvService(service);
	const warnings: string[] = [];

	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const gitignorePath = path.join(workspace.projectDir, ".gitignore");
	const envExamplePath = path.join(workspace.projectDir, ".env.example");
	const wpEnvPath = path.join(workspace.projectDir, ".wp-env.json");
	const dockerComposePath = path.join(
		workspace.projectDir,
		"docker-compose.integration.yml",
	);
	const smokeDir = path.join(
		workspace.projectDir,
		"scripts",
		"integration-smoke",
	);
	const docsDir = path.join(workspace.projectDir, "docs", "integration-env");
	const smokeScriptPath = path.join(smokeDir, `${integrationEnvSlug}.mjs`);
	const docsPath = path.join(docsDir, `${integrationEnvSlug}.md`);
	const shouldRemoveSmokeDirOnRollback = !(await pathExists(smokeDir));
	const shouldRemoveDocsDirOnRollback = !(await pathExists(docsDir));

	await executeWorkspaceMutationPlan({
		filePaths: [
			packageJsonPath,
			gitignorePath,
			envExamplePath,
			...(withWpEnv ? [wpEnvPath] : []),
			...(serviceId === "docker-compose" ? [dockerComposePath] : []),
		],
		targetPaths: [
			smokeScriptPath,
			docsPath,
			...(shouldRemoveSmokeDirOnRollback ? [smokeDir] : []),
			...(shouldRemoveDocsDirOnRollback ? [docsDir] : []),
		],
		run: async () => {
			await writeNewScaffoldFile(
				smokeScriptPath,
				buildIntegrationSmokeScriptSource(integrationEnvSlug),
			);
			await writeNewScaffoldFile(
				docsPath,
				buildIntegrationEnvReadmeSource({
					integrationEnvSlug,
					service: serviceId,
					withReleaseZip,
					withWpEnv,
				}),
			);
			await appendMissingLines(envExamplePath, [
				...buildEnvExampleSource(serviceId).trimEnd().split("\n"),
			]);
			await appendMissingLines(gitignorePath, [".env", ".env.local"]);

			if (withWpEnv) {
				await writeFileIfAbsent({
					filePath: wpEnvPath,
					source: buildWpEnvConfigSource(),
					warnings,
				});
			}
			if (serviceId === "docker-compose") {
				await writeFileIfAbsent({
					filePath: dockerComposePath,
					source: buildDockerComposeSource(),
					warnings,
				});
			}

			await mutatePackageJson(workspace.projectDir, (packageJson) =>
				addIntegrationEnvPackageJsonEntries({
					integrationEnvSlug,
					packageManager: workspace.packageManager,
					packageJson,
					service: serviceId,
					withReleaseZip,
					warnings,
					withWpEnv,
				}),
			);
		},
	});

	return {
		integrationEnvSlug,
		projectDir: workspace.projectDir,
		service: serviceId,
		warnings: warnings.length > 0 ? warnings : undefined,
		withReleaseZip,
		withWpEnv,
	};
}
