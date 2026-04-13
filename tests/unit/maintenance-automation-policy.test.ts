import { afterEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  MAINTENANCE_AUTOMATION_POLICY,
  validateMaintenanceAutomationPolicy,
} from '../../scripts/validate-maintenance-automation-policy.mjs';

let tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs) {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
  tempDirs = [];
});

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath: string, value: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, 'utf8');
}

function createMaintenancePolicyRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-typia-maintenance-policy-'));
  tempDirs.push(repoRoot);

  writeJson(path.join(repoRoot, 'package.json'), {
    scripts: {
      'maintenance-automation:validate':
        MAINTENANCE_AUTOMATION_POLICY.ciScript,
      'ci:local':
        'bun run changesets:validate && bun run maintenance-automation:validate && bun run lint:all',
    },
  });

  writeText(
    path.join(repoRoot, '.github/dependabot.yml'),
    `version: 2\nupdates:\n  - package-ecosystem: 'github-actions'\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n  - package-ecosystem: 'composer'\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n`
  );

  writeText(
    path.join(repoRoot, '.github/workflows/dependency-audit.yml'),
    `name: Dependency and Security Audit\non:\n  pull_request:\n    branches: [main]\n  push:\n    branches: [main]\n  schedule:\n    - cron: '30 0 * * 2'\n  workflow_dispatch:\njobs:\n  composer-audit:\n    name: Composer Audit\n    steps:\n      - run: composer audit --locked\n  bun-audit:\n    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'\n    name: Bun Audit\n    steps:\n      - run: bun audit --audit-level high\n`
  );

  writeText(
    path.join(repoRoot, '.github/workflows/ci.yml'),
    `jobs:\n  lint:\n    steps:\n      - name: Validate maintenance automation policy\n        run: bun run maintenance-automation:validate\n  test:\n    steps: []\n`
  );

  writeText(
    path.join(repoRoot, '.github/workflows/test-matrix.yml'),
    `jobs:\n  security-scan:\n    name: CodeQL Scan\n    steps:\n      - name: Run CodeQL\n        uses: github/codeql-action/init@v4\n`
  );

  writeText(
    path.join(repoRoot, 'docs/maintenance-automation-policy.md'),
    `Dependabot updates\ngithub-actions\ncomposer\nrelease/sampo\nbun audit --audit-level high\ncomposer audit --locked\nscheduled/manual\n.github/workflows/dependency-audit.yml\n.github/workflows/test-matrix.yml\n`
  );

  writeText(
    path.join(repoRoot, 'README.md'),
    `[Maintenance Automation Policy](docs/maintenance-automation-policy.md)\nbun run maintenance-automation:validate\n`
  );

  writeText(
    path.join(repoRoot, 'CONTRIBUTING.md'),
    `bun run maintenance-automation:validate\n[\`docs/maintenance-automation-policy.md\`](./docs/maintenance-automation-policy.md)\nDependabot\nrelease/sampo\n`
  );

  return repoRoot;
}

describe('validateMaintenanceAutomationPolicy', () => {
  test('passes when the repo matches the documented maintenance automation baseline', () => {
    const repoRoot = createMaintenancePolicyRepo();

    expect(validateMaintenanceAutomationPolicy(repoRoot)).toEqual({
      errors: [],
      valid: true,
    });
  });

  test('fails when dependabot coverage drifts from the chosen baseline', () => {
    const repoRoot = createMaintenancePolicyRepo();
    writeText(
      path.join(repoRoot, '.github/dependabot.yml'),
      `version: 2\nupdates:\n  - package-ecosystem: 'github-actions'\n    directory: '/'\n`
    );

    const result = validateMaintenanceAutomationPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      '.github/dependabot.yml must configure a composer update lane.',
    );
    expect(result.errors).toContain(
      '.github/dependabot.yml must keep the github-actions lane targeting the main branch.',
    );
    expect(result.errors).toContain(
      '.github/dependabot.yml must keep the github-actions lane on a weekly update cadence.',
    );
  });

  test('fails when dependabot widens automation beyond the documented ecosystems', () => {
    const repoRoot = createMaintenancePolicyRepo();
    writeText(
      path.join(repoRoot, '.github/dependabot.yml'),
      `version: 2\nupdates:\n  - package-ecosystem: 'github-actions'\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n  - package-ecosystem: composer\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n  - package-ecosystem: npm\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n`
    );

    const result = validateMaintenanceAutomationPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      '.github/dependabot.yml must not widen automation beyond github-actions, composer; found npm.',
    );
  });

  test('accepts equivalent YAML quoting styles for required dependabot ecosystems', () => {
    const repoRoot = createMaintenancePolicyRepo();
    writeText(
      path.join(repoRoot, '.github/dependabot.yml'),
      `version: 2\nupdates:\n  - package-ecosystem: "github-actions"\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n  - package-ecosystem: composer\n    directory: '/'\n    target-branch: 'main'\n    schedule:\n      interval: 'weekly'\n`
    );

    expect(validateMaintenanceAutomationPolicy(repoRoot)).toEqual({
      errors: [],
      valid: true,
    });
  });

  test('fails when audit workflows or ci hooks drift', () => {
    const repoRoot = createMaintenancePolicyRepo();
    writeText(
      path.join(repoRoot, '.github/workflows/dependency-audit.yml'),
      `name: Dependency and Security Audit\njobs:\n  composer-audit:\n    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'\n    name: Composer Audit\n    steps:\n      - run: composer audit --locked\n  bun-audit:\n    name: Bun Audit\n`
    );
    writeText(
      path.join(repoRoot, '.github/workflows/ci.yml'),
      `jobs:\n  lint:\n    steps:\n      - run: bun run lint:repo\n`
    );
    writeText(
      path.join(repoRoot, '.github/workflows/test-matrix.yml'),
      `jobs:\n  security-scan:\n    name: CodeQL Scan\n    steps:\n      - name: Run Bun audit\n        run: bun audit --audit-level high\n`
    );

    const result = validateMaintenanceAutomationPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      '.github/workflows/dependency-audit.yml must include "pull_request:\\n    branches: [main]".',
    );
    expect(result.errors).toContain(
      '.github/workflows/dependency-audit.yml must keep Bun Audit gated to schedule/workflow_dispatch.',
    );
    expect(result.errors).toContain(
      '.github/workflows/dependency-audit.yml must keep Composer Audit eligible for pull_request and push runs.',
    );
    expect(result.errors).toContain(
      '.github/workflows/ci.yml lint job must include "run: bun run maintenance-automation:validate".',
    );
    expect(result.errors).toContain(
      '.github/workflows/test-matrix.yml should not duplicate the Bun audit step now that dependency-audit.yml owns the fast audit lane.',
    );
  });

  test('fails when docs and local scripts stop reflecting the policy', () => {
    const repoRoot = createMaintenancePolicyRepo();
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.scripts['ci:local'] = 'bun run lint:all';
    writeJson(packageJsonPath, packageJson);
    writeText(path.join(repoRoot, 'README.md'), 'maintenance docs missing\n');

    const result = validateMaintenanceAutomationPolicy(repoRoot);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'package.json must include "bun run maintenance-automation:validate" in scripts["ci:local"].',
    );
    expect(result.errors).toContain(
      'README.md must mention "[Maintenance Automation Policy](docs/maintenance-automation-policy.md)".',
    );
  });
});
