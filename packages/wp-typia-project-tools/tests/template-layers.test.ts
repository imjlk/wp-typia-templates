import { describe, expect, test } from "bun:test";

import {
	templateLayerAmbiguousFixturePath,
	templateLayerConflictFixturePath,
	templateLayerCycleFixturePath,
	templateLayerFixturePath,
} from "./helpers/scaffold-test-harness.js";
import {
	loadExternalTemplateLayerManifest,
	resolveExternalTemplateLayers,
} from "../src/runtime/template-layers.js";

describe("external template layer manifests", () => {
	test("loads a data-only layer manifest and resolves ancestors deterministically", async () => {
		const manifest = await loadExternalTemplateLayerManifest(
			templateLayerFixturePath,
		);

		expect(manifest?.version).toBe(1);
		expect(Object.keys(manifest?.layers ?? {})).toEqual([
			"acme/internal-observability-base",
			"acme/basic-observability",
		]);

		const resolved = await resolveExternalTemplateLayers({
			sourceRoot: templateLayerFixturePath,
		});

		expect(resolved.selectedLayerId).toBe("acme/basic-observability");
		expect(resolved.entries.map((entry) => entry.id)).toEqual([
			"builtin:shared/base",
			"acme/internal-observability-base",
			"builtin:shared/rest-helpers/shared",
			"acme/basic-observability",
		]);
	});

	test("requires an explicit externalLayerId when a package exposes multiple public layers", async () => {
		await expect(
			resolveExternalTemplateLayers({
				sourceRoot: templateLayerAmbiguousFixturePath,
			}),
		).rejects.toThrow(
			"External layer package defines multiple selectable layers",
		);

		await expect(
			resolveExternalTemplateLayers({
				externalLayerId: "acme/beta",
				sourceRoot: templateLayerAmbiguousFixturePath,
			}),
		).resolves.toMatchObject({
			selectedLayerId: "acme/beta",
		});
	});

	test("rejects layer cycles and protected output conflicts", async () => {
		await expect(
			resolveExternalTemplateLayers({
				externalLayerId: "acme/a",
				sourceRoot: templateLayerCycleFixturePath,
			}),
		).rejects.toThrow("Detected a cycle while resolving external layer");

		const resolvedConflict = await resolveExternalTemplateLayers({
			sourceRoot: templateLayerConflictFixturePath,
		});
		expect(resolvedConflict.selectedLayerId).toBe("acme/conflict");
	});
});
