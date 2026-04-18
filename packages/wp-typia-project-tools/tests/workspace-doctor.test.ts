import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { cleanupScaffoldTempRoot, createScaffoldTempRoot, entryPath, getCommandErrorMessage, linkWorkspaceNodeModules, runCli, scaffoldOfficialWorkspace, stripPhpFunction, workspaceTemplatePackageManifest } from "./helpers/scaffold-test-harness.js";
import { scaffoldProject } from "../src/runtime/index.js";
import { getDoctorChecks } from "../src/runtime/cli-core.js";
import { updateWorkspaceInventorySource } from "../src/runtime/workspace-inventory.js";

describe("@wp-typia/project-tools workspace doctor", () => {
  const tempRoot = createScaffoldTempRoot("wp-typia-workspace-doctor-");
  const humanCliEnv = {
    ...process.env,
    AGENT: "",
    AMP_CURRENT_THREAD_ID: "",
    CLAUDECODE: "",
    CLAUDE_CODE: "",
    CODEX_CI: "",
    CODEX_SANDBOX: "",
    CODEX_THREAD_ID: "",
    CURSOR_AGENT: "",
    GEMINI_CLI: "",
    OPENCODE: "",
  } satisfies NodeJS.ProcessEnv;

  afterAll(() => {
    cleanupScaffoldTempRoot(tempRoot);
  });

test("doctor reports environment-only scope outside official workspace roots", async () => {
  const targetDir = path.join(tempRoot, "doctor-environment-only");
  fs.mkdirSync(targetDir, { recursive: true });

  const checks = await getDoctorChecks(targetDir);
  const scopeCheck = checks.find((check) => check.label === "Doctor scope");

  expect(scopeCheck?.status).toBe("pass");
  expect(scopeCheck?.detail).toContain("only covered environment readiness");
  expect(scopeCheck?.detail).toContain("workspace root");
  expect(
    checks.some((check) => check.label === "Workspace package metadata")
  ).toBe(false);
});

test("doctor reports invalid nearby workspace metadata before workspace checks", async () => {
  const targetDir = path.join(tempRoot, "doctor-invalid-workspace-metadata");
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: "invalid-workspace-metadata",
        private: true,
        wpTypia: {
          projectType: "workspace",
        },
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const checks = await getDoctorChecks(targetDir);
  const scopeCheck = checks.find((check) => check.label === "Doctor scope");
  const metadataCheck = checks.find(
    (check) => check.label === "Workspace package metadata"
  );

  expect(scopeCheck?.status).toBe("fail");
  expect(scopeCheck?.detail).toContain("workspace diagnostics could not continue");
  expect(scopeCheck?.detail).toContain("rerun `wp-typia doctor`");
  expect(metadataCheck?.status).toBe("fail");
  expect(metadataCheck?.detail).toContain(
    "Invalid wp-typia workspace metadata"
  );
});

test("doctor accepts workspaces that keep binding registries in src/bindings/index.js", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-binding-source-index-js"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace binding index js",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-binding-source-index-js",
      textDomain: "demo-space",
      title: "Demo Workspace Binding Source Index Js",
    },
  });

  linkWorkspaceNodeModules(targetDir);
  runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
    cwd: targetDir,
  });

  const bindingsTsPath = path.join(targetDir, "src", "bindings", "index.ts");
  const bindingsJsPath = path.join(targetDir, "src", "bindings", "index.js");
  fs.renameSync(bindingsTsPath, bindingsJsPath);

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = JSON.parse(doctorOutput) as {
    checks: Array<{ detail: string; label: string; status: string }>;
  };

  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Binding sources index"
    )?.status
  ).toBe("pass");
}, 15_000);

test("binding source workflow preserves an existing src/bindings/index.js registry", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-binding-source-existing-js-index"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace binding existing js index",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-binding-source-existing-js-index",
      textDomain: "demo-space",
      title: "Demo Workspace Binding Existing Js Index",
    },
  });

  linkWorkspaceNodeModules(targetDir);
  runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
    cwd: targetDir,
  });

  const bindingsTsPath = path.join(targetDir, "src", "bindings", "index.ts");
  const bindingsJsPath = path.join(targetDir, "src", "bindings", "index.js");
  fs.renameSync(bindingsTsPath, bindingsJsPath);

  runCli("node", [entryPath, "add", "binding-source", "news-data"], {
    cwd: targetDir,
  });

  expect(fs.existsSync(bindingsTsPath)).toBe(false);
  expect(fs.existsSync(bindingsJsPath)).toBe(true);
  const bindingsIndexSource = fs.readFileSync(bindingsJsPath, "utf8");
  expect(bindingsIndexSource).toContain("import './hero-data/editor';");
  expect(bindingsIndexSource).toContain("import './news-data/editor';");
}, 15_000);

test("binding source workflow repairs missing bootstrap functions even when hooks remain", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-binding-source-bootstrap-repair"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace binding bootstrap repair",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-binding-source-bootstrap-repair",
      textDomain: "demo-space",
      title: "Demo Workspace Binding Bootstrap Repair",
    },
  });

  linkWorkspaceNodeModules(targetDir);
  runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
    cwd: targetDir,
  });

  const bootstrapPath = path.join(
    targetDir,
    "demo-workspace-binding-source-bootstrap-repair.php"
  );
  const brokenBootstrap = `${stripPhpFunction(
    stripPhpFunction(
      fs.readFileSync(bootstrapPath, "utf8"),
      "demo_space_register_binding_sources"
    ),
    "demo_space_enqueue_binding_sources_editor"
  ).trimEnd()}\n?>\n`;
  fs.writeFileSync(bootstrapPath, brokenBootstrap, "utf8");

  runCli("node", [entryPath, "add", "binding-source", "news-data"], {
    cwd: targetDir,
  });

  const repairedBootstrap = fs.readFileSync(bootstrapPath, "utf8");
  expect(
    repairedBootstrap.match(
      /function\s+demo_space_register_binding_sources\s*\(/gu
    )?.length
  ).toBe(1);
  expect(
    repairedBootstrap.match(
      /function\s+demo_space_enqueue_binding_sources_editor\s*\(/gu
    )?.length
  ).toBe(1);
  expect(
    repairedBootstrap.match(
      /add_action\( 'init', 'demo_space_register_binding_sources', 20 \);/gu
    )?.length
  ).toBe(1);
  expect(
    repairedBootstrap.match(
      /add_action\( 'enqueue_block_editor_assets', 'demo_space_enqueue_binding_sources_editor' \);/gu
    )?.length
  ).toBe(1);
  expect(repairedBootstrap.trimEnd().endsWith("?>")).toBe(true);
  expect(
    repairedBootstrap.slice(repairedBootstrap.lastIndexOf("?>") + 2).trim()
  ).toBe("");
  expect(repairedBootstrap).toContain("src/bindings/*/server.php");
  expect(repairedBootstrap).toContain("build/bindings/index.js");
}, 15_000);

test("workspace inventory repair avoids duplicating existing section constants", () => {
  const repairedSource = updateWorkspaceInventorySource(
    `export const VARIATIONS: WorkspaceVariationConfig[] = [
\t// wp-typia add variation entries
];

export interface WorkspacePatternConfig {
\tfile: string;
\tslug: string;
}

export const BINDING_SOURCES: WorkspaceBindingSourceConfig[] = [
\t// wp-typia add binding-source entries
];
`,
    {
      patternEntries: ['\t{ file: "src/patterns/hero.php", slug: "hero" },'],
      variationEntries: [
        '\t{ block: "counter-card", file: "src/blocks/counter-card/variations/hero.ts", slug: "hero" },',
      ],
      bindingSourceEntries: [
        '\t{ editorFile: "src/bindings/hero/editor.ts", serverFile: "src/bindings/hero/server.php", slug: "hero" },',
      ],
    }
  );

  expect(repairedSource.match(/export const VARIATIONS\b/gu)?.length).toBe(1);
  expect(repairedSource.match(/export const PATTERNS\b/gu)?.length).toBe(1);
  expect(
    repairedSource.match(/export const BINDING_SOURCES\b/gu)?.length
  ).toBe(1);
  expect(repairedSource).toContain(
    "export interface WorkspaceVariationConfig"
  );
  expect(repairedSource).toContain("export interface WorkspacePatternConfig");
  expect(repairedSource).toContain(
    "export interface WorkspaceBindingSourceConfig"
  );
  expect(repairedSource).toContain('slug: "hero"');
});

test("doctor passes on a healthy multi-block workspace", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-doctor-multi-block");

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor multi block",
    slug: "demo-workspace-doctor-multi-block",
    title: "Demo Workspace Doctor Multi Block",
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );
  runCli(
    "node",
    [entryPath, "add", "block", "author-bio", "--template", "interactivity"],
    {
      cwd: targetDir,
    }
  );

  const checks = await getDoctorChecks(targetDir);

  expect(
    checks.find((check) => check.label === "Workspace inventory")?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Workspace package metadata")
      ?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Block counter-card")?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Block metadata counter-card")
      ?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Block collection counter-card")
      ?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Block author-bio")?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Block metadata author-bio")
      ?.status
  ).toBe("pass");
  expect(
    checks.find((check) => check.label === "Block collection author-bio")
      ?.status
  ).toBe("pass");
}, 20_000);

test("doctor fails when block.json names drift from workspace conventions", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-block-name-drift"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor block name drift",
    slug: "demo-workspace-doctor-block-name-drift",
    title: "Demo Workspace Doctor Block Name Drift",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  const blockJsonPath = path.join(
    targetDir,
    "src",
    "blocks",
    "counter-card",
    "block.json"
  );
  const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
  blockJson.name = "demo-space/counter-card-renamed";
  fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, 2), "utf8");

  const checks = await getDoctorChecks(targetDir);
  const metadataCheck = checks.find(
    (check) => check.label === "Block metadata counter-card"
  );

  expect(metadataCheck?.status).toBe("fail");
  expect(metadataCheck?.detail).toContain(
    'block.json name must equal "demo-space/counter-card"'
  );
}, 20_000);

test("doctor fails when block.json textdomains drift from workspace conventions", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-textdomain-drift"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor textdomain drift",
    slug: "demo-workspace-doctor-textdomain-drift",
    title: "Demo Workspace Doctor Textdomain Drift",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  const blockJsonPath = path.join(
    targetDir,
    "src",
    "blocks",
    "counter-card",
    "block.json"
  );
  const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
  blockJson.textdomain = "other-space";
  fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, 2), "utf8");

  const checks = await getDoctorChecks(targetDir);
  const metadataCheck = checks.find(
    (check) => check.label === "Block metadata counter-card"
  );

  expect(metadataCheck?.status).toBe("fail");
  expect(metadataCheck?.detail).toContain(
    'block.json textdomain must equal "demo-space"'
  );
}, 20_000);

test("doctor fails when generated block artifacts are missing", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-artifact-drift"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor artifact drift",
    slug: "demo-workspace-doctor-artifact-drift",
    title: "Demo Workspace Doctor Artifact Drift",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  fs.rmSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "counter-card",
      "typia-validator.php"
    )
  );

  const checks = await getDoctorChecks(targetDir);
  const blockCheck = checks.find(
    (check) => check.label === "Block counter-card"
  );

  expect(blockCheck?.status).toBe("fail");
  expect(blockCheck?.detail).toContain("typia-validator.php");
}, 20_000);

test("doctor fails when block entrypoints lose the shared collection import", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-collection-drift"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor collection drift",
    slug: "demo-workspace-doctor-collection-drift",
    title: "Demo Workspace Doctor Collection Drift",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  const blockEntryPath = path.join(
    targetDir,
    "src",
    "blocks",
    "counter-card",
    "index.tsx"
  );
  const entrySource = fs.readFileSync(blockEntryPath, "utf8");
  fs.writeFileSync(
    blockEntryPath,
    entrySource.replace("import '../../collection';\n", ""),
    "utf8"
  );

  const checks = await getDoctorChecks(targetDir);
  const collectionCheck = checks.find(
    (check) => check.label === "Block collection counter-card"
  );

  expect(collectionCheck?.status).toBe("fail");
  expect(collectionCheck?.detail).toContain("shared collection import");
}, 20_000);

test("doctor accepts equivalent shared collection import formatting", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-collection-formatting"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor collection formatting",
    slug: "demo-workspace-doctor-collection-formatting",
    title: "Demo Workspace Doctor Collection Formatting",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  const blockEntryPath = path.join(
    targetDir,
    "src",
    "blocks",
    "counter-card",
    "index.tsx"
  );
  const entrySource = fs.readFileSync(blockEntryPath, "utf8");
  fs.writeFileSync(
    blockEntryPath,
    entrySource.replace(
      "import '../../collection';",
      'import "../../collection"'
    ),
    "utf8"
  );

  const checks = await getDoctorChecks(targetDir);
  const collectionCheck = checks.find(
    (check) => check.label === "Block collection counter-card"
  );

  expect(collectionCheck?.status).toBe("pass");
}, 20_000);

test("doctor fails when block.json blockHooks use malformed metadata", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-hooked-block-drift"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor hooked block drift",
    slug: "demo-workspace-doctor-hooked-block-drift",
    title: "Demo Workspace Doctor Hooked Block Drift",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  const blockJsonPath = path.join(
    targetDir,
    "src",
    "blocks",
    "counter-card",
    "block.json"
  );
  const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
  blockJson.blockHooks = {
    "demo-space/counter-card": "after",
  };
  fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, 2), "utf8");

  const checks = await getDoctorChecks(targetDir);
  const blockHooksCheck = checks.find(
    (check) => check.label === "Block hooks counter-card"
  );

  expect(blockHooksCheck?.status).toBe("fail");
  expect(blockHooksCheck?.detail).toContain(
    "demo-space/counter-card => after"
  );
}, 20_000);

test("doctor fails when workspace package metadata becomes invalid", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-invalid-metadata"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace doctor invalid metadata",
    slug: "demo-workspace-doctor-invalid-metadata",
    title: "Demo Workspace Doctor Invalid Metadata",
  });

  linkWorkspaceNodeModules(targetDir);

  const packageJsonPath = path.join(targetDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.wpTypia.namespace = "   ";
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf8"
  );

  const checks = await getDoctorChecks(targetDir);
  const metadataCheck = checks.find(
    (check) => check.label === "Workspace package metadata"
  );

  expect(metadataCheck?.status).toBe("fail");
  expect(metadataCheck?.detail).toContain(
    "wpTypia.namespace must be a non-empty string"
  );
}, 20_000);

test("doctor fails on missing variation and pattern inventory files", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-doctor-drift");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace doctor drift",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-doctor-drift",
      textDomain: "demo-space",
      title: "Demo Workspace Doctor Drift",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );
  runCli(
    "node",
    [entryPath, "add", "variation", "hero-card", "--block", "counter-card"],
    { cwd: targetDir }
  );
  runCli("node", [entryPath, "add", "pattern", "hero-layout"], {
    cwd: targetDir,
  });

  fs.rmSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "counter-card",
      "variations",
      "hero-card.ts"
    )
  );
  fs.rmSync(path.join(targetDir, "src", "patterns", "hero-layout.php"));

  const errorMessage = getCommandErrorMessage(() =>
    runCli("node", [entryPath, "doctor"], {
      cwd: targetDir,
      env: humanCliEnv,
    })
  );

  expect(errorMessage).toContain("Summary: One or more doctor checks failed.");
  expect(errorMessage).toContain("Variation counter-card/hero-card");
  expect(errorMessage).toContain("Pattern hero-layout");
}, 15_000);

test("doctor fails when workspace inventory entries are malformed", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-invalid-inventory"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace invalid inventory",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-doctor-invalid-inventory",
      textDomain: "demo-space",
      title: "Demo Workspace Invalid Inventory",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const blockConfigPath = path.join(targetDir, "scripts", "block-config.ts");
  const blockConfigSource = fs.readFileSync(blockConfigPath, "utf8");
  fs.writeFileSync(
    blockConfigPath,
    blockConfigSource.replace(
      "// wp-typia add pattern entries",
      `\t{\n\t\tslug: "broken-pattern",\n\t},\n\t// wp-typia add pattern entries`
    ),
    "utf8"
  );

  const errorMessage = getCommandErrorMessage(() =>
    runCli("node", [entryPath, "doctor"], {
      cwd: targetDir,
      env: humanCliEnv,
    })
  );

  expect(errorMessage).toContain("Workspace inventory");
  expect(errorMessage).toContain("PATTERNS[0] is missing required");
});

test("doctor fails when workspace inventory exports use non-array initializers", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-doctor-invalid-export-shape"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace invalid export shape",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-doctor-invalid-export-shape",
      textDomain: "demo-space",
      title: "Demo Workspace Invalid Export Shape",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const blockConfigPath = path.join(targetDir, "scripts", "block-config.ts");
  const blockConfigSource = fs.readFileSync(blockConfigPath, "utf8");
  fs.writeFileSync(
    blockConfigPath,
    blockConfigSource.replace(
      "export const VARIATIONS: WorkspaceVariationConfig[] = [\n\t// wp-typia add variation entries\n];",
      "export const VARIATIONS: WorkspaceVariationConfig[] = {} as never;"
    ),
    "utf8"
  );

  const errorMessage = getCommandErrorMessage(() =>
    runCli("node", [entryPath, "doctor"], {
      cwd: targetDir,
      env: humanCliEnv,
    })
  );

  expect(errorMessage).toContain("Workspace inventory");
  expect(errorMessage).toContain(
    "must export VARIATIONS as an array literal"
  );
});
});
