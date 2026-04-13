/// <reference path="./external-template-modules.d.ts" />

import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import Mustache from "mustache";

const BINARY_EXTENSIONS = new Set([
	".avif",
	".bmp",
	".gif",
	".ico",
	".jpeg",
	".jpg",
	".otf",
	".pdf",
	".png",
	".svg",
	".ttf",
	".webp",
	".woff",
	".woff2",
]);

export type TemplateRenderView = Record<string, unknown>;
/**
 * Optional controls for raw directory copies.
 *
 * The filter runs for each discovered entry before copying. Returning `false`
 * skips only that entry; when the skipped entry is a directory, the subtree is
 * skipped as well.
 */
export interface CopyRawDirectoryOptions {
	/**
	 * Predicate that decides whether a discovered entry should be copied.
	 *
	 * Throwing or rejecting aborts the copy and bubbles to the caller.
	 */
	filter?: (
		sourcePath: string,
		targetPath: string,
		entry: fs.Dirent,
	) => boolean | Promise<boolean>;
}

/**
 * Render a Mustache template while keeping HTML escaping disabled only for the
 * current render call.
 */
export function renderMustacheTemplateString(
	template: string,
	view: TemplateRenderView,
): string {
	const originalEscape = Mustache.escape;
	Mustache.escape = (value: string) => value;

	try {
		return Mustache.render(template, view);
	} finally {
		Mustache.escape = originalEscape;
	}
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderInterpolatedString(template: string, view: Record<string, string>): string {
	return Object.entries(view).reduce(
		(output, [key, value]) => output.replace(new RegExp(`{{${escapeRegExp(key)}}}`, "g"), value),
		template,
	);
}

function isBinaryTemplateFile(filePath: string): boolean {
	return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function resolveRenderedPath(targetDir: string, destinationName: string): string {
	const resolvedTargetDir = path.resolve(targetDir);
	const resolvedDestinationPath = path.resolve(resolvedTargetDir, destinationName);
	const relativePath = path.relative(resolvedTargetDir, resolvedDestinationPath);
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error(`Rendered template path escapes target directory: ${destinationName}`);
	}
	return resolvedDestinationPath;
}

/**
 * Recursively copies a directory tree without rendering template contents.
 */
export async function copyRawDirectory(
	sourceDir: string,
	targetDir: string,
	options: CopyRawDirectoryOptions = {},
): Promise<void> {
	await fsp.mkdir(targetDir, { recursive: true });
	for (const entry of await fsp.readdir(sourceDir, { withFileTypes: true })) {
		const sourcePath = path.join(sourceDir, entry.name);
		const targetPath = path.join(targetDir, entry.name);
		if (options.filter && !(await options.filter(sourcePath, targetPath, entry))) {
			continue;
		}
		if (entry.isDirectory()) {
			await copyRawDirectory(sourcePath, targetPath, options);
			continue;
		}

		await fsp.mkdir(path.dirname(targetPath), { recursive: true });
		await fsp.copyFile(sourcePath, targetPath);
	}
}

export async function copyRenderedDirectory(
	sourceDir: string,
	targetDir: string,
	view: TemplateRenderView,
): Promise<void> {
	const entries = await fsp.readdir(sourceDir, { withFileTypes: true });
	for (const entry of entries) {
		const sourcePath = path.join(sourceDir, entry.name);
		const destinationNameTemplate = entry.name.endsWith(".mustache")
			? entry.name.slice(0, -".mustache".length)
			: entry.name;
		const destinationName = renderMustacheTemplateString(destinationNameTemplate, view);
		const destinationPath = resolveRenderedPath(targetDir, destinationName);

		if (entry.isDirectory()) {
			await fsp.mkdir(destinationPath, { recursive: true });
			await copyRenderedDirectory(sourcePath, destinationPath, view);
			continue;
		}

		if (isBinaryTemplateFile(sourcePath)) {
			await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
			await fsp.copyFile(sourcePath, destinationPath);
			continue;
		}

		const content = await fsp.readFile(sourcePath, "utf8");
		await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
		await fsp.writeFile(destinationPath, renderMustacheTemplateString(content, view), "utf8");
	}
}

export async function copyInterpolatedDirectory(
	sourceDir: string,
	targetDir: string,
	view: Record<string, string>,
): Promise<void> {
	const entries = await fsp.readdir(sourceDir, { withFileTypes: true });
	for (const entry of entries) {
		const sourcePath = path.join(sourceDir, entry.name);
		const destinationNameTemplate = entry.name.endsWith(".mustache")
			? entry.name.slice(0, -".mustache".length)
			: entry.name;
		const destinationName = renderInterpolatedString(destinationNameTemplate, view);
		const destinationPath = resolveRenderedPath(targetDir, destinationName);

		if (entry.isDirectory()) {
			await fsp.mkdir(destinationPath, { recursive: true });
			await copyInterpolatedDirectory(sourcePath, destinationPath, view);
			continue;
		}

		if (isBinaryTemplateFile(sourcePath)) {
			await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
			await fsp.copyFile(sourcePath, destinationPath);
			continue;
		}

		const content = await fsp.readFile(sourcePath, "utf8");
		await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
		await fsp.writeFile(destinationPath, renderInterpolatedString(content, view), "utf8");
	}
}

/**
 * Lists the output file paths produced by an interpolated template directory
 * without writing any files to disk.
 *
 * This walks the source directory, applies the same filename interpolation and
 * `.mustache` stripping rules as `copyInterpolatedDirectory(...)`, and returns
 * normalized output-relative paths under a virtual root.
 *
 * @param sourceDir - The template directory to traverse.
 * @param view - The interpolation map used when resolving file and directory
 * names.
 * @returns A sorted array of normalized output paths relative to a virtual
 * preview root.
 */
export async function listInterpolatedDirectoryOutputs(
	sourceDir: string,
	view: Record<string, string>,
): Promise<string[]> {
	const virtualRoot = path.resolve("/wp-typia-template-preview");
	const outputs: string[] = [];

	async function visit(currentSourceDir: string, currentTargetDir: string): Promise<void> {
		const entries = await fsp.readdir(currentSourceDir, { withFileTypes: true });
		for (const entry of entries) {
			const sourcePath = path.join(currentSourceDir, entry.name);
			const destinationNameTemplate = entry.name.endsWith(".mustache")
				? entry.name.slice(0, -".mustache".length)
				: entry.name;
			const destinationName = renderInterpolatedString(destinationNameTemplate, view);
			const destinationPath = resolveRenderedPath(currentTargetDir, destinationName);

			if (entry.isDirectory()) {
				await visit(sourcePath, destinationPath);
				continue;
			}

			outputs.push(path.relative(virtualRoot, destinationPath).replace(/\\/g, "/"));
		}
	}

	await visit(sourceDir, virtualRoot);
	return outputs.sort((left, right) => left.localeCompare(right));
}

export function pathExists(targetPath: string): boolean {
	return fs.existsSync(targetPath);
}
