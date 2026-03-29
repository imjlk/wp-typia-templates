/**
 * Practical CSS color vocabulary used by block editor controls and theme.json values.
 */
export type CssColorValue =
	| `#${string}`
	| `rgb(${string})`
	| `rgba(${string})`
	| `hsl(${string})`
	| `hsla(${string})`
	| `var(${string})`
	| `color-mix(${string})`
	| "transparent"
	| "currentColor";

/**
 * Derived from Gutenberg duotone preset structures.
 */
export interface DuotonePalette {
	colors: readonly [CssColorValue, CssColorValue];
	name?: string;
	slug?: string;
}
