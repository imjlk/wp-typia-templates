import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  FORMATTING_TOOLCHAIN_POLICY,
  validateFormattingToolchainPolicy,
} from "../../scripts/validate-formatting-toolchain-policy.mjs";

let tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs) {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
  tempDirs = [];
});

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath: string, value: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function createFormattingPolicyRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-format-policy-"));
  tempDirs.push(repoRoot);
  const policy = FORMATTING_TOOLCHAIN_POLICY;

  writeJson(path.join(repoRoot, "package.json"), {
    devDependencies: {
      "@eslint/js": policy.eslintJsVersion,
      "@typescript-eslint/eslint-plugin": policy.typescriptEslintVersion,
      "@typescript-eslint/parser": policy.typescriptEslintVersion,
      "eslint-config-prettier": policy.eslintConfigPrettierVersion,
      eslint: policy.eslintVersion,
      prettier: policy.prettierVersion,
    },
    scripts: {
      "ci:local":
        "bun run formatting-policy:validate && bun run format:check && bun run lint:all",
      "format:write": policy.rootFormatWriteScript,
      "format:check": policy.rootFormatCheckScript,
      "lint:fix": policy.rootLintFixScript,
      "lint:repo": policy.rootLintScript,
      "formatting-policy:validate": policy.rootPolicyValidateScript,
    },
  });

  for (const relativePath of policy.workspaceExamplePackagePaths) {
    writeJson(path.join(repoRoot, relativePath), {
      devDependencies: {
        prettier: policy.prettierVersion,
      },
    });
  }

  for (const relativePath of policy.generatedPackageManifestPaths) {
    writeText(
      path.join(repoRoot, relativePath),
      `{\n  "devDependencies": {\n    "prettier": "${policy.prettierVersion}"\n  }\n}\n`
    );
  }

  writeText(
    path.join(repoRoot, ".github/workflows/ci.yml"),
    `jobs:\n  lint:\n    steps:\n      - name: Validate formatting toolchain policy\n        run: bun run formatting-policy:validate\n      - name: Run formatting check\n        run: bun run format:check\n  node-20-baseline:\n    steps: []\n`
  );

  return repoRoot;
}

describe("validateFormattingToolchainPolicy", () => {
  test("passes when the repo matches the documented formatting baseline", () => {
    const repoRoot = createFormattingPolicyRepo();

    expect(validateFormattingToolchainPolicy(repoRoot)).toEqual({
      errors: [],
      valid: true,
    });
  });

  test("fails when root formatter package versions drift", () => {
    const repoRoot = createFormattingPolicyRepo();
    const packageJsonPath = path.join(repoRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.devDependencies.prettier = "3.0.0";
    writeJson(packageJsonPath, packageJson);

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `package.json must declare devDependencies.prettier="${FORMATTING_TOOLCHAIN_POLICY.prettierVersion}", found "3.0.0".`
    );
  });

  test("fails when the root ESLint stack drifts from the documented baseline", () => {
    const repoRoot = createFormattingPolicyRepo();
    const packageJsonPath = path.join(repoRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.devDependencies.eslint = "9.0.0";
    packageJson.devDependencies["@typescript-eslint/parser"] = "8.0.0";
    writeJson(packageJsonPath, packageJson);

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `package.json must declare devDependencies.eslint="${FORMATTING_TOOLCHAIN_POLICY.eslintVersion}", found "9.0.0".`
    );
    expect(result.errors).toContain(
      `package.json must declare devDependencies["@typescript-eslint/parser"]="${FORMATTING_TOOLCHAIN_POLICY.typescriptEslintVersion}", found "8.0.0".`
    );
  });

  test("fails when ci:local or the lint workflow omits formatting gates", () => {
    const repoRoot = createFormattingPolicyRepo();
    const packageJsonPath = path.join(repoRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.scripts["ci:local"] = "bun run lint:all";
    writeJson(packageJsonPath, packageJson);

    writeText(
      path.join(repoRoot, ".github/workflows/ci.yml"),
      "jobs:\n  lint:\n    steps:\n      - name: Validate formatting toolchain policy\n        run: bun run formatting-policy:validate\n"
    );

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'package.json must include "bun run formatting-policy:validate" in scripts["ci:local"].'
    );
    expect(result.errors).toContain(
      'package.json must include "bun run format:check" in scripts["ci:local"].'
    );
    expect(result.errors).toContain(
      '.github/workflows/ci.yml lint job must include "run: bun run format:check".'
    );
  });

  test("fails when root autofix commands drift from the documented baseline", () => {
    const repoRoot = createFormattingPolicyRepo();
    const packageJsonPath = path.join(repoRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.scripts["lint:fix"] = "eslint . --fix";
    packageJson.scripts["format:write"] = "prettier --write .";
    writeJson(packageJsonPath, packageJson);

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `package.json must keep scripts["lint:fix"]="${FORMATTING_TOOLCHAIN_POLICY.rootLintFixScript}", found "eslint . --fix".`
    );
    expect(result.errors).toContain(
      `package.json must keep scripts["format:write"]="${FORMATTING_TOOLCHAIN_POLICY.rootFormatWriteScript}", found "prettier --write .".`
    );
  });

  test("fails when example or generated package manifests keep a stale prettier version", () => {
    const repoRoot = createFormattingPolicyRepo();
    const exampleManifestPath = path.join(repoRoot, "examples/my-typia-block/package.json");
    const examplePackageJson = JSON.parse(fs.readFileSync(exampleManifestPath, "utf8"));
    examplePackageJson.devDependencies.prettier = "2.8.8";
    writeJson(exampleManifestPath, examplePackageJson);

    const templateManifestPath = path.join(
      repoRoot,
      "packages/wp-typia-project-tools/templates/_shared/base/package.json.mustache"
    );
    writeText(
      templateManifestPath,
      '{\n  "devDependencies": {\n    "prettier": "2.8.8"\n  }\n}\n'
    );

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `examples/my-typia-block/package.json must declare devDependencies.prettier="${FORMATTING_TOOLCHAIN_POLICY.prettierVersion}", found "2.8.8".`
    );
    expect(result.errors).toContain(
      `packages/wp-typia-project-tools/templates/_shared/base/package.json.mustache must declare devDependencies.prettier="${FORMATTING_TOOLCHAIN_POLICY.prettierVersion}", found "2.8.8".`
    );
  });

  test("fails when a generated template moves prettier out of devDependencies", () => {
    const repoRoot = createFormattingPolicyRepo();
    const templateManifestPath = path.join(
      repoRoot,
      "packages/wp-typia-project-tools/templates/_shared/base/package.json.mustache"
    );

    writeText(
      templateManifestPath,
      '{\n  "dependencies": {\n    "prettier": "3.8.2"\n  },\n  "devDependencies": {}\n}\n'
    );

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `packages/wp-typia-project-tools/templates/_shared/base/package.json.mustache must declare devDependencies.prettier="${FORMATTING_TOOLCHAIN_POLICY.prettierVersion}".`
    );
  });

  test("fails when another workflow job satisfies the lint gate strings accidentally", () => {
    const repoRoot = createFormattingPolicyRepo();

    writeText(
      path.join(repoRoot, ".github/workflows/ci.yml"),
      `jobs:\n  lint:\n    steps:\n      - name: Validate pending changesets\n        run: bun run changesets:validate\n  format-check:\n    steps:\n      - name: Validate formatting toolchain policy\n        run: bun run formatting-policy:validate\n      - name: Run formatting check\n        run: bun run format:check\n`
    );

    const result = validateFormattingToolchainPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      '.github/workflows/ci.yml lint job must include "run: bun run formatting-policy:validate".'
    );
    expect(result.errors).toContain(
      '.github/workflows/ci.yml lint job must include "run: bun run format:check".'
    );
  });
});
