export interface AbilityAnnotationSpec {
  destructive?: boolean;
  idempotent?: boolean;
  readonly?: boolean;
}

export interface AbilityCategorySpec {
  id: string;
  label: string;
}

export interface AbilityMcpProjectionSpec {
  public?: boolean;
}

export interface AbilityMetaSpec {
  [key: string]: unknown;
  mcp?: AbilityMcpProjectionSpec;
}

export interface AbilitySpec {
  annotations?: AbilityAnnotationSpec;
  categoryId: string;
  executeCallback: string;
  label: string;
  meta?: AbilityMetaSpec;
  permissionCallback: string;
  showInRest?: boolean;
}

export interface AbilitySpecCatalog {
  abilities: Record<string, AbilitySpec>;
  categories: Record<string, AbilityCategorySpec>;
}

export const ABILITY_SPEC_MERGE_BOUNDARY = {
  abilitySpecOwns: [
    'categoryId',
    'category.label',
    'label',
    'executeCallback',
    'permissionCallback',
    'annotations.readonly',
    'annotations.destructive',
    'annotations.idempotent',
    'meta.mcp.public',
    'showInRest',
  ],
  endpointManifestOwns: [
    'operationId',
    'method',
    'path',
    'summary',
    'queryContract',
    'bodyContract',
    'responseContract',
    'auth',
    'authMode',
    'wordpressAuth',
  ],
} as const;

export function resolveAbilityCategorySpec(
  abilitySpec: AbilitySpec,
  categories: Record<string, AbilityCategorySpec>,
  operationId: string,
): AbilityCategorySpec {
  const category = categories[abilitySpec.categoryId];
  if (!category) {
    throw new Error(
      `Operation "${operationId}" references unknown AbilitySpec category "${abilitySpec.categoryId}".`,
    );
  }

  if (category.id !== abilitySpec.categoryId) {
    throw new Error(
      `AbilitySpec category "${abilitySpec.categoryId}" resolves to category id "${category.id}".`,
    );
  }

  return category;
}
