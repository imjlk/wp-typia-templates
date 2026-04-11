import { z } from "zod";

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
	"data-storage": 5,
	namespace: 6,
	"no-install": 2,
	"package-manager": 5,
	"persistence-policy": 5,
	"php-prefix": 6,
	"project-dir": 6,
	template: 5,
	"text-domain": 6,
	yes: 2,
	"with-migration-ui": 2,
	"with-test-preset": 2,
	"with-wp-env": 2,
};

const CREATE_FIELD_GAP = 1;

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
	return Math.max(8, Math.min(28, terminalHeight - 12));
}

export function getCreateScrollTop(options: {
	activeFieldName: string | null;
	values: Partial<CreateFlowValues>;
	viewportHeight: number;
}): number {
	const { activeFieldName, values, viewportHeight } = options;
	if (!activeFieldName) {
		return 0;
	}

	const visibleFields = getVisibleCreateFieldNames(values);
	let offset = 0;

	for (const fieldName of visibleFields) {
		const fieldHeight = CREATE_FIELD_HEIGHTS[fieldName];
		if (fieldName === activeFieldName) {
			const safeViewportHeight = Math.max(4, viewportHeight - 2);
			const fieldBottom = offset + fieldHeight;
			if (fieldBottom <= safeViewportHeight) {
				return 0;
			}

			return Math.max(0, fieldBottom - safeViewportHeight + 1);
		}

		offset += fieldHeight + CREATE_FIELD_GAP;
	}

	return 0;
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
