import type {
  BlockAttributes,
  BlockVariation,
  BlockVariationScope,
} from "./registration.js";
import {
  createWordPressBlockApiCompatibilityManifest,
  type WordPressBlockApiCompatibilityDiagnostic,
  type WordPressBlockApiCompatibilityFeature,
  type WordPressBlockApiCompatibilityManifest,
  type WordPressCompatibilitySettings,
  type WordPressVersion,
} from "./compatibility.js";
import {
  getDiagnosticSeverity,
  handleDiagnostics,
  type DiagnosticLogger,
} from "./shared/diagnostics.js";
import { isObjectRecord } from "./shared/object-utils.js";
import { normalizeStaticRegistrationValue } from "./shared/static-registration.js";

export type BlockVariationAttributeMap<
  TAttributes extends BlockAttributes = BlockAttributes,
> = Partial<TAttributes> & BlockAttributes;

export type BlockVariationInnerBlockTemplate = readonly [
  name: string,
  attributes?: Readonly<BlockAttributes>,
  innerBlocks?: readonly BlockVariationInnerBlockTemplate[],
];

export type BlockVariationInnerBlocks =
  readonly BlockVariationInnerBlockTemplate[];

export type BlockVariationIsActive<
  TAttributes extends BlockAttributes = BlockAttributes,
> =
  | readonly Extract<keyof TAttributes, string>[]
  | ((
      blockAttributes: Readonly<BlockVariationAttributeMap<TAttributes>>,
      variationAttributes: Readonly<BlockVariationAttributeMap<TAttributes>>,
    ) => boolean);

export interface BlockVariationDefinition<
  TAttributes extends BlockAttributes = BlockAttributes,
> extends Omit<
    BlockVariation<BlockVariationAttributeMap<TAttributes>>,
    "attributes" | "example" | "innerBlocks" | "isActive" | "scope"
  > {
  readonly attributes?: BlockVariationAttributeMap<TAttributes>;
  readonly example?:
    | BlockVariation<BlockVariationAttributeMap<TAttributes>>["example"]
    | {
        readonly attributes: BlockVariationAttributeMap<TAttributes>;
        readonly innerBlocks?: BlockVariationInnerBlocks;
      };
  readonly innerBlocks?: BlockVariationInnerBlocks;
  readonly isActive?: BlockVariationIsActive<TAttributes>;
  readonly scope?: readonly BlockVariationScope[];
}

export interface DefineVariationInlineOptions {
  readonly allowMissingIsActive?: boolean;
  readonly logger?: DiagnosticLogger<BlockVariationDiagnostic>;
  readonly minVersion?: WordPressVersion;
  readonly minWordPress?: WordPressVersion;
  readonly onDiagnostic?: (diagnostic: BlockVariationDiagnostic) => void;
  readonly requireIsActive?: boolean;
  readonly strict?: boolean;
}

export interface DefineVariationOptions extends WordPressCompatibilitySettings {
  readonly allowMissingIsActive?: boolean;
  readonly logger?: DiagnosticLogger<BlockVariationDiagnostic>;
  readonly minWordPress?: WordPressVersion;
  readonly onDiagnostic?: (diagnostic: BlockVariationDiagnostic) => void;
  readonly requireIsActive?: boolean;
}

export type StripDefineVariationOptions<TVariation> = Omit<
  TVariation,
  keyof DefineVariationInlineOptions
>;

export const DEFINED_BLOCK_VARIATION_METADATA: unique symbol = Symbol.for(
  "@wp-typia/block-types/defined-variation",
) as never;

export const DEFINED_BLOCK_VARIATIONS_METADATA: unique symbol = Symbol.for(
  "@wp-typia/block-types/defined-variations",
) as never;

export type DefinedBlockVariationMetadataKey =
  typeof DEFINED_BLOCK_VARIATION_METADATA;

export type DefinedBlockVariationsMetadataKey =
  typeof DEFINED_BLOCK_VARIATIONS_METADATA;

export interface DefinedBlockVariationMetadata {
  readonly blockName: string;
  readonly diagnostics: readonly BlockVariationDiagnostic[];
  readonly manifest: WordPressBlockApiCompatibilityManifest;
}

export interface DefinedBlockVariationsMetadata {
  readonly diagnostics: readonly BlockVariationDiagnostic[];
  readonly entries: readonly BlockVariationRegistrationEntry[];
}

export type DefinedBlockVariation<
  TBlockName extends string = string,
  TAttributes extends BlockAttributes = BlockAttributes,
  TVariation extends BlockVariationDefinition<TAttributes> = BlockVariationDefinition<TAttributes>,
> = Readonly<StripDefineVariationOptions<TVariation>> & {
  readonly [DEFINED_BLOCK_VARIATION_METADATA]?: DefinedBlockVariationMetadata;
  readonly __wpTypiaVariationAttributes?: TAttributes;
  readonly __wpTypiaVariationTarget?: TBlockName;
};

export type DefinedBlockVariations<
  TVariations extends readonly DefinedBlockVariation[] = readonly DefinedBlockVariation[],
> = Readonly<TVariations> & {
  readonly [DEFINED_BLOCK_VARIATIONS_METADATA]?: DefinedBlockVariationsMetadata;
};

export type BlockVariationDiagnosticCode =
  | "duplicate-active-marker"
  | "duplicate-variation-name"
  | "missing-is-active"
  | "missing-stable-marker"
  | "unknown-is-active-attribute";

export interface BlockVariationAuthoringDiagnostic {
  readonly attribute?: string | undefined;
  readonly blockName: string;
  readonly code: BlockVariationDiagnosticCode;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly variationName: string;
}

export type BlockVariationDiagnostic =
  | BlockVariationAuthoringDiagnostic
  | WordPressBlockApiCompatibilityDiagnostic;

export interface BlockVariationRegistrationEntry {
  readonly blockName: string;
  readonly variation: Readonly<BlockVariationDefinition>;
}

export interface CreateBlockVariationRegistrationSourceOptions {
  readonly functionName?: string;
  readonly importSource?: string;
}

const DEFINE_VARIATION_INLINE_OPTION_KEYS = new Set<string>([
  "allowMissingIsActive",
  "logger",
  "minVersion",
  "minWordPress",
  "onDiagnostic",
  "requireIsActive",
  "strict",
]);

const STABLE_VARIATION_MARKER_ATTRIBUTES = [
  "className",
  "namespace",
  "wpTypiaVariation",
] as const;

function splitDefineVariationInput<
  TAttributes extends BlockAttributes,
  TVariation extends BlockVariationDefinition<TAttributes> &
    DefineVariationInlineOptions,
>(variation: TVariation): {
  inlineOptions: DefineVariationInlineOptions;
  variation: StripDefineVariationOptions<TVariation> &
    BlockVariationDefinition<TAttributes>;
} {
  const inlineOptions: DefineVariationInlineOptions = {};
  const normalizedVariation: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(variation)) {
    if (DEFINE_VARIATION_INLINE_OPTION_KEYS.has(key)) {
      Object.assign(inlineOptions, { [key]: value });
      continue;
    }

    normalizedVariation[key] = value;
  }

  return {
    inlineOptions,
    variation: normalizedVariation as StripDefineVariationOptions<TVariation> &
      BlockVariationDefinition<TAttributes>,
  };
}

function resolveDefineVariationSettings(
  inlineOptions: DefineVariationInlineOptions,
  options: DefineVariationOptions,
): {
  compatibility: WordPressCompatibilitySettings;
  diagnostics: {
    allowMissingIsActive: boolean;
    requireIsActive: boolean;
    strict: boolean;
  };
  logger: DefineVariationOptions["logger"];
  onDiagnostic: DefineVariationOptions["onDiagnostic"];
} {
  const compatibility: WordPressCompatibilitySettings = {};
  const allowUnknownFutureKeys = options.allowUnknownFutureKeys;
  const minVersion =
    options.minVersion ??
    options.minWordPress ??
    inlineOptions.minVersion ??
    inlineOptions.minWordPress;
  const strict = options.strict ?? inlineOptions.strict ?? true;

  if (allowUnknownFutureKeys !== undefined) {
    Object.assign(compatibility, { allowUnknownFutureKeys });
  }
  if (minVersion !== undefined) {
    Object.assign(compatibility, { minVersion });
  }
  Object.assign(compatibility, { strict });

  return {
    compatibility,
    diagnostics: {
      allowMissingIsActive:
        options.allowMissingIsActive ?? inlineOptions.allowMissingIsActive ?? false,
      requireIsActive:
        options.requireIsActive ?? inlineOptions.requireIsActive ?? true,
      strict,
    },
    logger: options.logger ?? inlineOptions.logger,
    onDiagnostic: options.onDiagnostic ?? inlineOptions.onDiagnostic,
  };
}

export function collectBlockVariationCompatibilityFeatures(): readonly WordPressBlockApiCompatibilityFeature[] {
  return [
    {
      area: "blockVariations",
      feature: "editorRegistration",
    },
  ];
}

export function createBlockVariationCompatibilityManifest(
  settings: DefineVariationOptions = {},
): WordPressBlockApiCompatibilityManifest {
  const resolved = resolveDefineVariationSettings({}, settings);

  return createWordPressBlockApiCompatibilityManifest(
    collectBlockVariationCompatibilityFeatures(),
    resolved.compatibility,
  );
}

function hasStableMarkerAttribute<TAttributes extends BlockAttributes>(
  attributes: BlockVariationDefinition<TAttributes>["attributes"],
): boolean {
  if (!isObjectRecord(attributes)) {
    return false;
  }

  return STABLE_VARIATION_MARKER_ATTRIBUTES.some((key) => key in attributes);
}

function createVariationDiagnostics<TAttributes extends BlockAttributes>(
  blockName: string,
  variation: BlockVariationDefinition<TAttributes>,
  options: ReturnType<typeof resolveDefineVariationSettings>["diagnostics"],
): readonly BlockVariationAuthoringDiagnostic[] {
  const diagnostics: BlockVariationAuthoringDiagnostic[] = [];
  const variationName = variation.name;
  const attributes = variation.attributes;
  const isActive = variation.isActive;

  if (
    options.requireIsActive &&
    !options.allowMissingIsActive &&
    !variation.isDefault &&
    isActive === undefined
  ) {
    diagnostics.push({
      blockName,
      code: "missing-is-active",
      message: `Block variation "${variationName}" for "${blockName}" does not declare isActive; add an active discriminator or set allowMissingIsActive.`,
      severity: "warning",
      variationName,
    });
  }

  if (
    options.requireIsActive &&
    !options.allowMissingIsActive &&
    !variation.isDefault &&
    isActive === undefined &&
    !hasStableMarkerAttribute(attributes)
  ) {
    diagnostics.push({
      blockName,
      code: "missing-stable-marker",
      message: `Block variation "${variationName}" for "${blockName}" has no stable marker attribute such as className, namespace, or wpTypiaVariation.`,
      severity: "warning",
      variationName,
    });
  }

  if (Array.isArray(isActive)) {
    for (const attribute of isActive) {
      if (!isObjectRecord(attributes) || !(attribute in attributes)) {
        diagnostics.push({
          attribute,
          blockName,
          code: "unknown-is-active-attribute",
          message: `Block variation "${variationName}" for "${blockName}" uses isActive attribute "${attribute}" that is not present in its attributes.`,
          severity: "warning",
          variationName,
        });
      }
    }
  }

  return diagnostics;
}

function handleVariationDiagnostics(
  diagnostics: readonly BlockVariationDiagnostic[],
  onDiagnostic: DefineVariationOptions["onDiagnostic"],
  logger: DefineVariationOptions["logger"],
): void {
  handleDiagnostics(diagnostics, onDiagnostic, {
    failureHeading: "WordPress block variation check failed:",
    logger,
  });
}

export function getDefinedVariationMetadata(
  variation: unknown,
): DefinedBlockVariationMetadata | undefined {
  return isObjectRecord(variation)
    ? (
        variation as {
          readonly [DEFINED_BLOCK_VARIATION_METADATA]?:
            | DefinedBlockVariationMetadata
            | undefined;
        }
      )[DEFINED_BLOCK_VARIATION_METADATA]
    : undefined;
}

export function getDefinedVariationBlockName(
  variation: unknown,
): string | undefined {
  return getDefinedVariationMetadata(variation)?.blockName;
}

export function getDefinedVariationCompatibilityManifest(
  variation: unknown,
): WordPressBlockApiCompatibilityManifest | undefined {
  return getDefinedVariationMetadata(variation)?.manifest;
}

export function getDefinedVariationsMetadata(
  variations: unknown,
): DefinedBlockVariationsMetadata | undefined {
  return Array.isArray(variations)
    ? (
        variations as {
          readonly [DEFINED_BLOCK_VARIATIONS_METADATA]?:
            | DefinedBlockVariationsMetadata
            | undefined;
        }
      )[DEFINED_BLOCK_VARIATIONS_METADATA]
    : undefined;
}

export function defineVariation<
  TAttributes extends BlockAttributes = BlockAttributes,
  const TBlockName extends string = string,
  const TVariation extends BlockVariationDefinition<TAttributes> &
    DefineVariationInlineOptions = BlockVariationDefinition<TAttributes> &
    DefineVariationInlineOptions,
>(
  blockName: TBlockName,
  variation: TVariation,
	options: DefineVariationOptions = {},
): DefinedBlockVariation<TBlockName, TAttributes, TVariation> {
	const { inlineOptions, variation: normalizedVariation } =
		splitDefineVariationInput<TAttributes, TVariation>(variation);
  const resolved = resolveDefineVariationSettings(inlineOptions, options);
  const manifest = createWordPressBlockApiCompatibilityManifest(
    collectBlockVariationCompatibilityFeatures(),
    resolved.compatibility,
  );
  const diagnostics = [
    ...manifest.diagnostics,
    ...createVariationDiagnostics(
      blockName,
      normalizedVariation,
      resolved.diagnostics,
    ),
  ];

  handleVariationDiagnostics(diagnostics, resolved.onDiagnostic, resolved.logger);

  Object.defineProperty(normalizedVariation, DEFINED_BLOCK_VARIATION_METADATA, {
    configurable: false,
    enumerable: false,
    value: {
      blockName,
      diagnostics,
      manifest,
    } satisfies DefinedBlockVariationMetadata,
    writable: false,
  });

  return normalizedVariation as DefinedBlockVariation<
    TBlockName,
    TAttributes,
    TVariation
  >;
}

function createCollectionDiagnostics(
  entries: readonly BlockVariationRegistrationEntry[],
  strict: boolean,
): readonly BlockVariationAuthoringDiagnostic[] {
  const diagnostics: BlockVariationAuthoringDiagnostic[] = [];
  const seenNames = new Map<string, BlockVariationRegistrationEntry>();
  const seenActiveMarkers = new Map<string, BlockVariationRegistrationEntry>();

  for (const entry of entries) {
    const nameKey = `${entry.blockName}:${entry.variation.name}`;
    const activeMarker = Array.isArray(entry.variation.isActive)
      ? entry.variation.isActive.join("|")
      : undefined;

    if (seenNames.has(nameKey)) {
      diagnostics.push({
        blockName: entry.blockName,
        code: "duplicate-variation-name",
        message: `Duplicate block variation name "${entry.variation.name}" for "${entry.blockName}".`,
        severity: getDiagnosticSeverity(strict),
        variationName: entry.variation.name,
      });
    }
    seenNames.set(nameKey, entry);

    if (activeMarker && activeMarker.length > 0) {
      const markerKey = `${entry.blockName}:${activeMarker}`;
      const existing = seenActiveMarkers.get(markerKey);

      if (existing) {
        diagnostics.push({
          blockName: entry.blockName,
          code: "duplicate-active-marker",
          message: `Block variations "${existing.variation.name}" and "${entry.variation.name}" for "${entry.blockName}" share the same isActive discriminator "${activeMarker}".`,
          severity: "warning",
          variationName: entry.variation.name,
        });
      }
      seenActiveMarkers.set(markerKey, entry);
    }
  }

  return diagnostics;
}

export function createBlockVariationRegistrationPlan(
  variations: readonly DefinedBlockVariation[],
): readonly BlockVariationRegistrationEntry[] {
  return variations.map((variation) => {
    const metadata = getDefinedVariationMetadata(variation);

    if (!metadata) {
      throw new Error(
        `Block variation "${variation.name}" was not created by defineVariation().`,
      );
    }

    return {
      blockName: metadata.blockName,
      variation,
    };
  });
}

export function defineVariations<
  const TVariations extends readonly DefinedBlockVariation[],
>(
  variations: TVariations,
  options: DefineVariationOptions = {},
): DefinedBlockVariations<TVariations> {
  const entries = createBlockVariationRegistrationPlan(variations);
  const strict = options.strict ?? true;
  const variationDiagnostics = entries.flatMap(
    (entry) => getDefinedVariationMetadata(entry.variation)?.diagnostics ?? [],
  );
  const collectionDiagnostics = createCollectionDiagnostics(entries, strict);
  const diagnostics = [
    ...variationDiagnostics,
    ...collectionDiagnostics,
  ];

  handleVariationDiagnostics(
    collectionDiagnostics,
    options.onDiagnostic,
    options.logger,
  );

  const normalizedVariations = [...variations] as unknown as DefinedBlockVariations<
    TVariations
  >;

  Object.defineProperty(
    normalizedVariations,
    DEFINED_BLOCK_VARIATIONS_METADATA,
    {
      configurable: false,
      enumerable: false,
      value: {
        diagnostics,
        entries,
      } satisfies DefinedBlockVariationsMetadata,
      writable: false,
    },
  );

  return normalizedVariations;
}

export function createStaticBlockVariationRegistrationSource(
  variations: readonly DefinedBlockVariation[],
  options: CreateBlockVariationRegistrationSourceOptions = {},
): string {
  const importSource = options.importSource ?? "@wordpress/blocks";
  const functionName = options.functionName ?? "registerWpTypiaBlockVariations";
  const entries = createBlockVariationRegistrationPlan(variations).map(
    (entry, index) =>
      normalizeStaticRegistrationValue(entry, `variations[${index}]`, {
        description: "variation",
      }),
  );
  const serializedEntries = JSON.stringify(entries, null, 2);

  return [
    `import { registerBlockVariation } from ${JSON.stringify(importSource)};`,
    "",
    `const variations = ${serializedEntries};`,
    "",
    `export function ${functionName}() {`,
    "  for (const { blockName, variation } of variations) {",
    "    registerBlockVariation(blockName, variation);",
    "  }",
    "}",
    "",
  ].join("\n");
}
