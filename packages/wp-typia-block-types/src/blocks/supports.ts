import type {
  BlockAlignment,
  BlockVerticalAlignment,
  JustifyContent,
  TextAlignment,
} from '../block-editor/alignment';
import type { FlexWrap, LayoutType, Orientation } from '../block-editor/layout';
import type { SpacingAxis, SpacingDimension } from '../block-editor/spacing';

/**
 * Derived from Gutenberg block support keys and commonly used block.json
 * support sections.
 */
export type BlockSupportFeature =
  | 'align'
  | 'alignWide'
  | 'anchor'
  | 'ariaLabel'
  | 'border'
  | 'className'
  | 'color'
  | 'customClassName'
  | 'dimensions'
  | 'filter'
  | 'html'
  | 'inserter'
  | 'interactivity'
  | 'js'
  | 'layout'
  | 'lightbox'
  | 'lock'
  | 'locking'
  | 'multiple'
  | 'position'
  | 'renaming'
  | 'reusable'
  | 'shadow'
  | 'spacing'
  | 'typography';

export const BLOCK_SUPPORT_FEATURES = [
  'align',
  'alignWide',
  'anchor',
  'ariaLabel',
  'border',
  'className',
  'color',
  'customClassName',
  'dimensions',
  'filter',
  'html',
  'inserter',
  'interactivity',
  'js',
  'layout',
  'lightbox',
  'lock',
  'locking',
  'multiple',
  'position',
  'renaming',
  'reusable',
  'shadow',
  'spacing',
  'typography',
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

export interface BlockBorderSupport {
  readonly color?: boolean;
  readonly radius?: boolean;
  readonly style?: boolean;
  readonly width?: boolean;
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<
    'color' | 'radius' | 'style' | 'width'
  >;
}

export interface BlockColorSupport {
  readonly background?: boolean;
  readonly backgroundImage?: boolean;
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
  readonly __experimentalDefaultControls?: BlockSupportDefaultControls<
    'background' | 'gradients' | 'link' | 'text'
  >;
}

export interface BlockDimensionsSupport {
  readonly aspectRatio?: boolean;
  readonly height?: boolean;
  readonly minHeight?: boolean;
  readonly width?: boolean;
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
  readonly textAlign?: boolean | readonly Exclude<TextAlignment, 'justify'>[];
  readonly textColumns?: boolean;
  readonly textDecoration?: boolean;
  readonly textTransform?: boolean;
  readonly writingMode?: boolean;
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
  readonly anchor?: boolean;
  readonly ariaLabel?: boolean;
  readonly border?: boolean | BlockBorderSupport;
  readonly className?: boolean;
  readonly color?: boolean | BlockColorSupport;
  readonly customClassName?: boolean;
  readonly dimensions?: boolean | BlockDimensionsSupport;
  readonly filter?: boolean | BlockFilterSupport;
  readonly html?: boolean;
  readonly inserter?: boolean;
  readonly interactivity?: boolean | BlockInteractivitySupport;
  readonly js?: boolean;
  readonly layout?: boolean | BlockLayoutSupport;
  readonly lightbox?: boolean | BlockLightboxSupport;
  readonly lock?: boolean;
  readonly locking?: boolean;
  readonly multiple?: boolean;
  readonly position?: boolean | BlockPositionSupport;
  readonly renaming?: boolean;
  readonly reusable?: boolean;
  readonly shadow?: boolean | BlockShadowSupport;
  readonly spacing?: boolean | BlockSpacingSupport;
  readonly typography?: boolean | BlockTypographySupport;
}
