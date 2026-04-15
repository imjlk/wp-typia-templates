import {
	parseTemplateLocator,
	resolveTemplateSeed,
} from "./template-source.js";
import {
	listSelectableExternalTemplateLayers,
	type SelectableExternalTemplateLayer,
} from "./template-layers.js";

export interface ExternalLayerSelectionOption
	extends SelectableExternalTemplateLayer {}

export interface ResolvedExternalLayerSelection {
	cleanup?: () => Promise<void>;
	externalLayerId?: string;
	externalLayerSource?: string;
}

export async function resolveOptionalInteractiveExternalLayerId({
	callerCwd,
	externalLayerId,
	externalLayerSource,
	selectExternalLayerId,
}: {
	callerCwd: string;
	externalLayerId?: string;
	externalLayerSource?: string;
	selectExternalLayerId?: (
		options: ExternalLayerSelectionOption[],
	) => Promise<string>;
}): Promise<ResolvedExternalLayerSelection> {
	if (!externalLayerSource || externalLayerId || !selectExternalLayerId) {
		return {
			externalLayerId,
			externalLayerSource,
		};
	}

	const layerSeed = await resolveTemplateSeed(
		parseTemplateLocator(externalLayerSource),
		callerCwd,
	);
	try {
		const selectableLayers = await listSelectableExternalTemplateLayers(
			layerSeed.rootDir,
		);
		if (selectableLayers.length <= 1) {
			await layerSeed.cleanup?.();
			return {
				externalLayerId,
				externalLayerSource,
			};
		}

		const selectedLayerId = await selectExternalLayerId(selectableLayers);
		if (selectableLayers.some((layer) => layer.id === selectedLayerId)) {
			return {
				cleanup: layerSeed.cleanup,
				externalLayerId: selectedLayerId,
				externalLayerSource: layerSeed.rootDir,
			};
		}

		await layerSeed.cleanup?.();
		throw new Error(
			`Unknown external layer "${selectedLayerId}". Expected one of: ${selectableLayers.map((layer) => layer.id).join(", ")}`,
		);
	} catch (error) {
		await layerSeed.cleanup?.();
		throw error;
	}
}
