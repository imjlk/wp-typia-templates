import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { cleanupScaffoldTempRoot, createScaffoldTempRoot, entryPath, getCommandErrorMessage, linkWorkspaceNodeModules, runCli, runGeneratedScript, scaffoldOfficialWorkspace, templateLayerWorkspaceFixturePath, typecheckGeneratedProject, workspaceTemplatePackageManifest } from "./helpers/scaffold-test-harness.js";
import { scaffoldProject } from "../src/runtime/index.js";

const legacyValidatorToolkitSource = [
  "import type { ManifestDefaultsDocument } from '@wp-typia/block-runtime/defaults';",
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
  "\t\tmanifest: manifest as ManifestDefaultsDocument,",
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
  expect(variationSource).toContain("A starter variation for Hero Card.");

  const doctorOutput = runCli("node", [entryPath, "doctor"], {
    cwd: targetDir,
  });
  const doctorChecks = JSON.parse(doctorOutput) as {
    checks: Array<{ detail: string; label: string; status: string }>;
  };
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

  const doctorOutput = runCli("node", [entryPath, "doctor"], {
    cwd: targetDir,
  });
  const doctorChecks = JSON.parse(doctorOutput) as {
    checks: Array<{ detail: string; label: string; status: string }>;
  };
  expect(
    doctorChecks.checks.find(
      (check) => check.label === "Block hooks counter-card"
    )?.status
  ).toBe("pass");
}, 20_000);

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
    "assert: typia.createAssert< FaqStackAttributes >()"
  );
  expect(repairedChildValidatorSource).toContain("import typia from 'typia';");
  expect(repairedChildValidatorSource).toContain(
    "assert: typia.createAssert< FaqStackItemAttributes >()"
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
      "import type { ManifestDefaultsDocument } from \"@wp-typia/block-runtime/defaults\";",
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
      "\t\tmanifest: manifest as ManifestDefaultsDocument,",
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
  const rootDoctorOutput = runCli("node", [entryPath, "doctor"], {
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

  const doctorOutput = runCli("node", [entryPath, "doctor"], {
    cwd: targetDir,
  });
  const doctorChecks = JSON.parse(doctorOutput) as {
    checks: Array<{ detail: string; label: string; status: string }>;
  };
  expect(
    doctorChecks.checks.find((check) => check.label === "Pattern bootstrap")
      ?.status
  ).toBe("pass");
  expect(
    doctorChecks.checks.find((check) => check.label === "Pattern hero-layout")
      ?.status
  ).toBe("pass");
}, 15_000);

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
  expect(bindingEditorSource).toContain("registerBlockBindingsSource");
  expect(bindingEditorSource).toContain("getFieldsList()");

  const doctorOutput = runCli("node", [entryPath, "doctor"], {
    cwd: targetDir,
  });
  const doctorChecks = JSON.parse(doctorOutput) as {
    checks: Array<{ detail: string; label: string; status: string }>;
  };
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
});
