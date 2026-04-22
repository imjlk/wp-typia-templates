type TtyLike = {
	isTTY?: boolean;
};

type RuntimeCapabilityOptions = {
	hasBunRuntime?: boolean;
	stdin?: TtyLike | null | undefined;
	stdout?: TtyLike | null | undefined;
	term?: string | undefined;
};

export function isInteractiveTerminal({
	stdin = process.stdin,
	stdout = process.stdout,
	term = process.env.TERM,
}: RuntimeCapabilityOptions = {}): boolean {
	return Boolean(stdin?.isTTY) && Boolean(stdout?.isTTY) && term !== "dumb";
}

export function supportsInteractiveTui(
	options: RuntimeCapabilityOptions = {},
): boolean {
	const hasBunRuntime =
		options.hasBunRuntime ?? typeof Bun !== "undefined";
	return hasBunRuntime && isInteractiveTerminal(options);
}
