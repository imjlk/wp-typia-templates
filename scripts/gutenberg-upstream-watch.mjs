#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	BLOCK_TYPES_REGISTRATION_PEER_BASELINE,
} from './validate-package-manifest-policy.mjs';

export const GUTENBERG_UPSTREAM_WATCH_POLICY = Object.freeze({
	cadence: 'weekly',
	defaultLookbackDays: 14,
	defaultMaxResultsPerQuery: 5,
	issueNumber: 283,
	upstream: Object.freeze({
		owner: 'WordPress',
		repo: 'gutenberg',
		ref: 'trunk',
	}),
	trackedPackagePaths: Object.freeze({
		'@wordpress/block-editor': 'packages/block-editor/package.json',
		'@wordpress/blocks': 'packages/blocks/package.json',
		'@wordpress/data': 'packages/data/package.json',
	}),
	localTemplatePinFiles: Object.freeze([
		'examples/compound-patterns/package.json',
		'examples/my-typia-block/package.json',
		'examples/persistence-examples/package.json',
		'packages/create-workspace-template/package.json.mustache',
		'packages/wp-typia-project-tools/templates/_shared/base/package.json.mustache',
		'packages/wp-typia-project-tools/templates/_shared/compound/core/package.json.mustache',
		'packages/wp-typia-project-tools/templates/_shared/compound/persistence/package.json.mustache',
		'packages/wp-typia-project-tools/templates/_shared/persistence/core/package.json.mustache',
		'packages/wp-typia-project-tools/templates/interactivity/package.json.mustache',
	]),
	areas: Object.freeze([
		Object.freeze({
			id: 'blocks-registration',
			issueTerms: Object.freeze([
				'"@wordpress/blocks"',
				'registerBlockType',
				'"block.json"',
			]),
			title: 'Block registration types',
		}),
		Object.freeze({
			id: 'block-editor-components',
			issueTerms: Object.freeze([
				'"@wordpress/block-editor"',
				'InspectorControls',
				'useBlockProps',
			]),
			title: 'Block editor component types',
		}),
		Object.freeze({
			id: 'data-store-types',
			issueTerms: Object.freeze([
				'"@wordpress/data"',
				'useSelect',
				'createReduxStore',
			]),
			title: 'Data store types',
		}),
	]),
	workflowFile: '.github/workflows/gutenberg-upstream-watch.yml',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');
const REPORT_MARKER = '<!-- gutenberg-upstream-watch -->';

function parseIntegerOption(value, optionName) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error(`${optionName} must be a positive integer, received ${JSON.stringify(value)}.`);
	}

	return parsed;
}

export function parseArgs(argv) {
	const options = {
		jsonFile: null,
		lookbackDays: GUTENBERG_UPSTREAM_WATCH_POLICY.defaultLookbackDays,
		maxResultsPerQuery: GUTENBERG_UPSTREAM_WATCH_POLICY.defaultMaxResultsPerQuery,
		reportFile: null,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === '--lookback-days') {
			options.lookbackDays = parseIntegerOption(argv[++index], '--lookback-days');
			continue;
		}

		if (argument === '--max-results') {
			options.maxResultsPerQuery = parseIntegerOption(argv[++index], '--max-results');
			continue;
		}

		if (argument === '--report-file') {
			options.reportFile = argv[++index] ?? null;
			continue;
		}

		if (argument === '--json-file') {
			options.jsonFile = argv[++index] ?? null;
			continue;
		}

		throw new Error(`Unknown argument: ${argument}`);
	}

	return options;
}

function toIsoDate(date) {
	return date.toISOString().slice(0, 10);
}

function daysAgo(days, now = new Date()) {
	const copy = new Date(now);
	copy.setUTCDate(copy.getUTCDate() - days);
	return copy;
}

function authHeaders(token) {
	const headers = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'wp-typia-gutenberg-upstream-watch',
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}

async function githubJson(url, token) {
	const response = await fetch(url, {
		headers: authHeaders(token),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`GitHub request failed (${response.status}) for ${url}: ${body}`);
	}

	return response.json();
}

function normalizeSearchItem(item) {
	return {
		number: item.number,
		state: item.state,
		title: item.title,
		updatedAt: item.updated_at,
		url: item.html_url,
	};
}

export function buildSearchQuery(area, itemType, sinceDate) {
	return [
		`repo:${GUTENBERG_UPSTREAM_WATCH_POLICY.upstream.owner}/${GUTENBERG_UPSTREAM_WATCH_POLICY.upstream.repo}`,
		`is:${itemType}`,
		`updated:>=${sinceDate}`,
		`(${area.issueTerms.join(' OR ')})`,
	].join(' ');
}

async function searchAreaActivity(area, itemType, sinceDate, token, maxResultsPerQuery) {
	const url = new URL('https://api.github.com/search/issues');
	url.searchParams.set('order', 'desc');
	url.searchParams.set('per_page', String(maxResultsPerQuery));
	url.searchParams.set('q', buildSearchQuery(area, itemType, sinceDate));
	url.searchParams.set('sort', 'updated');

	const data = await githubJson(url, token);
	return (data.items ?? []).map(normalizeSearchItem);
}

async function fetchUpstreamPackageVersion(packageName, packagePath, token) {
	const url = new URL(
		`https://api.github.com/repos/${GUTENBERG_UPSTREAM_WATCH_POLICY.upstream.owner}/${GUTENBERG_UPSTREAM_WATCH_POLICY.upstream.repo}/contents/${packagePath}`,
	);
	url.searchParams.set('ref', GUTENBERG_UPSTREAM_WATCH_POLICY.upstream.ref);

	const data = await githubJson(url, token);
	const sourceText = Buffer.from(data.content, data.encoding).toString('utf8');
	const packageJson = JSON.parse(sourceText);

	return {
		name: packageName,
		path: packagePath,
		version: packageJson.version,
	};
}

function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractDependencySpec(sourceText, packageName) {
	const pattern = new RegExp(
		`["']${escapeRegex(packageName)}["']\\s*:\\s*["']([^"']+)["']`,
	);
	const match = sourceText.match(pattern);
	return match?.[1] ?? null;
}

export function collectLocalDependencyPins(repoRoot, packageName, relativePaths) {
	const pins = [];

	for (const relativePath of relativePaths) {
		const absolutePath = path.join(repoRoot, relativePath);
		if (!fs.existsSync(absolutePath)) {
			continue;
		}

		const spec = extractDependencySpec(
			fs.readFileSync(absolutePath, 'utf8'),
			packageName,
		);
		if (!spec) {
			continue;
		}

		pins.push({
			path: relativePath,
			spec,
		});
	}

	return pins;
}

function summarizePins(pins) {
	const uniqueSpecs = [...new Set(pins.map((pin) => pin.spec))].sort();
	return {
		allAligned: uniqueSpecs.length <= 1,
		uniqueSpecs,
	};
}

export function evaluateBlocksVersionDrift(localSpec, upstreamVersion) {
	const expectedSpec = `^${upstreamVersion}`;
	return {
		expectedSpec,
		hasDrift: localSpec !== expectedSpec,
		localSpec,
		upstreamVersion,
	};
}

export function renderWatchReport(report) {
	const lines = [
		'# Gutenberg Upstream TypeScript Watch',
		'',
		`- Generated at: ${report.generatedAt}`,
		`- Cadence: ${report.cadence}`,
		`- Lookback window: ${report.lookbackDays} days (since ${report.sinceDate})`,
		`- Tracking issue: #${report.issueNumber}`,
		'',
		'## Current upstream package versions',
		'',
	];

	for (const packageVersion of report.upstreamPackageVersions) {
		lines.push(`- \`${packageVersion.name}\`: \`${packageVersion.version}\``);
	}

	lines.push('', '## Local generated-project dependency baseline', '');
	lines.push(
		`- Canonical \`@wordpress/blocks\` owner: \`${report.localBlocksBaseline.owner}\` -> \`${report.localBlocksBaseline.spec}\``,
	);
	lines.push(
		`- Generated-project \`@wordpress/blocks\` pins: ${report.localBlocksPinsSummary.allAligned ? `aligned at \`${report.localBlocksPinsSummary.uniqueSpecs[0] ?? 'n/a'}\`` : report.localBlocksPinsSummary.uniqueSpecs.map((spec) => `\`${spec}\``).join(', ')}`,
	);
	lines.push(
		`- Generated-project \`@wordpress/block-editor\` pins: ${report.localBlockEditorPinsSummary.allAligned ? `aligned at \`${report.localBlockEditorPinsSummary.uniqueSpecs[0] ?? 'n/a'}\`` : report.localBlockEditorPinsSummary.uniqueSpecs.map((spec) => `\`${spec}\``).join(', ')}`,
	);
	lines.push('', '## Compatibility signal', '');

	if (report.blocksVersionDrift.hasDrift) {
		lines.push(
			`- Version drift detected: local \`${report.blocksVersionDrift.localSpec}\` vs upstream \`${report.blocksVersionDrift.expectedSpec}\`. Review whether generated-project pins should move.`,
		);
	} else {
		lines.push(
			`- No \`@wordpress/blocks\` pin drift detected. Local baseline \`${report.blocksVersionDrift.localSpec}\` matches upstream \`${report.blocksVersionDrift.expectedSpec}\`.`,
		);
	}

	for (const area of report.areaActivity) {
		lines.push('', `## ${area.title}`, '', '### Recent pull requests', '');
		if (area.pullRequests.length === 0) {
			lines.push('- None found in the current lookback window.');
		} else {
			for (const item of area.pullRequests) {
				lines.push(
					`- [#${item.number}](${item.url}) ${item.title} (${item.state}, updated ${item.updatedAt.slice(0, 10)})`,
				);
			}
		}

		lines.push('', '### Recent issues', '');
		if (area.issues.length === 0) {
			lines.push('- None found in the current lookback window.');
		} else {
			for (const item of area.issues) {
				lines.push(
					`- [#${item.number}](${item.url}) ${item.title} (${item.state}, updated ${item.updatedAt.slice(0, 10)})`,
				);
			}
		}
	}

	lines.push(
		'',
		'## Follow-up path',
		'',
		'- Review this report in issue #283 or the uploaded workflow artifact.',
		'- If package-version drift or an upstream TypeScript change affects local facades, generated-project compatibility, or helper assumptions, open or refresh a normal follow-up issue/PR in this repository.',
		'- Keep release work on `main`/`release/sampo`; do not patch the release branch directly from this watch lane.',
	);

	return `${lines.join('\n')}\n`;
}

export async function generateGutenbergUpstreamWatchReport({
	lookbackDays = GUTENBERG_UPSTREAM_WATCH_POLICY.defaultLookbackDays,
	maxResultsPerQuery = GUTENBERG_UPSTREAM_WATCH_POLICY.defaultMaxResultsPerQuery,
	now = new Date(),
	repoRoot = DEFAULT_REPO_ROOT,
	token = process.env.GUTENBERG_UPSTREAM_TOKEN ?? process.env.GH_TOKEN ?? null,
} = {}) {
	const sinceDate = toIsoDate(daysAgo(lookbackDays, now));

	const upstreamPackageVersions = await Promise.all(
		Object.entries(GUTENBERG_UPSTREAM_WATCH_POLICY.trackedPackagePaths).map(
			([packageName, packagePath]) =>
				fetchUpstreamPackageVersion(packageName, packagePath, token),
		),
	);

	const areaActivity = await Promise.all(
		GUTENBERG_UPSTREAM_WATCH_POLICY.areas.map(async (area) => ({
			id: area.id,
			issues: await searchAreaActivity(
				area,
				'issue',
				sinceDate,
				token,
				maxResultsPerQuery,
			),
			pullRequests: await searchAreaActivity(
				area,
				'pr',
				sinceDate,
				token,
				maxResultsPerQuery,
			),
			title: area.title,
		})),
	);

	const localBlocksBaseline = {
		owner: 'scripts/validate-package-manifest-policy.mjs',
		spec: BLOCK_TYPES_REGISTRATION_PEER_BASELINE['@wordpress/blocks'],
	};
	const localBlocksPins = collectLocalDependencyPins(
		repoRoot,
		'@wordpress/blocks',
		GUTENBERG_UPSTREAM_WATCH_POLICY.localTemplatePinFiles,
	);
	const localBlockEditorPins = collectLocalDependencyPins(
		repoRoot,
		'@wordpress/block-editor',
		GUTENBERG_UPSTREAM_WATCH_POLICY.localTemplatePinFiles,
	);
	const upstreamBlocksVersion = upstreamPackageVersions.find(
		(item) => item.name === '@wordpress/blocks',
	)?.version;

	if (!upstreamBlocksVersion) {
		throw new Error('Unable to determine the upstream @wordpress/blocks version.');
	}

	const report = {
		areaActivity,
		blocksVersionDrift: evaluateBlocksVersionDrift(
			localBlocksBaseline.spec,
			upstreamBlocksVersion,
		),
		cadence: GUTENBERG_UPSTREAM_WATCH_POLICY.cadence,
		generatedAt: now.toISOString(),
		issueNumber: GUTENBERG_UPSTREAM_WATCH_POLICY.issueNumber,
		localBlockEditorPins,
		localBlockEditorPinsSummary: summarizePins(localBlockEditorPins),
		localBlocksBaseline,
		localBlocksPins,
		localBlocksPinsSummary: summarizePins(localBlocksPins),
		lookbackDays,
		reportMarker: REPORT_MARKER,
		sinceDate,
		upstreamPackageVersions,
	};

	return {
		markdown: renderWatchReport(report),
		report,
	};
}

function writeOutputFile(filePath, content) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, 'utf8');
}

export async function runCli({
	args = process.argv.slice(2),
	cwd = process.cwd(),
	env = process.env,
	stdout = process.stdout,
	stderr = process.stderr,
} = {}) {
	try {
		const options = parseArgs(args);
		const { markdown, report } = await generateGutenbergUpstreamWatchReport({
			lookbackDays: options.lookbackDays,
			maxResultsPerQuery: options.maxResultsPerQuery,
			repoRoot: cwd,
			token: env.GUTENBERG_UPSTREAM_TOKEN ?? env.GH_TOKEN ?? null,
		});

		if (options.reportFile) {
			writeOutputFile(options.reportFile, markdown);
		} else {
			stdout.write(markdown);
		}

		if (options.jsonFile) {
			writeOutputFile(
				options.jsonFile,
				`${JSON.stringify(report, null, 2)}\n`,
			);
		}

		return 0;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		stderr.write(`Failed to generate Gutenberg upstream watch report: ${message}\n`);
		return 1;
	}
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedPath === currentFilePath) {
	process.exitCode = await runCli();
}
