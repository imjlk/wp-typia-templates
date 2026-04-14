import { cloneJsonValue } from './json-utils.js';
import {
  isJsonValue,
  isNullableBoolean,
  isNullableJsonValue,
  isRecordOf,
} from './artifact-validation.js';
import { isPlainObject } from './object-utils.js';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface ManifestDefaultAttribute {
  typia: {
    defaultValue: JsonValue | null;
    hasDefault: boolean;
  };
  ts: {
    items: ManifestDefaultAttribute | null;
    kind: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'union';
    properties: Record<string, ManifestDefaultAttribute> | null;
    required: boolean;
    union: {
      branches: Record<string, ManifestDefaultAttribute>;
      discriminator: string;
    } | null;
  };
}

export interface ManifestDefaultsDocument {
  attributes: Record<string, ManifestDefaultAttribute>;
}

function isManifestDefaultAttribute(value: unknown): value is ManifestDefaultAttribute {
  if (!isPlainObject(value)) {
    return false;
  }

  const typia = value.typia;
  const ts = value.ts;
  if (!isPlainObject(typia) || !isPlainObject(ts)) {
    return false;
  }

  const items = ts.items;
  const properties = ts.properties;
  const union = ts.union;
  const hasDefault = typia.hasDefault;
  const hasValidDefaultValue =
    hasDefault === true
      ? 'defaultValue' in typia && isJsonValue(typia.defaultValue)
      : isNullableJsonValue(typia.defaultValue);

  return (
    hasValidDefaultValue &&
    isNullableBoolean(typia.hasDefault) &&
    (items === undefined ||
      items === null ||
      isManifestDefaultAttribute(items)) &&
    (properties === undefined ||
      properties === null ||
      isRecordOf(properties, isManifestDefaultAttribute)) &&
    (ts.required === undefined || typeof ts.required === 'boolean') &&
    (union === undefined ||
      union === null ||
      (isPlainObject(union) &&
        typeof union.discriminator === 'string' &&
        isRecordOf(union.branches, isManifestDefaultAttribute))) &&
    (ts.kind === 'string' ||
      ts.kind === 'number' ||
      ts.kind === 'boolean' ||
      ts.kind === 'array' ||
      ts.kind === 'object' ||
      ts.kind === 'union')
  );
}

export function isManifestDefaultsDocument(
  value: unknown,
): value is ManifestDefaultsDocument {
  return (
    isPlainObject(value) && isRecordOf(value.attributes, isManifestDefaultAttribute)
  );
}

export function assertManifestDefaultsDocument<
  TDocument = ManifestDefaultsDocument,
>(value: unknown): TDocument {
  if (!isManifestDefaultsDocument(value)) {
    throw new Error(
      'Manifest defaults document must contain an attributes record with scaffold default metadata.',
    );
  }

  return value as TDocument;
}

export function parseManifestDefaultsDocument<
  TDocument = ManifestDefaultsDocument,
>(value: unknown): TDocument {
  return assertManifestDefaultsDocument<TDocument>(value);
}

function isListArray(value: unknown[]): boolean {
  return value.every((_, index) => index in value);
}

function deriveDefaultValue(
  attribute: ManifestDefaultAttribute,
): JsonValue | undefined {
  if (attribute.typia.hasDefault) {
    return cloneJsonValue(attribute.typia.defaultValue);
  }

  if (attribute.ts.kind !== 'object' || !attribute.ts.properties) {
    return undefined;
  }

  const objectValue: Record<string, JsonValue> = {};

  for (const [name, child] of Object.entries(attribute.ts.properties)) {
    const childDefault = deriveDefaultValue(child);
    if (childDefault !== undefined) {
      objectValue[name] = childDefault;
    }
  }

  return Object.keys(objectValue).length > 0 ? objectValue : undefined;
}

function applyDefaultsForObject<TValue extends Record<string, unknown>>(
  value: TValue,
  schema: Record<string, ManifestDefaultAttribute>,
): TValue {
  const result: Record<string, unknown> = { ...value };

  for (const [name, attribute] of Object.entries(schema)) {
    if (!(name in result)) {
      const derivedDefault = deriveDefaultValue(attribute);
      if (derivedDefault !== undefined) {
        result[name] = derivedDefault;
      }
      continue;
    }

    result[name] = applyDefaultsForNode(result[name], attribute);
  }

  return result as TValue;
}

function applyDefaultsForUnion<TValue extends Record<string, unknown>>(
  value: TValue,
  attribute: ManifestDefaultAttribute,
): TValue {
  const union = attribute.ts.union;
  if (!union) {
    return value;
  }

  const discriminator = union.discriminator;
  const branchKey = value[discriminator];
  if (typeof branchKey !== 'string' || !(branchKey in union.branches)) {
    return value;
  }

  return applyDefaultsForRecord(value, union.branches[branchKey]);
}

function applyDefaultsForRecord<TValue extends Record<string, unknown>>(
  value: TValue,
  attribute: ManifestDefaultAttribute,
): TValue {
  if (attribute.ts.kind === 'object' && attribute.ts.properties) {
    return applyDefaultsForObject(value, attribute.ts.properties);
  }

  if (attribute.ts.kind === 'union') {
    return applyDefaultsForUnion(value, attribute);
  }

  return value;
}

function applyDefaultsForNode(
  value: unknown,
  attribute: ManifestDefaultAttribute,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (attribute.ts.kind) {
    case 'object':
      if (isPlainObject(value) && attribute.ts.properties) {
        return applyDefaultsForObject(value, attribute.ts.properties);
      }
      return value;
    case 'array':
      if (Array.isArray(value) && isListArray(value) && attribute.ts.items) {
        return value.map((item) =>
          applyDefaultsForNode(
            item,
            attribute.ts.items as ManifestDefaultAttribute,
          ),
        );
      }
      return value;
    case 'union':
      if (isPlainObject(value)) {
        return applyDefaultsForUnion(value, attribute);
      }
      return value;
    default:
      return value;
  }
}

export function applyTemplateDefaultsFromManifest<T extends object>(
  manifest: ManifestDefaultsDocument,
  value: Partial<T>,
): Partial<T> {
  return applyDefaultsForObject(
    value as Record<string, unknown>,
    manifest.attributes,
  ) as Partial<T>;
}
