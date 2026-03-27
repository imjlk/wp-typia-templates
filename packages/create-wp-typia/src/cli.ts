#!/usr/bin/env node

import { runCreateCli } from "../lib/scaffold.js";

runCreateCli(process.argv.slice(2)).catch((error: unknown) => {
	console.error("❌ create-wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
