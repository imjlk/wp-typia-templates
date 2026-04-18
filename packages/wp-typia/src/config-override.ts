export function extractWpTypiaConfigOverride(argv: string[]): {
	argv: string[];
	configOverridePath?: string;
} {
	const nextArgv: string[] = [];
	let configOverridePath: string | undefined;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg) {
			continue;
		}

		if (arg === "--config" || arg === "-c") {
			const next = argv[index + 1];
			if (!next || next.startsWith("-")) {
				throw new Error(`\`${arg}\` requires a value.`);
			}
			configOverridePath = next;
			index += 1;
			continue;
		}

		if (arg.startsWith("--config=")) {
			const inlineValue = arg.slice("--config=".length);
			if (!inlineValue) {
				throw new Error("`--config` requires a value.");
			}
			configOverridePath = inlineValue;
			continue;
		}

		nextArgv.push(arg);
	}

	return {
		argv: nextArgv,
		configOverridePath,
	};
}
