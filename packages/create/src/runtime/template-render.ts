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

Mustache.escape = (value: string) => value;

export type TemplateRenderView = Record<string, unknown>;

function renderMustacheTemplateString(template: string, view: TemplateRenderView): string {
	return Mustache.render(template, view);
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

export async function copyRawDirectory(sourceDir: string, targetDir: string): Promise<void> {
	await fsp.mkdir(path.dirname(targetDir), { recursive: true });
	await fsp.cp(sourceDir, targetDir, { recursive: true });
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
		const destinationPath = path.join(targetDir, destinationName);

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
		const destinationPath = path.join(targetDir, destinationName);

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

export function pathExists(targetPath: string): boolean {
	return fs.existsSync(targetPath);
}
