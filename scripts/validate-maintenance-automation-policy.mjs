#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAINTENANCE_AUTOMATION_POLICY = Object.freeze({
  dependabotEcosystems: Object.freeze(['github-actions', 'composer']),
  docsFile: 'docs/maintenance-automation-policy.md',
  docsRequiredSnippets: Object.freeze([
    'Dependabot updates',
    'github-actions',
    'composer',
    'release/sampo',
    'bun audit --audit-level high',
    'composer audit --locked',
    'scheduled/manual',
    '.github/workflows/dependency-audit.yml',
    '.github/workflows/test-matrix.yml',
  ]),
  ciScript: 'node scripts/validate-maintenance-automation-policy.mjs',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function readRelativeText(repoRoot, relativePath) {
  return readText(path.join(repoRoot, relativePath));
}

function lintJobBlock(workflowSource) {
  const lines = workflowSource.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^ {2}lint:\s*$/.test(line));

  if (startIndex < 0) {
    return '';
  }

  const blockLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (index > startIndex && /^ {2}[A-Za-z0-9_-]+:/.test(line)) {
      break;
    }
    blockLines.push(line);
  }

  return blockLines.join('\n');
}

function workflowJobBlock(workflowSource, jobId) {
  const lines = workflowSource.split(/\r?\n/);
  const startIndex = lines.findIndex(
    (line) => new RegExp(`^ {2}${jobId}:\\s*$`).test(line),
  );

  if (startIndex < 0) {
    return '';
  }

  const blockLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (index > startIndex && /^ {2}[A-Za-z0-9_-]+:\s*$/.test(line)) {
      break;
    }
    blockLines.push(line);
  }

  return blockLines.join('\n');
}

function extractDependabotUpdateBlock(sourceText, ecosystem) {
  const lines = sourceText.split('\n');
  const startIndex = lines.findIndex(
    (line) => line.trim() === `- package-ecosystem: '${ecosystem}'`,
  );

  if (startIndex < 0) {
    return '';
  }

  const blockLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (index > startIndex && /^  - package-ecosystem: /.test(line)) {
      break;
    }
    if (index > startIndex && line && !line.startsWith('  ')) {
      break;
    }
    blockLines.push(line);
  }

  return blockLines.join('\n');
}

function validateDependabotConfig(sourceText, errors) {
  const configuredEcosystems = Array.from(
    sourceText.matchAll(/^\s*-\s+package-ecosystem:\s+'([^']+)'/gm),
    (match) => match[1],
  );

  for (const ecosystem of configuredEcosystems) {
    if (!MAINTENANCE_AUTOMATION_POLICY.dependabotEcosystems.includes(ecosystem)) {
      errors.push(
        `.github/dependabot.yml must not widen automation beyond ${MAINTENANCE_AUTOMATION_POLICY.dependabotEcosystems.join(', ')}; found ${ecosystem}.`,
      );
    }
  }

  for (const ecosystem of MAINTENANCE_AUTOMATION_POLICY.dependabotEcosystems) {
    const block = extractDependabotUpdateBlock(sourceText, ecosystem);

    if (!block) {
      errors.push(
        `.github/dependabot.yml must configure a ${ecosystem} update lane.`,
      );
      continue;
    }

    if (!block.includes("target-branch: 'main'")) {
      errors.push(
        `.github/dependabot.yml must keep the ${ecosystem} lane targeting the main branch.`,
      );
    }

    if (!block.includes("interval: 'weekly'")) {
      errors.push(
        `.github/dependabot.yml must keep the ${ecosystem} lane on a weekly update cadence.`,
      );
    }
  }
}

function validateDependencyAuditWorkflow(sourceText, errors) {
  for (const requiredSnippet of [
    'name: Dependency and Security Audit',
    'pull_request:\n    branches: [main]',
    'push:\n    branches: [main]',
    'schedule:',
    'workflow_dispatch:',
    'name: Composer Audit',
    'run: composer audit --locked',
    'name: Bun Audit',
    'run: bun audit --audit-level high',
  ]) {
    if (!sourceText.includes(requiredSnippet)) {
      errors.push(
        `.github/workflows/dependency-audit.yml must include ${JSON.stringify(requiredSnippet)}.`,
      );
    }
  }

  const bunAuditBlock = workflowJobBlock(sourceText, 'bun-audit');
  for (const requiredSnippet of [
    "if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'",
    'name: Bun Audit',
    'run: bun audit --audit-level high',
  ]) {
    if (!bunAuditBlock.includes(requiredSnippet)) {
      errors.push(
        '.github/workflows/dependency-audit.yml must keep Bun Audit gated to schedule/workflow_dispatch.',
      );
      break;
    }
  }
}

function validateScheduledWorkflow(sourceText, errors) {
  if (!sourceText.includes("name: CodeQL Scan")) {
    errors.push(
      '.github/workflows/test-matrix.yml must keep the scheduled security job scoped to CodeQL.',
    );
  }

  if (sourceText.includes('Run Bun audit')) {
    errors.push(
      '.github/workflows/test-matrix.yml should not duplicate the Bun audit step now that dependency-audit.yml owns the fast audit lane.',
    );
  }
}

export function validateMaintenanceAutomationPolicy(repoRoot = DEFAULT_REPO_ROOT) {
  const errors = [];
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const scripts = packageJson.scripts ?? {};

  if (
    scripts['maintenance-automation:validate'] !==
    MAINTENANCE_AUTOMATION_POLICY.ciScript
  ) {
    errors.push(
      `package.json must keep scripts["maintenance-automation:validate"]="${MAINTENANCE_AUTOMATION_POLICY.ciScript}", found ${JSON.stringify(scripts['maintenance-automation:validate'] ?? null)}.`,
    );
  }

  const ciLocal =
    typeof scripts['ci:local'] === 'string' ? scripts['ci:local'] : '';
  if (!ciLocal.includes('bun run maintenance-automation:validate')) {
    errors.push(
      'package.json must include "bun run maintenance-automation:validate" in scripts["ci:local"].',
    );
  }

  validateDependabotConfig(
    readRelativeText(repoRoot, '.github/dependabot.yml'),
    errors,
  );
  validateDependencyAuditWorkflow(
    readRelativeText(repoRoot, '.github/workflows/dependency-audit.yml'),
    errors,
  );
  validateScheduledWorkflow(
    readRelativeText(repoRoot, '.github/workflows/test-matrix.yml'),
    errors,
  );

  const ciLintBlock = lintJobBlock(
    readRelativeText(repoRoot, '.github/workflows/ci.yml'),
  );
  if (
    !ciLintBlock.includes('run: bun run maintenance-automation:validate')
  ) {
    errors.push(
      '.github/workflows/ci.yml lint job must include "run: bun run maintenance-automation:validate".',
    );
  }

  const docsText = readRelativeText(repoRoot, MAINTENANCE_AUTOMATION_POLICY.docsFile);
  for (const snippet of MAINTENANCE_AUTOMATION_POLICY.docsRequiredSnippets) {
    if (!docsText.includes(snippet)) {
      errors.push(
        `${MAINTENANCE_AUTOMATION_POLICY.docsFile} must mention ${JSON.stringify(snippet)}.`,
      );
    }
  }

  for (const [relativePath, requiredSnippets] of Object.entries({
    'README.md': [
      '[Maintenance Automation Policy](docs/maintenance-automation-policy.md)',
      'bun run maintenance-automation:validate',
    ],
    'CONTRIBUTING.md': [
      'bun run maintenance-automation:validate',
      '[`docs/maintenance-automation-policy.md`](./docs/maintenance-automation-policy.md)',
      'Dependabot',
      'release/sampo',
    ],
  })) {
    const sourceText = readRelativeText(repoRoot, relativePath);
    for (const snippet of requiredSnippets) {
      if (!sourceText.includes(snippet)) {
        errors.push(`${relativePath} must mention ${JSON.stringify(snippet)}.`);
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

export function runCli({
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const result = validateMaintenanceAutomationPolicy(cwd);

  if (!result.valid) {
    stderr.write('Invalid maintenance automation policy detected:\n');
    for (const error of result.errors) {
      stderr.write(`- ${error}\n`);
    }
    return 1;
  }

  stdout.write('Validated maintenance automation policy.\n');
  return 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedPath === __filename) {
  process.exitCode = runCli();
}
