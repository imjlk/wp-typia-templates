import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function resolveBundledModuleHref(
	baseUrl: string,
	candidates: string[],
	options: {
		moduleLabel?: string;
	} = {},
): string {
	for (const candidate of candidates) {
		const url = new URL(candidate, baseUrl);
		if (fs.existsSync(fileURLToPath(url))) {
			return url.href;
		}
	}

	const missingCandidates = candidates.map((candidate) =>
		fileURLToPath(new URL(candidate, baseUrl)),
	);
	const label = options.moduleLabel ?? "bundled wp-typia runtime module";
	throw new Error(
		[
			`Missing bundled build artifacts for ${label}.`,
			"None of the expected files were found:",
			...missingCandidates.map((candidatePath) => `- ${candidatePath}`),
			"Run `bun run --filter wp-typia build` in a source checkout, or reinstall the published package/standalone binary if its bundled files are missing.",
		].join("\n"),
	);
}
