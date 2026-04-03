import typia from "typia";
import currentManifest from "./typia.manifest.json";
import {
  type ManifestDefaultsDocument,
  applyTemplateDefaultsFromManifest,
} from "@wp-typia/create/runtime/defaults";
import {
  createAttributeUpdater as createValidatedAttributeUpdater,
  type ValidationResult,
  toValidationResult,
} from "@wp-typia/create/runtime/validation";
import { {{pascalCase}}Attributes, {{pascalCase}}ValidationResult } from "./types";

/**
 * Typia validator helpers
 */
const validate = typia.createValidate<{{pascalCase}}Attributes>();
const assert = typia.createAssert<{{pascalCase}}Attributes>();
const is = typia.createIs<{{pascalCase}}Attributes>();
const random = typia.createRandom<{{pascalCase}}Attributes>();
const clone = typia.misc.createClone<{{pascalCase}}Attributes>();
const prune = typia.misc.createPrune<{{pascalCase}}Attributes>();

export const validate{{pascalCase}}Attributes = (
  attributes: unknown,
): {{pascalCase}}ValidationResult => {
  return toValidationResult(validate(attributes));
};

export const validators = {
  validate: validate{{pascalCase}}Attributes,
  assert,
  is,
  random,
  clone,
  prune,
};

export function sanitize{{pascalCase}}Attributes(
  attributes: Partial<{{pascalCase}}Attributes>,
): {{pascalCase}}Attributes {
  const normalized = applyTemplateDefaultsFromManifest<{{pascalCase}}Attributes>(
    currentManifest as ManifestDefaultsDocument,
    attributes,
  );

  return validators.assert({
    ...normalized,
    id: normalized.id && normalized.id.length > 0 ? normalized.id : generateRuntimeId(),
  });
}

/**
 * Create a validated attribute updater.
 */
export function createAttributeUpdater(
  attributes: {{pascalCase}}Attributes,
  setAttributes: (attrs: Partial<{{pascalCase}}Attributes>) => void,
  validator = validators.validate
) {
  return createValidatedAttributeUpdater(
    attributes,
    setAttributes,
    validator as (value: {{pascalCase}}Attributes) => ValidationResult<{{pascalCase}}Attributes>,
    (validation, key) => {
      console.error(`Validation failed for ${String(key)}:`, validation.errors);
    },
  );
}

function generateRuntimeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
