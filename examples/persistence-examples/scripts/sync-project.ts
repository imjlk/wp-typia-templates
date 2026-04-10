import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const check = process.argv.includes("--check");
const projectDir = process.cwd();
const tsxBinary = path.join(
	projectDir,
	"node_modules",
	".bin",
	process.platform === "win32" ? "tsx.cmd" : "tsx"
);

if (!fs.existsSync(tsxBinary)) {
	throw new Error(`Missing local tsx binary at ${tsxBinary}. Run the project install step first.`);
}

const extraArgs = check ? ["--check"] : [];

execFileSync(tsxBinary, [path.join(projectDir, "scripts", "sync-types-to-block-json.ts"), ...extraArgs], {
	cwd: projectDir,
	stdio: "inherit",
});
execFileSync(tsxBinary, [path.join(projectDir, "scripts", "sync-rest-contracts.ts"), ...extraArgs], {
	cwd: projectDir,
	stdio: "inherit",
});

console.log(
	check
		? "Verified metadata and REST artifacts through sync --check."
		: "Refreshed metadata and REST artifacts through sync.",
);
