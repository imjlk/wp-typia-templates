import fs from "node:fs";
import path from "node:path";
import { parseScaffoldBlockMetadata } from "@wp-typia/block-runtime/blocks";

import type {
	WorkspaceInventory,
} from "./workspace-inventory.js";

export function resolveWorkspaceBlock(
	inventory: WorkspaceInventory,
	blockSlug: string,
): WorkspaceInventory["blocks"][number] {
	const block = inventory.blocks.find((entry) => entry.slug === blockSlug);
	if (!block) {
		throw new Error(
			`Unknown workspace block "${blockSlug}". Choose one of: ${inventory.blocks.map((entry) => entry.slug).join(", ")}`,
		);
	}
	return block;
}

export function readWorkspaceBlockJson(
	projectDir: string,
	blockSlug: string,
): {
	blockJson: Record<string, unknown>;
	blockJsonPath: string;
} {
	const blockJsonPath = path.join(projectDir, "src", "blocks", blockSlug, "block.json");
	if (!fs.existsSync(blockJsonPath)) {
		throw new Error(
			`Missing ${path.relative(projectDir, blockJsonPath)} for workspace block "${blockSlug}".`,
		);
	}

	let blockJson: Record<string, unknown>;
	try {
		blockJson = parseScaffoldBlockMetadata<Record<string, unknown>>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Failed to parse ${path.relative(projectDir, blockJsonPath)}: ${error.message}`
				: `Failed to parse ${path.relative(projectDir, blockJsonPath)}.`,
		);
	}

	return {
		blockJson,
		blockJsonPath,
	};
}

export function getMutableBlockHooks(
	blockJson: Record<string, unknown>,
	blockJsonRelativePath: string,
): Record<string, string> {
	const blockHooks = blockJson.blockHooks;
	if (blockHooks === undefined) {
		const nextHooks: Record<string, string> = {};
		blockJson.blockHooks = nextHooks;
		return nextHooks;
	}
	if (!blockHooks || typeof blockHooks !== "object" || Array.isArray(blockHooks)) {
		throw new Error(`${blockJsonRelativePath} must define blockHooks as an object when present.`);
	}

	return blockHooks as Record<string, string>;
}
