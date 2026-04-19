export const ARCHIVED_NPM_ENTRYPOINTS = Object.freeze([
	{
		deprecationRange: "*",
		description:
			"Archived npm entrypoint for wp-typia. Use npx wp-typia create <project-dir> or bunx wp-typia create <project-dir> instead.",
		keywords: Object.freeze([
			"wordpress",
			"gutenberg",
			"typia",
			"archived",
			"deprecated",
			"legacy",
			"initializer",
		]),
		packageDir: "packages/create-wp-typia",
		packageName: "create-wp-typia",
		private: true,
		replacementCommands: Object.freeze([
			"npx wp-typia create <project-dir>",
			"bunx wp-typia create <project-dir>",
		]),
	},
]);

export function getArchivedNpmEntrypoint(packageName) {
	return (
		ARCHIVED_NPM_ENTRYPOINTS.find((entry) => entry.packageName === packageName) ?? null
	);
}

export function renderArchivedNpmDeprecationMessage(entry) {
	const [primaryCommand, secondaryCommand] = entry.replacementCommands;

	return `${entry.packageName} is archived. Use \`${primaryCommand}\` or \`${secondaryCommand}\` instead.`;
}

function shellQuote(value) {
	return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

export function renderArchivedNpmDeprecationCommand(entry) {
	const packageSpec = `${entry.packageName}@${entry.deprecationRange}`;

	return `npm deprecate ${shellQuote(packageSpec)} ${shellQuote(renderArchivedNpmDeprecationMessage(entry))}`;
}

export function renderArchivedNpmDeprecationPlan(
	entries = ARCHIVED_NPM_ENTRYPOINTS,
) {
	const lines = ["Archived npm entrypoint deprecation plan:"];

	for (const entry of entries) {
		lines.push("");
		lines.push(`- ${entry.packageName}`);
		lines.push(`  ${renderArchivedNpmDeprecationCommand(entry)}`);
	}

	return lines.join("\n");
}
