import fs from "node:fs";
import { promises as fsp } from "node:fs";

/**
 * JSON helpers shared by project-tools runtime modules.
 *
 * File-backed runtime JSON readers should use `safeJsonParse`,
 * `readJsonFileSync`, or `readJsonFile` so malformed JSON reports the file path
 * and operation context. Raw `JSON.parse` remains intentional for trusted
 * in-memory clones, subprocess output, test fixtures, generated workspace
 * script templates that embed their own path-aware parse handling, and
 * cache/discovery probes that immediately catch malformed documents to
 * continue with fallback behavior.
 *
 * This module also re-exports JSON cloning helpers from
 * `@wp-typia/block-runtime`. That adapter keeps the existing project-tools
 * module path stable while the runtime implementation lives in block-runtime.
 *
 * @module
 */
export * from "@wp-typia/block-runtime/json-utils";

export interface SafeJsonParseOptions {
	context?: string;
	filePath?: string;
}

function formatJsonParseTarget({ context, filePath }: SafeJsonParseOptions): string {
	const operation = context?.trim() || "JSON";
	return filePath ? `${operation} at ${filePath}` : operation;
}

/**
 * Parse JSON and include operation/file context when decoding fails.
 *
 * @param source Raw JSON source text.
 * @param options Optional file path and human-readable operation context.
 * @returns Parsed JSON value cast to the caller-specified type.
 * @throws {Error} When the source is malformed JSON.
 */
export function safeJsonParse<T = unknown>(
	source: string,
	options: SafeJsonParseOptions = {},
): T {
	try {
		return JSON.parse(source) as T;
	} catch (error) {
		throw new Error(
			`Failed to parse ${formatJsonParseTarget(options)}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

/**
 * Read and parse a JSON file synchronously with path-aware parse errors.
 *
 * @param filePath JSON file path to read.
 * @param options Optional parse context. `filePath` is always set from the
 * reader argument.
 * @returns Parsed JSON value cast to the caller-specified type.
 */
export function readJsonFileSync<T = unknown>(
	filePath: string,
	options: Omit<SafeJsonParseOptions, "filePath"> = {},
): T {
	return safeJsonParse<T>(fs.readFileSync(filePath, "utf8"), {
		...options,
		filePath,
	});
}

/**
 * Read and parse a JSON file asynchronously with path-aware parse errors.
 *
 * @param filePath JSON file path to read.
 * @param options Optional parse context. `filePath` is always set from the
 * reader argument.
 * @returns Parsed JSON value cast to the caller-specified type.
 */
export async function readJsonFile<T = unknown>(
	filePath: string,
	options: Omit<SafeJsonParseOptions, "filePath"> = {},
): Promise<T> {
	return safeJsonParse<T>(await fsp.readFile(filePath, "utf8"), {
		...options,
		filePath,
	});
}
