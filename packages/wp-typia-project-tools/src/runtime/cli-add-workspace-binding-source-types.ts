import type { PostMetaBindingField } from "./post-meta-binding-fields.js";

export type BindingTarget = {
	attributeName: string;
	blockSlug: string;
};

export type BindingPostMetaSource = {
	fields: PostMetaBindingField[];
	metaKey: string;
	metaPath: string;
	postMetaSlug: string;
	postType: string;
	schemaFile: string;
	sourceTypeName: string;
};
