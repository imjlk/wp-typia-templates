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
}): Promise<string | undefined> {
	if (!externalLayerSource || externalLayerId || !selectExternalLayerId) {
		return externalLayerId;
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
			return externalLayerId;
		}

		const selectedLayerId = await selectExternalLayerId(selectableLayers);
		if (selectableLayers.some((layer) => layer.id === selectedLayerId)) {
			return selectedLayerId;
		}

		throw new Error(
			`Unknown external layer "${selectedLayerId}". Expected one of: ${selectableLayers.map((layer) => layer.id).join(", ")}`,
		);
	} finally {
		await layerSeed.cleanup?.();
	}
}
