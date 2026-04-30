export const ADD_KIND_IDS = [
  'admin-view',
  'block',
  'variation',
  'style',
  'transform',
  'pattern',
  'binding-source',
  'rest-resource',
  'ability',
  'ai-feature',
  'hooked-block',
  'editor-plugin',
] as const;

export type AddKindId = (typeof ADD_KIND_IDS)[number];
