import fs from "node:fs/promises";
import path from "node:path";

import { Generator } from "@bunli/generator";

const packageRoot = path.resolve(import.meta.dir, "..");
const outputDir = path.join(packageRoot, ".bunli");
const outputFile = path.join(outputDir, "commands.gen.ts");

await fs.mkdir(outputDir, { recursive: true });

const generator = new Generator({
	directory: path.join(packageRoot, "src", "commands"),
	entry: path.join(packageRoot, "src", "cli.ts"),
	generateReport: false,
	outputFile,
});

const result = await generator.run();

if ("error" in result && result.error) {
	console.error(result.error);
	process.exit(1);
}
