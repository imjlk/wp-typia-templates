import path from "node:path";

import { patchFile } from "./cli-add-shared.js";
import {
	findExecutablePatternMatch,
	hasExecutablePattern,
	hasUncommentedPattern,
	maskTypeScriptCommentsAndLiterals,
	type SourceRange,
} from "./ts-source-masking.js";

const SCAFFOLD_REGISTRATION_SETTINGS_CALL_PATTERN =
	/registerScaffoldBlockType\s*\(\s*registration\s*\.\s*name\s*,\s*registration\s*\.\s*settings\s*\)\s*;?/u;

function isIdentifierBoundary(source: string, index: number): boolean {
	if (index < 0 || index >= source.length) {
		return true;
	}

	return !/[A-Za-z0-9_$]/u.test(source[index] ?? "");
}

function skipWhitespace(source: string, index: number): number {
	let cursor = index;

	while (cursor < source.length && /\s/u.test(source[cursor] ?? "")) {
		cursor += 1;
	}

	return cursor;
}

function findMatchingDelimiterEnd(
	source: string,
	openIndex: number,
	openDelimiter: string,
	closeDelimiter: string,
): number | undefined {
	let depth = 0;

	for (let index = openIndex; index < source.length; index += 1) {
		const char = source[index];

		if (char === openDelimiter) {
			depth += 1;
			continue;
		}

		if (char === closeDelimiter) {
			depth -= 1;

			if (depth === 0) {
				return index + 1;
			}
		}
	}

	return undefined;
}

export function findExecutableCallRange(
	source: string,
	callName: string,
): SourceRange | undefined {
	const maskedSource = maskTypeScriptCommentsAndLiterals(source);
	let searchIndex = 0;

	while (searchIndex < maskedSource.length) {
		const callNameIndex = maskedSource.indexOf(callName, searchIndex);

		if (callNameIndex === -1) {
			return undefined;
		}

		const callNameEnd = callNameIndex + callName.length;
		if (
			!isIdentifierBoundary(maskedSource, callNameIndex - 1) ||
			!isIdentifierBoundary(maskedSource, callNameEnd)
		) {
			searchIndex = callNameEnd;
			continue;
		}

		let cursor = skipWhitespace(maskedSource, callNameEnd);
		if (maskedSource[cursor] === "<") {
			const genericEnd = findMatchingDelimiterEnd(maskedSource, cursor, "<", ">");
			if (genericEnd === undefined) {
				searchIndex = callNameEnd;
				continue;
			}
			cursor = skipWhitespace(maskedSource, genericEnd);
		}

		if (maskedSource[cursor] !== "(") {
			searchIndex = callNameEnd;
			continue;
		}

		const callEnd = findMatchingDelimiterEnd(maskedSource, cursor, "(", ")");
		if (callEnd === undefined) {
			searchIndex = callNameEnd;
			continue;
		}

		let end = skipWhitespace(maskedSource, callEnd);
		if (maskedSource[end] === ";") {
			end += 1;
		}

		return {
			end,
			start: callNameIndex,
		};
	}

	return undefined;
}

function findBlockRegistrationCallRange(source: string): SourceRange | undefined {
	return (
		findExecutableCallRange(source, "registerScaffoldBlockType") ??
		findExecutableCallRange(source, "registerBlockType")
	);
}

export async function ensureWorkspaceEntrypointCall({
	blockIndexPath,
	callLine,
	callPattern,
	importLine,
	importPattern,
}: {
	blockIndexPath: string;
	callLine: string;
	callPattern: RegExp;
	importLine: string;
	importPattern: RegExp;
}): Promise<void> {
	await patchFile(blockIndexPath, (source) => {
		let nextSource = source;

		if (!hasUncommentedPattern(nextSource, importPattern)) {
			nextSource = `${importLine}\n${nextSource}`;
		}

		if (!hasExecutablePattern(nextSource, callPattern)) {
			const callRange = findBlockRegistrationCallRange(nextSource);

			if (callRange) {
				nextSource = [
					nextSource.slice(0, callRange.end),
					`\n${callLine}\n`,
					nextSource.slice(callRange.end),
				].join("");
			} else {
				nextSource = `${nextSource.trimEnd()}\n\n${callLine}\n`;
			}
		}

		if (!hasExecutablePattern(nextSource, callPattern)) {
			throw new Error(
				`Unable to inject ${callLine} into ${path.basename(blockIndexPath)}.`,
			);
		}

		return nextSource;
	});
}

export async function ensureWorkspaceRegistrationSettingsCall({
	blockIndexPath,
	callLine,
	callPattern,
	importLine,
	importPattern,
}: {
	blockIndexPath: string;
	callLine: string;
	callPattern: RegExp;
	importLine: string;
	importPattern: RegExp;
}): Promise<void> {
	await patchFile(blockIndexPath, (source) => {
		let nextSource = source;

		if (!hasUncommentedPattern(nextSource, importPattern)) {
			nextSource = `${importLine}\n${nextSource}`;
		}

		if (!hasExecutablePattern(nextSource, callPattern)) {
			const callRange = findExecutablePatternMatch(nextSource, [
				SCAFFOLD_REGISTRATION_SETTINGS_CALL_PATTERN,
			]);

			if (!callRange) {
				throw new Error(
					`Unable to inject ${callLine} into ${path.basename(
						blockIndexPath,
					)} because it does not expose a scaffold registration settings object.`,
				);
			}

			nextSource = [
				nextSource.slice(0, callRange.start),
				`${callLine}\n`,
				nextSource.slice(callRange.start),
			].join("");
		}

		return nextSource;
	});
}
