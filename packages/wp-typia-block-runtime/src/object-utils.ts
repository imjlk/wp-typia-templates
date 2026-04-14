import { isPlainObject as isSharedPlainObject } from '@wp-typia/api-client/runtime-primitives';

export type UnknownRecord<TValue = unknown> = Record<string, TValue>;

export function isPlainObject(value: unknown): value is UnknownRecord {
  return isSharedPlainObject(value);
}
