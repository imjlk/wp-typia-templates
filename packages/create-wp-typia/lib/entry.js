#!/usr/bin/env node

async function main() {
	if (typeof globalThis.Bun !== "undefined") {
		const translatedArgs = process.argv.slice(2).map((arg) => {
			if (arg === "--no-install") {
				return "--noInstall";
			}
			if (arg === "--package-manager") {
				return "--packageManager";
			}
			if (arg.startsWith("--package-manager=")) {
				return `--packageManager=${arg.slice("--package-manager=".length)}`;
			}
			return arg;
		});
		process.argv = [process.argv[0], process.argv[1], ...translatedArgs];
		await import("../src/cli.ts");
		return;
	}

	const { runNodeCli } = await import("./node-cli.js");
	await runNodeCli(process.argv.slice(2));
}

main().catch((error) => {
	console.error("❌ create-wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
