import type { RenderArgs } from "@bunli/core";

import type { WpTypiaUserConfig } from "../config";

type WpTypiaRenderStore = {
	wpTypiaUserConfig?: WpTypiaUserConfig;
};

export type WpTypiaRenderArgs = RenderArgs<Record<string, unknown>, WpTypiaRenderStore>;
