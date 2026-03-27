#!/usr/bin/env node

(async () => {
	const { runLegacyCli } = await import("create-wp-typia");
	await runLegacyCli("interactivity", process.argv.slice(2));
})().catch((error) => {
	console.error("❌ wp-typia-interactivity failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
