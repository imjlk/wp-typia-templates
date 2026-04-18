import type {
  BlockConfiguration as WordPressBlockConfiguration,
  BlockSupports as WordPressBlockSupports,
} from '@wordpress/blocks';
import { isPlainObject } from './object-utils.js';

type OverrideProperties<TBase, TOverride> = Omit<TBase, keyof TOverride> &
  TOverride;
type ScaffoldSupportDefaultControls<TFeature extends string> = Readonly<
  Partial<Record<TFeature, boolean>> & Record<string, boolean | undefined>
>;
type WordPressScaffoldBlockConfiguration = WordPressBlockConfiguration<
  Record<string, unknown>
>;
type ScaffoldBlockMetadataShape = { name: string };
type ScaffoldBlockRegistrationOverride = Record<string, unknown> & {
  name?: never;
};
type ScaffoldBlockMetadataSettings<
  TMetadata extends ScaffoldBlockMetadataShape,
> = Omit<TMetadata, 'name'>;
type MergedScaffoldBlockSettings<
  TMetadata extends ScaffoldBlockMetadataShape,
  TOverrides extends ScaffoldBlockRegistrationOverride,
> = OverrideProperties<
  ScaffoldBlockMetadataSettings<TMetadata>,
  Omit<TOverrides, 'name'>
>;

type ScaffoldLayoutType = 'flow' | 'constrained' | 'flex' | 'grid';
type ScaffoldFlexWrap = 'wrap' | 'nowrap';
type ScaffoldOrientation = 'horizontal' | 'vertical';
type ScaffoldJustifyContent =
  | 'left'
  | 'center'
  | 'right'
  | 'space-between'
  | 'stretch';
type ScaffoldBlockAlignment = 'left' | 'center' | 'right' | 'wide' | 'full';
type ScaffoldBlockVerticalAlignment = 'top' | 'center' | 'bottom';
type ScaffoldSpacingAxis = 'horizontal' | 'vertical';
type ScaffoldSpacingDimension =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | ScaffoldSpacingAxis;
type ScaffoldTypographySupportKey =
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  | 'textAlign'
  | 'textColumns'
  | 'textDecoration'
  | 'textTransform'
  | 'writingMode';
type ScaffoldSpacingSupportKey = 'blockGap' | 'margin' | 'padding';
type ScaffoldTypographyTextAlignment = 'left' | 'center' | 'right';

interface ScaffoldBlockBorderSupport {
  readonly color?: boolean;
  readonly radius?: boolean;
  readonly style?: boolean;
  readonly width?: boolean;
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
    'color' | 'radius' | 'style' | 'width'
  >;
}

interface ScaffoldBlockColorSupport {
  readonly background?: boolean;
  readonly button?: boolean;
  readonly enableContrastChecker?: boolean;
  readonly gradients?: boolean;
  readonly heading?: boolean;
  readonly link?: boolean;
  readonly text?: boolean;
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
    'background' | 'gradients' | 'link' | 'text'
  >;
}

interface ScaffoldBlockDimensionsSupport {
  readonly aspectRatio?: boolean;
  readonly height?: boolean;
  readonly minHeight?: boolean;
  readonly width?: boolean;
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
    'aspectRatio' | 'height' | 'minHeight' | 'width'
  >;
}

interface ScaffoldBlockFilterSupport {
  readonly duotone?: boolean;
}

interface ScaffoldBlockInteractivitySupport {
  readonly clientNavigation?: boolean;
  readonly interactive?: boolean;
}

interface ScaffoldBlockLayoutDefault {
  readonly columnCount?: number;
  readonly contentSize?: string;
  readonly allowInheriting?: boolean;
  readonly allowSizingOnChildren?: boolean;
  readonly flexWrap?: ScaffoldFlexWrap;
  readonly justifyContent?: ScaffoldJustifyContent;
  readonly minimumColumnWidth?: string;
  readonly orientation?: ScaffoldOrientation;
  readonly type?: ScaffoldLayoutType;
  readonly verticalAlignment?: ScaffoldBlockVerticalAlignment;
  readonly wideSize?: string;
}

interface ScaffoldBlockLayoutSupport {
  readonly allowCustomContentAndWideSize?: boolean;
  readonly allowEditing?: boolean;
  readonly allowInheriting?: boolean;
  readonly allowJustification?: boolean;
  readonly allowOrientation?: boolean;
  readonly allowSizingOnChildren?: boolean;
  readonly allowSwitching?: boolean;
  readonly allowVerticalAlignment?: boolean;
  readonly allowWrap?: boolean;
  readonly default?: ScaffoldBlockLayoutDefault;
}

interface ScaffoldBlockLightboxSupport {
  readonly allowEditing?: boolean;
  readonly enabled?: boolean;
}

interface ScaffoldBlockPositionSupport {
  readonly fixed?: boolean;
  readonly sticky?: boolean;
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
    'fixed' | 'sticky'
  >;
}

interface ScaffoldBlockShadowSupport {
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<'shadow'>;
}

interface ScaffoldBlockSpacingSupport {
  readonly blockGap?: boolean | readonly ScaffoldSpacingAxis[];
  readonly margin?: boolean | readonly ScaffoldSpacingDimension[];
  readonly padding?: boolean | readonly ScaffoldSpacingDimension[];
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<ScaffoldSpacingSupportKey>;
}

interface ScaffoldBlockTypographySupport {
  readonly fontFamily?: boolean;
  readonly fontSize?: boolean;
  readonly fontStyle?: boolean;
  readonly fontWeight?: boolean;
  readonly letterSpacing?: boolean;
  readonly lineHeight?: boolean;
  readonly textAlign?: boolean | readonly ScaffoldTypographyTextAlignment[];
  readonly textColumns?: boolean;
  readonly textDecoration?: boolean;
  readonly textTransform?: boolean;
  readonly writingMode?: boolean;
  readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<ScaffoldTypographySupportKey>;
}

type ScaffoldBlockSupportsOverride = {
  readonly align?: boolean | readonly ScaffoldBlockAlignment[];
  readonly alignWide?: boolean;
  readonly anchor?: boolean;
  readonly ariaLabel?: boolean;
  readonly border?: boolean | ScaffoldBlockBorderSupport;
  readonly className?: boolean;
  readonly color?: boolean | ScaffoldBlockColorSupport;
  readonly customClassName?: boolean;
  readonly dimensions?: boolean | ScaffoldBlockDimensionsSupport;
  readonly filter?: boolean | ScaffoldBlockFilterSupport;
  readonly html?: boolean;
  readonly inserter?: boolean;
  readonly interactivity?: boolean | ScaffoldBlockInteractivitySupport;
  readonly layout?: boolean | ScaffoldBlockLayoutSupport;
  readonly lightbox?: boolean | ScaffoldBlockLightboxSupport;
  readonly lock?: boolean;
  readonly multiple?: boolean;
  readonly position?: boolean | ScaffoldBlockPositionSupport;
  readonly renaming?: boolean;
  readonly reusable?: boolean;
  readonly shadow?: boolean | ScaffoldBlockShadowSupport;
  readonly spacing?: boolean | ScaffoldBlockSpacingSupport;
  readonly typography?: boolean | ScaffoldBlockTypographySupport;
};

export type ScaffoldBlockSupports = OverrideProperties<
  WordPressBlockSupports,
  ScaffoldBlockSupportsOverride
>;

export interface ScaffoldBlockRegistrationSettings {
  ancestor?: readonly string[];
  attributes?: WordPressScaffoldBlockConfiguration['attributes'];
  category?: WordPressScaffoldBlockConfiguration['category'];
  description?: WordPressScaffoldBlockConfiguration['description'];
  example?: WordPressScaffoldBlockConfiguration['example'];
  icon?: WordPressScaffoldBlockConfiguration['icon'];
  parent?: WordPressScaffoldBlockConfiguration['parent'];
  supports?: ScaffoldBlockSupports;
  title?: WordPressScaffoldBlockConfiguration['title'];
}

export interface ScaffoldBlockMetadata extends ScaffoldBlockRegistrationSettings {
  name: string;
}

/**
 * Wrapper helper for generated `block.json` modules.
 *
 * Wrapper files validate the raw JSON once at import time so downstream
 * scaffold code can consume typed metadata without repeating parse calls.
 */
export function defineScaffoldBlockMetadata<
  TMetadata extends Record<string, unknown>,
>(metadata: TMetadata): ScaffoldBlockMetadata & TMetadata {
  return parseScaffoldBlockMetadata<TMetadata>(metadata);
}

export interface BuildScaffoldBlockRegistrationResult<
  TName extends string = string,
  TSettings extends object = object,
> {
  name: TName;
  settings: TSettings;
}

/**
 * Build the registration payload consumed by generated block bootstrap code.
 *
 * @param metadata - Parsed block metadata containing the canonical block name.
 * @param overrides - Runtime overrides merged into the registration settings.
 * @returns The final block name and merged registration settings.
 * @example
 * ```ts
 * const registration = buildScaffoldBlockRegistration(metadata, overrides);
 * ```
 * @category Scaffolding
 */
export function buildScaffoldBlockRegistration<
  TMetadata extends ScaffoldBlockMetadataShape,
  TOverrides extends ScaffoldBlockRegistrationOverride,
>(
  metadata: TMetadata,
  overrides: TOverrides,
): BuildScaffoldBlockRegistrationResult<
  TMetadata['name'],
  MergedScaffoldBlockSettings<TMetadata, TOverrides>
> {
  const name = metadata.name;
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Scaffold block metadata must include a string name.');
  }

  const { name: _ignoredName, ...metadataSettings } = metadata;
  const settings: MergedScaffoldBlockSettings<TMetadata, TOverrides> = {
    ...metadataSettings,
    ...overrides,
  };

  return {
    name,
    settings,
  };
}

export function isScaffoldBlockMetadata(
  value: unknown,
): value is ScaffoldBlockMetadata {
  return (
    isPlainObject(value) &&
    typeof value.name === 'string' &&
    value.name.length > 0
  );
}

export function assertScaffoldBlockMetadata<TMetadata = ScaffoldBlockMetadata>(
  value: unknown,
): TMetadata & ScaffoldBlockMetadata {
  if (!isScaffoldBlockMetadata(value)) {
    throw new Error('Scaffold block metadata must include a string name.');
  }

  return value as TMetadata & ScaffoldBlockMetadata;
}

export function parseScaffoldBlockMetadata<
  TMetadata extends ScaffoldBlockMetadata,
>(metadata: TMetadata): TMetadata;
export function parseScaffoldBlockMetadata<TMetadata = ScaffoldBlockMetadata>(
  metadata: unknown,
): TMetadata & ScaffoldBlockMetadata;
export function parseScaffoldBlockMetadata<TMetadata = ScaffoldBlockMetadata>(
  metadata: unknown,
): TMetadata & ScaffoldBlockMetadata {
  return assertScaffoldBlockMetadata<TMetadata>(metadata);
}
