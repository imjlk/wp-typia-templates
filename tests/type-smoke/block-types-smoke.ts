import type {
	BlockAlignment,
	BlockContentPosition,
	BlockVerticalAlignment,
	TextAlignment,
} from "@wp-typia/block-types/block-editor/alignment";
import type { LayoutType } from "@wp-typia/block-types/block-editor/layout";
import type { SpacingDimension } from "@wp-typia/block-types/block-editor/spacing";
import type { TextTransform } from "@wp-typia/block-types/block-editor/typography";
import type { TypographySupportKey } from "@wp-typia/block-types/blocks/supports";

const blockAlignment: BlockAlignment = "wide";
const contentPosition: BlockContentPosition = "center right";
const layoutType: LayoutType = "flex";
const spacingDimension: SpacingDimension = "bottom";
const supportKey: TypographySupportKey = "fontStyle";
const textAlignment: TextAlignment = "justify";
const textTransform: TextTransform = "capitalize";
const blockVerticalAlignment: BlockVerticalAlignment = "top";

void blockAlignment;
void contentPosition;
void layoutType;
void spacingDimension;
void supportKey;
void textAlignment;
void textTransform;
void blockVerticalAlignment;
