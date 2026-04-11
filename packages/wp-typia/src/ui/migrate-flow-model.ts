import { z } from "zod";

import {
	FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	getFirstPartyScrollTop,
	getFirstPartyViewportHeight,
} from "./first-party-form-model";

export const migrateFlowSchema = z.object({
	all: z.boolean().default(false),
	command: z.enum([
		"init",
		"snapshot",
		"plan",
		"wizard",
		"diff",
		"scaffold",
		"verify",
		"doctor",
		"fixtures",
		"fuzz",
	]),
	"current-migration-version": z.string().optional(),
	force: z.boolean().default(false),
	"from-migration-version": z.string().optional(),
	iterations: z.string().optional(),
	"migration-version": z.string().optional(),
	seed: z.string().optional(),
	"to-migration-version": z.string().optional(),
});

export type MigrateFlowValues = z.infer<typeof migrateFlowSchema>;

export type MigrateFieldName =
	| "command"
	| "current-migration-version"
	| "migration-version"
	| "from-migration-version"
	| "to-migration-version"
	| "all"
	| "force"
	| "iterations"
	| "seed";

const MIGRATE_FIELD_HEIGHTS: Record<MigrateFieldName, number> = {
	all: FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	command: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
	"current-migration-version": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	force: FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
	"from-migration-version": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	iterations: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	"migration-version": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	seed: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
	"to-migration-version": FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
};

export function getVisibleMigrateFieldNames(
	values: Partial<MigrateFlowValues>,
): Array<MigrateFieldName> {
	switch (values.command ?? "plan") {
		case "init":
			return ["command", "current-migration-version"];
		case "snapshot":
			return ["command", "migration-version"];
		case "plan":
			return ["command", "from-migration-version", "to-migration-version"];
		case "wizard":
			return ["command"];
		case "diff":
			return ["command", "from-migration-version", "to-migration-version"];
		case "scaffold":
			return ["command", "from-migration-version", "to-migration-version"];
		case "verify":
			return ["command", "from-migration-version", "all"];
		case "doctor":
			return ["command", "from-migration-version", "all"];
		case "fixtures":
			return ["command", "from-migration-version", "to-migration-version", "all", "force"];
		case "fuzz":
			return ["command", "from-migration-version", "all", "iterations", "seed"];
		default:
			return ["command"];
	}
}

export function getMigrateViewportHeight(terminalHeight = 24): number {
	return getFirstPartyViewportHeight(terminalHeight);
}

export function getMigrateScrollTop(options: {
	activeFieldName: string | null;
	values: Partial<MigrateFlowValues>;
	viewportHeight: number;
}): number {
	const { activeFieldName, values, viewportHeight } = options;
	return getFirstPartyScrollTop({
		activeFieldName,
		fieldHeights: MIGRATE_FIELD_HEIGHTS,
		visibleFieldNames: getVisibleMigrateFieldNames(values),
		viewportHeight,
	});
}

export function sanitizeMigrateSubmitValues(values: MigrateFlowValues): Record<string, unknown> {
	const visibleFields = new Set(getVisibleMigrateFieldNames(values));
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

	return sanitized;
}
