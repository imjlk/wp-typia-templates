export type AiFeatureCapabilityMode = 'optional' | 'required';

export interface AiFeatureCompatibilityFloor {
  php?: string;
  wordpress?: string;
}

export interface AiFeatureRuntimeGate {
  kind:
    | 'adapter'
    | 'php-function'
    | 'script-package'
    | 'wordpress-core-feature';
  value: string;
}

export interface AiFeatureDefinition {
  description: string;
  id: string;
  label: string;
  minimumVersions?: AiFeatureCompatibilityFloor;
  runtimeGates?: readonly AiFeatureRuntimeGate[];
}

export interface AiFeatureCapabilitySelection {
  featureId: string;
  mode: AiFeatureCapabilityMode;
}

export interface ResolvedAiFeatureCapability extends AiFeatureDefinition {
  mode: AiFeatureCapabilityMode;
}

export interface ResolvedAiFeatureCapabilityPlan {
  hardMinimums: AiFeatureCompatibilityFloor;
  optionalFeatures: ResolvedAiFeatureCapability[];
  requiredFeatures: ResolvedAiFeatureCapability[];
}

export const AI_FEATURE_DEFINITIONS = {
  wordpressAiClient: {
    description:
      'WordPress 7.0 AI Client surface used by AI-capable feature endpoints.',
    id: 'wordpress-ai-client',
    label: 'WordPress AI Client',
    minimumVersions: {
      wordpress: '7.0',
    },
    runtimeGates: [
      {
        kind: 'wordpress-core-feature',
        value: 'WordPress AI Client',
      },
    ],
  },
  wordpressCoreAbilities: {
    description:
      'Client-side ability discovery surface for editor and admin flows.',
    id: 'wordpress-core-abilities',
    label: '@wordpress/core-abilities',
    minimumVersions: {
      wordpress: '7.0',
    },
    runtimeGates: [
      {
        kind: 'script-package',
        value: '@wordpress/core-abilities',
      },
    ],
  },
  wordpressMcpPublicMetadata: {
    description:
      'Optional MCP exposure metadata consumed by a separate adapter path rather than core alone.',
    id: 'wordpress-mcp-public-metadata',
    label: 'MCP public metadata',
    runtimeGates: [
      {
        kind: 'adapter',
        value: 'MCP adapter',
      },
    ],
  },
  wordpressServerAbilities: {
    description:
      'Server-side ability registration and execution surface for WordPress-native abilities.',
    id: 'wordpress-server-abilities',
    label: 'WordPress Abilities API',
    minimumVersions: {
      wordpress: '6.9',
    },
    runtimeGates: [
      {
        kind: 'php-function',
        value: 'wp_register_ability',
      },
      {
        kind: 'php-function',
        value: 'wp_register_ability_category',
      },
    ],
  },
} as const satisfies Record<string, AiFeatureDefinition>;

const DEFAULT_AI_FEATURE_REGISTRY: Readonly<
  Record<string, AiFeatureDefinition>
> = Object.values(AI_FEATURE_DEFINITIONS).reduce<
  Record<string, AiFeatureDefinition>
>((accumulator, definition) => {
  accumulator[definition.id] = definition;
  return accumulator;
}, {});

function parseVersionFloorParts(value: string): number[] {
  const parts = value.split('.').map((part) => Number.parseInt(part, 10));

  for (const [index, part] of parts.entries()) {
    if (!Number.isFinite(part)) {
      throw new Error(
        `compareVersionFloors received an invalid version floor "${value}" at segment ${index + 1}.`,
      );
    }
  }

  return parts;
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

function pickHigherVersionFloor(
  current: string | undefined,
  candidate: string | undefined,
): string | undefined {
  if (!candidate) {
    return current;
  }
  if (!current) {
    return candidate;
  }

  return compareVersionFloors(current, candidate) >= 0 ? current : candidate;
}

function normalizeSelections(
  selections: readonly AiFeatureCapabilitySelection[],
): AiFeatureCapabilitySelection[] {
  const normalized = new Map<string, AiFeatureCapabilitySelection>();

  for (const selection of selections) {
    const current = normalized.get(selection.featureId);
    if (!current || selection.mode === 'required') {
      normalized.set(selection.featureId, selection);
    }
  }

  return [...normalized.values()];
}

export function resolveAiFeatureCapabilityPlan(
  selections: readonly AiFeatureCapabilitySelection[],
  registry: Readonly<
    Record<string, AiFeatureDefinition>
  > = DEFAULT_AI_FEATURE_REGISTRY,
): ResolvedAiFeatureCapabilityPlan {
  const requiredFeatures: ResolvedAiFeatureCapability[] = [];
  const optionalFeatures: ResolvedAiFeatureCapability[] = [];
  let wordpress: string | undefined;
  let php: string | undefined;

  for (const selection of normalizeSelections(selections)) {
    const definition = registry[selection.featureId];
    if (!definition) {
      throw new Error(
        `Unknown AI feature capability "${selection.featureId}".`,
      );
    }

    const resolvedDefinition = {
      ...definition,
      mode: selection.mode,
    } satisfies ResolvedAiFeatureCapability;

    if (selection.mode === 'required') {
      requiredFeatures.push(resolvedDefinition);
      wordpress = pickHigherVersionFloor(
        wordpress,
        definition.minimumVersions?.wordpress,
      );
      php = pickHigherVersionFloor(php, definition.minimumVersions?.php);
      continue;
    }

    optionalFeatures.push(resolvedDefinition);
  }

  return {
    hardMinimums: {
      ...(php ? { php } : {}),
      ...(wordpress ? { wordpress } : {}),
    },
    optionalFeatures,
    requiredFeatures,
  };
}
