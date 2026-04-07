#!/usr/bin/env node

import { main } from "../lib/cli.js";

main().catch((error) => {
	console.error("❌ wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
