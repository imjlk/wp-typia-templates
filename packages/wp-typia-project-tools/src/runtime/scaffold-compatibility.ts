/**
 * Compatibility policy helpers for generated scaffold outputs.
 *
 * The policy keeps plugin headers, runtime gates, and workspace inventory
 * metadata aligned when optional or required AI-capable features are added.
 */
import {
	AI_FEATURE_DEFINITIONS,
	type AiFeatureCapabilitySelection,
	type AiFeatureCompatibilityFloor,
	type ResolvedAiFeatureCapability,
	type ResolvedAiFeatureCapabilityPlan,
	resolveAiFeatureCapabilityPlan,
} from "./ai-feature-capability.js";

/**
 * WordPress plugin header version floors emitted by scaffold templates.
 */
export interface ScaffoldPluginHeaderCompatibility {
	requiresAtLeast: string;
	requiresPhp: string;
	testedUpTo: string;
}

/**
 * Resolved compatibility policy for a set of scaffold feature capabilities.
 */
export interface ScaffoldCompatibilityPolicy {
	capabilityPlan: ResolvedAiFeatureCapabilityPlan;
	pluginHeader: ScaffoldPluginHeaderCompatibility;
}

/**
 * Serializable compatibility metadata stored in generated workspace inventory.
 */
export interface ScaffoldCompatibilityConfig {
	hardMinimums: AiFeatureCompatibilityFloor;
	mode: "baseline" | "optional" | "required";
	optionalFeatures: string[];
	requiredFeatures: string[];
	runtimeGates: string[];
}

/**
 * Baseline headers used by scaffold output before optional features are added.
 */
export const DEFAULT_SCAFFOLD_COMPATIBILITY: ScaffoldPluginHeaderCompatibility = {
	requiresAtLeast: "6.7",
	requiresPhp: "8.0",
	testedUpTo: "6.9",
};

/**
 * Optional WordPress AI Client surface used by server-only AI feature scaffold.
 */
export const OPTIONAL_WORDPRESS_AI_CLIENT_COMPATIBILITY: readonly AiFeatureCapabilitySelection[] =
	[
		{
			featureId: AI_FEATURE_DEFINITIONS.wordpressAiClient.id,
			mode: "optional",
		},
	];

/**
 * Required Abilities API surface used by typed workflow ability scaffold.
 */
export const REQUIRED_WORKSPACE_ABILITY_COMPATIBILITY: readonly AiFeatureCapabilitySelection[] =
	[
		{
			featureId: AI_FEATURE_DEFINITIONS.wordpressServerAbilities.id,
			mode: "required",
		},
		{
			featureId: AI_FEATURE_DEFINITIONS.wordpressCoreAbilities.id,
			mode: "required",
		},
	];

function parseVersionFloorParts(value: string): number[] {
	return value.split(".").map((part, index) => {
		if (!/^\d+$/u.test(part)) {
			throw new Error(
				`parseVersionFloorParts received an invalid version floor "${value}" at segment ${index + 1}.`,
			);
		}
		return Number.parseInt(part, 10);
	});
}

function compareVersionFloors(left: string, right: string): number {
	const leftParts = parseVersionFloorParts(left);
	const rightParts = parseVersionFloorParts(right);
	const length = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < length; index += 1) {
		const leftValue = leftParts[index] ?? 0;
		const rightValue = rightParts[index] ?? 0;
		if (leftValue > rightValue) {
			return 1;
		}
		if (leftValue < rightValue) {
			return -1;
		}
	}

	return 0;
}

function pickHigherVersionFloor(current: string, candidate: string | undefined): string {
	if (!candidate) {
		return current;
	}

	return compareVersionFloors(current, candidate) >= 0 ? current : candidate;
}

function pickHigherHeaderVersionFloor(policyValue: string, currentValue: string): string {
	const normalizedCurrentValue = currentValue.trim();
	if (!normalizedCurrentValue) {
		return policyValue;
	}

	try {
		return pickHigherVersionFloor(policyValue, normalizedCurrentValue);
	} catch {
		return policyValue;
	}
}

function formatRuntimeGate(feature: ResolvedAiFeatureCapability): string[] {
	return (feature.runtimeGates ?? []).map(
		(gate) => `${feature.label}: ${gate.kind} ${gate.value}`,
	);
}

function getPolicyMode(
	capabilityPlan: ResolvedAiFeatureCapabilityPlan,
): ScaffoldCompatibilityConfig["mode"] {
	if (capabilityPlan.requiredFeatures.length > 0) {
		return "required";
	}
	if (capabilityPlan.optionalFeatures.length > 0) {
		return "optional";
	}
	return "baseline";
}

/**
 * Resolve plugin header floors and capability gates for scaffold selections.
 */
export function resolveScaffoldCompatibilityPolicy(
	selections: readonly AiFeatureCapabilitySelection[],
	{
		baseline = DEFAULT_SCAFFOLD_COMPATIBILITY,
	}: {
		baseline?: ScaffoldPluginHeaderCompatibility;
	} = {},
): ScaffoldCompatibilityPolicy {
	const capabilityPlan = resolveAiFeatureCapabilityPlan(selections);
	const requiresAtLeast = pickHigherVersionFloor(
		baseline.requiresAtLeast,
		capabilityPlan.hardMinimums.wordpress,
	);
	const requiresPhp = pickHigherVersionFloor(
		baseline.requiresPhp,
		capabilityPlan.hardMinimums.php,
	);
	const testedUpTo = pickHigherVersionFloor(baseline.testedUpTo, requiresAtLeast);

	return {
		capabilityPlan,
		pluginHeader: {
			requiresAtLeast,
			requiresPhp,
			testedUpTo,
		},
	};
}

/**
 * Convert a resolved policy into workspace-inventory-safe JSON metadata.
 */
export function createScaffoldCompatibilityConfig(
	policy: ScaffoldCompatibilityPolicy,
): ScaffoldCompatibilityConfig {
	const { capabilityPlan } = policy;

	return {
		hardMinimums: capabilityPlan.hardMinimums,
		mode: getPolicyMode(capabilityPlan),
		optionalFeatures: capabilityPlan.optionalFeatures.map((feature) => feature.label),
		requiredFeatures: capabilityPlan.requiredFeatures.map((feature) => feature.label),
		runtimeGates: [
			...capabilityPlan.requiredFeatures.flatMap(formatRuntimeGate),
			...capabilityPlan.optionalFeatures.flatMap(formatRuntimeGate),
		],
	};
}

/**
 * Render compatibility metadata as formatted TypeScript object literal JSON.
 */
export function renderScaffoldCompatibilityConfig(
	policy: ScaffoldCompatibilityPolicy,
	indent = "\t\t",
): string {
	const config = createScaffoldCompatibilityConfig(policy);

	return JSON.stringify(config, null, "\t")
		.split("\n")
		.map((line, index) => (index === 0 ? line : `${indent}${line}`))
		.join("\n");
}

function replacePluginHeaderVersionFloor(
	source: string,
	pattern: RegExp,
	policyValue: string,
): string {
	return source.replace(
		pattern,
		(_match, prefix: string, currentValue: string, lineEnding: string) => {
			const versionPrefix = prefix.endsWith(":") ? `${prefix} ` : prefix;
			return `${versionPrefix}${pickHigherHeaderVersionFloor(
				policyValue,
				currentValue,
			)}${lineEnding}`;
		},
	);
}

/**
 * Patch a generated plugin bootstrap header without lowering custom floors.
 *
 * Preserves the original header line endings while replacing empty or invalid
 * version strings with the policy values.
 */
export function updatePluginHeaderCompatibility(
	source: string,
	policy: ScaffoldCompatibilityPolicy,
): string {
	const { pluginHeader } = policy;

	const nextSource = replacePluginHeaderVersionFloor(
		source,
		/(\* Requires at least:[^\S\r\n]*)([^\r\n]*)(\r?)/u,
		pluginHeader.requiresAtLeast,
	);
	const nextSourceWithTestedUpTo = replacePluginHeaderVersionFloor(
		nextSource,
		/(\* Tested up to:[^\S\r\n]*)([^\r\n]*)(\r?)/u,
		pluginHeader.testedUpTo,
	);
	return replacePluginHeaderVersionFloor(
		nextSourceWithTestedUpTo,
		/(\* Requires PHP:[^\S\r\n]*)([^\r\n]*)(\r?)/u,
		pluginHeader.requiresPhp,
	);
}
