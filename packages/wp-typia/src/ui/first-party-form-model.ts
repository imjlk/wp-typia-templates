export const FIRST_PARTY_FIELD_GAP = 1;
export const FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT = 6;
export const FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT = 2;
export const FIRST_PARTY_SELECT_FIELD_LABEL_GAP = 1;
export const FIRST_PARTY_SELECT_FIELD_CONTROL_HEIGHT = 3;
export const FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT =
	1 + FIRST_PARTY_SELECT_FIELD_LABEL_GAP + FIRST_PARTY_SELECT_FIELD_CONTROL_HEIGHT + 1;

export type FirstPartyFieldHeights<TName extends string> = Record<TName, number>;

export function getWrappedFieldNeighbors<TName extends string>(
	visibleFieldNames: ReadonlyArray<TName>,
	fieldName: TName,
): {
	nextFieldName?: TName;
	previousFieldName?: TName;
} {
	const index = visibleFieldNames.indexOf(fieldName);
	if (index === -1 || visibleFieldNames.length === 0) {
		return {};
	}

	return {
		nextFieldName: visibleFieldNames[(index + 1) % visibleFieldNames.length],
		previousFieldName:
			visibleFieldNames[(index - 1 + visibleFieldNames.length) % visibleFieldNames.length],
	};
}

export function getFirstPartyViewportHeight(terminalHeight = 24): number {
	return Math.max(8, Math.min(28, terminalHeight - 12));
}

export function getFirstPartyScrollTop<TName extends string>(options: {
	activeFieldName: string | null;
	fieldHeights: FirstPartyFieldHeights<TName>;
	visibleFieldNames: ReadonlyArray<TName>;
	viewportHeight: number;
}): number {
	const { activeFieldName, fieldHeights, visibleFieldNames, viewportHeight } = options;
	if (!activeFieldName) {
		return 0;
	}

	let offset = 0;
	for (const fieldName of visibleFieldNames) {
		const fieldHeight = fieldHeights[fieldName];
		if (fieldName === activeFieldName) {
			const safeViewportHeight = Math.max(4, viewportHeight - 2);
			const fieldBottom = offset + fieldHeight;
			if (fieldBottom <= safeViewportHeight) {
				return 0;
			}

			return Math.max(0, fieldBottom - safeViewportHeight + 1);
		}

		offset += fieldHeight + FIRST_PARTY_FIELD_GAP;
	}

	return 0;
}
