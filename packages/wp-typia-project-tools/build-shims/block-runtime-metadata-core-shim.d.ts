import type {} from "typia";
export * from "../../wp-typia-block-runtime/dist/metadata-core.js";

declare module "typia" {
	export namespace tags {
		export type Source<Value extends "html" | "text" | "rich-text"> = {
			readonly __wpTypiaSource?: Value;
		};

		export type Selector<Value extends string> = {
			readonly __wpTypiaSelector?: Value;
		};
	}
}
