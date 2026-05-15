import fs from "node:fs";
import path from "node:path";

import {
	type ParsedBlockPatternBlock,
	validateBlockPatternContentNesting,
} from "@wp-typia/block-runtime/metadata-core";

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
	| "invalid-pattern-section-role-convention"
	| "invalid-pattern-section-role-marker"
	| "invalid-pattern-slug"
	| "invalid-pattern-tag"
	| "invalid-pattern-thumbnail-url"
	| "mismatched-pattern-section-role"
	| "missing-pattern-content-file"
	| "missing-pattern-section-role"
	| "missing-pattern-section-role-marker"
	| "duplicate-pattern-section-role-marker"
	| "unknown-pattern-section-role-marker";

export type PatternCatalogDiagnostic = {
	code: PatternCatalogDiagnosticCode;
	message: string;
	patternSlug?: string;
	severity: PatternCatalogDiagnosticSeverity;
};

/**
 * Convention used to discover section role markers in serialized pattern
 * content. Defaults target `core/group` wrappers with a `section` base class,
 * `section--{role}` role class tokens, and `metadata.sectionRole` attributes.
 */
export type PatternCatalogSectionRoleConvention = {
	/**
	 * Serialized block name used as the section wrapper. Defaults to
	 * `core/group`.
	 */
	wrapperBlockName?: string;
	/**
	 * Optional class that marks a wrapper block as section-like even when the
	 * role marker is missing. Defaults to `section`.
	 */
	baseClassName?: string;
	/**
	 * Class token pattern where exactly one `{role}` placeholder is replaced by
	 * the section role slug. Defaults to `section--{role}`.
	 */
	roleClassNamePattern?: string;
	/**
	 * Dot-separated block attribute paths that can carry role slugs. Defaults to
	 * `metadata.sectionRole`.
	 */
	roleAttributePaths?: readonly string[];
	/**
	 * Warn when a full pattern repeats the same section role marker. Defaults to
	 * `false`.
	 */
	requireUniqueFullPatternRoles?: boolean;
};

/**
 * Section wrapper match extracted from a parsed WordPress block tree.
 */
export type PatternCatalogSectionRoleMatch = {
	blockName: string;
	blockPath: string;
	roles: readonly string[];
};

/**
 * Options for validating typed pattern catalog entries and, when `projectDir`
 * is provided, their serialized pattern content. Set `sectionRoleConvention` to
 * `false` to keep file existence checks but opt out of section-role marker
 * validation.
 */
export type PatternCatalogValidationOptions = {
	projectDir?: string;
	sectionRoleConvention?: PatternCatalogSectionRoleConvention | false;
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
const DEFAULT_SECTION_ROLE_CONVENTION = {
	baseClassName: "section",
	requireUniqueFullPatternRoles: false,
	roleAttributePaths: ["metadata.sectionRole"],
	roleClassNamePattern: "section--{role}",
	wrapperBlockName: "core/group",
} satisfies Required<PatternCatalogSectionRoleConvention>;

type NormalizedPatternCatalogSectionRoleConvention = Required<PatternCatalogSectionRoleConvention> & {
	roleClassNamePatternRegExp: RegExp;
};

type LocatedPatternSectionRole = {
	blockPath: string;
	role: string;
};

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

function normalizeSectionRoleConventionInput(
	convention: PatternCatalogSectionRoleConvention = {},
): Required<PatternCatalogSectionRoleConvention> {
	return {
		baseClassName:
			convention.baseClassName ??
			DEFAULT_SECTION_ROLE_CONVENTION.baseClassName,
		requireUniqueFullPatternRoles:
			convention.requireUniqueFullPatternRoles ??
			DEFAULT_SECTION_ROLE_CONVENTION.requireUniqueFullPatternRoles,
		roleAttributePaths:
			convention.roleAttributePaths ??
			DEFAULT_SECTION_ROLE_CONVENTION.roleAttributePaths,
		roleClassNamePattern:
			convention.roleClassNamePattern ??
			DEFAULT_SECTION_ROLE_CONVENTION.roleClassNamePattern,
		wrapperBlockName:
			convention.wrapperBlockName ??
			DEFAULT_SECTION_ROLE_CONVENTION.wrapperBlockName,
	};
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function createRoleClassNamePattern(pattern: string): RegExp {
	const parts = pattern.split("{role}");
	if (parts.length !== 2) {
		throw new Error(
			`roleClassNamePattern must contain exactly one "{role}" placeholder.`,
		);
	}

	return new RegExp(
		`^${escapeRegExp(parts[0] ?? "")}(?<role>\\S*)${escapeRegExp(parts[1] ?? "")}$`,
		"u",
	);
}

function normalizeSectionRoleConvention(
	convention: PatternCatalogSectionRoleConvention = {},
): NormalizedPatternCatalogSectionRoleConvention {
	const normalized = normalizeSectionRoleConventionInput(convention);
	return {
		...normalized,
		roleClassNamePatternRegExp: createRoleClassNamePattern(
			normalized.roleClassNamePattern,
		),
	};
}

function getClassNameTokens(attributes: Record<string, unknown>): string[] {
	const className = attributes.className;
	if (typeof className !== "string") {
		return [];
	}

	return className.split(/\s+/u).filter((token) => token.length > 0);
}

function getAttributePathValue(
	attributes: Record<string, unknown>,
	pathName: string,
): unknown {
	return pathName.split(".").reduce<unknown>((current, segment) => {
		if (
			current !== null &&
			typeof current === "object" &&
			!Array.isArray(current) &&
			Object.prototype.hasOwnProperty.call(current, segment)
		) {
			return (current as Record<string, unknown>)[segment];
		}

		return undefined;
	}, attributes);
}

function collectStringValues(value: unknown): string[] {
	if (typeof value === "string") {
		return [value];
	}
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string");
	}

	return [];
}

function uniqueValues(values: readonly string[]): string[] {
	return [...new Set(values)];
}

function formatRoleList(roles: readonly string[]): string {
	if (roles.length === 0) {
		return "none";
	}

	return roles.map((role) => `"${role}"`).join(", ");
}

function formatBlockPaths(paths: readonly string[]): string {
	return paths.map((blockPath) => `at ${blockPath}`).join(", ");
}

function describeRoleMarkerConvention(
	convention: NormalizedPatternCatalogSectionRoleConvention,
): string {
	return `${convention.wrapperBlockName} wrappers with class "${convention.roleClassNamePattern}" or attributes ${convention.roleAttributePaths.join(", ")}`;
}

function isSectionWrapperCandidate(
	block: ParsedBlockPatternBlock,
	roles: readonly string[],
	convention: NormalizedPatternCatalogSectionRoleConvention,
): boolean {
	if (block.blockName !== convention.wrapperBlockName) {
		return false;
	}
	if (roles.length > 0) {
		return true;
	}

	return getClassNameTokens(block.attributes).includes(convention.baseClassName);
}

function collectSectionRoleMatches(
	blocks: readonly ParsedBlockPatternBlock[],
	convention: NormalizedPatternCatalogSectionRoleConvention,
	pathSegments: readonly string[] = [],
): PatternCatalogSectionRoleMatch[] {
	return blocks.flatMap((block, index) => {
		const blockPathSegments = [
			...pathSegments,
			`${block.blockName}[${index}]`,
		];
		const blockPath = blockPathSegments.join(" > ");
		const roles = extractPatternSectionRolesFromAttributes(
			block.attributes,
			convention,
		);
		const matches = isSectionWrapperCandidate(block, roles, convention)
			? [
					{
						blockName: block.blockName,
						blockPath,
						roles,
					},
				]
			: [];

		return [
			...matches,
			...collectSectionRoleMatches(
				block.innerBlocks,
				convention,
				blockPathSegments,
			),
		];
	});
}

function unescapeSerializedBlockCommentJsonQuotes(content: string): string {
	return content.replace(/<!--([\s\S]*?)-->/gu, (comment, body: string) => {
		const source = body.trim();
		if (!source.startsWith("wp:") && !source.startsWith("/wp:")) {
			return comment;
		}

		return `<!--${body.replace(/\\"/gu, '"')}-->`;
	});
}

/**
 * Extract section role slugs from serialized block attributes using the
 * configured class and metadata marker convention.
 *
 * @param attributes Parsed block attributes from serialized pattern content.
 * @param convention Optional marker convention override.
 * @returns Unique role marker values in discovery order.
 */
export function extractPatternSectionRolesFromAttributes(
	attributes: Record<string, unknown>,
	convention: PatternCatalogSectionRoleConvention = {},
): string[] {
	const normalized = normalizeSectionRoleConvention(convention);
	const classRoles = getClassNameTokens(attributes)
		.map((token) => normalized.roleClassNamePatternRegExp.exec(token)?.groups?.role)
		.filter((role): role is string => typeof role === "string");
	const attributeRoles = normalized.roleAttributePaths.flatMap((pathName) =>
		collectStringValues(getAttributePathValue(attributes, pathName)),
	);

	return uniqueValues([...classRoles, ...attributeRoles]);
}

/**
 * Find section wrapper blocks and their role markers in parsed pattern content.
 *
 * @param blocks Parsed block tree returned by `validateBlockPatternContentNesting`.
 * @param convention Optional marker convention override.
 * @returns Section wrapper matches with serialized block paths.
 */
export function extractPatternSectionRoleMatches(
	blocks: readonly ParsedBlockPatternBlock[],
	convention: PatternCatalogSectionRoleConvention = {},
): PatternCatalogSectionRoleMatch[] {
	return collectSectionRoleMatches(
		blocks,
		normalizeSectionRoleConvention(convention),
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

function createKnownSectionRoleSet(
	patterns: readonly PatternCatalogEntry[],
): ReadonlySet<string> {
	return new Set(
		patterns
			.map((pattern) => pattern.sectionRole)
			.filter(
				(sectionRole): sectionRole is string =>
					typeof sectionRole === "string" &&
					PATTERN_SECTION_ROLE_PATTERN.test(sectionRole),
			),
	);
}

function validatePatternContentSectionRoles({
	content,
	contentFile,
	convention,
	knownSectionRoles,
	label,
	pattern,
}: {
	content: string;
	contentFile: string;
	convention: NormalizedPatternCatalogSectionRoleConvention;
	knownSectionRoles: ReadonlySet<string>;
	label: string;
	pattern: PatternCatalogEntry;
}): PatternCatalogDiagnostic[] {
	const diagnostics: PatternCatalogDiagnostic[] = [];
	const parsed = validateBlockPatternContentNesting(content, {
		allowExternalBlockNames: true,
		nesting: {},
		patternFile: contentFile,
	});
	let matches = collectSectionRoleMatches(parsed.blocks, convention);
	const unescapedContent = unescapeSerializedBlockCommentJsonQuotes(content);
	if (unescapedContent !== content) {
		const unescapedParsed = validateBlockPatternContentNesting(
			unescapedContent,
			{
				allowExternalBlockNames: true,
				nesting: {},
				patternFile: contentFile,
			},
		);
		const unescapedMatches = collectSectionRoleMatches(
			unescapedParsed.blocks,
			convention,
		);
		if (
			unescapedMatches.some((match) => match.roles.length > 0) ||
			matches.length === 0
		) {
			matches = unescapedMatches;
		}
	}
	const locatedRoles = matches.flatMap<LocatedPatternSectionRole>((match) =>
		match.roles.map((role) => ({
			blockPath: match.blockPath,
			role,
		})),
	);
	const invalidRoles = locatedRoles.filter(
		({ role }) => !PATTERN_SECTION_ROLE_PATTERN.test(role),
	);
	for (const invalidRole of uniqueValues(invalidRoles.map(({ role }) => role))) {
		const paths = invalidRoles
			.filter(({ role }) => role === invalidRole)
			.map(({ blockPath }) => blockPath);
		diagnostics.push(
			createPatternCatalogDiagnostic({
				code: "invalid-pattern-section-role-marker",
				message: `${label}: section role marker "${invalidRole}" in ${contentFile} must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens (${formatBlockPaths(paths)}).`,
				patternSlug: pattern.slug,
				severity: "error",
			}),
		);
	}

	const validLocatedRoles = locatedRoles.filter(({ role }) =>
		PATTERN_SECTION_ROLE_PATTERN.test(role),
	);
	const validRoles = validLocatedRoles.map(({ role }) => role);
	const uniqueValidRoles = uniqueValues(validRoles);
	const unknownRoles = uniqueValidRoles.filter(
		(role) => !knownSectionRoles.has(role),
	);
	for (const unknownRole of unknownRoles) {
		const paths = validLocatedRoles
			.filter(({ role }) => role === unknownRole)
			.map(({ blockPath }) => blockPath);
		diagnostics.push(
			createPatternCatalogDiagnostic({
				code: "unknown-pattern-section-role-marker",
				message: `${label}: section role marker "${unknownRole}" in ${contentFile} is not declared by any PATTERNS sectionRole (${formatBlockPaths(paths)}).`,
				patternSlug: pattern.slug,
				severity: "warning",
			}),
		);
	}

	const scope = pattern.scope ?? "full";
	const expectedSectionRole =
		typeof pattern.sectionRole === "string" &&
		PATTERN_SECTION_ROLE_PATTERN.test(pattern.sectionRole)
			? pattern.sectionRole
			: undefined;
	if (scope === "section" && expectedSectionRole) {
		if (validRoles.length === 0) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "missing-pattern-section-role-marker",
					message: `${label}: section-scoped pattern content in ${contentFile} must include section role marker "${expectedSectionRole}" using ${describeRoleMarkerConvention(convention)}.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		} else if (!validRoles.includes(expectedSectionRole)) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "mismatched-pattern-section-role",
					message: `${label}: manifest sectionRole "${expectedSectionRole}" was not found in ${contentFile}; found ${formatRoleList(uniqueValidRoles)}.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
		}
	}

	if (scope === "full" && convention.requireUniqueFullPatternRoles) {
		for (const role of uniqueValidRoles) {
			const paths = validLocatedRoles
				.filter((locatedRole) => locatedRole.role === role)
				.map(({ blockPath }) => blockPath);
			if (paths.length <= 1) {
				continue;
			}
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "duplicate-pattern-section-role-marker",
					message: `${label}: full pattern content in ${contentFile} repeats section role marker "${role}" (${formatBlockPaths(paths)}).`,
					patternSlug: pattern.slug,
					severity: "warning",
				}),
			);
		}
	}

	return diagnostics;
}

/**
 * Validate typed pattern catalog metadata declared in `scripts/block-config.ts`.
 *
 * The validator checks catalog shape, duplicate slugs, optional section-role
 * rules, safe content file paths, and missing files when a workspace root is
 * provided. With a workspace root, it also parses serialized block markup and
 * compares section role markers against the catalog manifest.
 *
 * @param patterns Pattern catalog entries to validate.
 * @param options Optional project root and section role marker convention.
 * @returns Structured diagnostics split into errors and warnings.
 */
export function validatePatternCatalog(
	patterns: readonly PatternCatalogEntry[],
	options: PatternCatalogValidationOptions = {},
): PatternCatalogValidationResult {
	const diagnostics: PatternCatalogDiagnostic[] = [];
	const seenSlugs = new Map<string, number>();
	let sectionRoleConvention: NormalizedPatternCatalogSectionRoleConvention | null =
		null;
	if (options.sectionRoleConvention !== false) {
		try {
			sectionRoleConvention = normalizeSectionRoleConvention(
				options.sectionRoleConvention,
			);
		} catch (error) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "invalid-pattern-section-role-convention",
					message: `sectionRoleConvention.roleClassNamePattern is invalid: ${
						error instanceof Error ? error.message : String(error)
					}`,
					severity: "error",
				}),
			);
		}
	}
	const knownSectionRoles = createKnownSectionRoleSet(patterns);

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
		if (!options.projectDir) {
			continue;
		}

		const absoluteContentFile = path.join(options.projectDir, contentFile);
		if (!fs.existsSync(absoluteContentFile)) {
			diagnostics.push(
				createPatternCatalogDiagnostic({
					code: "missing-pattern-content-file",
					message: `${label}: missing pattern content file ${contentFile}.`,
					patternSlug: pattern.slug,
					severity: "error",
				}),
			);
			continue;
		}

		if (sectionRoleConvention) {
			let content: string;
			try {
				content = fs.readFileSync(absoluteContentFile, "utf8");
			} catch (error) {
				diagnostics.push(
					createPatternCatalogDiagnostic({
						code: "invalid-pattern-content-file",
						message: `${label}: failed to read pattern content file ${contentFile}: ${
							error instanceof Error ? error.message : String(error)
						}.`,
						patternSlug: pattern.slug,
						severity: "error",
					}),
				);
				continue;
			}

			diagnostics.push(
				...validatePatternContentSectionRoles({
					content,
					contentFile,
					convention: sectionRoleConvention,
					knownSectionRoles,
					label,
					pattern,
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
