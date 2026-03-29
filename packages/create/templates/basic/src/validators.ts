import typia from "typia";
import currentManifest from "./typia.manifest.json";
import {
  type ManifestDefaultsDocument,
  applyTemplateDefaultsFromManifest,
} from "@wp-typia/create/runtime/defaults";
import { {{pascalCase}}Attributes } from "./types";

/**
 * Typia 유효성 검증기
 */
export const validators = {
  validate: typia.createValidate<{{pascalCase}}Attributes>(),
  assert: typia.createAssert<{{pascalCase}}Attributes>(),
  is: typia.createIs<{{pascalCase}}Attributes>(),
  random: typia.createRandom<{{pascalCase}}Attributes>(),
  clone: typia.misc.createClone<{{pascalCase}}Attributes>(),
  prune: typia.misc.createPrune<{{pascalCase}}Attributes>(),
};

export function sanitize{{pascalCase}}Attributes(
  attributes: Partial<{{pascalCase}}Attributes>,
): {{pascalCase}}Attributes {
  const normalized = applyTemplateDefaultsFromManifest<{{pascalCase}}Attributes>(
    currentManifest as ManifestDefaultsDocument,
    attributes,
  );

  return {
    ...normalized,
    id: normalized.id && normalized.id.length > 0 ? normalized.id : generateRuntimeId(),
  } as {{pascalCase}}Attributes;
}

/**
 * 속성 업데이터 생성
 */
export function createAttributeUpdater(
  attributes: {{pascalCase}}Attributes,
  setAttributes: (attrs: Partial<{{pascalCase}}Attributes>) => void,
  validator = validators.validate
) {
  return <K extends keyof {{pascalCase}}Attributes>(
    key: K,
    value: {{pascalCase}}Attributes[K]
  ) => {
    const newAttrs = { ...attributes, [key]: value };
    
    const validation = validator(newAttrs);
    if (validation.success) {
      setAttributes({ [key]: value } as Partial<{{pascalCase}}Attributes>);
      return true;
    } else {
      console.error(`Validation failed for ${String(key)}:`, validation.errors);
      return false;
    }
  };
}

function generateRuntimeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
