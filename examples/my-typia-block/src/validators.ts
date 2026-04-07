/* eslint-disable no-console */
import typia from "typia";
import currentManifest from "../typia.manifest.json";
import {
  type ManifestDefaultsDocument,
  applyTemplateDefaultsFromManifest,
} from "@wp-typia/block-runtime/defaults";
import {
  createAttributeUpdater as createValidatedAttributeUpdater,
  createNestedAttributeUpdater as createValidatedNestedAttributeUpdater,
  type ValidationResult,
  toValidationResult,
} from "@wp-typia/block-runtime/validation";
import { MyTypiaBlockAttributes } from "./types";
import { generateUUID } from "./utils";

/**
 * Typia validators for the block attributes
 */
const validate = typia.createValidate<MyTypiaBlockAttributes>();
const assert = typia.createAssert<MyTypiaBlockAttributes>();
const is = typia.createIs<MyTypiaBlockAttributes>();
const random = typia.createRandom<MyTypiaBlockAttributes>();
const clone = typia.misc.createClone<MyTypiaBlockAttributes>();
const prune = typia.misc.createPrune<MyTypiaBlockAttributes>();

export const validateMyTypiaBlockAttributes = (
  attributes: unknown
): ValidationResult<MyTypiaBlockAttributes> => {
  return toValidationResult<MyTypiaBlockAttributes>(validate(attributes));
};

export const validators = {
  validate: validateMyTypiaBlockAttributes,
  assert,
  is,
  random,
  clone,
  prune,
};

export function sanitizeMyTypiaBlockAttributes(
  attributes: Partial<MyTypiaBlockAttributes>
): MyTypiaBlockAttributes {
  const normalized = applyTemplateDefaultsFromManifest<MyTypiaBlockAttributes>(
    currentManifest as ManifestDefaultsDocument,
    attributes
  );

  return validators.assert({
    ...normalized,
    id:
      normalized.id && normalized.id.length > 0
        ? normalized.id
        : generateUUID(),
  });
}

/**
 * Create safe attribute updater with validation
 * @param attributes
 * @param setAttributes
 * @param validator
 */
export function createAttributeUpdater(
  attributes: MyTypiaBlockAttributes,
  setAttributes: (attrs: Partial<MyTypiaBlockAttributes>) => void,
  validator = validators.validate
) {
  return createValidatedAttributeUpdater(
    attributes,
    setAttributes,
    validator as (
      value: MyTypiaBlockAttributes
    ) => ValidationResult<MyTypiaBlockAttributes>,
    (validation, key) => {
      console.error(`Validation failed for ${String(key)}:`, validation.errors);
    }
  );
}

export function createNestedAttributeUpdater(
  attributes: MyTypiaBlockAttributes,
  setAttributes: (attrs: Partial<MyTypiaBlockAttributes>) => void,
  validator = validators.validate
) {
  return createValidatedNestedAttributeUpdater(
    attributes,
    setAttributes,
    validator as (
      value: MyTypiaBlockAttributes
    ) => ValidationResult<MyTypiaBlockAttributes>,
    (validation, path) => {
      console.error(`Validation failed for ${path}:`, validation.errors);
    }
  );
}
