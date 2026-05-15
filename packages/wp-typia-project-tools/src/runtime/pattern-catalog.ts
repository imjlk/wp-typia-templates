import fs from "node:fs";
import path from "node:path";

export const PATTERN_CATALOG_SCOPE_IDS = ["full", "section"] as const;

export type PatternCatalogScope = (typeof PATTERN_CATALOG_SCOPE_IDS)[number];

export type PatternCatalogEntry = {
	contentFile?: string;
	file?: string;
	scope?: string;
	sectionRole?: string;
	slug: string;
	tags?: readonly string[];
	thumbnailUrl?: string;
	title?: string;
};

export type PatternCatalogDiagnosticSeverity = "error" | "warning";

export type PatternCatalogDiagnosticCode =
	| "duplicate-pattern-slug"
	| "invalid-pattern-content-file"
	| "invalid-pattern-scope"
	| "invalid-pattern-section-role"
	| "invalid-pattern-slug"
	| "invalid-pattern-tag"
	| "invalid-pattern-thumbnail-url"
	| "missing-pattern-content-file"
	| "missing-pattern-section-role";

export type PatternCatalogDiagnostic = {
	code: PatternCatalogDiagnosticCode;
	message: string;
	patternSlug?: string;
	severity: PatternCatalogDiagnosticSeverity;
};

export type PatternCatalogValidationOptions = {
	projectDir?: string;
};

export type PatternCatalogValidationResult = {
	diagnostics: PatternCatalogDiagnostic[];
	errors: PatternCatalogDiagnostic[];
	warnings: PatternCatalogDiagnostic[];
};

const PATTERN_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/u;
const PATTERN_SECTION_ROLE_PATTERN = PATTERN_SLUG_PATTERN;
const PATTERN_TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;
const PATTERN_CONTENT_FILE_ROOT = "src/patterns/";

function createPatternCatalogDiagnostic(
	diagnostic: PatternCatalogDiagnostic,
): PatternCatalogDiagnostic {
	return diagnostic;
}

function isPatternCatalogScope(value: string): value is PatternCatalogScope {
	return (PATTERN_CATALOG_SCOPE_IDS as readonly string[]).includes(value);
}

function isSafeRelativePath(value: string): boolean {
	return (
		value.length > 0 &&
		!path.isAbsolute(value) &&
		!value.includes("\\") &&
		!value.split(/[\\/]+/u).includes("..") &&
		!/[<>:"|?*\u0000-\u001F]/u.test(value)
	);
}

function isPatternContentFilePath(value: string): boolean {
	if (
		!isSafeRelativePath(value) ||
		!value.startsWith(PATTERN_CONTENT_FILE_ROOT) ||
		!value.endsWith(".php")
	) {
		return false;
	}

	const patternRelativePath = value.slice(PATTERN_CONTENT_FILE_ROOT.length);
	const segments = patternRelativePath.split("/");
	return (
		(segments.length === 1 || segments.length === 2) &&
		segments.every((segment) => segment.length > 0)
	);
}

/**
 * Validate pattern thumbnail references with the same URL/path rules used by
 * catalog diagnostics and `wp-typia add pattern`.
 *
 * @param value Candidate thumbnail URL or relative project path.
 * @returns Whether the value is an http(s) URL or safe relative project path.
 */
export function isValidPatternThumbnailUrl(value: string): boolean {
	if (value.length === 0) {
		return false;
	}
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return isSafeRelativePath(value);
	}
}

export function resolvePatternCatalogContentFile(
	pattern: Pick<PatternCatalogEntry, "contentFile" | "file">,
): string | undefined {
	return pattern.contentFile ?? pattern.file;
}

/**
 * Validate typed pattern catalog metadata declared in `scripts/block-config.ts`.
 *
 * The validator is intentionally metadata-only: it checks catalog shape,
 * duplicate slugs, optional section-role rules, safe content file paths, and
 * missing files when a workspace root is provided. Block markup validation runs
 * separately through the nesting validator.
 *
 * @param patterns Pattern catalog entries to validate.
 * @param options Optional project root for content-file existence checks.
 * @returns Structured diagnostics split into errors and warnings.
 */
export function validatePatternCatalog(
	patterns: readonly PatternCatalogEntry[],
	options: PatternCatalogValidationOptions = {},
): PatternCatalogValidationResult {
	const diagnostics: PatternCatalogDiagnostic[] = [];
	const seenSlugs = new Map<string, number>();

	for (const [index, pattern] of patterns.entries()) {
		const label = pattern.slug || `PATTERNS[${index}]`;
		if (!PATTERN_SLUG_PATTERN.test(pattern.slug)) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "invalid-pattern-slug",
					message: `${label}: slug must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}

		const previousIndex = seenSlugs.get(pattern.slug);
		if (previousIndex !== undefined) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "duplicate-pattern-slug",
					message: `${label}: duplicate slug already declared at PATTERNS[${previousIndex}].`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		} else {
			seenSlugs.set(pattern.slug, index);
		}

		const scope = pattern.scope ?? "full";
		if (!isPatternCatalogScope(scope)) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "invalid-pattern-scope",
					message: `${label}: scope must be one of ${PATTERN_CATALOG_SCOPE_IDS.join(", ")}.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}

		if (scope === "section" && !pattern.sectionRole) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "missing-pattern-section-role",
					message: `${label}: section-scoped patterns must declare sectionRole.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}
		if (
			pattern.sectionRole !== undefined &&
			!PATTERN_SECTION_ROLE_PATTERN.test(pattern.sectionRole)
		) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "invalid-pattern-section-role",
					message: `${label}: sectionRole must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}

		for (const [tagIndex, tag] of (pattern.tags ?? []).entries()) {
			if (!PATTERN_TAG_PATTERN.test(tag)) {
				diagnostics.push(
					createPatternCatalogDiagnostic({
						code: "invalid-pattern-tag",
						message: `${label}: tags[${tagIndex}] must contain only lowercase letters, numbers, and hyphens.`,
						patternSlug: pattern.slug,
						severity: "error",
					}),
				);
			}
		}

		if (
			pattern.thumbnailUrl !== undefined &&
			!isValidPatternThumbnailUrl(pattern.thumbnailUrl)
		) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "invalid-pattern-thumbnail-url",
					message: `${label}: thumbnailUrl must be an http(s) URL or safe relative project path.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}

		const contentFile = resolvePatternCatalogContentFile(pattern);
		if (!contentFile) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "missing-pattern-content-file",
					message: `${label}: contentFile or legacy file must point at the pattern PHP file.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
			continue;
		}
		if (!isPatternContentFilePath(contentFile)) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "invalid-pattern-content-file",
					message: `${label}: contentFile must be a safe relative project path directly under src/patterns/ or one nested directory under src/patterns/ and end in .php.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
			continue;
		}
		if (options.projectDir && !fs.existsSync(path.join(options.projectDir, contentFile))) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "missing-pattern-content-file",
					message: `${label}: missing pattern content file ${contentFile}.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}
	}

	const warnings = diagnostics.filter(
		(diagnostic) => diagnostic.severity === "warning",
	);
	const errors = diagnostics.filter(
		(diagnostic) => diagnostic.severity === "error",
	);

	return {
		diagnostics,
		errors,
		warnings,
	};
}

/**
 * Render pattern catalog diagnostics for CLI, sync, and doctor output.
 *
 * @param diagnostics Diagnostics returned from {@link validatePatternCatalog}.
 * @returns Human-readable lines with stable diagnostic codes.
 */
export function formatPatternCatalogDiagnostics(
	diagnostics: readonly PatternCatalogDiagnostic[],
): string {
	return diagnostics
		.map((diagnostic) => `- [${diagnostic.code}] ${diagnostic.message}`)
		.join("\n");
}
