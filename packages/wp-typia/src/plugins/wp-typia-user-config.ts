import { createPlugin } from "@bunli/core/plugin";

import { loadWpTypiaUserConfig, type WpTypiaUserConfig } from "../config";

declare module "@bunli/core/plugin" {
	interface CommandContext {
		wpTypiaUserConfig?: WpTypiaUserConfig;
		isAIAgent?: boolean;
		aiAgents?: string[];
		aiAgentEnvVars?: string[];
	}
}

export const wpTypiaUserConfigPlugin = createPlugin(() => {
	let resolvedConfig: WpTypiaUserConfig = {};

	return {
		name: "wp-typia-user-config",
		async setup(context) {
			resolvedConfig = await loadWpTypiaUserConfig(context.paths.cwd);
		},
		beforeCommand(context) {
			context.store.wpTypiaUserConfig = resolvedConfig;
		},
	};
});

export default wpTypiaUserConfigPlugin;
