import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function captureCommand(command, args) {
	return execFileSync(command, args, {
		cwd: repoRoot,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
}

function captureExamplesState() {
	return {
		diff: captureCommand("git", ["diff", "--binary", "--", "examples"]),
		status: captureCommand("git", ["status", "--porcelain", "--untracked-files=all", "--", "examples"]),
	};
}

function runBuild(command, args) {
	execFileSync(command, args, {
		cwd: repoRoot,
		stdio: "inherit",
	});
}

const before = captureExamplesState();

for (const filter of [
	"my-typia-block",
	"persistence-examples",
	"compound-patterns",
	"api-contract-adapter-poc",
]) {
	runBuild("bun", ["run", "--filter", filter, "build"]);
}

const after = captureExamplesState();

if (before.diff !== after.diff || before.status !== after.status) {
	console.error(
		[
			"❌ Example builds modified files under examples/.",
			"Build and typecheck flows should verify generated artifacts, not rewrite them.",
			"Run the relevant sync-* command explicitly if artifact refresh is intended.",
		].join("\n"),
	);
	process.exit(1);
}
