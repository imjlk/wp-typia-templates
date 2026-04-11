export const VERSION_POLICY_PRIORITY = {
	patch: 0,
	minor: 1,
	major: 2,
};

export const RANGE_POLICY = {
	caret: "caret",
	exact: "exact",
};

export const RUNTIME_PACKAGE_COUPLINGS = [
	{
		dependencyName: "@wp-typia/api-client",
		dependentName: "@wp-typia/rest",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/api-client",
		dependentName: "@wp-typia/block-runtime",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/api-client",
		dependentName: "@wp-typia/project-tools",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/block-runtime",
		dependentName: "@wp-typia/project-tools",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/rest",
		dependentName: "@wp-typia/project-tools",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/block-types",
		dependentName: "@wp-typia/project-tools",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/project-tools",
		dependentName: "wp-typia",
		rangePolicy: RANGE_POLICY.exact,
	},
	{
		dependencyName: "@wp-typia/api-client",
		dependentName: "wp-typia",
		rangePolicy: RANGE_POLICY.caret,
	},
];

export const WORKSPACE_PROTOCOL_POLICY_EXCEPTIONS = [
	{
		dependencyName: "@wp-typia/api-client",
		dependentName: "@wp-typia/rest",
		rangePolicy: RANGE_POLICY.caret,
	},
	{
		dependencyName: "@wp-typia/block-runtime",
		dependentName: "@wp-typia/project-tools",
		rangePolicy: RANGE_POLICY.caret,
	},
];

export const RUNTIME_PACKAGE_NAMES = [
	...new Set(
		RUNTIME_PACKAGE_COUPLINGS.flatMap(({ dependencyName, dependentName }) => [
			dependencyName,
			dependentName,
		]),
	),
].sort();

function parseVersion(version) {
	const match = version.match(
		/^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)$/u,
	);
	if (!match?.groups) {
		throw new Error(`Unsupported semver version "${version}".`);
	}

	return {
		major: Number.parseInt(match.groups.major, 10),
		minor: Number.parseInt(match.groups.minor, 10),
		patch: Number.parseInt(match.groups.patch, 10),
	};
}

function compareParsedVersions(left, right) {
	if (left.major !== right.major) {
		return left.major - right.major;
	}
	if (left.minor !== right.minor) {
		return left.minor - right.minor;
	}
	return left.patch - right.patch;
}

export function compareVersions(left, right) {
	return compareParsedVersions(parseVersion(left), parseVersion(right));
}

export function bumpVersion(version, releaseType) {
	const parsed = parseVersion(version);

	switch (releaseType) {
		case "patch":
			return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
		case "minor":
			return `${parsed.major}.${parsed.minor + 1}.0`;
		case "major":
			return `${parsed.major + 1}.0.0`;
		default:
			throw new Error(`Unsupported release type "${releaseType}".`);
	}
}

export function renderPolicySpec(rangePolicy, version) {
	switch (rangePolicy) {
		case RANGE_POLICY.exact:
			return version;
		case RANGE_POLICY.caret:
			return `^${version}`;
		default:
			throw new Error(`Unsupported range policy "${rangePolicy}".`);
	}
}

export function isPolicySpec(rangePolicy, spec) {
	switch (rangePolicy) {
		case RANGE_POLICY.exact:
			return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(spec);
		case RANGE_POLICY.caret:
			return /^\^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(spec);
		default:
			return false;
	}
}

export function specAllowsVersion(spec, version, rangePolicy) {
	if (!isPolicySpec(rangePolicy, spec)) {
		return false;
	}

	if (rangePolicy === RANGE_POLICY.exact) {
		return spec === version;
	}

	let current;
	try {
		current = parseVersion(version);
	} catch {
		return false;
	}
	const base = parseVersion(spec.slice(1));

	if (compareParsedVersions(current, base) < 0) {
		return false;
	}

	if (base.major > 0) {
		return current.major === base.major;
	}

	if (base.minor > 0) {
		return current.major === 0 && current.minor === base.minor;
	}

	return current.major === 0 && current.minor === 0 && current.patch === base.patch;
}

export function getRequiredDependentReleaseType(
	dependencyCurrentVersion,
	dependencyNextVersion,
	rangePolicy,
) {
	if (dependencyCurrentVersion === dependencyNextVersion) {
		return null;
	}

	const currentPolicySpec = renderPolicySpec(rangePolicy, dependencyCurrentVersion);
	return specAllowsVersion(currentPolicySpec, dependencyNextVersion, rangePolicy)
		? null
		: "patch";
}
