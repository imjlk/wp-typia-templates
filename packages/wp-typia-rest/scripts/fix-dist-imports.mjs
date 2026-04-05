import { readFileSync, writeFileSync } from "node:fs";

const distDir = new URL("../dist/", import.meta.url);

for (const relativeFile of [
	"index.js",
	"http.js",
	"react.js",
	"index.d.ts",
	"http.d.ts",
	"react.d.ts",
]) {
	const fileUrl = new URL(relativeFile, distDir);
	const source = readFileSync(fileUrl, "utf8");
	const next = source
		.replaceAll('from "./client"', 'from "./client.js"')
		.replaceAll('from "./http"', 'from "./http.js"');

	if (next !== source) {
		writeFileSync(fileUrl, next);
	}
}
