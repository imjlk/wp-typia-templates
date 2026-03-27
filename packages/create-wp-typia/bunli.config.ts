import { defineConfig } from "@bunli/core";

export default defineConfig({
	name: "create-wp-typia",
	version: "0.1.0",
	description: "Bun-first scaffolding CLI for WordPress Typia block templates",
	commands: {
		entry: "./src/cli.ts",
	},
	build: {
		entry: "./src/cli.ts",
		outdir: "./dist",
		sourcemap: false,
		minify: false,
	},
});
