const PACKAGE_MANAGER_DATA = [
	{
		id: "bun",
		label: "Bun",
		packageManagerField: "bun@1.3.10",
		installCommand: "bun install",
		frozenInstallCommand: "bun install --frozen-lockfile",
	},
	{
		id: "npm",
		label: "npm",
		packageManagerField: "npm@11.6.1",
		installCommand: "npm install",
		frozenInstallCommand: "npm ci",
	},
	{
		id: "pnpm",
		label: "pnpm",
		packageManagerField: "pnpm@8.3.1",
		installCommand: "pnpm install",
		frozenInstallCommand: "pnpm install --frozen-lockfile",
	},
	{
		id: "yarn",
		label: "Yarn",
		packageManagerField: "yarn@3.2.4",
		installCommand: "yarn install",
		frozenInstallCommand: "yarn install --frozen-lockfile",
	},
];

export const PACKAGE_MANAGER_IDS = PACKAGE_MANAGER_DATA.map((manager) => manager.id);
export const PACKAGE_MANAGERS = Object.freeze(
	Object.fromEntries(PACKAGE_MANAGER_DATA.map((manager) => [manager.id, manager])),
);

const DEV_INSTALL_FLAGS = {
	bun: "add -d",
	npm: "install --save-dev",
	pnpm: "add -D",
	yarn: "add -D",
};

const STOP_CHARS = new Set(["\n", "\r", "`", "\"", "'", ")", "]", "}", "!", ",", "."]);

export function getPackageManager(id) {
	const manager = PACKAGE_MANAGERS[id];
	if (!manager) {
		throw new Error(
			`Unknown package manager "${id}". Expected one of: ${PACKAGE_MANAGER_IDS.join(", ")}`,
		);
	}
	return manager;
}

export function getPackageManagerSelectOptions() {
	return PACKAGE_MANAGER_DATA.map((manager) => ({
		label: manager.label,
		value: manager.id,
		hint: manager.installCommand,
	}));
}

export function formatRunScript(packageManagerId, scriptName, extraArgs = "") {
	const args = extraArgs.trim();

	if (packageManagerId === "bun") {
		return args ? `bun run ${scriptName} ${args}` : `bun run ${scriptName}`;
	}
	if (packageManagerId === "npm") {
		return args ? `npm run ${scriptName} -- ${args}` : `npm run ${scriptName}`;
	}
	if (packageManagerId === "pnpm") {
		return args ? `pnpm run ${scriptName} -- ${args}` : `pnpm run ${scriptName}`;
	}

	return args ? `yarn run ${scriptName} ${args}` : `yarn run ${scriptName}`;
}

export function formatInstallCommand(packageManagerId) {
	return getPackageManager(packageManagerId).installCommand;
}

function consumeCommandArguments(content, startIndex) {
	let cursor = startIndex;
	let args = "";

	while (cursor < content.length) {
		const current = content[cursor];
		if (
			STOP_CHARS.has(current) ||
			content.startsWith("&&", cursor) ||
			content.startsWith("||", cursor) ||
			current === ";"
		) {
			break;
		}

		args += current;
		cursor += 1;
	}

	return {
		args: args.trim(),
		cursor,
	};
}

function replaceBunRunCommands(content, packageManagerId) {
	const marker = "bun run ";
	let result = "";
	let cursor = 0;

	while (cursor < content.length) {
		const index = content.indexOf(marker, cursor);
		if (index === -1) {
			result += content.slice(cursor);
			break;
		}

		if (index > 0 && /[A-Za-z0-9_-]/.test(content[index - 1])) {
			result += content.slice(cursor, index + marker.length);
			cursor = index + marker.length;
			continue;
		}

		result += content.slice(cursor, index);
		const scriptNameStart = index + marker.length;
		const scriptNameMatch = /^[A-Za-z0-9:_-]+/.exec(content.slice(scriptNameStart));
		if (!scriptNameMatch) {
			result += marker;
			cursor = scriptNameStart;
			continue;
		}

		const scriptName = scriptNameMatch[0];
		const argsStart = scriptNameStart + scriptName.length;
		const { args, cursor: nextCursor } = consumeCommandArguments(content, argsStart);
		result += formatRunScript(packageManagerId, scriptName, args);
		cursor = nextCursor;
	}

	return result;
}

function replaceDevDependencyInstalls(content, packageManagerId) {
	return content.replace(/\bbun add -d ([^\s&|;`"'()]+)\b/g, (_, packageName) => {
		if (packageManagerId === "bun") {
			return `bun add -d ${packageName}`;
		}

		return `${packageManagerId} ${DEV_INSTALL_FLAGS[packageManagerId]} ${packageName}`;
	});
}

export function transformPackageManagerText(content, packageManagerId) {
	const manager = getPackageManager(packageManagerId);

	return replaceDevDependencyInstalls(
		replaceBunRunCommands(
			content
				.replace(/\bbun install --frozen-lockfile\b/g, manager.frozenInstallCommand)
				.replace(/\bbun install\b/g, manager.installCommand),
			packageManagerId,
		),
		packageManagerId,
	)
		.replace(/\s*&&\s*/g, " && ")
		.replace(/\s*\|\|\s*/g, " || ");
}
