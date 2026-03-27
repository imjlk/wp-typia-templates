import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';

describe('create-wp-typia scaffolding', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-wp-typia-'));

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('scaffoldProject creates a Bun-first basic template', async () => {
    const targetDir = path.join(tempRoot, 'demo-basic');
    const scaffoldModuleUrl = pathToFileURL(
      path.join(process.cwd(), 'packages/create-wp-typia/lib/scaffold.js')
    ).href;
    const script = [
      `const mod = await import(${JSON.stringify(scaffoldModuleUrl)});`,
      `await mod.scaffoldProject({`,
      `projectDir: ${JSON.stringify(targetDir)},`,
      `projectName: 'demo-basic',`,
      `template: 'basic',`,
      `yes: true,`,
      `noInstall: true,`,
      `});`,
    ].join(' ');

    execSync(`node --input-type=module -e ${JSON.stringify(script)}`, { stdio: 'inherit' });

    const packageJsonPath = path.join(targetDir, 'package.json');
    const readmePath = path.join(targetDir, 'README.md');
    const gitignorePath = path.join(targetDir, '.gitignore');
    const typesPath = path.join(targetDir, 'src', 'types.ts');

    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(fs.existsSync(readmePath)).toBe(true);
    expect(fs.existsSync(gitignorePath)).toBe(true);
    expect(fs.existsSync(typesPath)).toBe(true);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    expect(packageJson.packageManager).toBe('bun@1.3.10');
    expect(packageJson.scripts.prebuild).toContain('bun run sync-types');
  });

  test('legacy wrapper keeps current-directory scaffolding flow', () => {
    const targetDir = path.join(tempRoot, 'legacy-basic');
    fs.mkdirSync(targetDir, { recursive: true });

    execSync(
      `node ${path.join(process.cwd(), 'packages/wp-typia-basic/scripts/setup.js')} --yes --no-install`,
      { cwd: targetDir, stdio: 'inherit' }
    );

    const packageJsonPath = path.join(targetDir, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    expect(packageJson.name).toBe('legacy-basic');
    expect(packageJson.packageManager).toBe('bun@1.3.10');
  });
});
