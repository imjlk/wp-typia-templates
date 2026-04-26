export type PhpFunctionRange = {
	end: number;
	source: string;
	start: number;
};

export type PhpFunctionRangeOptions = {
	includeTrailingNewlines?: boolean;
};

export type ReplacePhpFunctionDefinitionOptions = PhpFunctionRangeOptions & {
	trimReplacementStart?: boolean;
};

export function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function quotePhpString(value: string): string {
	return `'${value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'")}'`;
}

export function hasPhpFunctionDefinition(
	source: string,
	functionName: string,
): boolean {
	return new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\(`, "u").test(source);
}

export function findPhpFunctionRange(
	source: string,
	functionName: string,
	options: PhpFunctionRangeOptions = {},
): PhpFunctionRange | null {
	const signaturePattern = new RegExp(
		`function\\s+${escapeRegex(functionName)}\\s*\\([^)]*\\)\\s*(?::\\s*[^{};]+)?\\s*\\{`,
		"u",
	);
	const signatureMatch = signaturePattern.exec(source);
	if (!signatureMatch) {
		return null;
	}

	const functionStart = signatureMatch.index;
	const openBraceOffset = signatureMatch[0].lastIndexOf("{");
	if (openBraceOffset === -1) {
		return null;
	}
	const openBraceIndex = functionStart + openBraceOffset;

	let depth = 0;
	for (let index = openBraceIndex; index < source.length; index += 1) {
		const character = source[index];
		if (character === "{") {
			depth += 1;
			continue;
		}
		if (character !== "}") {
			continue;
		}
		depth -= 1;
		if (depth === 0) {
			let end = index + 1;
			if (options.includeTrailingNewlines ?? true) {
				while (end < source.length && /[\r\n]/u.test(source[end] ?? "")) {
					end += 1;
				}
			}
			return {
				end,
				source: source.slice(functionStart, end),
				start: functionStart,
			};
		}
	}

	return null;
}

export function replacePhpFunctionDefinition(
	source: string,
	functionName: string,
	replacement: string,
	options: ReplacePhpFunctionDefinitionOptions = {},
): string | null {
	const functionRange = findPhpFunctionRange(source, functionName, options);
	if (!functionRange) {
		return null;
	}

	return [
		source.slice(0, functionRange.start),
		options.trimReplacementStart ? replacement.trimStart() : replacement,
		source.slice(functionRange.end),
	].join("");
}
