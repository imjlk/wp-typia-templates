import os from "node:os";
import path from "node:path";
import { promises as fsp } from "node:fs";

import {
	getTemplateById,
	SHARED_BASE_TEMPLATE_ROOT,
	SHARED_COMPOUND_TEMPLATE_ROOT,
	SHARED_PERSISTENCE_TEMPLATE_ROOT,
	SHARED_REST_HELPER_TEMPLATE_ROOT,
	type BuiltInTemplateId,
} from "./template-registry.js";

/**
 * Controls which persistence layer is applied when materializing the built-in
 * `persistence` template.
 */
export type BuiltInPersistencePolicy = "authenticated" | "public";

export interface BuiltInTemplateVariantOptions {
	persistenceEnabled?: boolean;
	persistencePolicy?: BuiltInPersistencePolicy;
}

export interface MaterializedBuiltInTemplateSource {
	id: BuiltInTemplateId;
	defaultCategory: string;
	description: string;
	features: string[];
	format: "wp-typia";
	templateDir: string;
	cleanup?: () => Promise<void>;
	selectedVariant?: string | null;
	warnings?: string[];
}

/**
 * Returns the ordered overlay directories for a built-in template.
 *
 * Persistence templates include the shared base, the persistence core layer,
 * the selected policy layer, and the thin template overlay. All other built-ins
 * resolve to the shared base plus their own template directory.
 */
export function getBuiltInTemplateLayerDirs(
	templateId: BuiltInTemplateId,
	{
		persistenceEnabled = false,
		persistencePolicy = "authenticated",
	}: BuiltInTemplateVariantOptions = {},
): string[] {
	if (templateId === "persistence") {
		return [
			SHARED_BASE_TEMPLATE_ROOT,
			path.join(SHARED_REST_HELPER_TEMPLATE_ROOT, "shared"),
			path.join(SHARED_PERSISTENCE_TEMPLATE_ROOT, "core"),
			path.join(
				SHARED_REST_HELPER_TEMPLATE_ROOT,
				persistencePolicy === "public" ? "public" : "auth",
			),
			path.join(SHARED_PERSISTENCE_TEMPLATE_ROOT, persistencePolicy === "public" ? "public" : "auth"),
			getTemplateById(templateId).templateDir,
		];
	}

	if (templateId === "compound") {
		const layers = [
			SHARED_BASE_TEMPLATE_ROOT,
			path.join(SHARED_COMPOUND_TEMPLATE_ROOT, "core"),
			getTemplateById(templateId).templateDir,
		];

		if (persistenceEnabled) {
			layers.push(
				path.join(SHARED_REST_HELPER_TEMPLATE_ROOT, "shared"),
				path.join(SHARED_COMPOUND_TEMPLATE_ROOT, "persistence"),
				path.join(
					SHARED_REST_HELPER_TEMPLATE_ROOT,
					persistencePolicy === "public" ? "public" : "auth",
				),
				path.join(
					SHARED_COMPOUND_TEMPLATE_ROOT,
					persistencePolicy === "public" ? "persistence-public" : "persistence-auth",
				),
			);
		}

		return layers;
	}

	return [SHARED_BASE_TEMPLATE_ROOT, getTemplateById(templateId).templateDir];
}

/**
 * Materializes a built-in template into a temporary directory by copying each
 * resolved layer in order.
 *
 * Callers should invoke the returned `cleanup` function when they no longer
 * need the materialized directory. If copying fails, the temporary directory is
 * removed before the error is rethrown.
 */
export async function resolveBuiltInTemplateSource(
	templateId: BuiltInTemplateId,
	options: BuiltInTemplateVariantOptions = {},
): Promise<MaterializedBuiltInTemplateSource> {
	const template = getTemplateById(templateId);
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-template-"));
	const templateDir = path.join(tempRoot, templateId);

	try {
		await fsp.mkdir(templateDir, { recursive: true });

		for (const layerDir of getBuiltInTemplateLayerDirs(templateId, options)) {
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
