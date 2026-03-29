import type { BunliConfigInput } from "@bunli/core";

const config = {
	name: "create-wp-typia",
	version: "1.0.0",
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
} satisfies BunliConfigInput;

export default config;
