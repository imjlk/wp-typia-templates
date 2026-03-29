/**
 * Derived from @wordpress/blocks support constants and block support paths.
 */
export type BlockSupportFeature =
	| "align"
	| "anchor"
	| "ariaLabel"
	| "border"
	| "className"
	| "color"
	| "dimensions"
	| "filter"
	| "html"
	| "interactivity"
	| "layout"
	| "lightbox"
	| "lock"
	| "position"
	| "renaming"
	| "shadow"
	| "spacing"
	| "typography";

export const BLOCK_SUPPORT_FEATURES = [
	"align",
	"anchor",
	"ariaLabel",
	"border",
	"className",
	"color",
	"dimensions",
	"filter",
	"html",
	"interactivity",
	"layout",
	"lightbox",
	"lock",
	"position",
	"renaming",
	"shadow",
	"spacing",
	"typography",
] as const satisfies readonly BlockSupportFeature[];

export type TypographySupportKey =
	| "fontFamily"
	| "fontSize"
	| "fontStyle"
	| "fontWeight"
	| "letterSpacing"
	| "lineHeight"
	| "textAlign"
	| "textColumns"
	| "textDecoration"
	| "textTransform"
	| "writingMode";

export const TYPOGRAPHY_SUPPORT_KEYS = [
	"fontFamily",
	"fontSize",
	"fontStyle",
	"fontWeight",
	"letterSpacing",
	"lineHeight",
	"textAlign",
	"textColumns",
	"textDecoration",
	"textTransform",
	"writingMode",
] as const satisfies readonly TypographySupportKey[];

export type SpacingSupportKey = "blockGap" | "margin" | "padding";

export const SPACING_SUPPORT_KEYS = [
	"blockGap",
	"margin",
	"padding",
] as const satisfies readonly SpacingSupportKey[];
