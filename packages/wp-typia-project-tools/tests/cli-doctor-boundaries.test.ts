import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceRoot = resolve(import.meta.dir, "..", "src", "runtime");

test("cli-doctor keeps environment and workspace checks in dedicated modules", () => {
	const cliDoctorSource = readFileSync(resolve(sourceRoot, "cli-doctor.ts"), "utf8");
	const environmentSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-environment.ts"),
		"utf8",
	);
	const workspaceSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace.ts"),
		"utf8",
	);

	expect(cliDoctorSource).toContain('from "./cli-doctor-environment.js"');
	expect(cliDoctorSource).toContain('from "./cli-doctor-workspace.js"');
	expect(cliDoctorSource).not.toContain("function readCommandVersion(");
	expect(cliDoctorSource).not.toContain("function checkWorkspacePackageMetadata(");
	expect(cliDoctorSource).not.toContain("function checkWorkspaceBindingBootstrap(");
	expect(environmentSource).toContain("export async function getEnvironmentDoctorChecks(");
	expect(workspaceSource).toContain("export function getWorkspaceDoctorChecks(");
	expect(workspaceSource).toContain("function checkWorkspaceBlockMetadata(");
});
