import { z } from "zod";

import {
	FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	getFirstPartyScrollTop,
	getFirstPartyViewportHeight,
} from "./first-party-form-model";

export const createFlowSchema = z.object({
	"data-storage": z.string().optional(),
	namespace: z.string().optional(),
	"no-install": z.boolean().default(false),
	"package-manager": z.string().optional(),
	"persistence-policy": z.string().optional(),
	"php-prefix": z.string().optional(),
	"project-dir": z.string().min(1),
	template: z.string().optional(),
	"text-domain": z.string().optional(),
	variant: z.string().optional(),
	"with-migration-ui": z.boolean().default(false),
	"with-test-preset": z.boolean().default(false),
	"with-wp-env": z.boolean().default(false),
	yes: z.boolean().default(false),
});

export type CreateFlowValues = z.infer<typeof createFlowSchema>;

export type CreateFieldName =
	| "project-dir"
	| "template"
	| "package-manager"
	| "namespace"
	| "text-domain"
	| "php-prefix"
	| "data-storage"
	| "persistence-policy"
	| "no-install"
	| "yes"
	| "with-wp-env"
	| "with-test-preset"
	| "with-migration-ui";

export const CREATE_CHECKBOX_FIELD_NAMES = [
	"no-install",
	"yes",
	"with-wp-env",
	"with-test-preset",
	"with-migration-ui",
] as const satisfies ReadonlyArray<CreateFieldName>;

export const CREATE_FIELD_ORDER = [
	"project-dir",
	"template",
	"package-manager",
	"namespace",
	"text-domain",
	"php-prefix",
	"data-storage",
	"persistence-policy",
	...CREATE_CHECKBOX_FIELD_NAMES,
] as const satisfies ReadonlyArray<CreateFieldName>;

const CREATE_FIELD_HEIGHTS: Record<CreateFieldName, number> = {
	"data-storage": FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	namespace: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	"no-install": FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	"package-manager": FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	"persistence-policy": FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	"php-prefix": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	"project-dir": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	template: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	"text-domain": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	yes: FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	"with-migration-ui": FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	"with-test-preset": FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	"with-wp-env": FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
};

export function isCreatePersistenceTemplate(template?: string): boolean {
	return template === "persistence" || template === "compound";
}

export function getVisibleCreateFieldNames(
	values: Partial<CreateFlowValues>,
): Array<CreateFieldName> {
	return CREATE_FIELD_ORDER.filter((name) => {
		if (name === "data-storage" || name === "persistence-policy") {
			return isCreatePersistenceTemplate(values.template);
		}

		return true;
	});
}

export function getCreateViewportHeight(terminalHeight = 24): number {
	return getFirstPartyViewportHeight(terminalHeight);
}

export function getCreateScrollTop(options: {
	activeFieldName: string | null;
	values: Partial<CreateFlowValues>;
	viewportHeight: number;
}): number {
	const { activeFieldName, values, viewportHeight } = options;
	return getFirstPartyScrollTop({
		activeFieldName,
		fieldHeights: CREATE_FIELD_HEIGHTS,
		visibleFieldNames: getVisibleCreateFieldNames(values),
		viewportHeight,
	});
}

export function sanitizeCreateSubmitValues(values: CreateFlowValues): CreateFlowValues {
	if (isCreatePersistenceTemplate(values.template)) {
		return values;
	}

	return {
		...values,
		"data-storage": undefined,
		"persistence-policy": undefined,
	};
}
