type TtyLike = {
	isTTY?: boolean;
};

type RuntimeCapabilityOptions = {
	hasBunRuntime?: boolean;
	stdin?: TtyLike | null | undefined;
	stdout?: TtyLike | null | undefined;
	term?: string | undefined;
};

/**
 * Detect whether the current runtime can safely prompt on an interactive terminal.
 */
export function isInteractiveTerminal({
	stdin = process.stdin,
	stdout = process.stdout,
	term = process.env.TERM,
}: RuntimeCapabilityOptions = {}): boolean {
	return Boolean(stdin?.isTTY) && Boolean(stdout?.isTTY) && term !== "dumb";
}

/**
 * Detect whether the Bun-powered TUI runtime should be enabled for this process.
 */
export function supportsInteractiveTui(
	options: RuntimeCapabilityOptions = {},
): boolean {
	const hasBunRuntime =
		options.hasBunRuntime ?? typeof Bun !== "undefined";
	return hasBunRuntime && isInteractiveTerminal(options);
}
