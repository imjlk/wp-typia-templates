import os from "node:os";
import path from "node:path";
import { promises as fsp } from "node:fs";

import {
	getTemplateById,
	SHARED_BASE_TEMPLATE_ROOT,
	SHARED_PERSISTENCE_TEMPLATE_ROOT,
	type BuiltInTemplateId,
} from "./template-registry.js";

export type BuiltInPersistencePolicy = "authenticated" | "public";

export interface MaterializedBuiltInTemplateSource {
	id: BuiltInTemplateId;
	defaultCategory: string;
	description: string;
	features: string[];
	format: "wp-typia";
	templateDir: string;
	cleanup: () => Promise<void>;
}

export function getBuiltInTemplateLayerDirs(
	templateId: BuiltInTemplateId,
	persistencePolicy: BuiltInPersistencePolicy = "authenticated",
): string[] {
	if (templateId === "persistence") {
		return [
			SHARED_BASE_TEMPLATE_ROOT,
			path.join(SHARED_PERSISTENCE_TEMPLATE_ROOT, "core"),
			path.join(SHARED_PERSISTENCE_TEMPLATE_ROOT, persistencePolicy === "public" ? "public" : "auth"),
			getTemplateById(templateId).templateDir,
		];
	}

	return [SHARED_BASE_TEMPLATE_ROOT, getTemplateById(templateId).templateDir];
}

export async function resolveBuiltInTemplateSource(
	templateId: BuiltInTemplateId,
	persistencePolicy: BuiltInPersistencePolicy = "authenticated",
): Promise<MaterializedBuiltInTemplateSource> {
	const template = getTemplateById(templateId);
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-template-"));
	const templateDir = path.join(tempRoot, templateId);

	try {
		await fsp.mkdir(templateDir, { recursive: true });

		for (const layerDir of getBuiltInTemplateLayerDirs(templateId, persistencePolicy)) {
			await fsp.cp(layerDir, templateDir, {
				recursive: true,
				force: true,
			});
		}
	} catch (error) {
		await fsp.rm(tempRoot, { force: true, recursive: true });
		throw error;
	}

	return {
		id: template.id,
		defaultCategory: template.defaultCategory,
		description: template.description,
		features: template.features,
		format: "wp-typia",
		templateDir,
		cleanup: async () => {
			await fsp.rm(tempRoot, { force: true, recursive: true });
		},
	};
}
