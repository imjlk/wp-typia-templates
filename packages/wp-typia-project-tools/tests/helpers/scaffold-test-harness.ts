import { execFile, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

import { runUtf8Command } from "../../../../tests/helpers/process-utils";
import { scaffoldProject } from "../../src/runtime/index.js";

export const packageRoot = path.resolve(import.meta.dir, "../..");
export const entryPath = path.resolve(
  packageRoot,
  "..",
  "wp-typia",
  "bin",
  "wp-typia.js"
);
export const createBlockExternalFixturePath = path.join(
  packageRoot,
  "tests",
  "fixtures",
  "create-block-external"
);
export const createBlockSubsetFixturePath = path.join(
  packageRoot,
  "tests",
  "fixtures",
  "create-block-subset"
);
const createPackageManifest = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")
);
export const workspaceTemplatePackageManifest = JSON.parse(
  fs.readFileSync(
    path.resolve(
      packageRoot,
      "..",
      "create-workspace-template",
      "package.json"
    ),
    "utf8"
  )
);
export const wpTypiaPackageManifest = JSON.parse(
  fs.readFileSync(
    path.resolve(packageRoot, "..", "wp-typia", "package.json"),
    "utf8"
  )
);
export const apiClientPackageVersion =
  createPackageManifest.dependencies["@wp-typia/api-client"];
export const blockRuntimePackageManifest = JSON.parse(
  fs.readFileSync(
    path.resolve(packageRoot, "..", "wp-typia-block-runtime", "package.json"),
    "utf8"
  )
);
export const blockRuntimePackageVersion = blockRuntimePackageManifest.version;
if (
  typeof blockRuntimePackageVersion !== "string" ||
  blockRuntimePackageVersion.length === 0
) {
  throw new Error(
    'Expected "packages/wp-typia-block-runtime/package.json" to define a version.'
  );
}
export const normalizedBlockRuntimePackageVersion = `^${blockRuntimePackageVersion}`;
export const blockTypesPackageVersion =
  createPackageManifest.dependencies["@wp-typia/block-types"];
export const restPackageVersion = createPackageManifest.dependencies["@wp-typia/rest"];
const workspaceNodeModulesPath = path.resolve(
  packageRoot,
  "..",
  "..",
  "node_modules"
);
const workspaceBunNodeModulesPath = path.join(
  workspaceNodeModulesPath,
  ".bun",
  "node_modules"
);
const workspacePackagePaths = {
  "@wp-typia/api-client": path.resolve(
    packageRoot,
    "..",
    "wp-typia-api-client"
  ),
  "@wp-typia/block-runtime": path.resolve(
    packageRoot,
    "..",
    "wp-typia-block-runtime"
  ),
  "@wp-typia/block-types": path.resolve(
    packageRoot,
    "..",
    "wp-typia-block-types"
  ),
  "@wp-typia/project-tools": packageRoot,
  "@wp-typia/rest": path.resolve(packageRoot, "..", "wp-typia-rest"),
} as const;
const generatedProjectTypecheckSupportPackages = [
  "react",
  "react-dom",
  "@types/react",
  "@types/react-dom",
] as const;
const builtWorkspacePackages = new Set<string>();

export function runCli(
  command: string,
  args: string[],
  options: Parameters<typeof runUtf8Command>[2] = {}
) {
  return runUtf8Command(command, args, options);
}

export function getCommandErrorMessage(run: () => string): string {
  try {
    run();
    return "";
  } catch (error) {
    if (typeof error === "object" && error !== null) {
      const message =
        "message" in error && typeof error.message === "string"
          ? error.message
          : String(error);
      const stdout =
        "stdout" in error && typeof error.stdout === "string"
          ? error.stdout
          : "";
      const stderr =
        "stderr" in error && typeof error.stderr === "string"
          ? error.stderr
          : "";
      return [message, stdout, stderr].filter(Boolean).join("\n");
    }
    return String(error);
  }
}

export function stripPhpFunction(source: string, functionName: string): string {
  return source.replace(
    new RegExp(
      `\\nfunction\\s+${functionName}\\s*\\(\\)\\s*\\{[\\s\\S]*?\\n\\}`,
      "u"
    ),
    ""
  );
}

export function ensureDirSymlink(targetPath: string, sourcePath: string) {
  if (fs.existsSync(targetPath)) {
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.symlinkSync(sourcePath, targetPath, "dir");
}

export function ensureFileSymlink(targetPath: string, sourcePath: string) {
  if (fs.existsSync(targetPath)) {
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.symlinkSync(sourcePath, targetPath, "file");
}

export function resolveWorkspaceDependencyPath(packageName: string): string | null {
  const directPath = path.join(workspaceNodeModulesPath, packageName);
  if (fs.existsSync(directPath)) {
    return fs.realpathSync(directPath);
  }

  const bunPath = path.join(workspaceBunNodeModulesPath, packageName);
  if (fs.existsSync(bunPath)) {
    return fs.realpathSync(bunPath);
  }

  return null;
}

export function ensureWorkspacePackageBuilt(
  packageName: keyof typeof workspacePackagePaths,
  packagePath: string
) {
  if (builtWorkspacePackages.has(packageName)) {
    return;
  }

  if (fs.existsSync(path.join(packagePath, "dist"))) {
    builtWorkspacePackages.add(packageName);
    return;
  }

  runCli("bun", ["run", "build"], { cwd: packagePath });
  builtWorkspacePackages.add(packageName);
}

export function ensureWorkspaceBinaryDirectory(targetDir: string) {
  const targetBinDir = path.join(targetDir, "node_modules", ".bin");
  fs.mkdirSync(targetBinDir, { recursive: true });
}

export function linkPackageBins(
  targetDir: string,
  packageName: string,
  sourcePath: string
) {
  const packageJsonPath = path.join(sourcePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    bin?: Record<string, string> | string;
    name?: string;
  };
  const binField = packageJson.bin;
  if (!binField) {
    return;
  }

  const normalizedBins =
    typeof binField === "string"
      ? {
          [(packageJson.name ?? packageName).split("/").slice(-1)[0] ??
          packageName]: binField,
        }
      : binField;

  for (const [binName, relativeBinPath] of Object.entries(normalizedBins)) {
    ensureFileSymlink(
      path.join(targetDir, "node_modules", ".bin", binName),
      path.join(sourcePath, relativeBinPath)
    );
  }
}

export function linkWorkspaceNodeModules(targetDir: string) {
  const nodeModulesPath = path.join(targetDir, "node_modules");

  if (!fs.existsSync(nodeModulesPath)) {
    fs.mkdirSync(nodeModulesPath, { recursive: true });
  }

  ensureWorkspaceBinaryDirectory(targetDir);

  const packageJsonPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const dependencyNames = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...generatedProjectTypecheckSupportPackages,
  ]);

  for (const packageName of dependencyNames) {
    const workspacePackagePath =
      workspacePackagePaths[packageName as keyof typeof workspacePackagePaths];
    if (workspacePackagePath) {
      ensureWorkspacePackageBuilt(
        packageName as keyof typeof workspacePackagePaths,
        workspacePackagePath
      );
      ensureDirSymlink(
        path.join(nodeModulesPath, ...packageName.split("/")),
        workspacePackagePath
      );
      linkPackageBins(targetDir, packageName, workspacePackagePath);
      continue;
    }

    const sourcePath = resolveWorkspaceDependencyPath(packageName);
    if (!sourcePath) {
      continue;
    }

    ensureDirSymlink(
      path.join(nodeModulesPath, ...packageName.split("/")),
      sourcePath
    );
    linkPackageBins(targetDir, packageName, sourcePath);
  }
}

export function runGeneratedScript(
  targetDir: string,
  scriptRelativePath: string,
  args: string[] = []
) {
  linkWorkspaceNodeModules(targetDir);
  return runCli("bun", [path.join(targetDir, scriptRelativePath), ...args], {
    cwd: targetDir,
  });
}

export async function runGeneratedScriptAsync(
  targetDir: string,
  scriptRelativePath: string,
  args: string[] = []
) {
  linkWorkspaceNodeModules(targetDir);
  const execFileAsync = promisify(execFile);
  const result = await execFileAsync(
    "bun",
    [path.join(targetDir, scriptRelativePath), ...args],
    {
      cwd: targetDir,
      encoding: "utf8",
    }
  );

  return result.stdout;
}

export function typecheckGeneratedProject(targetDir: string) {
  linkWorkspaceNodeModules(targetDir);
  return runCli(
    path.join(targetDir, "node_modules", ".bin", "tsc"),
    ["--noEmit"],
    {
      cwd: targetDir,
    }
  );
}

export function buildGeneratedProject(targetDir: string) {
  linkWorkspaceNodeModules(targetDir);
  const result = spawnSync(
    path.join(targetDir, "node_modules", ".bin", "wp-scripts"),
    ["build", "--experimental-modules"],
    {
      cwd: targetDir,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

  if (result.error) {
    const error = new Error(
      output || `Generated project build failed to start for ${targetDir}.`,
      { cause: result.error }
    );
    Object.assign(error, {
      status: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    });
    throw error;
  }
  if (result.status !== 0) {
    const error = new Error(output || "Generated project build failed.");
    Object.assign(error, {
      status: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    });
    throw error;
  }

  return output;
}

export function replaceGeneratedTransportBaseUrls(
  transportPath: string,
  baseUrl: string
) {
  let source = fs.readFileSync(transportPath, "utf8");
  const names = [
    "EDITOR_READ_BASE_URL",
    "EDITOR_WRITE_BASE_URL",
    "FRONTEND_READ_BASE_URL",
    "FRONTEND_WRITE_BASE_URL",
  ] as const;

  for (const name of names) {
    const previousSource = source;
    source = source.replace(
      new RegExp(`const ${name}: string \\| undefined = undefined;`, "u"),
      `const ${name}: string | undefined = ${JSON.stringify(baseUrl)};`
    );
    if (source === previousSource) {
      throw new Error(`Unable to rewrite ${name} inside ${transportPath}.`);
    }
  }

  fs.writeFileSync(transportPath, source);
}

export function runGeneratedJsonScript(
  targetDir: string,
  scriptName: string,
  scriptSource: string
) {
  const scriptPath = path.join(targetDir, scriptName);
  fs.writeFileSync(scriptPath, scriptSource);

  try {
    return JSON.parse(runGeneratedScript(targetDir, scriptName));
  } finally {
    fs.rmSync(scriptPath, { force: true });
  }
}

export async function runGeneratedJsonScriptAsync(
  targetDir: string,
  scriptName: string,
  scriptSource: string
) {
  const scriptPath = path.join(targetDir, scriptName);
  fs.writeFileSync(scriptPath, scriptSource);

  try {
    return JSON.parse(await runGeneratedScriptAsync(targetDir, scriptName));
  } finally {
    fs.rmSync(scriptPath, { force: true });
  }
}

export async function scaffoldOfficialWorkspace(
  targetDir: string,
  {
    description = "Demo workspace",
    namespace = "demo-space",
    phpPrefix = "demo_space",
    slug = path.basename(targetDir),
    textDomain = "demo-space",
    title = "Demo Workspace",
    withMigrationUi = false,
  }: {
    description?: string;
    namespace?: string;
    phpPrefix?: string;
    slug?: string;
    textDomain?: string;
    title?: string;
    withMigrationUi?: boolean;
  } = {}
) {
  await scaffoldProject({
    projectDir: targetDir,
    templateId: workspaceTemplatePackageManifest.name,
    packageManager: "npm",
    noInstall: true,
    withMigrationUi,
    answers: {
      author: "Test Runner",
      description,
      namespace,
      phpPrefix,
      slug,
      textDomain,
      title,
    },
  });
}

export function createScaffoldTempRoot(prefix = "wp-typia-create-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupScaffoldTempRoot(tempRoot: string) {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
