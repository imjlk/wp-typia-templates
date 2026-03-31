import type { BunliConfigInput } from "@bunli/core";

const config = {
	name: "@wp-typia/rest",
	version: "0.1.0",
	description: "Typed WordPress REST helpers powered by Typia validation",
	build: {
		entry: "./src/index.ts",
		outdir: "./dist",
		sourcemap: false,
		minify: false,
	},
} satisfies BunliConfigInput;

export default config;
