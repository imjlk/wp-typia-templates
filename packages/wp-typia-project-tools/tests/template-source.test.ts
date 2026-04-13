import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { blockTypesPackageVersion, cleanupScaffoldTempRoot, createBlockExternalFixturePath, createBlockSubsetFixturePath, createScaffoldTempRoot, normalizedBlockRuntimePackageVersion, packageRoot, workspaceTemplatePackageManifest } from "./helpers/scaffold-test-harness.js";
import { getTemplateVariables, scaffoldProject } from "../src/runtime/index.js";
import { resolveTemplateId } from "../src/runtime/scaffold.js";
import { copyRenderedDirectory } from "../src/runtime/template-render.js";
import { parseGitHubTemplateLocator, parseNpmTemplateLocator, parseTemplateLocator } from "../src/runtime/template-source.js";

describe("@wp-typia/project-tools template sources", () => {
  const tempRoot = createScaffoldTempRoot("wp-typia-template-source-");

  afterAll(() => {
    cleanupScaffoldTempRoot(tempRoot);
  });

test("getTemplateVariables rejects slugs that normalize to an empty identifier", () => {
  expect(() =>
    getTemplateVariables("basic", {
      author: "Test Runner",
      description: "Invalid slug",
      namespace: "create-block",
      phpPrefix: "demo_slug",
      slug: "!!!",
      textDomain: "demo-slug",
      title: "Invalid Slug",
    })
  ).toThrow("Block slug: Use lowercase letters, numbers, and hyphens only");
});

test("local create-block subset paths scaffold into a pnpm-ready wp-typia project", async () => {
  const targetDir = path.join(tempRoot, "demo-remote");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: createBlockSubsetFixturePath,
    packageManager: "pnpm",
    noInstall: true,
    withTestPreset: true,
    withWpEnv: true,
    answers: {
      author: "Test Runner",
      description: "Demo remote block",
      namespace: "create-block",
      slug: "demo-remote",
      title: "Demo Remote",
    },
  });

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  );
  const generatedTypes = fs.readFileSync(
    path.join(targetDir, "src", "types.ts"),
    "utf8"
  );
  const generatedIndex = fs.readFileSync(
    path.join(targetDir, "src", "index.js"),
    "utf8"
  );
  const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
  const generatedBlockJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8")
  );

  expect(packageJson.packageManager).toBe("pnpm@8.3.1");
  expect(packageJson.devDependencies["@wp-typia/block-runtime"]).toBe(
    normalizedBlockRuntimePackageVersion
  );
  expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(
    blockTypesPackageVersion
  );
  expect(
    packageJson.devDependencies["@wp-typia/project-tools"]
  ).toBeUndefined();
  expect(packageJson.scripts.build).toBe(
    "pnpm run sync --check && wp-scripts build --experimental-modules"
  );
  expect(generatedTypes).toContain("export interface DemoRemoteAttributes");
  expect(generatedTypes).toContain('"content"?: string & tags.Default<"">');
  expect(generatedIndex).toContain('import metadata from "./block.json";');
  expect(generatedBlockJson.name).toBe("create-block/demo-remote");
  expect(generatedBlockJson.title).toBe("Demo Remote");
  expect(generatedBlockJson.editorStyle).toBeUndefined();
  expect(generatedBlockJson.supports.align).toEqual(["wide", "full"]);
  expect(fs.existsSync(path.join(targetDir, ".wp-env.json"))).toBe(false);
  expect(fs.existsSync(path.join(targetDir, ".wp-env.test.json"))).toBe(
    false
  );
  expect(readme).not.toContain("## Local WordPress");
  expect(readme).not.toContain("## Local Test Preset");
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

  const generatedTypes = fs.readFileSync(
    path.join(targetDir, "src", "types.ts"),
    "utf8"
  );
  const generatedEdit = fs.readFileSync(
    path.join(targetDir, "src", "edit.js"),
    "utf8"
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  );
  const generatedBlockJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8")
  );

  expect(result.selectedVariant).toBe("standard");
  expect(result.warnings).toContain(
    'Ignoring external template config key "pluginTemplatesPath": wp-typia owns package/tooling/sync setup for generated projects, so this external template setting is ignored.'
  );
  expect(
    fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))
  ).toBe(true);
  expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
  expect(
    packageJson.devDependencies["@wp-typia/project-tools"]
  ).toBeUndefined();
  expect(
    packageJson.dependencies?.["@wp-typia/project-tools"]
  ).toBeUndefined();
  expect(generatedTypes).toContain(
    '"variantLabel"?: string & tags.Default<"standard">'
  );
  expect(generatedTypes).toContain(
    '"transformedLabel"?: string & tags.Default<"standard-transformed">'
  );
  expect(generatedEdit).toContain("template-standard");
  expect(generatedEdit).toContain("standard-transformed");
  expect(generatedBlockJson.editorStyle).toBeUndefined();
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

  const generatedTypes = fs.readFileSync(
    path.join(targetDir, "src", "types.ts"),
    "utf8"
  );
  const generatedEdit = fs.readFileSync(
    path.join(targetDir, "src", "edit.js"),
    "utf8"
  );
  const generatedBlockJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8")
  );

  expect(result.selectedVariant).toBe("hero");
  expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
  expect(generatedTypes).toContain(
    '"variantLabel"?: string & tags.Default<"hero">'
  );
  expect(generatedTypes).toContain(
    '"transformedLabel"?: string & tags.Default<"hero-transformed">'
  );
  expect(generatedEdit).toContain("template-hero");
  expect(generatedBlockJson.supports.multiple).toBe(true);
});

test("workspace template package identity is defined once and imported by runtime callers", () => {
  const runtimeDir = path.join(packageRoot, "src", "runtime");
  const templateRegistry = fs.readFileSync(
    path.join(runtimeDir, "template-registry.ts"),
    "utf8"
  );
  const templateSource = fs.readFileSync(
    path.join(runtimeDir, "template-source.ts"),
    "utf8"
  );
  const cliScaffold = fs.readFileSync(
    path.join(runtimeDir, "cli-scaffold.ts"),
    "utf8"
  );
  const scaffoldRuntime = fs.readFileSync(
    path.join(runtimeDir, "scaffold.ts"),
    "utf8"
  );

  expect(templateRegistry).toContain(
    'export const OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";'
  );
  expect(templateSource).toContain("OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE");
  expect(cliScaffold).toContain("OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE");
  expect(scaffoldRuntime).toContain("OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE");
  expect(templateSource).not.toContain(
    'const OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";'
  );
  expect(cliScaffold).not.toContain(
    'const OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";'
  );
  expect(scaffoldRuntime).not.toContain(
    'const OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";'
  );
});

test("official workspace template scaffolds through the local npm template resolver", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-template");

  const result = await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo empty workspace",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-template",
      textDomain: "demo-space",
      title: "Demo Workspace Template",
    },
  });

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  );
  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "demo-workspace-template.php"),
    "utf8"
  );
  const buildWorkspaceSource = fs.readFileSync(
    path.join(targetDir, "scripts", "build-workspace.mjs"),
    "utf8"
  );
  const blockConfigSource = fs.readFileSync(
    path.join(targetDir, "scripts", "block-config.ts"),
    "utf8"
  );

  expect(result.templateId).toBe(workspaceTemplatePackageManifest.name);
  expect(packageJson.wpTypia).toEqual({
    projectType: "workspace",
    templatePackage: workspaceTemplatePackageManifest.name,
    namespace: "demo-space",
    textDomain: "demo-space",
    phpPrefix: "demo_space",
  });
  expect(blockConfigSource).toContain("// wp-typia add block entries");
  expect(blockConfigSource).toContain("// wp-typia add variation entries");
  expect(blockConfigSource).toContain("// wp-typia add pattern entries");
  expect(blockConfigSource).toContain(
    "// wp-typia add binding-source entries"
  );
  expect(packageJson.scripts.sync).toBe("tsx scripts/sync-project.ts");
  expect(packageJson.scripts.build).toBe(
    "npm run sync -- --check && node scripts/build-workspace.mjs build"
  );
  expect(packageJson.scripts.start).toBe(
    "npm run sync && node scripts/build-workspace.mjs start"
  );
  expect(packageJson.scripts.typecheck).toBe(
    "npm run sync -- --check && tsc --noEmit"
  );
  expect(buildWorkspaceSource).toContain("--blocks-manifest");
  expect(buildWorkspaceSource).toContain("if ( blockSlugs.length === 0 )");
  expect(bootstrapSource).toContain("wp_register_block_metadata_collection");
  expect(bootstrapSource).toContain(
    "wp_register_block_types_from_metadata_collection"
  );
  expect(bootstrapSource).toContain("src/bindings/*/server.php");
  expect(bootstrapSource).toContain("enqueue_block_editor_assets");
  expect(bootstrapSource).toContain("register_block_pattern_category");
  expect(bootstrapSource).toContain("/src/patterns/*.php");
  expect(
    fs.existsSync(path.join(targetDir, "src", "blocks", ".gitkeep"))
  ).toBe(true);
  expect(
    fs.existsSync(path.join(targetDir, "src", "bindings", ".gitkeep"))
  ).toBe(true);
  expect(
    fs.existsSync(path.join(targetDir, "src", "patterns", ".gitkeep"))
  ).toBe(true);
  expect(fs.existsSync(path.join(targetDir, "scripts", "sync-project.ts"))).toBe(
    true
  );
  const workspaceSyncProjectSource = fs.readFileSync(
    path.join(targetDir, "scripts", "sync-project.ts"),
    "utf8"
  );
  expect(workspaceSyncProjectSource).toContain("spawnSync");
  expect(workspaceSyncProjectSource).toContain(
    "shell: process.platform === 'win32'"
  );
  expect(workspaceSyncProjectSource).toContain("spawnSync( 'tsx', args");
  expect(workspaceSyncProjectSource).not.toContain("getLocalTsxBinary");
});

test("official workspace templates accept local path references with migration UI", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-template-local-path");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: path.resolve(packageRoot, "..", "create-workspace-template"),
    packageManager: "npm",
    noInstall: true,
    withMigrationUi: true,
    answers: {
      author: "Test Runner",
      description: "Demo empty workspace local path",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-template-local-path",
      textDomain: "demo-space",
      title: "Demo Workspace Template Local Path",
    },
  });

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  );

  expect(packageJson.wpTypia?.templatePackage).toBe(
    workspaceTemplatePackageManifest.name
  );
  expect(packageJson.scripts["migration:doctor"]).toContain("wp-typia");
});

test("official workspace template escapes apostrophes in pattern category labels", async () => {
  const targetDir = path.join(tempRoot, "johns-workspace-template");

  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Workspace title escaping",
      namespace: "johns-space",
      phpPrefix: "johns_space",
      slug: "johns-workspace-template",
      textDomain: "johns-space",
      title: "John's Blocks",
    },
  });

  const bootstrapSource = fs.readFileSync(
    path.join(targetDir, "johns-workspace-template.php"),
    "utf8"
  );

  expect(bootstrapSource).toContain("sprintf(");
  expect(bootstrapSource).toContain("__( '%s Patterns', 'johns-space' )");
  expect(bootstrapSource).toContain('"John\'s Blocks"');
});

test("rendered template paths cannot escape the target directory", async () => {
  const templateRoot = fs.mkdtempSync(
    path.join(tempRoot, "render-escape-template-")
  );
  const targetDir = fs.mkdtempSync(
    path.join(tempRoot, "render-escape-target-")
  );

  fs.writeFileSync(
    path.join(templateRoot, "{{fileName}}.mustache"),
    "escaped",
    "utf8"
  );

  await expect(
    copyRenderedDirectory(templateRoot, targetDir, {
      fileName: "../outside",
    })
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
    })
  ).rejects.toThrow(
    "--variant is only supported for official external template configs."
  );
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
    })
  ).rejects.toThrow(
    "--variant is only supported for official external template configs."
  );
});

test("parses github template locators with refs", () => {
  expect(
    parseGitHubTemplateLocator("github:owner/repo/templates/card#main")
  ).toEqual({
    owner: "owner",
    repo: "repo",
    ref: "main",
    sourcePath: "templates/card",
  });
});

test("removed built-in template ids are rejected consistently during template locator parsing", () => {
  expect(() => parseTemplateLocator("persisted")).toThrow(
    'Built-in template "persisted" was removed. Use --template persistence --persistence-policy authenticated instead.'
  );
});

test("parses npm template locators for package specs", () => {
  expect(parseNpmTemplateLocator("@scope/template-package@^1.2.0")).toEqual({
    fetchSpec: "^1.2.0",
    name: "@scope/template-package",
    raw: "@scope/template-package@^1.2.0",
    rawSpec: "^1.2.0",
    type: "range",
  });
});

test("normalizes the workspace template alias to the official package id", async () => {
  await expect(
    resolveTemplateId({
      templateId: "workspace",
    })
  ).resolves.toBe(workspaceTemplatePackageManifest.name);

  await expect(
    resolveTemplateId({
      templateId: workspaceTemplatePackageManifest.name,
    })
  ).resolves.toBe(workspaceTemplatePackageManifest.name);

  await expect(
    resolveTemplateId({
      isInteractive: true,
      selectTemplate: async () => "workspace",
    })
  ).resolves.toBe(workspaceTemplatePackageManifest.name);
});

test("workspace alias scaffolds through the official local template resolver", async () => {
  const targetDir = path.join(tempRoot, "demo-workspace-template-alias");

  const result = await scaffoldProject({
    projectDir: targetDir,
    templateId: "workspace",
    packageManager: "npm",
    noInstall: true,
    answers: {
      author: "Test Runner",
      description: "Demo empty workspace alias",
      namespace: "demo-space",
      phpPrefix: "demo_space",
      slug: "demo-workspace-template-alias",
      textDomain: "demo-space",
      title: "Demo Workspace Template Alias",
    },
  });

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf8")
  );

  expect(result.templateId).toBe(workspaceTemplatePackageManifest.name);
  expect(packageJson.wpTypia).toEqual({
    projectType: "workspace",
    templatePackage: workspaceTemplatePackageManifest.name,
    namespace: "demo-space",
    textDomain: "demo-space",
    phpPrefix: "demo_space",
  });
});

test("npm package template specs can scaffold through the registry resolver", async () => {
  const npmTemplateRoot = fs.mkdtempSync(
    path.join(tempRoot, "npm-template-source-")
  );
  const registryBase = "https://registry.npmjs.org";
  const tarballUrl = `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`;
  const metadataUrl = `${registryBase}/${encodeURIComponent(
    "@demo/create-block-template"
  )}`;
  const tarballPath = path.join(
    npmTemplateRoot,
    "create-block-template-1.2.3.tgz"
  );
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
      2
    )
  );
  execFileSync("tar", [
    "-czf",
    tarballPath,
    "-C",
    npmTemplateRoot,
    "package",
  ]);
  process.env.NPM_CONFIG_REGISTRY = registryBase;

  globalThis.fetch = (async (input) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
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
        }
      );
    }

    if (requestUrl === tarballUrl) {
      return new Response(fs.readFileSync(tarballPath), { status: 200 });
    }

    throw new Error(
      `Unexpected fetch URL in npm template resolver test: ${requestUrl}`
    );
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

    const generatedTypes = fs.readFileSync(
      path.join(targetDir, "src", "types.ts"),
      "utf8"
    );
    expect(result.selectedVariant).toBe("hero");
    expect(generatedTypes).toContain(
      '"variantLabel"?: string & tags.Default<"hero">'
    );
    expect(
      fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))
    ).toBe(true);
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
  const metadataUrl = `${registryBase}/${encodeURIComponent(
    "@demo/create-block-template"
  )}`;
  const originalFetch = globalThis.fetch;
  const originalRegistry = process.env.NPM_CONFIG_REGISTRY;

  process.env.NPM_CONFIG_REGISTRY = registryBase;
  globalThis.fetch = (async (input) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
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
        }
      );
    }

    throw new Error(
      `Unexpected fetch URL in npm template resolver range test: ${requestUrl}`
    );
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
      })
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
});
