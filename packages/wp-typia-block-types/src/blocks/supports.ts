import type {
  BlockAlignment,
  BlockVerticalAlignment,
  JustifyContent,
  TextAlignment,
} from "../block-editor/alignment.js";
import type {
  BlockBorderSupportAttributes,
  BlockColorSupportAttributes,
  BlockDimensionsSupportAttributes,
  BlockSpacingSupportAttributes,
  BlockStyleAttributes,
  BlockTypographySupportAttributes,
} from "../block-editor/style-attributes.js";
import type { FlexWrap, LayoutType, Orientation } from "../block-editor/layout.js";
import type { SpacingAxis, SpacingDimension } from "../block-editor/spacing.js";
import {
  createWordPressBlockApiCompatibilityManifest,
  type WordPressBlockApiCompatibilityDiagnostic,
  type WordPressBlockApiCompatibilityFeature,
  type WordPressBlockApiCompatibilityManifest,
  type WordPressCompatibilitySettings,
  type WordPressVersion,
} from "./compatibility.js";

/**
 * Derived from Gutenberg block support keys and commonly used block.json
 * support sections.
 */
export type BlockSupportFeature =
  | 'align'
  | 'alignWide'
  | 'allowedBlocks'
  | 'anchor'
  | 'ariaLabel'
  | 'autoRegister'
  | 'background'
  | 'border'
  | 'className'
  | 'color'
  | 'contentRole'
  | 'customClassName'
  | 'dimensions'
  | 'filter'
  | 'html'
  | 'inserter'
  | 'interactivity'
  | 'js'
  | 'layout'
  | 'lightbox'
  | 'listView'
  | 'lock'
  | 'locking'
  | 'multiple'
  | 'position'
  | 'renaming'
  | 'reusable'
  | 'shadow'
  | 'spacing'
  | 'splitting'
  | 'visibility'
  | 'typography';

export const BLOCK_SUPPORT_FEATURES = [
  'align',
  'alignWide',
  'allowedBlocks',
  'anchor',
  'ariaLabel',
  'autoRegister',
  'background',
  'border',
  'className',
  'color',
  'contentRole',
  'customClassName',
  'dimensions',
  'filter',
  'html',
  'inserter',
  'interactivity',
  'js',
  'layout',
  'lightbox',
  'listView',
  'lock',
  'locking',
  'multiple',
  'position',
  'renaming',
  'reusable',
  'shadow',
  'spacing',
  'splitting',
  'typography',
  'visibility',
] as const satisfies readonly BlockSupportFeature[];

export type TypographySupportKey =
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  | 'dropCap'
  | 'textAlign'
  | 'textColumns'
  | 'textDecoration'
  | 'textTransform'
  | 'writingMode';

export const TYPOGRAPHY_SUPPORT_KEYS = [
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'dropCap',
  'textAlign',
  'textColumns',
  'textDecoration',
  'textTransform',
  'writingMode',
] as const satisfies readonly TypographySupportKey[];

export type SpacingSupportKey = 'blockGap' | 'margin' | 'padding';

export const SPACING_SUPPORT_KEYS = [
  'blockGap',
  'margin',
  'padding',
] as const satisfies readonly SpacingSupportKey[];

type BlockSupportDefaultControls<TFeature extends string> = Readonly<
  Partial<Record<TFeature, boolean>> & Record<string, boolean | undefined>
>;

export type SkipSerialization<TFeature extends string> =
  | boolean
  | readonly TFeature[];

export interface BlockBorderSupport {
  readonly color?: boolean;
  readonly radius?: boolean;
  readonly style?: boolean;
  readonly width?: boolean;
  readonly __experimentalSkipSerialization?: SkipSerialization<
    'color' | 'radius' | 'style' | 'width'
  >;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<
    'color' | 'radius' | 'style' | 'width'
  >;
}

export interface BlockBackgroundSupport {
  readonly backgroundImage?: boolean;
  readonly backgroundSize?: boolean;
}

export interface BlockColorSupport {
  readonly background?: boolean;
  /**
   * Dedicated button color support documented in the Block Supports reference
   * as stable since WordPress 6.5.
   */
  readonly button?: boolean;
  readonly enableAlpha?: boolean;
  readonly enableContrastChecker?: boolean;
  readonly gradients?: boolean;
  /**
   * Dedicated heading color support documented in the Block Supports reference
   * as stable since WordPress 6.5.
   */
  readonly heading?: boolean;
  readonly link?: boolean;
  readonly text?: boolean;
  readonly __experimentalSkipSerialization?: SkipSerialization<
    'background' | 'button' | 'gradients' | 'heading' | 'link' | 'text'
  >;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<
    'background' | 'gradients' | 'link' | 'text'
  >;
}

export interface BlockDimensionsSupport {
  readonly aspectRatio?: boolean;
  readonly height?: boolean;
  readonly minHeight?: boolean;
  readonly width?: boolean;
  readonly __experimentalSkipSerialization?: SkipSerialization<
    'aspectRatio' | 'height' | 'minHeight' | 'width'
  >;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<
    'aspectRatio' | 'height' | 'minHeight' | 'width'
  >;
}

export interface BlockFilterSupport {
  readonly duotone?: boolean;
}

export interface BlockInteractivitySupport {
  readonly clientNavigation?: boolean;
  readonly interactive?: boolean;
}

export interface BlockLayoutDefault {
  readonly columnCount?: number;
  readonly columnGap?: string;
  readonly contentSize?: string;
  readonly allowInheriting?: boolean;
  readonly allowSizingOnChildren?: boolean;
  readonly flexWrap?: FlexWrap;
  readonly justifyContent?: JustifyContent;
  readonly minimumColumnWidth?: string;
  readonly orientation?: Orientation;
  readonly rowGap?: string;
  readonly type?: LayoutType;
  readonly verticalAlignment?: BlockVerticalAlignment;
  readonly wideSize?: string;
}

export interface BlockLayoutSupport {
  readonly allowCustomContentAndWideSize?: boolean;
  readonly allowEditing?: boolean;
  readonly allowInheriting?: boolean;
  readonly allowJustification?: boolean;
  readonly allowOrientation?: boolean;
  readonly allowSizingOnChildren?: boolean;
  readonly allowSwitching?: boolean;
  readonly allowVerticalAlignment?: boolean;
  readonly allowWrap?: boolean;
  readonly default?: BlockLayoutDefault;
}

export interface BlockLightboxSupport {
  readonly allowEditing?: boolean;
  readonly enabled?: boolean;
}

export interface BlockPositionSupport {
  readonly fixed?: boolean;
  readonly sticky?: boolean;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<
    'fixed' | 'sticky'
  >;
}

export interface BlockShadowSupport {
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<'shadow'>;
}

export interface SpacingSize {
  readonly name: string;
  readonly size: string;
  readonly slug: string;
}

export interface BlockSpacingSupport {
  readonly blockGap?: boolean | readonly SpacingAxis[];
  readonly margin?: boolean | readonly SpacingDimension[];
  readonly padding?: boolean | readonly SpacingDimension[];
  readonly spacingSizes?: readonly SpacingSize[];
  readonly units?: readonly string[];
  readonly __experimentalSkipSerialization?: SkipSerialization<SpacingSupportKey>;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<SpacingSupportKey>;
}

export interface BlockTypographySupport {
  readonly dropCap?: boolean;
  readonly fontFamily?: boolean;
  readonly fontSize?: boolean;
  readonly fontStyle?: boolean;
  readonly fontWeight?: boolean;
  readonly letterSpacing?: boolean;
  readonly lineHeight?: boolean;
  readonly textAlign?: boolean | readonly TextAlignment[];
  readonly textColumns?: boolean;
  readonly textDecoration?: boolean;
  readonly textTransform?: boolean;
  readonly writingMode?: boolean;
  readonly __experimentalSkipSerialization?: SkipSerialization<TypographySupportKey>;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<TypographySupportKey>;
}

/**
 * Practical WP 6.9+ block support surface for block.json metadata and
 * registration helpers.
 *
 * This intentionally models the common public subtrees instead of mirroring
 * every Gutenberg-internal experimental flag.
 */
export interface BlockSupports {
  readonly align?: boolean | readonly BlockAlignment[];
  readonly alignWide?: boolean;
  readonly allowedBlocks?: boolean;
  readonly anchor?: boolean;
  readonly ariaLabel?: boolean;
  readonly autoRegister?: boolean;
  readonly background?: boolean | BlockBackgroundSupport;
  readonly border?: boolean | BlockBorderSupport;
  readonly className?: boolean;
  readonly color?: boolean | BlockColorSupport;
  readonly contentRole?: boolean;
  readonly customClassName?: boolean;
  readonly dimensions?: boolean | BlockDimensionsSupport;
  readonly filter?: boolean | BlockFilterSupport;
  readonly html?: boolean;
  readonly inserter?: boolean;
  readonly interactivity?: boolean | BlockInteractivitySupport;
  readonly js?: boolean;
  readonly layout?: boolean | BlockLayoutSupport;
  readonly lightbox?: boolean | BlockLightboxSupport;
  readonly listView?: boolean;
  readonly lock?: boolean;
  readonly locking?: boolean;
  readonly multiple?: boolean;
  readonly position?: boolean | BlockPositionSupport;
  readonly renaming?: boolean;
  readonly reusable?: boolean;
  readonly shadow?: boolean | BlockShadowSupport;
  readonly spacing?: boolean | BlockSpacingSupport;
  readonly splitting?: boolean;
  readonly typography?: boolean | BlockTypographySupport;
  readonly visibility?: boolean;
}

export type BlockSupportsInput = BlockSupports & Readonly<Record<string, unknown>>;

export interface BlockAlignSupportAttributes {
  readonly align?: BlockAlignment;
}

export interface BlockAllowedBlocksSupportAttributes {
  readonly allowedBlocks?: readonly string[];
}

export interface BlockLayoutSupportAttributes {
  readonly layout?: BlockLayoutDefault;
}

export interface BlockStyleAttributeSupportAttributes {
  readonly style?: BlockStyleAttributes;
}

type SupportTruthy<TValue> = [TValue] extends [false | null | undefined]
  ? false
  : true;

type HasSupport<TSupports, TKey extends PropertyKey> = TKey extends keyof TSupports
  ? SupportTruthy<TSupports[TKey]>
  : false;

type HasNestedSupport<
  TSupports,
  TSection extends keyof BlockSupports,
  TKey extends PropertyKey,
> = TSection extends keyof TSupports
  ? TSupports[TSection] extends true
    ? true
    : TSupports[TSection] extends Readonly<Record<TKey, infer TValue>>
      ? SupportTruthy<TValue>
      : false
  : false;

type IfSupport<TCondition, TAttributes> = TCondition extends true
  ? TAttributes
  : {};

export interface DefineSupportsInlineOptions {
  readonly allowUnknownFutureKeys?: boolean;
  readonly minVersion?: WordPressVersion;
  readonly minWordPress?: WordPressVersion;
  readonly onDiagnostic?: (diagnostic: WordPressBlockApiCompatibilityDiagnostic) => void;
  readonly strict?: boolean;
}

export interface DefineSupportsOptions extends WordPressCompatibilitySettings {
  readonly minWordPress?: WordPressVersion;
  readonly onDiagnostic?: (diagnostic: WordPressBlockApiCompatibilityDiagnostic) => void;
}

export type StripDefineSupportsOptions<TSupports> = Omit<
  TSupports,
  keyof DefineSupportsInlineOptions
>;

export const DEFINED_BLOCK_SUPPORTS_METADATA: unique symbol = Symbol.for(
  "@wp-typia/block-types/defined-supports",
) as never;

export type DefinedBlockSupportsMetadataKey =
  typeof DEFINED_BLOCK_SUPPORTS_METADATA;

export interface DefinedBlockSupportsMetadata {
  readonly diagnostics: readonly WordPressBlockApiCompatibilityDiagnostic[];
  readonly manifest: WordPressBlockApiCompatibilityManifest;
}

export type DefinedBlockSupports<TSupports extends BlockSupportsInput = BlockSupportsInput> =
  Readonly<StripDefineSupportsOptions<TSupports>> & {
    readonly [DEFINED_BLOCK_SUPPORTS_METADATA]?: DefinedBlockSupportsMetadata;
  };

export type SupportAttributes<TSupports> =
  TSupports extends DefinedBlockSupports<infer TDefinedSupports>
    ? SupportAttributesFromBlockSupports<
        StripDefineSupportsOptions<TDefinedSupports>
      >
    : TSupports extends BlockSupportsInput
      ? SupportAttributesFromBlockSupports<StripDefineSupportsOptions<TSupports>>
      : {};

export type SupportAttributesFromBlockSupports<TSupports> =
  IfSupport<
    HasSupport<TSupports, "align">,
    BlockAlignSupportAttributes
  > &
    IfSupport<
      HasSupport<TSupports, "allowedBlocks">,
      BlockAllowedBlocksSupportAttributes
    > &
    IfSupport<HasSupport<TSupports, "layout">, BlockLayoutSupportAttributes> &
    IfSupport<HasSupport<TSupports, "color">, BlockColorSupportAttributes> &
    IfSupport<
      HasSupport<TSupports, "typography">,
      BlockTypographySupportAttributes
    > &
    IfSupport<HasSupport<TSupports, "spacing">, BlockSpacingSupportAttributes> &
    IfSupport<
      HasSupport<TSupports, "dimensions">,
      BlockDimensionsSupportAttributes
    > &
    IfSupport<HasSupport<TSupports, "border">, BlockBorderSupportAttributes> &
    IfSupport<
      HasSupport<TSupports, "background">,
      BlockStyleAttributeSupportAttributes
    > &
    IfSupport<
      HasNestedSupport<TSupports, "filter", "duotone">,
      BlockStyleAttributeSupportAttributes
    > &
    IfSupport<
      HasSupport<TSupports, "position">,
      BlockStyleAttributeSupportAttributes
    > &
    IfSupport<
      HasSupport<TSupports, "shadow">,
      BlockStyleAttributeSupportAttributes
    >;

const KNOWN_BLOCK_SUPPORT_FEATURES = new Set<string>(BLOCK_SUPPORT_FEATURES);
const DEFINE_SUPPORTS_INLINE_OPTION_KEYS = new Set<string>([
  "allowUnknownFutureKeys",
  "minVersion",
  "minWordPress",
  "onDiagnostic",
  "strict",
]);
const COLOR_COMPATIBILITY_SUPPORT_KEYS = [
  "button",
  "enableContrastChecker",
  "heading",
] as const;
const TYPOGRAPHY_COMPATIBILITY_SUPPORT_KEYS = [
  "fontSize",
  "letterSpacing",
  "lineHeight",
  "textAlign",
  "textDecoration",
  "textTransform",
] as const satisfies readonly TypographySupportKey[];
const TOP_LEVEL_COMPATIBILITY_SUPPORT_KEYS = [
  "allowedBlocks",
  "background",
  "contentRole",
  "dimensions",
  "listView",
  "position",
  "renaming",
  "shadow",
  "visibility",
] as const satisfies readonly BlockSupportFeature[];

function isSupportObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnabledSupportValue(value: unknown): boolean {
  return value !== false && value !== null && value !== undefined;
}

function isEnabledTopLevelSupportValue(value: unknown): boolean {
  if (!isSupportObject(value)) {
    return isEnabledSupportValue(value);
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      !key.startsWith("__experimental") &&
      isEnabledSupportValue(nestedValue),
  );
}

function hasEnabledNestedSupport(
  section: unknown,
  key: string,
): boolean {
  return isSupportObject(section) && isEnabledSupportValue(section[key]);
}

function addCompatibilityFeature(
  features: WordPressBlockApiCompatibilityFeature[],
  seen: Set<string>,
  feature: string,
): void {
  const id = `blockSupports.${feature}`;

  if (seen.has(id)) {
    return;
  }

  seen.add(id);
  features.push({
    area: "blockSupports",
    feature,
  });
}

export function collectBlockSupportsCompatibilityFeatures(
  supports: BlockSupportsInput,
): readonly WordPressBlockApiCompatibilityFeature[] {
  const features: WordPressBlockApiCompatibilityFeature[] = [];
  const seen = new Set<string>();

  for (const key of TOP_LEVEL_COMPATIBILITY_SUPPORT_KEYS) {
    if (isEnabledTopLevelSupportValue(supports[key])) {
      addCompatibilityFeature(features, seen, key);
    }
  }

  const spacing = supports.spacing;
  for (const key of SPACING_SUPPORT_KEYS) {
    if (hasEnabledNestedSupport(spacing, key)) {
      addCompatibilityFeature(features, seen, `spacing.${key}`);
    }
  }

  const typography = supports.typography;
  for (const key of TYPOGRAPHY_COMPATIBILITY_SUPPORT_KEYS) {
    if (hasEnabledNestedSupport(typography, key)) {
      addCompatibilityFeature(features, seen, `typography.${key}`);
    }
  }

  const color = supports.color;
  if (isSupportObject(color)) {
    for (const key of COLOR_COMPATIBILITY_SUPPORT_KEYS) {
      if (isEnabledSupportValue(color[key])) {
        addCompatibilityFeature(features, seen, `color.${key}`);
      }
    }
  }

  if (hasEnabledNestedSupport(supports.filter, "duotone")) {
    addCompatibilityFeature(features, seen, "filter.duotone");
  }

  for (const key of Object.keys(supports)) {
    if (
      !KNOWN_BLOCK_SUPPORT_FEATURES.has(key) &&
      !DEFINE_SUPPORTS_INLINE_OPTION_KEYS.has(key) &&
      isEnabledTopLevelSupportValue(supports[key])
    ) {
      addCompatibilityFeature(features, seen, key);
    }
  }

  return features;
}

function splitDefineSupportsInput<TSupports extends BlockSupportsInput>(
  supports: TSupports & DefineSupportsInlineOptions,
): {
  inlineOptions: DefineSupportsInlineOptions;
  supports: StripDefineSupportsOptions<TSupports> & BlockSupportsInput;
} {
  const normalizedSupports: Record<string, unknown> = {};
  const inlineOptions: DefineSupportsInlineOptions = {};

  for (const [key, value] of Object.entries(supports)) {
    if (DEFINE_SUPPORTS_INLINE_OPTION_KEYS.has(key)) {
      Object.assign(inlineOptions, { [key]: value });
      continue;
    }

    normalizedSupports[key] = value;
  }

  return {
    inlineOptions,
    supports: normalizedSupports as StripDefineSupportsOptions<TSupports> &
      BlockSupportsInput,
  };
}

function resolveDefineSupportsSettings(
  inlineOptions: DefineSupportsInlineOptions,
  options: DefineSupportsOptions,
): WordPressCompatibilitySettings {
  const settings: WordPressCompatibilitySettings = {};
  const allowUnknownFutureKeys =
    options.allowUnknownFutureKeys ?? inlineOptions.allowUnknownFutureKeys;
  const minVersion =
    options.minVersion ??
    options.minWordPress ??
    inlineOptions.minVersion ??
    inlineOptions.minWordPress;
  const strict = options.strict ?? inlineOptions.strict;

  if (allowUnknownFutureKeys !== undefined) {
    Object.assign(settings, { allowUnknownFutureKeys });
  }
  if (minVersion !== undefined) {
    Object.assign(settings, { minVersion });
  }
  if (strict !== undefined) {
    Object.assign(settings, { strict });
  }

  return settings;
}

export function createBlockSupportsCompatibilityManifest(
  supports: BlockSupportsInput,
  settings: DefineSupportsOptions = {},
): WordPressBlockApiCompatibilityManifest {
  const compatibilitySettings = resolveDefineSupportsSettings({}, settings);

  return createWordPressBlockApiCompatibilityManifest(
    collectBlockSupportsCompatibilityFeatures(supports),
    compatibilitySettings,
  );
}

function handleDefineSupportsDiagnostics(
  diagnostics: readonly WordPressBlockApiCompatibilityDiagnostic[],
  onDiagnostic: DefineSupportsOptions["onDiagnostic"],
): void {
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(
      [
        "WordPress block supports compatibility check failed:",
        ...errors.map((diagnostic) => `- ${diagnostic.message}`),
      ].join("\n"),
    );
  }

  for (const diagnostic of diagnostics) {
    if (onDiagnostic) {
      onDiagnostic(diagnostic);
      continue;
    }

    console.warn(`[wp-typia] ${diagnostic.message}`);
  }
}

export function getDefinedSupportsCompatibilityManifest(
  supports: unknown,
): WordPressBlockApiCompatibilityManifest | undefined {
  return isSupportObject(supports)
    ? (
        supports as {
          readonly [DEFINED_BLOCK_SUPPORTS_METADATA]?:
            | DefinedBlockSupportsMetadata
            | undefined;
        }
      )[DEFINED_BLOCK_SUPPORTS_METADATA]?.manifest
    : undefined;
}

export function defineSupports<
  const TSupports extends BlockSupportsInput & DefineSupportsInlineOptions,
>(
  supports: TSupports,
  options: DefineSupportsOptions = {},
): DefinedBlockSupports<TSupports> {
  const { inlineOptions, supports: normalizedSupports } =
    splitDefineSupportsInput(supports);
  const settings = resolveDefineSupportsSettings(inlineOptions, options);
  const manifest = createBlockSupportsCompatibilityManifest(
    normalizedSupports,
    settings,
  );

  handleDefineSupportsDiagnostics(
    manifest.diagnostics,
    options.onDiagnostic ?? inlineOptions.onDiagnostic,
  );

  Object.defineProperty(normalizedSupports, DEFINED_BLOCK_SUPPORTS_METADATA, {
    configurable: false,
    enumerable: false,
    value: {
      diagnostics: manifest.diagnostics,
      manifest,
    } satisfies DefinedBlockSupportsMetadata,
    writable: false,
  });

  return normalizedSupports as DefinedBlockSupports<TSupports>;
}
