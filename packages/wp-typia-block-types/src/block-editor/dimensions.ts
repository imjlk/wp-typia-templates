/**
 * Derived from Gutenberg aspect ratio presets and dimensions controls.
 */
export type AspectRatio =
	| "auto"
	| "1"
	| "1/1"
	| "4/3"
	| "3/4"
	| "3/2"
	| "2/3"
	| "16/9"
	| "9/16"
	| "21/9";

export const ASPECT_RATIOS = [
	"auto",
	"1",
	"1/1",
	"4/3",
	"3/4",
	"3/2",
	"2/3",
	"16/9",
	"9/16",
	"21/9",
] as const satisfies readonly AspectRatio[];

/**
 * Practical min-height value surface for WordPress dimension controls.
 */
export type MinHeightValue =
	| `${number}px`
	| `${number}rem`
	| `${number}em`
	| `${number}%`
	| `${number}vh`
	| `${number}vw`
	| `var(${string})`
	| `clamp(${string})`
	| `min(${string})`
	| `max(${string})`;
