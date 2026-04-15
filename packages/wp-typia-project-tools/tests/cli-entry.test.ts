import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { cleanupScaffoldTempRoot, createBlockSubsetFixturePath, createScaffoldTempRoot, entryPath, getCommandErrorMessage, runCli, templateLayerAmbiguousFixturePath, templateLayerFixturePath } from "./helpers/scaffold-test-harness.js";
import { formatHelpText, getDoctorChecks, getNextSteps, getOptionalOnboarding, runScaffoldFlow } from "../src/runtime/cli-core.js";
import { collectScaffoldAnswers } from "../src/runtime/scaffold.js";

describe("@wp-typia/project-tools scaffold CLI flow", () => {
  const tempRoot = createScaffoldTempRoot("wp-typia-scaffold-cli-");

  afterAll(() => {
    cleanupScaffoldTempRoot(tempRoot);
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
    "utf8"
  );

  expect(flow.result.variables.dataStorageMode).toBe("custom-table");
  expect(flow.result.variables.persistencePolicy).toBe("authenticated");
  expect(pluginBootstrap).toContain("custom-table");
  expect(flow.nextSteps).toEqual([
    `cd ${projectInput}`,
    "npm install",
    "npm run dev",
  ]);
  expect(flow.optionalOnboarding.steps).toEqual(["npm run sync"]);
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
    selectWithTestPreset: async () => true,
    selectWithWpEnv: async () => false,
    templateId: "persistence",
  });

  const pluginBootstrap = fs.readFileSync(
    path.join(flow.projectDir, `${projectInput}.php`),
    "utf8"
  );
  const restPublicHelper = fs.readFileSync(
    path.join(flow.projectDir, "inc", "rest-public.php"),
    "utf8"
  );

  expect(flow.result.variables.dataStorageMode).toBe("post-meta");
  expect(flow.result.variables.persistencePolicy).toBe("public");
  expect(pluginBootstrap).toContain(
    "require_once __DIR__ . '/inc/rest-public.php';"
  );
  expect(restPublicHelper).toContain(
    "function demo_persistence_prompted_verify_public_write_token"
  );
  expect(fs.existsSync(path.join(flow.projectDir, ".wp-env.json"))).toBe(
    false
  );
  expect(fs.existsSync(path.join(flow.projectDir, ".wp-env.test.json"))).toBe(
    true
  );
  expect(flow.optionalOnboarding.steps).toEqual(["npm run sync"]);
});

test("interactive scaffold answers recover when the project name normalizes to an empty slug", async () => {
  const answers = await collectScaffoldAnswers({
    projectName: "!!!",
    promptText: async (message, defaultValue) => {
      if (message === "Block slug") {
        return "demo-recovered";
      }

      return defaultValue || "Recovered";
    },
    templateId: "basic",
  });

  expect(answers.slug).toBe("demo-recovered");
  expect(answers.phpPrefix).toBe("demo_recovered");
  expect(answers.textDomain).toBe("demo-recovered");
  expect(answers.title).toBe("Demo Recovered");
});

test("runScaffoldFlow avoids duplicate namespace segments without colliding with core wrapper classes", async () => {
  const projectInput = "demo-default-class";
  const flow = await runScaffoldFlow({
    cwd: tempRoot,
    noInstall: true,
    packageManager: "npm",
    projectInput,
    templateId: "basic",
    yes: true,
  });

  const blockJson = JSON.parse(
    fs.readFileSync(path.join(flow.projectDir, "src", "block.json"), "utf8")
  );
  const generatedEdit = fs.readFileSync(
    path.join(flow.projectDir, "src", "edit.tsx"),
    "utf8"
  );
  const generatedSave = fs.readFileSync(
    path.join(flow.projectDir, "src", "save.tsx"),
    "utf8"
  );
  const generatedStyle = fs.readFileSync(
    path.join(flow.projectDir, "src", "style.scss"),
    "utf8"
  );

  expect(blockJson.name).toBe("demo-default-class/demo-default-class");
  expect(generatedStyle).toContain(".wp-block-demo-default-class-block");
  expect(generatedStyle).not.toContain(
    ".wp-block-demo-default-class-demo-default-class"
  );
  expect(generatedStyle).not.toContain(".wp-block-demo-default-class {");
  expect(generatedEdit).toContain(
    "className: `wp-block-demo-default-class-block${isVisible ? '' : ' is-hidden'}`"
  );
  expect(generatedSave).toContain(
    "className: `wp-block-demo-default-class-block${isVisible ? '' : ' is-hidden'}`"
  );
  expect(generatedEdit).toContain(
    'className="wp-block-demo-default-class-block__content"'
  );
  expect(generatedSave).toContain(
    'className="wp-block-demo-default-class-block__content"'
  );
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
    "npm run dev",
  ]);
  expect(flow.optionalOnboarding.steps).toEqual(["npm run sync"]);
  expect(flow.optionalOnboarding.note).toContain(
    "do not create migration history"
  );
});

test("runScaffoldFlow composes a built-in scaffold with an external layer package", async () => {
  const flow = await runScaffoldFlow({
    cwd: tempRoot,
    externalLayerSource: templateLayerFixturePath,
    noInstall: true,
    packageManager: "npm",
    projectInput: "demo-layered-basic",
    templateId: "basic",
    yes: true,
  });

  expect(flow.result.warnings).toContain(
    `Applied external layer "acme/basic-observability" from "${templateLayerFixturePath}".`
  );
  expect(
    fs.existsSync(path.join(flow.projectDir, "inc", "observability.php"))
  ).toBe(true);
  expect(
    fs.readFileSync(path.join(flow.projectDir, "src", "observability.ts"), "utf8")
  ).toContain("demo-layered-basic-observability");
});

test("runScaffoldFlow honors explicit external layer ids when a package exposes multiple public roots", async () => {
  const flow = await runScaffoldFlow({
    cwd: tempRoot,
    externalLayerId: "acme/beta",
    externalLayerSource: templateLayerAmbiguousFixturePath,
    noInstall: true,
    packageManager: "npm",
    projectInput: "demo-layered-beta",
    templateId: "basic",
    yes: true,
  });

  expect(flow.result.warnings).toContain(
    `Applied external layer "acme/beta" from "${templateLayerAmbiguousFixturePath}".`
  );
  expect(fs.readFileSync(path.join(flow.projectDir, "beta.txt"), "utf8")).toContain(
    "beta layer"
  );
});

test("runScaffoldFlow prompts for an external layer when multiple public roots are available", async () => {
  let promptedOptions: Array<{
    description?: string;
    extends: string[];
    id: string;
  }> = [];

  const flow = await runScaffoldFlow({
    cwd: tempRoot,
    externalLayerSource: templateLayerAmbiguousFixturePath,
    isInteractive: true,
    noInstall: true,
    packageManager: "npm",
    projectInput: "demo-layered-ambiguous-prompt",
    promptText: async (_message, defaultValue) => defaultValue,
    selectExternalLayerId: async (options) => {
      promptedOptions = options;
      return "acme/beta";
    },
    templateId: "basic",
  });

  expect(promptedOptions).toEqual([
    {
      description: "Alpha external layer",
      extends: ["acme/internal-base"],
      id: "acme/alpha",
    },
    {
      description: "Beta external layer",
      extends: ["acme/internal-base"],
      id: "acme/beta",
    },
  ]);
  expect(flow.result.warnings).toContain(
    `Applied external layer "acme/beta" from "${templateLayerAmbiguousFixturePath}".`
  );
  expect(
    fs.readFileSync(path.join(flow.projectDir, "base.txt"), "utf8")
  ).toContain("base external layer");
  expect(fs.readFileSync(path.join(flow.projectDir, "beta.txt"), "utf8")).toContain(
    "beta layer"
  );
});

test("optional onboarding derives sync steps from available custom-template scripts", () => {
  const onboarding = getOptionalOnboarding({
    availableScripts: ["sync-types", "sync-rest"],
    packageManager: "npm",
    templateId: "/tmp/custom-template",
  });

  expect(onboarding.steps).toEqual([
    "npm run sync-types",
    "npm run sync-rest",
  ]);
  expect(onboarding.note).toContain(
    "Run npm run sync-types then npm run sync-rest manually before build, typecheck, or commit."
  );
  expect(onboarding.note).toContain(
    "npm run sync-types -- --check verifies the current type-derived artifacts without rewriting them."
  );
  expect(onboarding.note).not.toContain("npm run sync -- --check");
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
    })
  ).rejects.toThrow(
    'Unsupported persistence policy "invalid". Expected one of: authenticated, public'
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
    })
  ).rejects.toThrow(
    'Built-in template "data" was removed. Use --template persistence --persistence-policy public instead.'
  );
});

test("runScaffoldFlow rejects external layers for non-built-in templates", async () => {
  await expect(
    runScaffoldFlow({
      cwd: tempRoot,
      externalLayerSource: templateLayerFixturePath,
      noInstall: true,
      packageManager: "npm",
      projectInput: "demo-external-layer-on-custom-template",
      templateId: createBlockSubsetFixturePath,
      yes: true,
    })
  ).rejects.toThrow(
    "External template layers currently compose only with built-in templates"
  );
});

test("runScaffoldFlow rejects external layer ids without a layer source", async () => {
  await expect(
    runScaffoldFlow({
      cwd: tempRoot,
      externalLayerId: "acme/basic-observability",
      noInstall: true,
      packageManager: "npm",
      projectInput: "demo-layer-id-only",
      templateId: "basic",
      yes: true,
    })
  ).rejects.toThrow(
    "externalLayerId requires externalLayerSource when composing built-in template layers."
  );
});

test("runScaffoldFlow keeps multi-layer external packages fail-fast outside interactive mode", async () => {
  await expect(
    runScaffoldFlow({
      cwd: tempRoot,
      externalLayerSource: templateLayerAmbiguousFixturePath,
      noInstall: true,
      packageManager: "npm",
      projectInput: "demo-layered-ambiguous-noninteractive",
      templateId: "basic",
      yes: true,
    })
  ).rejects.toThrow(
    "External layer package defines multiple selectable layers (acme/internal-base, acme/alpha, acme/beta). Pass an explicit externalLayerId or rerun through the interactive CLI selector."
  );
});

test("formatHelpText keeps migration UI flags out of external template usage", () => {
  const helpText = formatHelpText();
  const usageLines = helpText
    .split("\n")
    .filter((line) => line.startsWith("  wp-typia "));
  const externalPathLine = usageLines.find((line) =>
    line.includes("./path|github:owner/repo/path[#ref]>")
  );
  const externalPackageLine = usageLines.find((line) =>
    line.includes("<npm-package>")
  );

  expect(externalPathLine).toBeDefined();
  expect(externalPathLine).not.toContain("--with-migration-ui");
  expect(externalPathLine).not.toContain("--external-layer-source");
  expect(externalPackageLine).toBeDefined();
  expect(externalPackageLine).not.toContain("--with-migration-ui");
  expect(externalPackageLine).not.toContain("--external-layer-source");
  expect(helpText).toContain("--template workspace");
  expect(helpText).toContain("--external-layer-source");
  expect(helpText).toContain("--external-layer-id");
  expect(helpText).toContain("@wp-typia/create-workspace-template");
});

test("cli-core barrel preserves doctor helper exports", () => {
  expect(typeof getDoctorChecks).toBe("function");
});

test("getNextSteps quotes project paths with spaces", () => {
  expect(
    getNextSteps({
      noInstall: true,
      packageManager: "bun",
      projectDir: "/tmp/demo project",
      projectInput: "demo project",
      templateId: "basic",
    })
  ).toEqual(["cd 'demo project'", "bun install", "bun run dev"]);
  expect(
    getNextSteps({
      noInstall: false,
      packageManager: "bun",
      projectDir: "/tmp/-demo",
      projectInput: "-demo",
      templateId: "basic",
    })
  ).toEqual(["cd '-demo'", "bun run dev"]);
});

test("runScaffoldFlow does not prompt for migration UI on external templates", async () => {
  let promptedForMigrationUi = false;

  const flow = await runScaffoldFlow({
    cwd: tempRoot,
    isInteractive: true,
    noInstall: true,
    packageManager: "npm",
    projectInput: "demo-external-no-migration-ui-prompt",
    promptText: async (_message, defaultValue) => defaultValue,
    withMigrationUi: true,
    selectWithMigrationUi: async () => {
      promptedForMigrationUi = true;
      return true;
    },
    templateId: createBlockSubsetFixturePath,
  });

  expect(promptedForMigrationUi).toBe(false);
  expect(flow.result.variables.needsMigration).toBe("{{needsMigration}}");
});

test("node entry exposes templates and doctor commands", () => {
  const templatesOutput = runCli("node", [entryPath, "templates", "list"]);
  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"]);

  expect(templatesOutput).toContain("basic");
  expect(templatesOutput).toContain("interactivity");
  expect(templatesOutput).toContain("persistence");
  expect(templatesOutput).toContain("compound");
  expect(templatesOutput).toContain("@wp-typia/create-workspace-template");
  expect(templatesOutput).not.toContain("advanced");
  expect(templatesOutput).not.toContain("full");
  expect(doctorOutput).toContain('"label": "Bun"');
  expect(doctorOutput).toContain('"label": "Template basic"');
});

test("node entry supports the explicit create command", () => {
  const targetDir = path.join(tempRoot, "demo-node-create-command");

  runCli("node", [
    entryPath,
    "create",
    targetDir,
    "--template",
    "basic",
    "--package-manager",
    "npm",
    "--yes",
    "--no-install",
  ]);

  expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true);
  expect(fs.existsSync(path.join(targetDir, "src", "block.json"))).toBe(true);
});

test("node entry supports external layer flags for built-in create scaffolds", () => {
  const targetDir = path.join(tempRoot, "demo-node-create-layered");

  runCli("node", [
    entryPath,
    "create",
    targetDir,
    "--template",
    "basic",
    "--external-layer-source",
    templateLayerFixturePath,
    "--package-manager",
    "npm",
    "--yes",
    "--no-install",
  ]);

  expect(fs.existsSync(path.join(targetDir, "inc", "observability.php"))).toBe(true);
  expect(fs.readFileSync(path.join(targetDir, "src", "observability.ts"), "utf8")).toContain(
    "demo-node-create-layered-observability"
  );
});

test("node entry exposes Bunli-owned help and rejects the removed migrations alias", () => {
  const helpOutput = runCli("node", [entryPath, "--help"]);
  const errorMessage = getCommandErrorMessage(() =>
    runCli("node", [entryPath, "migrations", "init"], { stdio: "pipe" })
  );

  expect(helpOutput).toContain("Scaffold a new wp-typia project.");
  expect(helpOutput).toContain(
    "Run migration workflows for migration-capable wp-typia projects."
  );
  expect(helpOutput).toContain(
    "Inspect or sync schema-driven MCP metadata for wp-typia."
  );
  expect(helpOutput).toContain("Manage agent skill files");
  expect(helpOutput).toContain("Generate shell completion scripts");
  expect(errorMessage).toContain(
    "`wp-typia migrations` was removed in favor of `wp-typia migrate`."
  );
});

test("bun entry exposes templates and doctor commands", () => {
  const templatesOutput = runCli("bun", [entryPath, "templates", "list"]);
  const doctorOutput = runCli("bun", [entryPath, "doctor", "--format", "json"]);

  expect(templatesOutput).toContain("basic");
  expect(templatesOutput).toContain("interactivity");
  expect(templatesOutput).toContain("persistence");
  expect(templatesOutput).toContain("compound");
  expect(templatesOutput).toContain("@wp-typia/create-workspace-template");
  expect(templatesOutput).not.toContain("advanced");
  expect(templatesOutput).not.toContain("full");
  expect(doctorOutput).toContain('"label": "Bun"');
  expect(doctorOutput).toContain('"label": "Template basic"');
});

test("bun entry exposes Bunli-owned help and rejects the removed migrations alias", () => {
  const helpOutput = runCli("bun", [entryPath, "--help"]);
  const errorMessage = getCommandErrorMessage(() =>
    runCli("bun", [entryPath, "migrations", "init"], { stdio: "pipe" })
  );

  expect(helpOutput).toContain("Scaffold a new wp-typia project.");
  expect(helpOutput).toContain(
    "Run migration workflows for migration-capable wp-typia projects."
  );
  expect(helpOutput).toContain(
    "Inspect or sync schema-driven MCP metadata for wp-typia."
  );
  expect(helpOutput).toContain("Manage agent skill files");
  expect(helpOutput).toContain("Generate shell completion scripts");
  expect(errorMessage).toContain(
    "`wp-typia migrations` was removed in favor of `wp-typia migrate`."
  );
});

test(
  "bun entry translates kebab-case identifier flags while scaffolding",
  () => {
    const targetDir = path.join(tempRoot, "demo-bun-entry");

    runCli(
      "bun",
      [
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
      ],
      {
        stdio: "inherit",
      }
    );

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
    );
    const blockJson = JSON.parse(
      fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8")
    );
    const pluginBootstrap = fs.readFileSync(
      path.join(targetDir, "demo-bun-entry.php"),
      "utf8"
    );

    expect(packageJson.packageManager).toBe("bun@1.3.11");
    expect(blockJson.name).toBe("experiments/demo-bun-entry");
    expect(blockJson.textdomain).toBe("demo-bun-entry-text");
    expect(pluginBootstrap).toContain("Text Domain:       demo-bun-entry-text");
    expect(pluginBootstrap).toContain(
      "function demo_bun_entry_php_get_counter"
    );
    expect(fs.existsSync(path.join(targetDir, "README.md"))).toBe(true);
  },
  { timeout: 15_000 }
);

test("node entry requires --package-manager with --yes", () => {
  expect(() => {
    runCli(
      "node",
      [
        entryPath,
        "demo-missing-pm",
        "--template",
        "basic",
        "--yes",
        "--no-install",
      ],
      {
        stdio: "pipe",
      }
    );
  }).toThrow();
});

test("node entry rejects missing values for identifier override flags", () => {
  expect(() => {
    runCli(
      "node",
      [
        entryPath,
        "demo-missing-namespace",
        "--template",
        "basic",
        "--namespace",
        "--yes",
        "--no-install",
        "--package-manager",
        "npm",
      ],
      {
        stdio: "pipe",
      }
    );
  }).toThrow();
});
});
