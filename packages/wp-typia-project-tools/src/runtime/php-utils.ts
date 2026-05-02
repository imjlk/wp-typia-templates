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

type PhpFunctionScanMode =
	| "block-comment"
	| "code"
	| "double-quoted"
	| "heredoc"
	| "line-comment"
	| "single-quoted";

type PhpHeredocStart = {
	contentStart: number;
	delimiter: string;
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

function isPhpIdentifierStart(character: string | undefined): boolean {
	return /^[A-Za-z_]$/u.test(character ?? "");
}

function isPhpIdentifierPart(character: string | undefined): boolean {
	return /^[A-Za-z0-9_]$/u.test(character ?? "");
}

function isPhpLineStart(source: string, index: number): boolean {
	return index === 0 || source[index - 1] === "\n";
}

function isPhpHorizontalWhitespace(character: string | undefined): boolean {
	return character === " " || character === "\t";
}

function isPhpWhitespace(character: string | undefined): boolean {
	return typeof character === "string" && /\s/u.test(character);
}

function findPhpLineBoundary(
	source: string,
	index: number,
): { contentEnd: number; nextStart: number } {
	const newlineIndex = source.indexOf("\n", index);
	if (newlineIndex === -1) {
		return {
			contentEnd: source.endsWith("\r") ? source.length - 1 : source.length,
			nextStart: source.length,
		};
	}

	return {
		contentEnd: source[newlineIndex - 1] === "\r" ? newlineIndex - 1 : newlineIndex,
		nextStart: newlineIndex + 1,
	};
}

function parsePhpHeredocStart(source: string, index: number): PhpHeredocStart | null {
	if (!source.startsWith("<<<", index)) {
		return null;
	}

	let cursor = index + 3;
	while (isPhpHorizontalWhitespace(source[cursor])) {
		cursor += 1;
	}

	const quote = source[cursor] === "'" || source[cursor] === '"' ? source[cursor] : "";
	if (quote) {
		cursor += 1;
	}

	if (!isPhpIdentifierStart(source[cursor])) {
		return null;
	}

	const delimiterStart = cursor;
	cursor += 1;
	while (isPhpIdentifierPart(source[cursor])) {
		cursor += 1;
	}
	const delimiter = source.slice(delimiterStart, cursor);

	if (quote) {
		if (source[cursor] !== quote) {
			return null;
		}
		cursor += 1;
	}

	const lineBoundary = findPhpLineBoundary(source, cursor);
	if (source.slice(cursor, lineBoundary.contentEnd).trim() !== "") {
		return null;
	}

	return {
		contentStart: lineBoundary.nextStart,
		delimiter,
	};
}

function findPhpHeredocClosingEnd(
	source: string,
	index: number,
	delimiter: string,
): number | null {
	if (!isPhpLineStart(source, index)) {
		return null;
	}

	let cursor = index;
	while (isPhpHorizontalWhitespace(source[cursor])) {
		cursor += 1;
	}

	if (!source.startsWith(delimiter, cursor)) {
		return null;
	}
	cursor += delimiter.length;

	if (isPhpIdentifierPart(source[cursor])) {
		return null;
	}

	let continuationCursor = cursor;
	while (isPhpHorizontalWhitespace(source[continuationCursor])) {
		continuationCursor += 1;
	}
	const continuation = source[continuationCursor];
	if (
		continuationCursor >= source.length ||
		continuation === "\r" ||
		continuation === "\n" ||
		!isPhpIdentifierPart(continuation)
	) {
		return cursor;
	}

	return null;
}

function skipPhpCallTrivia(source: string, index: number): number | null {
	let cursor = index;
	while (cursor < source.length) {
		while (isPhpWhitespace(source[cursor])) {
			cursor += 1;
		}

		if (source[cursor] === "/" && source[cursor + 1] === "*") {
			const commentEnd = source.indexOf("*/", cursor + 2);
			if (commentEnd === -1) {
				return null;
			}
			cursor = commentEnd + 2;
			continue;
		}

		if (source[cursor] === "/" && source[cursor + 1] === "/") {
			cursor = findPhpLineBoundary(source, cursor + 2).nextStart;
			continue;
		}

		if (source[cursor] === "#" && source[cursor + 1] !== "[") {
			cursor = findPhpLineBoundary(source, cursor + 1).nextStart;
			continue;
		}

		return cursor;
	}

	return cursor;
}

function matchesPhpFunctionCallAt(
	source: string,
	index: number,
	functionName: string,
): boolean {
	if (!source.startsWith(functionName, index)) {
		return false;
	}
	if (isPhpIdentifierPart(source[index - 1])) {
		return false;
	}

	const cursor = index + functionName.length;
	if (isPhpIdentifierPart(source[cursor])) {
		return false;
	}
	const callStart = skipPhpCallTrivia(source, cursor);

	return callStart !== null && source[callStart] === "(";
}

/**
 * Detect a PHP function call outside strings, comments, heredoc, and nowdoc blocks.
 *
 * @param source PHP source to scan.
 * @param functionName Literal PHP function identifier to find.
 * @returns Whether `source` contains a code-mode call to `functionName`.
 */
export function hasPhpFunctionCall(source: string, functionName: string): boolean {
	let mode: PhpFunctionScanMode = "code";
	let heredocDelimiter = "";
	let index = 0;
	while (index < source.length) {
		const character = source[index];

		if (mode === "heredoc") {
			const closingEnd = findPhpHeredocClosingEnd(
				source,
				index,
				heredocDelimiter,
			);
			if (closingEnd !== null) {
				mode = "code";
				heredocDelimiter = "";
				index = closingEnd;
				continue;
			}

			const nextLineStart = findPhpLineBoundary(source, index).nextStart;
			if (nextLineStart <= index) {
				return false;
			}
			index = nextLineStart;
			continue;
		}

		if (mode === "single-quoted" || mode === "double-quoted") {
			const quote = mode === "single-quoted" ? "'" : '"';
			if (character === "\\") {
				index += 2;
				continue;
			}
			if (character === quote) {
				mode = "code";
			}
			index += 1;
			continue;
		}

		if (mode === "line-comment") {
			if (character === "\r" || character === "\n") {
				mode = "code";
			}
			index += 1;
			continue;
		}

		if (mode === "block-comment") {
			if (character === "*" && source[index + 1] === "/") {
				mode = "code";
				index += 2;
				continue;
			}
			index += 1;
			continue;
		}

		if (character === "'") {
			mode = "single-quoted";
			index += 1;
			continue;
		}
		if (character === '"') {
			mode = "double-quoted";
			index += 1;
			continue;
		}
		if (character === "/" && source[index + 1] === "/") {
			mode = "line-comment";
			index += 2;
			continue;
		}
		if (character === "#" && source[index + 1] !== "[") {
			mode = "line-comment";
			index += 1;
			continue;
		}
		if (character === "/" && source[index + 1] === "*") {
			mode = "block-comment";
			index += 2;
			continue;
		}
		if (character === "<") {
			const heredocStart = parsePhpHeredocStart(source, index);
			if (heredocStart) {
				mode = "heredoc";
				heredocDelimiter = heredocStart.delimiter;
				index = heredocStart.contentStart;
				continue;
			}
		}
		if (matchesPhpFunctionCallAt(source, index, functionName)) {
			return true;
		}

		index += 1;
	}

	return false;
}

/**
 * Locate a PHP function body without counting braces in non-code regions.
 *
 * @param source PHP source to scan.
 * @param functionName Literal PHP function identifier to locate.
 * @param options Range options such as trailing newline inclusion.
 * @returns The matched {@link PhpFunctionRange}, or `null` when no safe range exists.
 */
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
	let mode: PhpFunctionScanMode = "code";
	let heredocDelimiter = "";
	let index = openBraceIndex;
	while (index < source.length) {
		const character = source[index];

		if (mode === "heredoc") {
			const closingEnd = findPhpHeredocClosingEnd(
				source,
				index,
				heredocDelimiter,
			);
			if (closingEnd !== null) {
				mode = "code";
				heredocDelimiter = "";
				index = closingEnd;
				continue;
			}

			const nextLineStart = findPhpLineBoundary(source, index).nextStart;
			if (nextLineStart <= index) {
				return null;
			}
			index = nextLineStart;
			continue;
		}

		if (mode === "single-quoted" || mode === "double-quoted") {
			const quote = mode === "single-quoted" ? "'" : '"';
			if (character === "\\") {
				index += 2;
				continue;
			}
			if (character === quote) {
				mode = "code";
			}
			index += 1;
			continue;
		}

		if (mode === "line-comment") {
			if (character === "\r" || character === "\n") {
				mode = "code";
			}
			index += 1;
			continue;
		}

		if (mode === "block-comment") {
			if (character === "*" && source[index + 1] === "/") {
				mode = "code";
				index += 2;
				continue;
			}
			index += 1;
			continue;
		}

		if (character === "'") {
			mode = "single-quoted";
			index += 1;
			continue;
		}
		if (character === '"') {
			mode = "double-quoted";
			index += 1;
			continue;
		}
		if (character === "/" && source[index + 1] === "/") {
			mode = "line-comment";
			index += 2;
			continue;
		}
		if (character === "#" && source[index + 1] !== "[") {
			mode = "line-comment";
			index += 1;
			continue;
		}
		if (character === "/" && source[index + 1] === "*") {
			mode = "block-comment";
			index += 2;
			continue;
		}
		if (character === "<") {
			const heredocStart = parsePhpHeredocStart(source, index);
			if (heredocStart) {
				mode = "heredoc";
				heredocDelimiter = heredocStart.delimiter;
				index = heredocStart.contentStart;
				continue;
			}
		}

		if (character === "{") {
			depth += 1;
			index += 1;
			continue;
		}
		if (character !== "}") {
			index += 1;
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
		index += 1;
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
