import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { cleanupScaffoldTempRoot, createScaffoldTempRoot, entryPath, getCommandErrorMessage, linkWorkspaceNodeModules, parseJsonObjectFromOutput, runCli, runGeneratedScript, scaffoldOfficialWorkspace, templateLayerFixturePath, templateLayerWorkspaceAmbiguousFixturePath, templateLayerWorkspaceFixturePath, typecheckGeneratedProject, workspaceTemplatePackageManifest } from "./helpers/scaffold-test-harness.js";
import { runAddBlockCommand } from "../src/runtime/cli-core.js";
import { scaffoldProject } from "../src/runtime/index.js";

const legacyValidatorToolkitSource = [
  "import { parseManifestDefaultsDocument } from '@wp-typia/block-runtime/defaults';",
  "import {",
  "\tcreateScaffoldValidatorToolkit,",
  "\ttype ScaffoldValidatorToolkitOptions,",
  "} from '@wp-typia/block-runtime/validation';",
  "",
  "interface TemplateValidatorToolkitOptions< T extends object > {",
  "\tfinalize?: ScaffoldValidatorToolkitOptions< T >['finalize'];",
  "\tmanifest: unknown;",
  "\tonValidationError?: ScaffoldValidatorToolkitOptions< T >['onValidationError'];",
  "}",
  "",
  "export function createTemplateValidatorToolkit< T extends object >( {",
  "\tfinalize,",
  "\tmanifest,",
  "\tonValidationError,",
  "}: TemplateValidatorToolkitOptions< T > ) {",
  "\treturn createScaffoldValidatorToolkit< T >( {",
  "\t\tmanifest: parseManifestDefaultsDocument( manifest ),",
  "\t\tfinalize,",
  "\t\tonValidationError,",
  "\t} );",
  "}",
  "",
].join("\n");

function writeLegacyValidatorToolkitFixture(targetDir: string) {
  fs.writeFileSync(
    path.join(targetDir, "src", "validator-toolkit.ts"),
    legacyValidatorToolkitSource,
    "utf8"
  );
}

function writeLegacyCompoundValidatorFixture(
  targetDir: string,
  blockSlug: string,
  typeName: string,
  exportSuffix: string,
  options?: {
    includeTypiaImport?: boolean;
    lineEnding?: "\n" | "\r\n";
    quoteStyle?: "'" | '"';
  }
) {
  const includeTypiaImport = options?.includeTypiaImport ?? false;
  const lineEnding = options?.lineEnding ?? "\n";
  const quoteStyle = options?.quoteStyle ?? "'";

  fs.writeFileSync(
    path.join(targetDir, "src", "blocks", blockSlug, "validators.ts"),
    [
      ...(includeTypiaImport
        ? [`import typia from ${quoteStyle}typia${quoteStyle};`]
        : []),
      `import currentManifest from ${quoteStyle}./typia.manifest.json${quoteStyle};`,
      "import type {",
      `\t${typeName},`,
      `} from ${quoteStyle}./types${quoteStyle};`,
      `import { createTemplateValidatorToolkit } from ${quoteStyle}../../validator-toolkit${quoteStyle};`,
      "",
      `const scaffoldValidators = createTemplateValidatorToolkit< ${typeName} >( {`,
      "\tmanifest: currentManifest,",
      "} );",
      "",
      `export const validate${exportSuffix} =`,
      "\tscaffoldValidators.validateAttributes;",
      "",
      "export const validators = scaffoldValidators.validators;",
      "",
      `export const sanitize${exportSuffix} =`,
      "\tscaffoldValidators.sanitizeAttributes;",
      "",
      "export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;",
      "",
    ].join(lineEnding),
    "utf8"
  );
}

describe("@wp-typia/project-tools workspace add", () => {
  const tempRoot = createScaffoldTempRoot("wp-typia-workspace-add-");

  afterAll(() => {
    cleanupScaffoldTempRoot(tempRoot);
  });

test("canonical CLI can add a basic block to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-basic");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add basic",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-basic",
      textDomain: "demo-space",
      title: "Demo Workspace Add Basic",
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

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const indexSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
    "utf8"
  );
  const blockJson = JSON.parse(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
      "utf8"
    )
  );

  expect(blockConfigSource).toContain('slug: "counter-card"');
  expect(indexSource).toContain("import '../../collection';");
  expect(blockJson.name).toBe("demo-space/counter-card");
  typecheckGeneratedProject(targetDir);
  runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", [
    "--check",
  ]);
}, 20_000);

test("canonical CLI can add a basic block with an external layer package", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-basic-layered");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add basic layered",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-basic-layered",
      textDomain: "demo-space",
      title: "Demo Workspace Add Basic Layered",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "counter-card",
      "--template",
      "basic",
      "--external-layer-source",
      templateLayerWorkspaceFixturePath,
    ],
    {
      cwd: targetDir,
    }
  );

  expect(
    fs.existsSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block-telemetry.ts")
    )
  ).toBe(true);
  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block-telemetry.ts"),
      "utf8"
    )
  ).toContain("counter-card-telemetry");
  typecheckGeneratedProject(targetDir);
}, 20_000);

test("runAddBlockCommand can select an external layer when multiple workspace-safe roots are available", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-basic-layered-prompt");
  let promptedOptions: Array<{
    description?: string;
    extends: string[];
    id: string;
  }> = [];

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add basic layered prompt",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-basic-layered-prompt",
      textDomain: "demo-space",
      title: "Demo Workspace Add Basic Layered Prompt",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const result = await runAddBlockCommand({
    blockName: "counter-card",
    cwd: targetDir,
    externalLayerSource: templateLayerWorkspaceAmbiguousFixturePath,
    selectExternalLayerId: async (options) => {
      promptedOptions = options;
      return "acme/beta";
    },
    templateId: "basic",
  });

  expect(promptedOptions).toEqual([
    {
      description: "Alpha block-local workspace layer",
      extends: ["acme/internal-base"],
      id: "acme/alpha",
    },
    {
      description: "Beta block-local workspace layer",
      extends: ["acme/internal-base"],
      id: "acme/beta",
    },
  ]);
  expect(result.warnings).toContain(
    `Applied external layer "acme/beta" from "${templateLayerWorkspaceAmbiguousFixturePath}".`
  );
  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "base.txt"),
      "utf8"
    )
  ).toContain("base workspace layer for counter-card");
  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "beta.txt"),
      "utf8"
    )
  ).toContain("beta workspace layer for counter-card");
  typecheckGeneratedProject(targetDir);
}, 20_000);

test("canonical CLI resolves add-block local external layer paths from the caller cwd", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-basic-layered-relative");
  let nestedCwd = path.join(targetDir, "src");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add basic layered relative",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-basic-layered-relative",
      textDomain: "demo-space",
      title: "Demo Workspace Add Basic Layered Relative",
    },
  });

  linkWorkspaceNodeModules(targetDir);
  nestedCwd = fs.realpathSync(nestedCwd);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "counter-card",
      "--template",
      "basic",
      "--external-layer-source",
      path.relative(nestedCwd, fs.realpathSync(templateLayerWorkspaceFixturePath)),
    ],
    {
      cwd: nestedCwd,
    }
  );

  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block-telemetry.ts"),
      "utf8"
    )
  ).toContain("counter-card-telemetry");
}, 20_000);

test("runAddBlockCommand explains when a block name normalizes to an empty slug", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-invalid-block-name");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add invalid block name",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-invalid-block-name",
      textDomain: "demo-space",
      title: "Demo Workspace Add Invalid Block Name",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  await expect(
    runAddBlockCommand({
      blockName: "!!!",
      cwd: targetDir,
      templateId: "basic",
    })
  ).rejects.toThrow(
    'Block name "!!!" normalizes to an empty slug. Use letters or numbers so wp-typia can generate a block slug.'
  );
}, 20_000);

test("canonical CLI rejects add-block external layers that emit workspace-level files", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-basic-layered-root-output");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add basic layered root output",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-basic-layered-root-output",
      textDomain: "demo-space",
      title: "Demo Workspace Add Basic Layered Root Output",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const commandError = getCommandErrorMessage(() =>
    runCli(
      "node",
      [
        entryPath,
        "add",
        "block",
        "counter-card",
        "--template",
        "basic",
        "--external-layer-source",
        templateLayerFixturePath,
      ],
      {
        cwd: targetDir,
      }
    )
  );

  expect(commandError).toMatch(
    /External layer "acme\/basic-observability" writes workspace-level output "inc\/observability\.php"/
  );
  expect(
    fs.existsSync(path.join(targetDir, "src", "blocks", "counter-card"))
  ).toBe(false);
}, 20_000);

test("runAddBlockCommand explains that query-loop is a create-time scaffold family", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-query-loop-unsupported",
  );

  await scaffoldOfficialWorkspace(targetDir);

  linkWorkspaceNodeModules(targetDir);

  await expect(
    runAddBlockCommand({
      blockName: "query-listing",
      cwd: targetDir,
      templateId: "query-loop",
    })
  ).rejects.toThrow(
    "`wp-typia add block --template query-loop` is not supported. Query Loop is a create-time `core/query` variation scaffold, so use `wp-typia create <project-dir> --template query-loop` instead."
  );
});

test("canonical CLI can add a variation to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-variation");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add variation",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-variation",
      textDomain: "demo-space",
      title: "Demo Workspace Add Variation",
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

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const blockIndexSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
    "utf8"
  );
  const variationsIndexSource = fs.readFileSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "counter-card",
      "variations",
      "index.ts"
    ),
    "utf8"
  );
  const variationSource = fs.readFileSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "counter-card",
      "variations",
      "hero-card.ts"
    ),
    "utf8"
  );

  expect(blockConfigSource).toContain('block: "counter-card"');
  expect(blockConfigSource).toContain('slug: "hero-card"');
  expect(blockIndexSource).toContain("registerWorkspaceVariations");
  expect(blockIndexSource).toContain("registerWorkspaceVariations();");
  expect(variationsIndexSource).toContain("workspaceVariation_hero_card");
  expect(variationSource).toContain("BlockVariation");
  expect(variationSource).toContain(
    "@wp-typia/block-types/blocks/registration"
  );
  expect(variationSource).toContain("A starter variation for Hero Card.");

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find((check) => check.label === "Workspace inventory")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Variation counter-card/hero-card"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Variation entrypoint counter-card"
    )?.status
  ).toBe("pass");

  runCli("npm", ["run", "build"], { cwd: targetDir });
}, 60_000);

test("variation workflow keeps registry identifiers unique for similar slugs", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-variation-collision-safe"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace variation collision safe",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-variation-collision-safe",
      textDomain: "demo-space",
      title: "Demo Workspace Variation Collision Safe",
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
    [entryPath, "add", "variation", "hero-2-card", "--block", "counter-card"],
    { cwd: targetDir }
  );
  runCli(
    "node",
    [entryPath, "add", "variation", "hero2-card", "--block", "counter-card"],
    { cwd: targetDir }
  );

  const variationsIndexSource = fs.readFileSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "counter-card",
      "variations",
      "index.ts"
    ),
    "utf8"
  );

  expect(variationsIndexSource).toContain(
    "import { workspaceVariation_hero_2_card } from './hero-2-card';"
  );
  expect(variationsIndexSource).toContain(
    "import { workspaceVariation_hero2_card } from './hero2-card';"
  );

  runCli("npm", ["run", "build"], { cwd: targetDir });
}, 60_000);

test("canonical CLI can add hooked-block metadata to an official workspace block", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-hooked-block");

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace add hooked block",
    slug: "demo-workspace-add-hooked-block",
    title: "Demo Workspace Add Hooked Block",
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
    [
      entryPath,
      "add",
      "hooked-block",
      "counter-card",
      "--anchor",
      "core/post-content",
      "--position",
      "after",
    ],
    { cwd: targetDir }
  );

  const blockJson = JSON.parse(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
      "utf8"
    )
  );

  expect(blockJson.blockHooks).toEqual({
    "core/post-content": "after",
  });

  runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts");
  const syncedBlockJson = JSON.parse(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
      "utf8"
    )
  );
  expect(syncedBlockJson.blockHooks).toEqual({
    "core/post-content": "after",
  });

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Block hooks counter-card"
    )?.status
  ).toBe("pass");
}, 20_000);

test("canonical CLI can dry-run an add block scaffold without mutating the workspace", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-block-dry-run");

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace add block dry run",
    slug: "demo-workspace-add-block-dry-run",
    title: "Demo Workspace Add Block Dry Run",
  });

  linkWorkspaceNodeModules(targetDir);
  const output = runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "counter-card",
      "--template",
      "basic",
      "--dry-run",
    ],
    { cwd: targetDir }
  );

  expect(output).toContain("Dry run");
  expect(output).toContain("Blocks: counter-card");
  expect(output).toContain("write src/blocks/counter-card/index.tsx");
  expect(
    fs.existsSync(path.join(targetDir, "src", "blocks", "counter-card"))
  ).toBe(false);
});

test("canonical CLI can dry-run hooked-block metadata updates without rewriting block.json", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-hooked-block-dry-run");

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace add hooked block dry run",
    slug: "demo-workspace-add-hooked-block-dry-run",
    title: "Demo Workspace Add Hooked Block Dry Run",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );
  const originalBlockJsonSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
    "utf8"
  );

  const output = runCli(
    "node",
    [
      entryPath,
      "add",
      "hooked-block",
      "counter-card",
      "--anchor",
      "core/post-content",
      "--position",
      "after",
      "--dry-run",
    ],
    { cwd: targetDir }
  );

  expect(output).toContain("Dry run");
  expect(output).toContain("Block: counter-card");
  expect(output).toContain("update src/blocks/counter-card/block.json");
  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
      "utf8"
    )
  ).toBe(originalBlockJsonSource);
});

test("duplicate add block failures preserve existing workspace blocks", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-duplicate");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add duplicate",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-duplicate",
      textDomain: "demo-space",
      title: "Demo Workspace Add Duplicate",
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

  const originalIndexSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
    "utf8"
  );
  const originalBlockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );

  expect(() =>
    runCli(
      "node",
      [entryPath, "add", "block", "counter-card", "--template", "basic"],
      {
        cwd: targetDir,
      }
    )
  ).toThrow(
    "A block already exists at src/blocks/counter-card. Choose a different name."
  );

  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "index.tsx"),
      "utf8"
    )
  ).toBe(originalIndexSource);
  expect(
    fs.readFileSync(
      path.join(targetDir, "scripts", "block-config.ts"),
      "utf8"
    )
  ).toBe(originalBlockConfigSource);
});

test("hooked-block workflow rejects unknown blocks, invalid anchors, self-hooks, invalid positions, and duplicate anchors", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-hooked-block-invalid"
  );

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace hooked block invalid",
    slug: "demo-workspace-hooked-block-invalid",
    title: "Demo Workspace Hooked Block Invalid",
  });

  linkWorkspaceNodeModules(targetDir);
  runCli(
    "node",
    [entryPath, "add", "block", "counter-card", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "hooked-block",
          "missing-card",
          "--anchor",
          "core/post-content",
          "--position",
          "after",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("Unknown workspace block");

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "hooked-block",
          "counter-card",
          "--anchor",
          "post-content",
          "--position",
          "after",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("full `namespace/slug` block name format");

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "hooked-block",
          "counter-card",
          "--anchor",
          "demo-space/counter-card",
          "--position",
          "after",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("cannot hook a block relative to its own block name");

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "hooked-block",
          "counter-card",
          "--anchor",
          "core/post-content",
          "--position",
          "around",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain(
    "Hook position must be one of: before, after, firstChild, lastChild."
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "hooked-block",
      "counter-card",
      "--anchor",
      "core/post-content",
      "--position",
      "after",
    ],
    { cwd: targetDir }
  );

  const originalBlockJsonSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
    "utf8"
  );

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "hooked-block",
          "counter-card",
          "--anchor",
          "core/post-content",
          "--position",
          "before",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("already defines a blockHooks entry");
  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "counter-card", "block.json"),
      "utf8"
    )
  ).toBe(originalBlockJsonSource);
}, 20_000);

test("variation workflow rejects unknown blocks and preserves existing variation files on duplicate failure", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-variation-duplicate");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace variation duplicate",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-variation-duplicate",
      textDomain: "demo-space",
      title: "Demo Workspace Variation Duplicate",
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

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "variation",
          "hero-card",
          "--block",
          "missing-card",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("missing-card");
  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "variation",
          "2024-hero",
          "--block",
          "counter-card",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("Variation name must start with a letter");

  runCli(
    "node",
    [entryPath, "add", "variation", "hero-card", "--block", "counter-card"],
    { cwd: targetDir }
  );

  const originalVariationSource = fs.readFileSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "counter-card",
      "variations",
      "hero-card.ts"
    ),
    "utf8"
  );
  const originalInventorySource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "variation",
          "hero-card",
          "--block",
          "counter-card",
        ],
        { cwd: targetDir }
      )
    )
  ).toContain("A variation already exists");

  expect(
    fs.readFileSync(
      path.join(
        targetDir,
        "src",
        "blocks",
        "counter-card",
        "variations",
        "hero-card.ts"
      ),
      "utf8"
    )
  ).toBe(originalVariationSource);
  expect(
    fs.readFileSync(
      path.join(targetDir, "scripts", "block-config.ts"),
      "utf8"
    )
  ).toBe(originalInventorySource);
}, 15_000);

test("canonical CLI can add a compound persistence block to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-compound");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add compound",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound",
      textDomain: "demo-space",
      title: "Demo Workspace Add Compound",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
      "--data-storage",
      "custom-table",
      "--persistence-policy",
      "public",
    ],
    {
      cwd: targetDir,
    }
  );

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const serverModuleSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "server.php"),
    "utf8"
  );
  const parentBlockJson = JSON.parse(
    fs.readFileSync(
      path.join(targetDir, "src", "blocks", "faq-stack", "block.json"),
      "utf8"
    )
  );

  expect(blockConfigSource).toContain("defineEndpointManifest");
  expect(blockConfigSource).toContain('slug: "faq-stack-item"');
  expect(serverModuleSource).toContain("rest-public.php");
  expect(serverModuleSource).toContain(
    "array_key_exists( 'resourceKey', $attributes )"
  );
  expect(serverModuleSource).toContain(
    "define( 'DEMO_SPACE_FAQ_STACK_DATA_STORAGE_MODE', 'custom-table' );"
  );
  expect(serverModuleSource).toContain(
    "if ( 'custom-table' === DEMO_SPACE_FAQ_STACK_DATA_STORAGE_MODE"
  );
  expect(serverModuleSource).toContain(
    "'storage'     => DEMO_SPACE_FAQ_STACK_DATA_STORAGE_MODE,"
  );
  expect(serverModuleSource).toContain("is_post_publicly_viewable( $post )");
  expect(serverModuleSource).toContain(": 'primary';");
  expect(parentBlockJson.name).toBe("demo-space/faq-stack");
  expect(fs.existsSync(path.join(targetDir, "src", "hooks.ts"))).toBe(true);
  expect(fs.existsSync(path.join(targetDir, "src", "validator-toolkit.ts"))).toBe(
    true
  );
  runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", [
    "--check",
  ]);
  runGeneratedScript(targetDir, "scripts/sync-rest-contracts.ts", [
    "--check",
  ]);
}, 60_000);

test("canonical CLI can add a persistence block with alternate render targets", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-persistence-alternate-render-targets"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add persistence alternate render targets",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-persistence-alternate-render-targets",
      textDomain: "demo-space",
      title: "Demo Workspace Add Persistence Alternate Render Targets",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "mailing-card",
      "--template",
      "persistence",
      "--alternate-render-targets",
      "email,plain-text",
      "--data-storage",
      "custom-table",
      "--persistence-policy",
      "authenticated",
    ],
    {
      cwd: targetDir,
    }
  );

  const renderTargetsSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "mailing-card", "render-targets.php"),
    "utf8"
  );
  const emailRenderSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "mailing-card", "render-email.php"),
    "utf8"
  );
  const textRenderSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "mailing-card", "render-text.php"),
    "utf8"
  );

  expect(renderTargetsSource).toMatch(/function\s+.+_render_target\(/);
  expect(emailRenderSource).toContain("render_target( 'email'");
  expect(textRenderSource).toContain("render_target( 'plain-text'");
  expect(
    fs.existsSync(
      path.join(targetDir, "src", "blocks", "mailing-card", "render-mjml.php")
    )
  ).toBe(false);
  runGeneratedScript(targetDir, "scripts/sync-types-to-block-json.ts", [
    "--check",
  ]);
  runGeneratedScript(targetDir, "scripts/sync-rest-contracts.ts", [
    "--check",
  ]);
}, 60_000);

test("add compound block repairs a legacy shared validator toolkit in an official workspace template", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-toolkit"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add compound legacy validator toolkit",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-toolkit",
      textDomain: "demo-space",
      title: "Demo Workspace Add Compound Legacy Validator Toolkit",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);

  writeLegacyCompoundValidatorFixture(
    targetDir,
    "faq-stack",
    "FaqStackAttributes",
    "FaqStackAttributes"
  );
  writeLegacyCompoundValidatorFixture(
    targetDir,
    "faq-stack-item",
    "FaqStackItemAttributes",
    "FaqStackItemAttributes",
    {
      lineEnding: "\r\n",
      quoteStyle: '"',
    }
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const validatorToolkitSource = fs.readFileSync(
    path.join(targetDir, "src", "validator-toolkit.ts"),
    "utf8"
  );
  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );
  const repairedChildValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack-item", "validators.ts"),
    "utf8"
  );

  expect(validatorToolkitSource).toContain("interface TemplateValidatorFunctions<");
  expect(validatorToolkitSource).toContain(
    "assert: ScaffoldValidatorToolkitOptions< T >['assert'];"
  );
  expect(repairedParentValidatorSource).toContain("import typia from 'typia';");
  expect(repairedParentValidatorSource).toContain(
    "import currentManifest from './manifest-defaults-document';"
  );
  expect(repairedParentValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackAttributes >()"
  );
  expect(repairedChildValidatorSource).toContain("import typia from 'typia';");
  expect(repairedChildValidatorSource).toContain(
    "import currentManifest from './manifest-defaults-document';"
  );
  expect(repairedChildValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackItemAttributes >()"
  );
  typecheckGeneratedProject(targetDir);
}, 60_000);

test("add compound block backfills a missing manifest-defaults wrapper during legacy validator repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-wrapper-backfill"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description:
        "Demo workspace add compound legacy validator wrapper backfill",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-wrapper-backfill",
      textDomain: "demo-space",
      title:
        "Demo Workspace Add Compound Legacy Validator Wrapper Backfill",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);
  fs.rmSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "faq-stack",
      "manifest-defaults-document.ts"
    )
  );
  writeLegacyCompoundValidatorFixture(
    targetDir,
    "faq-stack",
    "FaqStackAttributes",
    "FaqStackAttributes"
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const manifestDefaultsWrapperSource = fs.readFileSync(
    path.join(
      targetDir,
      "src",
      "blocks",
      "faq-stack",
      "manifest-defaults-document.ts"
    ),
    "utf8"
  );
  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );

  expect(manifestDefaultsWrapperSource).toContain(
    "import rawCurrentManifest from './typia.manifest.json';"
  );
  expect(manifestDefaultsWrapperSource).toContain(
    "defineManifestDefaultsDocument( rawCurrentManifest )"
  );
  expect(repairedParentValidatorSource).toContain(
    "import currentManifest from './manifest-defaults-document';"
  );

  typecheckGeneratedProject(targetDir);
}, 60_000);

test("add compound block does not duplicate an existing typia import during legacy validator repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-typia-import"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add compound legacy validator typia import",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-typia-import",
      textDomain: "demo-space",
      title: "Demo Workspace Add Compound Legacy Validator Typia Import",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);

  writeLegacyCompoundValidatorFixture(
    targetDir,
    "faq-stack",
    "FaqStackAttributes",
    "FaqStackAttributes",
    {
      includeTypiaImport: true,
      quoteStyle: '"',
    }
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );
  const typiaImportMatches = repairedParentValidatorSource.match(
    /import typia from ['"]typia['"];/gu
  );

  expect(typiaImportMatches).toHaveLength(1);
  expect(repairedParentValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackAttributes >()"
  );

  typecheckGeneratedProject(targetDir);
}, 30_000);

test("add compound block does not duplicate a BOM-prefixed typia import during legacy validator repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-bom-typia-import"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add compound legacy validator BOM typia import",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-bom-typia-import",
      textDomain: "demo-space",
      title: "Demo Workspace Add Compound Legacy Validator BOM Typia Import",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);

  fs.writeFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    [
      '\uFEFFimport typia from "typia";',
      'import currentManifest from "./typia.manifest.json";',
      "import type {",
      "\tFaqStackAttributes,",
      '} from "./types";',
      'import { createTemplateValidatorToolkit } from "../../validator-toolkit";',
      "",
      "const scaffoldValidators = createTemplateValidatorToolkit< FaqStackAttributes >( {",
      "\tmanifest: currentManifest,",
      "} );",
      "",
      "export const validateFaqStackAttributes =",
      "\tscaffoldValidators.validateAttributes;",
      "",
      "export const validators = scaffoldValidators.validators;",
      "",
      "export const sanitizeFaqStackAttributes =",
      "\tscaffoldValidators.sanitizeAttributes;",
      "",
      "export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;",
      "",
    ].join("\n"),
    "utf8"
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );
  const typiaImportMatches = repairedParentValidatorSource.match(
    /^[\uFEFF \t]*import typia from ['"]typia['"];/gmu
  );

  expect(typiaImportMatches).toHaveLength(1);
  expect(repairedParentValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackAttributes >()"
  );

  typecheckGeneratedProject(targetDir);
}, 30_000);

test("add compound block ignores a commented typia import during legacy validator repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-commented-typia-import"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description:
        "Demo workspace add compound legacy validator commented typia import",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-commented-typia-import",
      textDomain: "demo-space",
      title:
        "Demo Workspace Add Compound Legacy Validator Commented Typia Import",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);

  fs.writeFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    [
      '// import typia from "typia";',
      'import currentManifest from "./typia.manifest.json";',
      "import type {",
      "\tFaqStackAttributes,",
      '} from "./types";',
      'import { createTemplateValidatorToolkit } from "../../validator-toolkit";',
      "",
      "const scaffoldValidators = createTemplateValidatorToolkit< FaqStackAttributes >( {",
      "\tmanifest: currentManifest,",
      "} );",
      "",
      "export const validateFaqStackAttributes =",
      "\tscaffoldValidators.validateAttributes;",
      "",
      "export const validators = scaffoldValidators.validators;",
      "",
      "export const sanitizeFaqStackAttributes =",
      "\tscaffoldValidators.sanitizeAttributes;",
      "",
      "export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;",
      "",
    ].join("\n"),
    "utf8"
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );
  const typiaImportMatches = repairedParentValidatorSource
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .match(/^[ \t]*import typia from ['"]typia['"];/gmu);

  expect(typiaImportMatches).toHaveLength(1);
  expect(repairedParentValidatorSource).toContain(
    '// import typia from "typia";'
  );
  expect(repairedParentValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackAttributes >()"
  );

  typecheckGeneratedProject(targetDir);
}, 30_000);

test("add compound block ignores a block-commented typia import during legacy validator repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-block-commented-typia-import"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description:
        "Demo workspace add compound legacy validator block commented typia import",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-block-commented-typia-import",
      textDomain: "demo-space",
      title:
        "Demo Workspace Add Compound Legacy Validator Block Commented Typia Import",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);

  fs.writeFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    [
      "/*",
      'import typia from "typia";',
      "*/",
      'import currentManifest from "./typia.manifest.json";',
      "import type {",
      "\tFaqStackAttributes,",
      '} from "./types";',
      'import { createTemplateValidatorToolkit } from "../../validator-toolkit";',
      "",
      "const scaffoldValidators = createTemplateValidatorToolkit< FaqStackAttributes >( {",
      "\tmanifest: currentManifest,",
      "} );",
      "",
      "export const validateFaqStackAttributes =",
      "\tscaffoldValidators.validateAttributes;",
      "",
      "export const validators = scaffoldValidators.validators;",
      "",
      "export const sanitizeFaqStackAttributes =",
      "\tscaffoldValidators.sanitizeAttributes;",
      "",
      "export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;",
      "",
    ].join("\n"),
    "utf8"
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );
  const typiaImportMatches = repairedParentValidatorSource
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .match(/^[ \t]*import typia from ['"]typia['"];/gmu);

  expect(typiaImportMatches).toHaveLength(1);
  expect(repairedParentValidatorSource).toContain("/*");
  expect(repairedParentValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackAttributes >()"
  );

  typecheckGeneratedProject(targetDir);
}, 30_000);

test("add compound block ignores a block-commented manifest import during legacy validator repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-legacy-validator-block-commented-manifest-import"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description:
        "Demo workspace add compound legacy validator block commented manifest import",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-legacy-validator-block-commented-manifest-import",
      textDomain: "demo-space",
      title:
        "Demo Workspace Add Compound Legacy Validator Block Commented Manifest Import",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  writeLegacyValidatorToolkitFixture(targetDir);

  fs.writeFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    [
      "/*",
      'import currentManifest from "./typia.manifest.json";',
      "*/",
      'import type {',
      "\tFaqStackAttributes,",
      '} from "./types";',
      'import { createTemplateValidatorToolkit } from "../../validator-toolkit";',
      'import currentManifest from "./typia.manifest.json";',
      "",
      "const scaffoldValidators = createTemplateValidatorToolkit< FaqStackAttributes >( {",
      "\tmanifest: currentManifest,",
      "} );",
      "",
      "export const validateFaqStackAttributes =",
      "\tscaffoldValidators.validateAttributes;",
      "",
      "export const validators = scaffoldValidators.validators;",
      "",
      "export const sanitizeFaqStackAttributes =",
      "\tscaffoldValidators.sanitizeAttributes;",
      "",
      "export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;",
      "",
    ].join("\n"),
    "utf8"
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const repairedParentValidatorSource = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "faq-stack", "validators.ts"),
    "utf8"
  );

  expect(repairedParentValidatorSource).toContain(
    "import currentManifest from './manifest-defaults-document';"
  );
  expect(repairedParentValidatorSource).toContain(
    'import currentManifest from "./typia.manifest.json";'
  );
  expect(repairedParentValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackAttributes >()"
  );

  typecheckGeneratedProject(targetDir);
}, 30_000);

test("add compound block preserves a compatible shared validator toolkit with different formatting", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-compound-compatible-validator-toolkit"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add compound compatible validator toolkit",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-compound-compatible-validator-toolkit",
      textDomain: "demo-space",
      title: "Demo Workspace Add Compound Compatible Validator Toolkit",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "faq-stack",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const validatorToolkitPath = path.join(
    targetDir,
    "src",
    "validator-toolkit.ts"
  );
  fs.writeFileSync(
    validatorToolkitPath,
    [
      "// preserve-compatible-toolkit",
      "import { parseManifestDefaultsDocument } from \"@wp-typia/block-runtime/defaults\";",
      "import {",
      "\tcreateScaffoldValidatorToolkit,",
      "\ttype ScaffoldValidatorToolkitOptions,",
      "} from \"@wp-typia/block-runtime/validation\";",
      "",
      "interface TemplateValidatorFunctions<T extends object>{",
      "\tassert:ScaffoldValidatorToolkitOptions<T>[\"assert\"];",
      "\tclone:ScaffoldValidatorToolkitOptions<T>[\"clone\"];",
      "\tis:ScaffoldValidatorToolkitOptions<T>[\"is\"];",
      "\tprune:ScaffoldValidatorToolkitOptions<T>[\"prune\"];",
      "\trandom:ScaffoldValidatorToolkitOptions<T>[\"random\"];",
      "\tvalidate:ScaffoldValidatorToolkitOptions<T>[\"validate\"];",
      "}",
      "",
      "interface TemplateValidatorToolkitOptions<T extends object>",
      "\textends TemplateValidatorFunctions<T> {",
      "\tfinalize?: ScaffoldValidatorToolkitOptions<T>[\"finalize\"];",
      "\tmanifest: unknown;",
      "\tonValidationError?: ScaffoldValidatorToolkitOptions<T>[\"onValidationError\"];",
      "}",
      "",
      "export function createTemplateValidatorToolkit<T extends object>({",
      "\tassert,",
      "\tclone,",
      "\tfinalize,",
      "\tis,",
      "\tmanifest,",
      "\tonValidationError,",
      "\tprune,",
      "\trandom,",
      "\tvalidate ,",
      "}: TemplateValidatorToolkitOptions<T>) {",
      "\treturn createScaffoldValidatorToolkit<T>({",
      "\t\tmanifest: parseManifestDefaultsDocument( manifest ),",
      "\t\tvalidate,",
      "\t\tassert,",
      "\t\tis,",
      "\t\trandom,",
      "\t\tclone,",
      "\t\tprune,",
      "\t\tfinalize,",
      "\t\tonValidationError,",
      "\t});",
      "}",
      "",
    ].join("\n"),
    "utf8"
  );

  runCli(
    "node",
    [
      entryPath,
      "add",
      "block",
      "feature-grid",
      "--template",
      "compound",
    ],
    {
      cwd: targetDir,
    }
  );

  const validatorToolkitSource = fs.readFileSync(validatorToolkitPath, "utf8");

  expect(validatorToolkitSource).toContain("// preserve-compatible-toolkit");

  typecheckGeneratedProject(targetDir);
}, 30_000);

test("add block updates migration config in a migration-enabled workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-migration");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    withMigrationUi: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add migration",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-migration",
      textDomain: "demo-space",
      title: "Demo Workspace Add Migration",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [entryPath, "add", "block", "release-note", "--template", "basic"],
    {
      cwd: targetDir,
    }
  );

  const migrationConfigSource = fs.readFileSync(
    path.join(targetDir, "src", "migrations", "config.ts"),
    "utf8"
  );

  expect(migrationConfigSource).toContain("key: 'release-note'");
  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "migrations",
        "versions",
        "v1",
        "release-note",
        "typia.manifest.json"
      )
    )
  ).toBe(true);

  const doctorOutput = runCli(
    "node",
    [entryPath, "migrate", "doctor", "--all"],
    {
      cwd: targetDir,
    }
  );
  expect(doctorOutput).toContain("PASS Migration config");
  const rootDoctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const rootDoctorChecks = JSON.parse(rootDoctorOutput) as {
    checks: Array<{ label: string; status: string }>;
  };
  expect(
    rootDoctorChecks.checks.find(
      (check) => check.label === "Migration workspace"
    )?.status
  ).toBe("pass");
  expect(doctorOutput).toContain("PASS Migration doctor summary");
}, 20_000);

test("canonical CLI can add a pattern to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-pattern");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add pattern",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-pattern",
      textDomain: "demo-space",
      title: "Demo Workspace Add Pattern",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  expect(
    getCommandErrorMessage(() =>
      runCli("node", [entryPath, "add", "pattern", "2024-hero"], {
        cwd: targetDir,
      })
    )
  ).toContain("Pattern name must start with a letter");

  runCli("node", [entryPath, "add", "pattern", "hero-layout"], {
    cwd: targetDir,
  });

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-add-pattern.php"),
    "utf8"
  );
  const patternSource = fs.readFileSync(
    path.join(targetDir, "src", "patterns", "hero-layout.php"),
    "utf8"
  );

  expect(blockConfigSource).toContain('slug: "hero-layout"');
  expect(blockConfigSource).toContain('file: "src/patterns/hero-layout.php"');
  expect(bootstrapSource).toContain("register_block_pattern_category");
  expect(bootstrapSource).toContain("/src/patterns/*.php");
  expect(patternSource).toContain("demo-space/hero-layout");

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find((check) => check.label === "Pattern bootstrap")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find((check) => check.label === "Pattern hero-layout")
      ?.status
  ).toBe("pass");
}, 15_000);

test("runAddBlockCommand carries compound InnerBlocks presets into workspace scaffolds", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-compound-horizontal");

  await scaffoldOfficialWorkspace(targetDir, {
    description: "Demo workspace add compound horizontal",
    slug: "demo-workspace-add-compound-horizontal",
    title: "Demo Workspace Add Compound Horizontal",
  });

  linkWorkspaceNodeModules(targetDir);

  const result = await runAddBlockCommand({
    blockName: "feature-grid",
    cwd: targetDir,
    innerBlocksPreset: "horizontal",
    templateId: "compound",
  });

  const parentChildren = fs.readFileSync(
    path.join(targetDir, "src", "blocks", "feature-grid", "children.ts"),
    "utf8",
  );

  expect(result.blockSlugs).toEqual(["feature-grid", "feature-grid-item"]);
  expect(parentChildren).toContain("ROOT_INNER_BLOCKS_PRESET_ID = 'horizontal'");
  expect(parentChildren).toContain("directInsert: true");
  expect(parentChildren).toContain("orientation: 'horizontal'");
  typecheckGeneratedProject(targetDir);
}, 20_000);

test("canonical CLI can add a binding source to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-binding-source");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add binding source",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-binding-source",
      textDomain: "demo-space",
      title: "Demo Workspace Add Binding Source",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
    cwd: targetDir,
  });

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-add-binding-source.php"),
    "utf8"
  );
  const bindingsIndexSource = fs.readFileSync(
    path.join(targetDir, "src", "bindings", "index.ts"),
    "utf8"
  );
  const bindingServerSource = fs.readFileSync(
    path.join(targetDir, "src", "bindings", "hero-data", "server.php"),
    "utf8"
  );
  const bindingEditorSource = fs.readFileSync(
    path.join(targetDir, "src", "bindings", "hero-data", "editor.ts"),
    "utf8"
  );

  expect(blockConfigSource).toContain('slug: "hero-data"');
  expect(blockConfigSource).toContain(
    'serverFile: "src/bindings/hero-data/server.php"'
  );
  expect(blockConfigSource).toContain(
    'editorFile: "src/bindings/hero-data/editor.ts"'
  );
  expect(bootstrapSource).toContain("src/bindings/*/server.php");
  expect(bootstrapSource).toContain("build/bindings/index.js");
  expect(bindingsIndexSource).toContain("import './hero-data/editor';");
  expect(bindingServerSource).toContain("register_block_bindings_source");
  expect(bindingServerSource).toContain(
    "function demo_space_hero_data_binding_source_values() : array"
  );
  expect(bindingServerSource).toContain(
    "'get_value_callback' => 'demo_space_hero_data_resolve_binding_source_value'"
  );
  expect(bindingServerSource).toContain("'hero-data' => 'Hero Data starter value'");
  expect(bindingEditorSource).toContain("registerBlockBindingsSource");
  expect(bindingEditorSource).toContain("const BINDING_SOURCE_VALUES");
  expect(bindingEditorSource).toContain('"hero-data": "Hero Data starter value"');
  expect(bindingEditorSource).toContain("resolveBindingSourceValue( field )");
  expect(bindingEditorSource).toContain("getFieldsList()");

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find((check) => check.label === "Binding bootstrap")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Binding sources index"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Binding source hero-data"
    )?.status
  ).toBe("pass");

  runCli("npm", ["run", "build"], { cwd: targetDir });
  expect(
    fs.existsSync(path.join(targetDir, "build", "bindings", "index.js"))
  ).toBe(true);
  expect(
    fs.readFileSync(path.join(targetDir, "build", "bindings", "index.js"), "utf8")
  ).toContain("Hero Data starter value");
  expect(
    fs.existsSync(
      path.join(targetDir, "build", "bindings", "index.asset.php")
    )
  ).toBe(true);
  expect(
    fs.existsSync(path.join(targetDir, "build", "blocks-manifest.php"))
  ).toBe(true);
}, 30_000);

test("binding source workflow preserves existing files on duplicate failure", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-binding-source-duplicate"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace binding source duplicate",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-binding-source-duplicate",
      textDomain: "demo-space",
      title: "Demo Workspace Binding Source Duplicate",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  expect(
    getCommandErrorMessage(() =>
      runCli("node", [entryPath, "add", "binding-source", "2024-hero"], {
        cwd: targetDir,
      })
    )
  ).toContain("Binding source name must start with a letter");

  runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
    cwd: targetDir,
  });

  const originalServerSource = fs.readFileSync(
    path.join(targetDir, "src", "bindings", "hero-data", "server.php"),
    "utf8"
  );
  const originalInventorySource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );

  expect(
    getCommandErrorMessage(() =>
      runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
        cwd: targetDir,
      })
    )
  ).toContain("A binding source already exists");

  expect(
    fs.readFileSync(
      path.join(targetDir, "src", "bindings", "hero-data", "server.php"),
      "utf8"
    )
  ).toBe(originalServerSource);
  expect(
    fs.readFileSync(
      path.join(targetDir, "scripts", "block-config.ts"),
      "utf8"
    )
  ).toBe(originalInventorySource);
}, 15_000);

test("binding source rollback restores an existing src/bindings/index.js registry", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-binding-source-js-rollback"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace binding js rollback",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-binding-source-js-rollback",
      textDomain: "demo-space",
      title: "Demo Workspace Binding Js Rollback",
    },
  });

  linkWorkspaceNodeModules(targetDir);
  runCli("node", [entryPath, "add", "binding-source", "hero-data"], {
    cwd: targetDir,
  });

  const bindingsTsPath = path.join(targetDir, "src", "bindings", "index.ts");
  const bindingsJsPath = path.join(targetDir, "src", "bindings", "index.js");
  fs.renameSync(bindingsTsPath, bindingsJsPath);
  const originalBindingsIndexSource = fs.readFileSync(bindingsJsPath, "utf8");

  const blockConfigPath = path.join(targetDir, "scripts", "block-config.ts");
  fs.writeFileSync(
    blockConfigPath,
    fs
      .readFileSync(blockConfigPath, "utf8")
      .replace(
        "// wp-typia add binding-source entries",
        "// missing binding source marker"
      ),
    "utf8"
  );

  expect(
    getCommandErrorMessage(() =>
      runCli("node", [entryPath, "add", "binding-source", "news-data"], {
        cwd: targetDir,
      })
    )
  ).toContain("Workspace inventory marker");

  const rolledBackBindingSourceDir = path.join(
    targetDir,
    "src",
    "bindings",
    "news-data"
  );
  expect(fs.existsSync(bindingsTsPath)).toBe(false);
  expect(fs.readFileSync(bindingsJsPath, "utf8")).toBe(
    originalBindingsIndexSource
  );
  expect(fs.existsSync(rolledBackBindingSourceDir)).toBe(false);
  expect(
    fs.existsSync(path.join(rolledBackBindingSourceDir, "server.php"))
  ).toBe(false);
  expect(
    fs.existsSync(path.join(rolledBackBindingSourceDir, "editor.ts"))
  ).toBe(false);
}, 15_000);

test("canonical CLI can add a plugin-level REST resource to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-rest-resource");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add rest resource",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-rest-resource",
      textDomain: "demo-space",
      title: "Demo Workspace Add Rest Resource",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "rest-resource",
      "snapshots",
      "--namespace",
      "demo-space/v1",
      "--methods",
      "list,read,create,update,delete",
    ],
    {
      cwd: targetDir,
    }
  );

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-add-rest-resource.php"),
    "utf8"
  );
  const typesSource = fs.readFileSync(
    path.join(targetDir, "src", "rest", "snapshots", "api-types.ts"),
    "utf8"
  );
  const validatorsSource = fs.readFileSync(
    path.join(targetDir, "src", "rest", "snapshots", "api-validators.ts"),
    "utf8"
  );
  const apiSource = fs.readFileSync(
    path.join(targetDir, "src", "rest", "snapshots", "api.ts"),
    "utf8"
  );
  const dataSource = fs.readFileSync(
    path.join(targetDir, "src", "rest", "snapshots", "data.ts"),
    "utf8"
  );
  const phpSource = fs.readFileSync(
    path.join(targetDir, "inc", "rest", "snapshots.php"),
    "utf8"
  );

  expect(blockConfigSource).toContain('slug: "snapshots"');
  expect(blockConfigSource).toContain('namespace: "demo-space/v1"');
  expect(blockConfigSource).toContain("methods: [");
  expect(blockConfigSource).toContain('"list"');
  expect(blockConfigSource).toContain('"read"');
  expect(blockConfigSource).toContain('"create"');
  expect(blockConfigSource).toContain('"update"');
  expect(blockConfigSource).toContain('"delete"');
  expect(blockConfigSource).toContain('apiFile: "src/rest/snapshots/api.ts"');
  expect(blockConfigSource).toContain('phpFile: "inc/rest/snapshots.php"');
  expect(blockConfigSource).toContain("defineEndpointManifest");
  expect(bootstrapSource).toContain("function demo_space_register_rest_resources()");
  expect(bootstrapSource).toContain("inc/rest/*.php");
  expect(typesSource).toContain("export interface SnapshotsListQuery");
  expect(typesSource).toContain("export interface SnapshotsDeleteResponse");
  expect(validatorsSource).toContain("apiValidators");
  expect(validatorsSource).toContain("listQuery");
  expect(validatorsSource).toContain("deleteResponse");
  expect(apiSource).toContain("restResourceCreateEndpoint");
  expect(apiSource).toContain("resolveRestNonce");
  expect(apiSource).toContain("headers: nonce");
  expect(apiSource).not.toContain("requestOptions: nonce");
  expect(dataSource).toContain("useSnapshotsListQuery");
  expect(dataSource).toContain("useDeleteSnapshotsResourceMutation");
  expect(phpSource).toContain("register_rest_route");
  expect(phpSource).toContain("'demo-space/v1'");
  expect(phpSource).toContain("current_user_can( 'edit_posts' )");
  expect(
    fs.existsSync(path.join(targetDir, "src", "rest", "snapshots", "api-client.ts"))
  ).toBe(true);
  expect(
    fs.existsSync(path.join(targetDir, "src", "rest", "snapshots", "api.openapi.json"))
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "rest",
        "snapshots",
        "api-schemas",
        "list-query.schema.json"
      )
    )
  ).toBe(true);

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find((check) => check.label === "REST resource bootstrap")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "REST resource config snapshots"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "REST resource snapshots"
    )?.status
  ).toBe("pass");

  runCli("npm", ["run", "sync-rest", "--", "--check"], { cwd: targetDir });
  typecheckGeneratedProject(targetDir);
}, 30_000);

test("rest resource workflow repairs legacy sync-rest scripts before writing workspace resources", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-rest-resource-legacy-sync-rest"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace rest resource legacy sync-rest",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-rest-resource-legacy-sync-rest",
      textDomain: "demo-space",
      title: "Demo Workspace Rest Resource Legacy Sync Rest",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const syncRestScriptPath = path.join(
    targetDir,
    "scripts",
    "sync-rest-contracts.ts"
  );
  const legacySyncRestSource = fs
    .readFileSync(syncRestScriptPath, "utf8")
    .replace(
      /import \{\n\tBLOCKS,\n\tREST_RESOURCES,\n\ttype WorkspaceBlockConfig,\n\ttype WorkspaceRestResourceConfig,\n\} from '\.\/block-config';/u,
      "import { BLOCKS, type WorkspaceBlockConfig } from './block-config';"
    )
    .replace(/\nfunction isWorkspaceRestResource\([\s\S]*?\n\}\n/u, "\n")
    .replace(
      "\n\tconst restResources = REST_RESOURCES.filter( isWorkspaceRestResource );",
      ""
    )
    .replace(
      /if \( restBlocks.length === 0 && restResources.length === 0 \) \{[\s\S]*?\n\t\}/u,
      [
        "if ( restBlocks.length === 0 ) {",
        "\t\tconsole.log(",
        "\t\t\toptions.check",
        "\t\t\t\t? 'ℹ️ No REST-enabled workspace blocks are registered yet. `sync-rest --check` is already clean.'",
        "\t\t\t\t: 'ℹ️ No REST-enabled workspace blocks are registered yet.'",
        "\t\t);",
        "\t\treturn;",
        "\t}",
      ].join("\n")
    )
    .replace(
      /\n\tfor \( const resource of restResources \) \{[\s\S]*?\n\t\}\n\n\tconsole\.log\(/u,
      "\n\tconsole.log("
    )
    .replace(
      "✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date for workspace blocks and plugin-level resources!",
      "✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date with the TypeScript types!"
    )
    .replace(
      "✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated for workspace blocks and plugin-level resources!",
      "✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated from TypeScript types!"
    );
  fs.writeFileSync(syncRestScriptPath, legacySyncRestSource, "utf8");

  runCli("node", [entryPath, "add", "rest-resource", "snapshots"], {
    cwd: targetDir,
  });

  const repairedSyncRestSource = fs.readFileSync(syncRestScriptPath, "utf8");
  expect(repairedSyncRestSource).toContain("REST_RESOURCES");
  expect(repairedSyncRestSource).toContain("function isWorkspaceRestResource(");
  expect(repairedSyncRestSource).toContain(
    "const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );"
  );
  expect(repairedSyncRestSource).toContain(
    "plugin-level REST resources are registered yet"
  );
  expect(repairedSyncRestSource).toContain("for ( const resource of restResources )");

  runCli("npm", ["run", "sync-rest", "--", "--check"], { cwd: targetDir });
}, 20_000);

test("rest resource workflow fails fast when sync-rest anchors drift past automatic repair", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-rest-resource-sync-rest-drift"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace rest resource sync-rest drift",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-rest-resource-sync-rest-drift",
      textDomain: "demo-space",
      title: "Demo Workspace Rest Resource Sync Rest Drift",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const syncRestScriptPath = path.join(
    targetDir,
    "scripts",
    "sync-rest-contracts.ts"
  );
  fs.writeFileSync(
    syncRestScriptPath,
    [
      "import { WORKSPACE_BLOCKS, type WorkspaceBlockConfig } from './block-config';",
      "",
      "function isRestEnabledBlock(",
      "\tblock: WorkspaceBlockConfig",
      "): block is WorkspaceBlockConfig & {",
      "\trestManifest: NonNullable< WorkspaceBlockConfig[ 'restManifest' ] >;",
      "\ttypesFile: string;",
      "} {",
      "\treturn (",
      "\t\ttypeof block.typesFile === 'string' &&",
      "\t\ttypeof block.restManifest === 'object' &&",
      "\t\tblock.restManifest !== null",
      "\t);",
      "}",
      "",
      "async function assertTypeArtifactsCurrent() {",
      "\tconst restBlocks = WORKSPACE_BLOCKS.filter( isRestEnabledBlock );",
      "\tif ( restBlocks.length === 0 ) {",
      "\t\tconsole.log( 'legacy drift' );",
      "\t\treturn;",
      "\t}",
      "\tconsole.log( 'legacy drift' );",
      "}",
    ].join("\n"),
    "utf8"
  );

  expect(() =>
    runCli("node", [entryPath, "add", "rest-resource", "snapshots"], {
      cwd: targetDir,
    })
  ).toThrow(
    "ensureRestResourceSyncScriptAnchors could not patch sync-rest-contracts.ts"
  );
}, 20_000);

test("workspace doctor fails when required REST resource schemas are missing", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-rest-resource-missing-schema"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace rest resource missing schema",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-rest-resource-missing-schema",
      textDomain: "demo-space",
      title: "Demo Workspace Rest Resource Missing Schema",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "rest-resource",
      "snapshots",
      "--namespace",
      "demo-space/v1",
    ],
    {
      cwd: targetDir,
    }
  );

  fs.rmSync(
    path.join(
      targetDir,
      "src",
      "rest",
      "snapshots",
      "api-schemas",
      "list-response.schema.json"
    )
  );

  const doctorError = getCommandErrorMessage(() =>
    runCli("node", [entryPath, "doctor", "--format", "json"], {
      cwd: targetDir,
    })
  );

  expect(doctorError).toContain("REST resource snapshots");
  expect(doctorError).toContain("list-response.schema.json");
}, 20_000);

test("rest resource workflow rejects invalid namespace and methods and preserves existing files on duplicate failure", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-rest-resource-duplicate"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace rest resource duplicate",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-rest-resource-duplicate",
      textDomain: "demo-space",
      title: "Demo Workspace Rest Resource Duplicate",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "rest-resource",
          "snapshots",
          "--namespace",
          "DemoSpace/v1",
        ],
        {
          cwd: targetDir,
        }
      )
    )
  ).toContain("REST resource namespace must use lowercase");

  expect(
    getCommandErrorMessage(() =>
      runCli(
        "node",
        [
          entryPath,
          "add",
          "rest-resource",
          "snapshots",
          "--methods",
          "list,archive",
        ],
        {
          cwd: targetDir,
        }
      )
    )
  ).toContain("REST resource methods must be a comma-separated list");

  runCli("node", [entryPath, "add", "rest-resource", "snapshots"], {
    cwd: targetDir,
  });

  const originalConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const originalPhpSource = fs.readFileSync(
    path.join(targetDir, "inc", "rest", "snapshots.php"),
    "utf8"
  );

  expect(
    getCommandErrorMessage(() =>
      runCli("node", [entryPath, "add", "rest-resource", "snapshots"], {
        cwd: targetDir,
      })
    )
  ).toContain("A REST resource already exists");

  expect(
    fs.readFileSync(path.join(targetDir, "scripts", "block-config.ts"), "utf8")
  ).toBe(originalConfigSource);
  expect(
    fs.readFileSync(path.join(targetDir, "inc", "rest", "snapshots.php"), "utf8")
  ).toBe(originalPhpSource);
}, 20_000);

test("canonical CLI can add a server-only AI feature to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-ai-feature");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add ai feature",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-ai-feature",
      textDomain: "demo-space",
      title: "Demo Workspace Add AI Feature",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [
      entryPath,
      "add",
      "ai-feature",
      "brief-suggestions",
      "--namespace",
      "demo-space/v1",
    ],
    {
      cwd: targetDir,
    }
  );

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-add-ai-feature.php"),
    "utf8"
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  ) as {
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  const syncProjectSource = fs.readFileSync(
    path.join(targetDir, "scripts", "sync-project.ts"),
    "utf8"
  );
  const syncRestSource = fs.readFileSync(
    path.join(targetDir, "scripts", "sync-rest-contracts.ts"),
    "utf8"
  );
  const syncAiSource = fs.readFileSync(
    path.join(targetDir, "scripts", "sync-ai-features.ts"),
    "utf8"
  );
  const typesSource = fs.readFileSync(
    path.join(targetDir, "src", "ai-features", "brief-suggestions", "api-types.ts"),
    "utf8"
  );
  const validatorsSource = fs.readFileSync(
    path.join(
      targetDir,
      "src",
      "ai-features",
      "brief-suggestions",
      "api-validators.ts"
    ),
    "utf8"
  );
  const apiSource = fs.readFileSync(
    path.join(targetDir, "src", "ai-features", "brief-suggestions", "api.ts"),
    "utf8"
  );
  const dataSource = fs.readFileSync(
    path.join(targetDir, "src", "ai-features", "brief-suggestions", "data.ts"),
    "utf8"
  );
  const phpSource = fs.readFileSync(
    path.join(targetDir, "inc", "ai-features", "brief-suggestions.php"),
    "utf8"
  );

  expect(blockConfigSource).toContain('slug: "brief-suggestions"');
  expect(blockConfigSource).toContain('namespace: "demo-space/v1"');
  expect(blockConfigSource).toContain(
    'aiSchemaFile: "src/ai-features/brief-suggestions/ai-schemas/feature-result.ai.schema.json"'
  );
  expect(blockConfigSource).toContain(
    'apiFile: "src/ai-features/brief-suggestions/api.ts"'
  );
  expect(blockConfigSource).toContain(
    'phpFile: "inc/ai-features/brief-suggestions.php"'
  );
  expect(blockConfigSource).toContain('"mode": "optional"');
  expect(blockConfigSource).toContain("WordPress AI Client");
  expect(blockConfigSource).toContain(
    "WordPress AI Client: wordpress-core-feature WordPress AI Client"
  );
  expect(blockConfigSource).toContain("defineEndpointManifest");
  expect(bootstrapSource).toContain("Requires at least: 6.7");
  expect(bootstrapSource).toContain("Tested up to:      6.9");
  expect(bootstrapSource).toContain("function demo_space_register_ai_features()");
  expect(bootstrapSource).toContain("inc/ai-features/*.php");
  expect(packageJson.scripts?.["sync-ai"]).toBe("tsx scripts/sync-ai-features.ts");
  expect(packageJson.devDependencies?.["@wp-typia/project-tools"]).toBeDefined();
  expect(syncProjectSource).toContain("const syncAiScriptPath");
  expect(syncProjectSource).toContain("runSyncScript( syncAiScriptPath, options );");
  expect(syncRestSource).toContain("AI_FEATURES");
  expect(syncRestSource).toContain("isWorkspaceAiFeature");
  expect(syncRestSource).toContain("const aiFeatures = AI_FEATURES.filter");
  expect(syncAiSource).toContain("@wp-typia/project-tools/ai-artifacts");
  expect(syncAiSource).toContain("projectWordPressAiSchema");
  expect(typesSource).toContain(
    "export interface BriefSuggestionsAiFeatureRequest"
  );
  expect(typesSource).toContain(
    "export interface BriefSuggestionsAiFeatureResponse"
  );
  expect(typesSource).toContain("providerType: 'client' | 'cloud' | 'server'");
  expect(validatorsSource).toContain("featureRequest");
  expect(validatorsSource).toContain("featureResponse");
  expect(apiSource).toContain("aiFeatureRunEndpoint");
  expect(apiSource).toContain("resolveRestNonce");
  expect(dataSource).toContain("useRunBriefSuggestionsAiFeatureMutation");
  expect(phpSource).toContain("wp_ai_client_prompt");
  expect(phpSource).toContain("static $is_supported = null;");
  expect(phpSource).toContain("is_supported_for_text_generation");
  expect(phpSource).toContain("generate_text_result");
  expect(phpSource).toContain("admin_notices");
  expect(phpSource).toContain("sprintf(");
  expect(phpSource).toContain("The %s AI feature is optional");
  expect(phpSource).toContain("optional and remains disabled");
  const adminNoticeSource = phpSource.slice(
    phpSource.indexOf("function demo_space_brief_suggestions_ai_feature_admin_notice")
  );
  expect(
    adminNoticeSource.indexOf("! current_user_can( 'manage_options' )")
  ).toBeLessThan(
    adminNoticeSource.indexOf(
      "demo_space_brief_suggestions_is_ai_feature_supported()"
    )
  );
  expect(phpSource).toContain("register_rest_route");
  expect(phpSource).toContain("'demo-space/v1'");

  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "ai-features",
        "brief-suggestions",
        "api-client.ts"
      )
    )
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "ai-features",
        "brief-suggestions",
        "api.openapi.json"
      )
    )
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "ai-features",
        "brief-suggestions",
        "api-schemas",
        "feature-request.schema.json"
      )
    )
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "ai-features",
        "brief-suggestions",
        "ai-schemas",
        "feature-result.ai.schema.json"
      )
    )
  ).toBe(true);

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find((check) => check.label === "AI feature bootstrap")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "AI feature config brief-suggestions"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "AI feature brief-suggestions"
    )?.status
  ).toBe("pass");

  runCli("npm", ["run", "sync-rest", "--", "--check"], { cwd: targetDir });
  runCli("npm", ["run", "sync-ai", "--", "--check"], { cwd: targetDir });
  typecheckGeneratedProject(targetDir);
}, 30_000);

test("canonical CLI can add a typed workflow ability to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-ability");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add ability",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-ability",
      textDomain: "demo-space",
      title: "Demo Workspace Add Ability",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli("node", [entryPath, "add", "ability", "review-workflow"], {
    cwd: targetDir,
  });

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-add-ability.php"),
    "utf8"
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  ) as {
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  const syncProjectSource = fs.readFileSync(
    path.join(targetDir, "scripts", "sync-project.ts"),
    "utf8"
  );
  const syncAbilitiesSource = fs.readFileSync(
    path.join(targetDir, "scripts", "sync-abilities.ts"),
    "utf8"
  );
  const buildWorkspaceSource = fs.readFileSync(
    path.join(targetDir, "scripts", "build-workspace.mjs"),
    "utf8"
  );
  const webpackSource = fs.readFileSync(
    path.join(targetDir, "webpack.config.js"),
    "utf8"
  );
  const abilitiesIndexSource = fs.readFileSync(
    path.join(targetDir, "src", "abilities", "index.ts"),
    "utf8"
  );
  const typesSource = fs.readFileSync(
    path.join(targetDir, "src", "abilities", "review-workflow", "types.ts"),
    "utf8"
  );
  const dataSource = fs.readFileSync(
    path.join(targetDir, "src", "abilities", "review-workflow", "data.ts"),
    "utf8"
  );
  const abilityConfig = JSON.parse(
    fs.readFileSync(
      path.join(
        targetDir,
        "src",
        "abilities",
        "review-workflow",
        "ability.config.json"
      ),
      "utf8"
    )
  ) as {
    abilityId?: string;
    category?: { slug?: string };
  };
  const phpSource = fs.readFileSync(
    path.join(targetDir, "inc", "abilities", "review-workflow.php"),
    "utf8"
  );

  expect(blockConfigSource).toContain('slug: "review-workflow"');
  expect(blockConfigSource).toContain(
    'configFile: "src/abilities/review-workflow/ability.config.json"'
  );
  expect(blockConfigSource).toContain(
    'inputTypeName: "ReviewWorkflowAbilityInput"'
  );
  expect(blockConfigSource).toContain(
    'outputTypeName: "ReviewWorkflowAbilityOutput"'
  );
  expect(blockConfigSource).toContain('"mode": "required"');
  expect(blockConfigSource).toContain("WordPress Abilities API");
  expect(blockConfigSource).toContain("@wordpress/core-abilities");
  expect(bootstrapSource).toContain("Requires at least: 7.0");
  expect(bootstrapSource).toContain("Tested up to:      7.0");
  expect(bootstrapSource).toContain("inc/abilities/*.php");
  expect(bootstrapSource).toContain("build/abilities/index.js");
  expect(bootstrapSource).toContain("wp_enqueue_script_module");
  expect(bootstrapSource).toContain("@wordpress/core-abilities");
  expect(bootstrapSource).toContain("@wordpress/abilities");
  expect(bootstrapSource).toContain("plugins_loaded");
  expect(bootstrapSource).toContain("admin_enqueue_scripts");
  expect(packageJson.dependencies?.["@wordpress/abilities"]).toBe("^0.10.0");
  expect(packageJson.dependencies?.["@wordpress/core-abilities"]).toBe("^0.9.0");
  expect(packageJson.scripts?.["sync-abilities"]).toBe(
    "tsx scripts/sync-abilities.ts"
  );
  expect(syncProjectSource).toContain("const syncAbilitiesScriptPath");
  expect(syncProjectSource).toContain(
    "runSyncScript( syncAbilitiesScriptPath, options );"
  );
  expect(syncAbilitiesSource).toContain("ABILITIES");
  expect(syncAbilitiesSource).toContain("syncTypeSchemas");
  expect(buildWorkspaceSource).toContain("'src/abilities/index.ts'");
  expect(webpackSource).toContain("'abilities/index'");
  expect(abilitiesIndexSource).toContain("./review-workflow/client");
  expect(typesSource).toContain("export interface ReviewWorkflowAbilityInput");
  expect(typesSource).toContain("export interface ReviewWorkflowAbilityOutput");
  expect(dataSource).toContain("from '@wordpress/abilities'");
  expect(dataSource).toContain("@wordpress/core-abilities");
  expect(dataSource).toContain("waitForReviewWorkflowAbilityRegistration");
  expect(dataSource).toContain("getRegisteredAbility");
  expect(dataSource).not.toContain("globalThis");
  expect(abilityConfig.abilityId).toBe("demo-space/review-workflow");
  expect(abilityConfig.category?.slug).toBe("demo-space-workflows");
  expect(phpSource).toContain("wp_register_ability_category");
  expect(phpSource).toContain("wp_register_ability(");
  expect(phpSource).toContain("input.schema.json");
  expect(phpSource).toContain("output.schema.json");

  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "abilities",
        "review-workflow",
        "input.schema.json"
      )
    )
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(
        targetDir,
        "src",
        "abilities",
        "review-workflow",
        "output.schema.json"
      )
    )
  ).toBe(true);

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find((check) => check.label === "Ability bootstrap")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find((check) => check.label === "Abilities index")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Ability config review-workflow"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find((check) => check.label === "Ability review-workflow")
      ?.status
  ).toBe("pass");

  runCli("npm", ["run", "sync-abilities", "--", "--check"], { cwd: targetDir });
  typecheckGeneratedProject(targetDir);
}, 30_000);

test("canonical CLI can add an editor plugin to an official workspace template", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-add-editor-plugin");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools", "--slot", "PluginSidebar"],
    {
      cwd: targetDir,
    }
  );

  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-add-editor-plugin.php"),
    "utf8"
  );
  const editorPluginsIndexSource = fs.readFileSync(
    path.join(targetDir, "src", "editor-plugins", "index.ts"),
    "utf8"
  );
  const entrySource = fs.readFileSync(
    path.join(targetDir, "src", "editor-plugins", "document-tools", "index.tsx"),
    "utf8"
  );
  const sidebarSource = fs.readFileSync(
    path.join(targetDir, "src", "editor-plugins", "document-tools", "Sidebar.tsx"),
    "utf8"
  );
  const dataSource = fs.readFileSync(
    path.join(targetDir, "src", "editor-plugins", "document-tools", "data.ts"),
    "utf8"
  );

  expect(blockConfigSource).toContain('slug: "document-tools"');
  expect(blockConfigSource).toContain('slot: "PluginSidebar"');
  expect(blockConfigSource).toContain(
    'file: "src/editor-plugins/document-tools/index.tsx"'
  );
  expect(bootstrapSource).toContain("build/editor-plugins/index.js");
  expect(bootstrapSource).toContain("build/editor-plugins/style-index.css");
  expect(bootstrapSource).toContain(
    "demo_space_enqueue_editor_plugins_editor"
  );
  expect(editorPluginsIndexSource).toContain("import './document-tools';");
  expect(entrySource).toContain("registerPlugin");
  expect(entrySource).toContain("demo-space-document-tools");
  expect(sidebarSource).toContain("PluginSidebar");
  expect(sidebarSource).toContain("PluginSidebarMoreMenuItem");
  expect(dataSource).toContain('EDITOR_PLUGIN_SLOT = "PluginSidebar"');
  expect(dataSource).toContain("isDocumentToolsEnabled");

  const doctorOutput = runCli("node", [entryPath, "doctor", "--format", "json"], {
    cwd: targetDir,
  });
  const doctorChecks = parseJsonObjectFromOutput<{
    checks: Array<{ detail: string; label: string; status: string }>;
  }>(doctorOutput);
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Editor plugin bootstrap"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Editor plugins index"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Editor plugin document-tools"
    )?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Editor plugin config document-tools"
    )?.status
  ).toBe("pass");

  runCli("npm", ["run", "build"], { cwd: targetDir });
  expect(
    fs.existsSync(path.join(targetDir, "build", "editor-plugins", "index.js"))
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(targetDir, "build", "editor-plugins", "index.asset.php")
    )
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(targetDir, "build", "editor-plugins", "style-index.css")
    )
  ).toBe(true);
  expect(
    fs.existsSync(path.join(targetDir, "build", "blocks-manifest.php"))
  ).toBe(true);
}, 30_000);

test("editor plugin workflow repairs legacy workspace build config hooks", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-editor-plugin-legacy-build"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin legacy build",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin-legacy-build",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin Legacy Build",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const buildScriptPath = path.join(targetDir, "scripts", "build-workspace.mjs");
  const webpackConfigPath = path.join(targetDir, "webpack.config.js");
  fs.writeFileSync(
    buildScriptPath,
    fs
      .readFileSync(buildScriptPath, "utf8")
      .replace(
        `[\n\t\t'src/bindings/index.ts',\n\t\t'src/bindings/index.js',\n\t\t'src/editor-plugins/index.ts',\n\t\t'src/editor-plugins/index.js',\n\t]`,
        "[ 'src/bindings/index.ts', 'src/bindings/index.js' ]"
      ),
    "utf8"
  );
  fs.writeFileSync(
    webpackConfigPath,
    fs
      .readFileSync(webpackConfigPath, "utf8")
      .replace(
        `\tfor ( const [ entryName, candidates ] of [\n\t\t[\n\t\t\t'bindings/index',\n\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'editor-plugins/index',\n\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],\n\t\t],\n\t] ) {\n\t\tfor ( const relativePath of candidates ) {\n\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\t\tcontinue;\n\t\t\t}\n\n\t\t\tentries.push( [ entryName, entryPath ] );\n\t\t\tbreak;\n\t\t}\n\t}`,
        `\tfor ( const relativePath of [ 'src/bindings/index.ts', 'src/bindings/index.js' ] ) {\n\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\tcontinue;\n\t\t}\n\n\t\tentries.push( [ 'bindings/index', entryPath ] );\n\t\tbreak;\n\t}`
      ),
    "utf8"
  );

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools"],
    {
      cwd: targetDir,
    }
  );

  expect(fs.readFileSync(buildScriptPath, "utf8")).toContain(
    "'src/editor-plugins/index.ts'"
  );
  expect(fs.readFileSync(webpackConfigPath, "utf8")).toContain(
    "'editor-plugins/index'"
  );

  runCli("npm", ["run", "build"], { cwd: targetDir });
  expect(
    fs.existsSync(path.join(targetDir, "build", "editor-plugins", "index.js"))
  ).toBe(true);
}, 30_000);

test("editor plugin workflow repairs formatted legacy workspace build config hooks", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-editor-plugin-formatted-legacy-build"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin formatted legacy build",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin-formatted-legacy-build",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin Formatted Legacy Build",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const buildScriptPath = path.join(targetDir, "scripts", "build-workspace.mjs");
  const webpackConfigPath = path.join(targetDir, "webpack.config.js");
  fs.writeFileSync(
    buildScriptPath,
    fs
      .readFileSync(buildScriptPath, "utf8")
      .replace(
        `[\n\t\t'src/bindings/index.ts',\n\t\t'src/bindings/index.js',\n\t\t'src/editor-plugins/index.ts',\n\t\t'src/editor-plugins/index.js',\n\t]`,
        `[\n      \"src/bindings/index.ts\",\n      \"src/bindings/index.js\",\n    ]`
      ),
    "utf8"
  );
  fs.writeFileSync(
    webpackConfigPath,
    fs
      .readFileSync(webpackConfigPath, "utf8")
      .replace(
        `\tfor ( const [ entryName, candidates ] of [\n\t\t[\n\t\t\t'bindings/index',\n\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'editor-plugins/index',\n\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],\n\t\t],\n\t] ) {\n\t\tfor ( const relativePath of candidates ) {\n\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\t\tcontinue;\n\t\t\t}\n\n\t\t\tentries.push( [ entryName, entryPath ] );\n\t\t\tbreak;\n\t\t}\n\t}`,
        `\tfor ( const relativePath of [\n\t\t\"src/bindings/index.ts\",\n\t\t\"src/bindings/index.js\",\n\t] ) {\n\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\tcontinue;\n\t\t}\n\n\t\tentries.push( [ \"bindings/index\", entryPath ] );\n\t\tbreak;\n\t}`
      ),
    "utf8"
  );

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools"],
    {
      cwd: targetDir,
    }
  );

  expect(fs.readFileSync(buildScriptPath, "utf8")).toContain(
    "'src/editor-plugins/index.ts'"
  );
  expect(fs.readFileSync(webpackConfigPath, "utf8")).toContain(
    "'editor-plugins/index'"
  );
}, 30_000);

test("editor plugin workflow accepts double-quoted shared entry hooks", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-editor-plugin-double-quoted-shared-entries"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin double quoted shared entries",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin-double-quoted-shared-entries",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin Double Quoted Shared Entries",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const buildScriptPath = path.join(targetDir, "scripts", "build-workspace.mjs");
  const webpackConfigPath = path.join(targetDir, "webpack.config.js");
  fs.writeFileSync(
    buildScriptPath,
    fs
      .readFileSync(buildScriptPath, "utf8")
      .replace(/'src\/editor-plugins\/index\.ts'/g, "\"src/editor-plugins/index.ts\"")
      .replace(/'src\/editor-plugins\/index\.js'/g, "\"src/editor-plugins/index.js\""),
    "utf8"
  );
  fs.writeFileSync(
    webpackConfigPath,
    fs
      .readFileSync(webpackConfigPath, "utf8")
      .replace(/'editor-plugins\/index'/g, "\"editor-plugins/index\"")
      .replace(/'src\/editor-plugins\/index\.ts'/g, "\"src/editor-plugins/index.ts\"")
      .replace(/'src\/editor-plugins\/index\.js'/g, "\"src/editor-plugins/index.js\""),
    "utf8"
  );

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools"],
    {
      cwd: targetDir,
    }
  );

  expect(fs.readFileSync(buildScriptPath, "utf8")).toContain(
    "\"src/editor-plugins/index.ts\""
  );
  expect(fs.readFileSync(webpackConfigPath, "utf8")).toContain(
    "\"editor-plugins/index\""
  );
}, 30_000);

test("editor plugin workflow preserves legacy registry imports outside inventory", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-editor-plugin-legacy-registry"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin legacy registry",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin-legacy-registry",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin Legacy Registry",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const editorPluginsDir = path.join(targetDir, "src", "editor-plugins");
  const legacyPluginDir = path.join(editorPluginsDir, "legacy-tools");
  fs.mkdirSync(legacyPluginDir, { recursive: true });
  fs.writeFileSync(
    path.join(editorPluginsDir, "index.js"),
    "import './legacy-tools/index.js';\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(legacyPluginDir, "index.js"),
    "export {};\n",
    "utf8"
  );

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools"],
    {
      cwd: targetDir,
    }
  );

  const registrySource = fs.readFileSync(
    path.join(editorPluginsDir, "index.js"),
    "utf8"
  );
  expect(registrySource).toContain("import './legacy-tools';");
  expect(registrySource).toContain("import './document-tools';");
}, 30_000);

test("editor plugin workflow accepts existing js shared entry hooks", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-editor-plugin-js-entry"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin js entry",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin-js-entry",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin JS Entry",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  const buildScriptPath = path.join(targetDir, "scripts", "build-workspace.mjs");
  const editorPluginsDir = path.join(targetDir, "src", "editor-plugins");
  fs.mkdirSync(editorPluginsDir, { recursive: true });
  fs.writeFileSync(path.join(editorPluginsDir, "index.js"), "", "utf8");
  fs.writeFileSync(
    buildScriptPath,
    fs
      .readFileSync(buildScriptPath, "utf8")
      .replace(
        `[\n\t\t'src/bindings/index.ts',\n\t\t'src/bindings/index.js',\n\t\t'src/editor-plugins/index.ts',\n\t\t'src/editor-plugins/index.js',\n\t]`,
        `[\n\t\t'src/bindings/index.ts',\n\t\t'src/bindings/index.js',\n\t\t'src/editor-plugins/index.js',\n\t]`
      ),
    "utf8"
  );

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools"],
    {
      cwd: targetDir,
    }
  );

  expect(fs.readFileSync(buildScriptPath, "utf8")).toContain(
    "'src/editor-plugins/index.js'"
  );
  expect(fs.readFileSync(path.join(editorPluginsDir, "index.js"), "utf8")).toContain(
    "import './document-tools';"
  );
}, 30_000);

test("editor plugin workflow repairs stale legacy bootstrap functions", async () => {
  const targetDir = path.join(
    tempRoot,
    "demo-workspace-add-editor-plugin-legacy-bootstrap"
  );

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo workspace add editor plugin legacy bootstrap",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-add-editor-plugin-legacy-bootstrap",
      textDomain: "demo-space",
      title: "Demo Workspace Add Editor Plugin Legacy Bootstrap",
    },
  });

  linkWorkspaceNodeModules(targetDir);

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "document-tools"],
    {
      cwd: targetDir,
    }
  );

  const bootstrapPath = path.join(
    targetDir,
    "demo-workspace-add-editor-plugin-legacy-bootstrap.php"
  );
  fs.writeFileSync(
    bootstrapPath,
    fs
      .readFileSync(bootstrapPath, "utf8")
      .replace(
        /\n\t\$style_path\s+= __DIR__ \. '\/build\/editor-plugins\/style-index\.css';[\s\S]+?\n\t\}\n/u,
        "\n"
      ),
    "utf8"
  );
  fs.appendFileSync(
    bootstrapPath,
    "\n// build/editor-plugins/style-index.css\n// build/editor-plugins/style-index-rtl.css\n// wp_style_add_data\n",
    "utf8"
  );

  runCli(
    "node",
    [entryPath, "add", "editor-plugin", "review-panel"],
    {
      cwd: targetDir,
    }
  );

  const bootstrapSource = fs.readFileSync(bootstrapPath, "utf8");
  expect(bootstrapSource).toContain("build/editor-plugins/style-index.css");
  expect(bootstrapSource).toContain("build/editor-plugins/style-index-rtl.css");
  expect(bootstrapSource).toContain("wp_style_add_data");
}, 30_000);
});
