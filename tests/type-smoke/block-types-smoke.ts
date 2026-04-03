import type {
	BlockAlignment,
	BlockContentPosition,
	BlockVerticalAlignment,
	TextAlignment,
} from "@wp-typia/block-types/block-editor/alignment";
import type {
	CssColorValue,
	CssNamedColor,
	DuotonePalette,
} from "@wp-typia/block-types/block-editor/color";
import type {
	AspectRatio,
	MinHeightKeyword,
	MinHeightValue,
} from "@wp-typia/block-types/block-editor/dimensions";
import type { LayoutType } from "@wp-typia/block-types/block-editor/layout";
import type { SpacingDimension } from "@wp-typia/block-types/block-editor/spacing";
import type {
	BlockColorSupportAttributes,
	BlockStyleAttributes,
	BlockStyleSupportAttributes,
} from "@wp-typia/block-types/block-editor/style-attributes";
import type { TextTransform } from "@wp-typia/block-types/block-editor/typography";
import type {
	BlockSupports,
	TypographySupportKey,
} from "@wp-typia/block-types/blocks/supports";

const aspectRatio: AspectRatio = "16/9";
const blockAlignment: BlockAlignment = "wide";
const contentPosition: BlockContentPosition = "center right";
const layoutType: LayoutType = "flex";
const minHeightKeyword: MinHeightKeyword = "auto";
const minHeight: MinHeightValue = "320px";
const spacingDimension: SpacingDimension = "bottom";
const supportKey: TypographySupportKey = "fontStyle";
const blockSupports: BlockSupports = {
	align: ["wide", "full"],
	border: {
		color: true,
		radius: true,
	},
	color: {
		background: true,
		gradients: true,
		link: true,
		text: true,
	},
	interactivity: {
		clientNavigation: true,
		interactive: true,
	},
	layout: {
		allowSwitching: true,
		allowVerticalAlignment: true,
		allowWrap: true,
		default: {
			type: "flex",
			flexWrap: "nowrap",
			contentSize: "720px",
			wideSize: "1200px",
			verticalAlignment: "center",
			minimumColumnWidth: "16rem",
			columnCount: 3,
		},
	},
	spacing: {
		blockGap: ["horizontal", "vertical"],
		padding: ["top", "bottom", "left", "right", "horizontal"],
	},
	typography: {
		fontFamily: true,
		fontSize: true,
		textAlign: ["left", "right"],
		textTransform: true,
	},
};
const textAlignment: TextAlignment = "justify";
const textTransform: TextTransform = "capitalize";
const blockVerticalAlignment: BlockVerticalAlignment = "top";
const namedColor: CssNamedColor = "transparent";
const textColor: CssColorValue = "var(--wp--preset--color--primary)";
const supportStyleAttributes: BlockStyleSupportAttributes = {
	backgroundColor: "primary",
	fontSize: "large",
	style: {
		border: {
			radius: "12px",
		},
		color: {
			text: "var(--wp--preset--color--primary)",
			gradient: "var:preset|gradient|sunset",
		},
		spacing: {
			padding: {
				top: "1rem",
				horizontal: "2rem",
			},
		},
		typography: {
			fontSize: "var:preset|font-size|large",
			textTransform: "uppercase",
		},
	},
	textColor: "foreground",
};
const styleBag: BlockStyleAttributes = {
	color: {
		background: "var(--wp--preset--color--secondary)",
		text: "var(--wp--preset--color--primary)",
	},
	dimensions: {
		aspectRatio: "16/9",
		minHeight: "320px",
	},
};
const colorSupportAttrs: BlockColorSupportAttributes = {
	style: styleBag,
	textColor: "primary",
};
const duotonePalette: DuotonePalette = {
	colors: ["#111111", "rgba(255, 255, 255, 0.95)"],
	name: "High contrast",
	slug: "high-contrast",
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
void spacingDimension;
void styleBag;
void supportStyleAttributes;
void supportKey;
void textAlignment;
void textColor;
void textTransform;
void blockVerticalAlignment;
