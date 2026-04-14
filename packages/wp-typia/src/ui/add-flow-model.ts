import { z } from "zod";

import {
	FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	getFirstPartyScrollTop,
	getFirstPartyViewportHeight,
} from "./first-party-form-model";

export const addFlowSchema = z.object({
	anchor: z.string().optional(),
	block: z.string().optional(),
	"data-storage": z.string().optional(),
	"external-layer-id": z.string().optional(),
	"external-layer-source": z.string().optional(),
	kind: z
		.enum(["block", "variation", "pattern", "binding-source", "hooked-block"])
		.default("block"),
	name: z.string().optional(),
	"persistence-policy": z.string().optional(),
	position: z.string().optional(),
	template: z.string().optional(),
});

export type AddFlowValues = z.infer<typeof addFlowSchema>;

export type AddFieldName =
	| "kind"
	| "name"
	| "template"
	| "block"
	| "anchor"
	| "position"
	| "data-storage"
	| "persistence-policy";

const ADD_FIELD_ORDER = [
	"kind",
	"name",
	"template",
	"block",
	"anchor",
	"position",
	"data-storage",
	"persistence-policy",
] as const satisfies ReadonlyArray<AddFieldName>;

const ADD_FIELD_HEIGHTS: Record<AddFieldName, number> = {
	anchor: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	block: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	"data-storage": FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	kind: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	name: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	"persistence-policy": FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	position: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	template: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
};

export function isAddPersistenceTemplate(template?: string): boolean {
	return template === "persistence" || template === "compound";
}

export function getVisibleAddFieldNames(values: Partial<AddFlowValues>): Array<AddFieldName> {
	switch (values.kind ?? "block") {
		case "variation":
			return ["kind", "name", "block"];
		case "pattern":
			return ["kind", "name"];
		case "binding-source":
			return ["kind", "name"];
		case "hooked-block":
			return ["kind", "name", "anchor", "position"];
		case "block":
		default:
			return ADD_FIELD_ORDER.filter((name) => {
				if (name === "data-storage" || name === "persistence-policy") {
					return isAddPersistenceTemplate(values.template);
				}
				return name === "kind" || name === "name" || name === "template";
			});
	}
}

export function getAddViewportHeight(terminalHeight = 24): number {
	return getFirstPartyViewportHeight(terminalHeight);
}

export function getAddScrollTop(options: {
	activeFieldName: string | null;
	values: Partial<AddFlowValues>;
	viewportHeight: number;
}): number {
	const { activeFieldName, values, viewportHeight } = options;
	return getFirstPartyScrollTop({
		activeFieldName,
		fieldHeights: ADD_FIELD_HEIGHTS,
		visibleFieldNames: getVisibleAddFieldNames(values),
		viewportHeight,
	});
}

export function sanitizeAddSubmitValues(values: AddFlowValues): Record<string, unknown> {
	const visibleFields = new Set(getVisibleAddFieldNames(values));
	const sanitized: Record<string, unknown> = {};

	for (const fieldName of visibleFields) {
		const value = values[fieldName];
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.length > 0) {
				sanitized[fieldName] = trimmed;
			}
			continue;
		}

		if (value !== undefined && value !== null) {
			sanitized[fieldName] = value;
		}
	}

	if ((values.kind ?? "block") === "block") {
		for (const hiddenFieldName of ["external-layer-source", "external-layer-id"] as const) {
			const value = values[hiddenFieldName];
			if (typeof value === "string") {
				const trimmed = value.trim();
				if (trimmed.length > 0) {
					sanitized[hiddenFieldName] = trimmed;
				}
			}
		}
	}

	return sanitized;
}
