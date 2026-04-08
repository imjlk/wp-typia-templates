import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function resolveBundledModuleHref(baseUrl: string, candidates: string[]): string {
	for (const candidate of candidates) {
		const url = new URL(candidate, baseUrl);
		if (fs.existsSync(fileURLToPath(url))) {
			return url.href;
		}
	}

	return new URL(candidates[0]!, baseUrl).href;
}
