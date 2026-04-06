import { execFileSync } from "node:child_process";
import { globSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "..");
const prettierBin = require.resolve("prettier/bin-prettier.js");
const prettierMode = process.argv.includes("--write") ? "--write" : "--check";

const patterns = [
  "README.md",
  "CONTRIBUTING.md",
  "package.json",
  "composer.json",
  "prettier.config.mjs",
  "eslint.config.mjs",
  "playwright.config.ts",
  "typedoc.json",
  "tsconfig.json",
  "tsconfig.base.json",
  ".vscode/*.json",
  ".github/workflows/*.yml",
  "scripts/check-repo-format.mjs",
];

const files = [
  ...new Set(
    patterns.flatMap((pattern) =>
      globSync(pattern, { cwd: repoRoot, nodir: true })
    )
  ),
];

if (files.length === 0) {
  console.log("No repo-format files matched.");
  process.exit(0);
}

execFileSync(process.execPath, [prettierBin, prettierMode, ...files], {
  cwd: repoRoot,
  stdio: "inherit",
});
