import typia from "typia";
import currentManifest from "./typia.manifest.json";
import {
  type ManifestDefaultsDocument,
} from "@wp-typia/create/runtime/defaults";
import {
  createScaffoldValidatorToolkit,
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
const scaffoldValidators = createScaffoldValidatorToolkit<{{pascalCase}}Attributes>({
  manifest: currentManifest as ManifestDefaultsDocument,
  validate,
  assert,
  is,
  random,
  clone,
  prune,
  finalize: (normalized) => ({
    ...normalized,
    id: normalized.id && normalized.id.length > 0 ? normalized.id : generateRuntimeId(),
  }),
});

export const validate{{pascalCase}}Attributes =
  scaffoldValidators.validateAttributes as (
    attributes: unknown,
  ) => {{pascalCase}}ValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}Attributes =
  scaffoldValidators.sanitizeAttributes as (
    attributes: Partial<{{pascalCase}}Attributes>,
  ) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;

function generateRuntimeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
