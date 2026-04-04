import type {
  BlockAlignment,
  BlockContentPosition,
  BlockVerticalAlignment,
  TextAlignment,
} from '@wp-typia/block-types/block-editor/alignment';
import type {
  CssColorValue,
  CssNamedColor,
  DuotonePalette,
} from '@wp-typia/block-types/block-editor/color';
import type {
  AspectRatio,
  MinHeightKeyword,
  MinHeightValue,
} from '@wp-typia/block-types/block-editor/dimensions';
import type { LayoutType } from '@wp-typia/block-types/block-editor/layout';
import type { SpacingDimension } from '@wp-typia/block-types/block-editor/spacing';
import type {
  BlockColorSupportAttributes,
  BlockShadowStyleAttributes,
  BlockStyleAttributes,
  BlockStyleSupportAttributes,
  PresetDuotoneReference,
} from '@wp-typia/block-types/block-editor/style-attributes';
import type { TextTransform } from '@wp-typia/block-types/block-editor/typography';
import type {
  BlockSupports,
  SpacingSize,
  TypographySupportKey,
} from '@wp-typia/block-types/blocks/supports';

const aspectRatio: AspectRatio = '16/9';
const blockAlignment: BlockAlignment = 'wide';
const contentPosition: BlockContentPosition = 'center right';
const layoutType: LayoutType = 'flex';
const minHeightKeyword: MinHeightKeyword = 'auto';
const minHeight: MinHeightValue = '320px';
const presetDuotone: PresetDuotoneReference =
  'var:preset|duotone|high-contrast';
const shadowValue: BlockShadowStyleAttributes =
  '0 10px 30px rgba(0, 0, 0, 0.2)';
const spacingDimension: SpacingDimension = 'bottom';
const spacingSize: SpacingSize = {
  name: 'XL',
  size: '2rem',
  slug: 'xl',
};
const supportKey: TypographySupportKey = 'dropCap';
const blockSupports: BlockSupports = {
  align: ['wide', 'full'],
  background: {
    backgroundImage: true,
    backgroundSize: true,
  },
  border: {
    color: true,
    radius: true,
    __experimentalSkipSerialization: ['radius', 'width'],
  },
  color: {
    background: true,
    enableAlpha: true,
    gradients: true,
    link: true,
    text: true,
    __experimentalSkipSerialization: ['background', 'text'],
  },
  dimensions: {
    aspectRatio: true,
    minHeight: true,
    __experimentalSkipSerialization: ['minHeight'],
  },
  interactivity: {
    clientNavigation: true,
    interactive: true,
  },
  js: true,
  layout: {
    allowSwitching: true,
    allowVerticalAlignment: true,
    allowWrap: true,
    default: {
      type: 'flex',
      flexWrap: 'nowrap',
      contentSize: '720px',
      wideSize: '1200px',
      verticalAlignment: 'center',
      minimumColumnWidth: '16rem',
      columnCount: 3,
      columnGap: '2rem',
      rowGap: '1.5rem',
    },
  },
  locking: true,
  spacing: {
    blockGap: ['horizontal', 'vertical'],
    margin: ['top', 'bottom'],
    padding: ['top', 'bottom', 'left', 'right', 'horizontal'],
    spacingSizes: [spacingSize],
    units: ['px', 'rem', 'em'],
    __experimentalSkipSerialization: ['margin', 'padding'],
  },
  typography: {
    dropCap: true,
    fontFamily: true,
    fontSize: true,
    textAlign: ['left', 'justify'],
    textTransform: true,
    __experimentalSkipSerialization: true,
  },
};
const textAlignment: TextAlignment = 'justify';
const textTransform: TextTransform = 'capitalize';
const blockVerticalAlignment: BlockVerticalAlignment = 'top';
const namedColor: CssNamedColor = 'transparent';
const textColor: CssColorValue = 'var(--wp--preset--color--primary)';
const supportStyleAttributes: BlockStyleSupportAttributes = {
  backgroundColor: 'primary',
  fontSize: 'large',
  style: {
    border: {
      bottomWidth: '1px',
      leftWidth: '2px',
      radius: '12px',
      rightWidth: '2px',
      topWidth: '3px',
    },
    color: {
      duotone: ['#111111', 'rgba(255, 255, 255, 0.95)'],
      text: 'var(--wp--preset--color--primary)',
      gradient: 'var:preset|gradient|sunset',
    },
    shadow: shadowValue,
    spacing: {
      padding: {
        top: '1rem',
        horizontal: '2rem',
      },
    },
    typography: {
      fontSize: 'var:preset|font-size|large',
      textTransform: 'uppercase',
    },
  },
  textColor: 'foreground',
};
const styleBag: BlockStyleAttributes = {
  color: {
    background: 'var(--wp--preset--color--secondary)',
    duotone: presetDuotone,
    text: 'var(--wp--preset--color--primary)',
  },
  dimensions: {
    aspectRatio: '16/9',
    minHeight: '320px',
  },
  shadow: shadowValue,
};
const colorSupportAttrs: BlockColorSupportAttributes = {
  style: styleBag,
  textColor: 'primary',
};
const duotonePalette: DuotonePalette = {
  colors: ['#111111', 'rgba(255, 255, 255, 0.95)'],
  name: 'High contrast',
  slug: 'high-contrast',
};

void aspectRatio;
void blockAlignment;
void blockSupports;
void contentPosition;
void colorSupportAttrs;
void duotonePalette;
void layoutType;
void minHeightKeyword;
void minHeight;
void namedColor;
void presetDuotone;
void shadowValue;
void spacingDimension;
void spacingSize;
void styleBag;
void supportStyleAttributes;
void supportKey;
void textAlignment;
void textColor;
void textTransform;
void blockVerticalAlignment;
