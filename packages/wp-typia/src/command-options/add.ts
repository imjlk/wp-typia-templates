import type { CommandOptionMetadataMap } from './types';

/**
 * Shared `wp-typia add` option metadata used by both runtime entry paths.
 */
export const ADD_OPTION_METADATA = {
  'alternate-render-targets': {
    description:
      'Comma-separated alternate render targets for dynamic block scaffolds (email,mjml,plain-text).',
    type: 'string',
  },
  anchor: {
    description: 'Anchor block name for hooked-block workflows.',
    type: 'string',
  },
  attribute: {
    description:
      'Target block attribute for end-to-end binding-source workflows.',
    type: 'string',
  },
  auth: {
    description:
      'Auth intent for manual REST contract workflows (public, authenticated, or public-write-protected).',
    type: 'string',
  },
  block: {
    description:
      'Target block slug for variation, style, and end-to-end binding-source workflows.',
    type: 'string',
  },
  'controller-class': {
    description:
      'Generated REST resource controller class used for route callbacks.',
    type: 'string',
  },
  'controller-extends': {
    description:
      'Optional base class for generated REST resource controller wrappers.',
    type: 'string',
  },
  'data-storage': {
    description: 'Persistence storage mode for persistence-capable templates.',
    type: 'string',
  },
  'dry-run': {
    argumentKind: 'flag',
    description:
      'Preview workspace file updates and completion guidance without writing them.',
    type: 'boolean',
  },
  'external-layer-id': {
    description:
      'Explicit layer id when an external layer package exposes multiple selectable layers.',
    type: 'string',
  },
  'external-layer-source': {
    description:
      'Local path, GitHub locator, or npm package that exposes wp-typia.layers.json for built-in block templates.',
    type: 'string',
  },
  from: {
    description:
      'Source full block name (namespace/block) for transform workflows.',
    type: 'string',
  },
  'inner-blocks-preset': {
    description:
      'Compound-only InnerBlocks preset (freeform, ordered, horizontal, locked-structure).',
    type: 'string',
  },
  manual: {
    argumentKind: 'flag',
    description:
      'Create a type-only manual REST contract without PHP route/controller files.',
    type: 'boolean',
  },
  'hide-from-rest': {
    argumentKind: 'flag',
    description:
      'Keep a generated post-meta contract out of WordPress REST/editor responses.',
    type: 'boolean',
  },
  'meta-key': {
    description:
      'WordPress meta key for post-meta workflows; defaults to _<phpPrefix>_<name>.',
    type: 'string',
  },
  method: {
    description:
      'HTTP method for manual REST contract workflows (GET, POST, PUT, PATCH, or DELETE).',
    type: 'string',
  },
  methods: {
    description:
      'Comma-separated REST resource methods for rest-resource workflows.',
    type: 'string',
  },
  namespace: {
    description: 'REST namespace for rest-resource and ai-feature workflows.',
    type: 'string',
  },
  'permission-callback': {
    description:
      'PHP permission callback for generated REST resource route registrations.',
    type: 'string',
  },
  'post-type': {
    description: 'WordPress post type key for post-meta workflows.',
    type: 'string',
  },
  'persistence-policy': {
    description: 'Persistence write policy for persistence-capable templates.',
    type: 'string',
  },
  path: {
    description:
      'Route path pattern for manual REST contract workflows, relative to the REST namespace.',
    type: 'string',
  },
  position: {
    description: 'Hook position for hooked-block workflows.',
    type: 'string',
  },
  'query-type': {
    description:
      'Exported TypeScript query type for manual REST contract workflows.',
    type: 'string',
  },
  'response-type': {
    description:
      'Exported TypeScript response type for manual REST contract workflows.',
    type: 'string',
  },
  'route-pattern': {
    description:
      'Generated REST resource item route pattern relative to the REST namespace.',
    type: 'string',
  },
  'secret-field': {
    description:
      'Write-only request body field for manual settings REST contracts.',
    type: 'string',
  },
  'secret-state-field': {
    description:
      'Masked response boolean field for --secret-field; defaults to has<SecretField>.',
    type: 'string',
  },
  service: {
    description:
      'Optional local service starter for integration-env workflows (none or docker-compose).',
    type: 'string',
  },
  slot: {
    description:
      'Document editor shell slot for editor-plugin workflows (sidebar or document-setting-panel).',
    type: 'string',
  },
  source: {
    description:
      'Optional data source locator for admin-view workflows, such as rest-resource:products or core-data:postType/post.',
    type: 'string',
  },
  template: {
    description:
      'Optional built-in block family for the new block; interactive flows let you choose it when omitted and non-interactive runs default to basic.',
    type: 'string',
  },
  type: {
    description:
      'Exported TypeScript type or interface name for standalone contract workflows.',
    type: 'string',
  },
  'body-type': {
    description:
      'Exported TypeScript body type for manual REST contract workflows.',
    type: 'string',
  },
  to: {
    description:
      'Target workspace block slug or full block name for transform workflows.',
    type: 'string',
  },
  'wp-env': {
    argumentKind: 'flag',
    description:
      'Add a local @wordpress/env preset for integration-env workflows.',
    type: 'boolean',
  },
} as const satisfies CommandOptionMetadataMap;
