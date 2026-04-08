import { createPlugin } from "@bunli/core/plugin";

import {
	loadWpTypiaUserConfig,
	loadWpTypiaUserConfigFromSource,
	mergeWpTypiaUserConfig,
	type WpTypiaUserConfig,
} from "../config";

declare module "@bunli/core/plugin" {
	interface CommandContext {
		wpTypiaUserConfig?: WpTypiaUserConfig;
		isAIAgent?: boolean;
		aiAgents?: string[];
		aiAgentEnvVars?: string[];
	}
}

export const wpTypiaUserConfigPlugin = createPlugin((options: { overrideSource?: string } = {}) => {
	let resolvedConfig: WpTypiaUserConfig = {};

	return {
		name: "wp-typia-user-config",
		async setup(context) {
			resolvedConfig = await loadWpTypiaUserConfig(context.paths.cwd);
			if (options.overrideSource) {
				const overrideConfig = await loadWpTypiaUserConfigFromSource(
					context.paths.cwd,
					options.overrideSource,
				);
				resolvedConfig = mergeWpTypiaUserConfig(resolvedConfig, overrideConfig);
			}
		},
		beforeCommand(context) {
			context.store.wpTypiaUserConfig = resolvedConfig;
		},
	};
});

export default wpTypiaUserConfigPlugin;
