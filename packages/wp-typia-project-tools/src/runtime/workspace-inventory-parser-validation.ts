import type {
	WorkspaceInventoryAppendOptionKey,
	WorkspaceInventoryEntriesKey,
	WorkspaceInventorySectionFlagKey,
} from "./workspace-inventory-types.js";

export type InventoryEntryFieldValue = string | string[] | boolean | undefined;

export type InventoryEntryFieldValidationContext = {
	elementIndex: number;
	entryName: string;
	key: string;
};

type InventoryEntryFieldDescriptor = {
	key: string;
	kind?: "boolean" | "string" | "stringArray";
	required?: boolean;
	validate?: (
		value: InventoryEntryFieldValue,
		context: InventoryEntryFieldValidationContext,
	) => void;
};

export type InventoryEntryParserDescriptor = {
	entryName: string;
	fields: readonly InventoryEntryFieldDescriptor[];
};

type RequiredInventoryEntryKey<T extends object> = Extract<
	{
		[Key in keyof T]-?: undefined extends T[Key] ? never : Key;
	}[keyof T],
	string
>;

type TypedInventoryEntryFieldDescriptor<
	T extends object,
	TKey extends Extract<keyof T, string> = Extract<keyof T, string>,
> =
	TKey extends Extract<keyof T, string>
		? Omit<InventoryEntryFieldDescriptor, "key" | "required"> & {
				key: TKey;
			} & (TKey extends RequiredInventoryEntryKey<T>
					? { required: true }
					: { required?: boolean })
		: never;

type RequiredInventoryEntryFieldDescriptor<T extends object> = Omit<
	InventoryEntryFieldDescriptor,
	"key" | "required"
> & {
	key: RequiredInventoryEntryKey<T>;
	required: true;
};

type MissingRequiredInventoryEntryKeys<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> = Exclude<RequiredInventoryEntryKey<T>, TFields[number]["key"]>;

type RequiredInventoryEntryFieldsPresent<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> =
	MissingRequiredInventoryEntryKeys<T, TFields> extends never
		? unknown
		: {
				missingRequiredInventoryEntryFields: MissingRequiredInventoryEntryKeys<
					T,
					TFields
				>;
			};

type RequiredInventoryEntryFieldsMarkedRequired<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> =
	Extract<
		TFields[number],
		{ key: RequiredInventoryEntryKey<T> }
	> extends RequiredInventoryEntryFieldDescriptor<T>
		? unknown
		: {
				requiredInventoryEntryFieldsMustSetRequiredTrue: RequiredInventoryEntryKey<T>;
			};

export type InventorySectionDescriptor = {
	/** Optional marker metadata used when appending generated entries. */
	append?: {
		marker: string;
		optionKey: WorkspaceInventoryAppendOptionKey;
	};
	/** Optional exported interface that backs the inventory section entries. */
	interface?: {
		name: string;
		section: string;
	};
	/** Optional parser metadata for descriptor-driven inventory reads. */
	parse?: {
		entriesKey: WorkspaceInventoryEntriesKey;
		entry: InventoryEntryParserDescriptor;
		exportName?: string;
		hasSectionKey?: WorkspaceInventorySectionFlagKey;
		required?: boolean;
	};
	/** Optional exported const array that stores the inventory section entries. */
	value?: {
		name: string;
		section: string;
	};
};

export function defineInventoryEntryParser<T extends object>() {
	return <
		const TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
	>(
		descriptor: {
			entryName: string;
			fields: TFields;
		} & RequiredInventoryEntryFieldsPresent<T, TFields> &
			RequiredInventoryEntryFieldsMarkedRequired<T, TFields>,
	): InventoryEntryParserDescriptor => descriptor;
}

function isMissingRequiredInventoryValue(
	value: InventoryEntryFieldValue,
): boolean {
	return (
		value === undefined || (typeof value === "string" && value.length === 0)
	);
}

function formatMissingRequiredInventoryFields(keys: readonly string[]): string {
	return keys.length === 1
		? `required "${keys[0]}"`
		: `required fields ${keys.map((key) => `"${key}"`).join(", ")}`;
}

export function assertParsedInventoryEntry<T extends object>(
	entry: Record<string, InventoryEntryFieldValue>,
	descriptor: InventoryEntryParserDescriptor,
	elementIndex: number,
): asserts entry is Record<string, InventoryEntryFieldValue> & T {
	const missingRequiredKeys = descriptor.fields
		.filter(
			(field) =>
				field.required === true &&
				isMissingRequiredInventoryValue(entry[field.key]),
		)
		.map((field) => field.key);

	if (missingRequiredKeys.length > 0) {
		throw new Error(
			`${descriptor.entryName}[${elementIndex}] is missing ${formatMissingRequiredInventoryFields(missingRequiredKeys)} in scripts/block-config.ts.`,
		);
	}
}
