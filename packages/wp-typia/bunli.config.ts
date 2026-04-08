import { defineConfig } from "@bunli/core";

import packageJson from "./package.json";

export const bunliConfig = defineConfig({
	name: packageJson.name,
	version: packageJson.version,
	description: packageJson.description,
	commands: {
		entry: "./src/cli.ts",
		directory: "./src/commands",
		generateReport: true,
	},
	build: {
		entry: "./src/cli.ts",
		outdir: "./dist-bunli",
		sourcemap: true,
	},
	test: {
		pattern: ["tests/*.test.ts"],
		coverage: false,
		watch: false,
	},
	tui: {
		renderer: {
			bufferMode: "alternate",
		},
	},
});

export default bunliConfig;
