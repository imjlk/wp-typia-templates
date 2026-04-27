export const ADD_KIND_IDS = [
  'admin-view',
  'block',
  'variation',
  'pattern',
  'binding-source',
  'rest-resource',
  'ability',
  'ai-feature',
  'editor-plugin',
  'hooked-block',
] as const;
export type AddKindId = (typeof ADD_KIND_IDS)[number];
export type AddFieldName =
  | 'kind'
  | 'name'
  | 'source'
  | 'template'
  | 'block'
  | 'attribute'
  | 'anchor'
  | 'methods'
  | 'namespace'
  | 'position'
  | 'slot'
  | 'alternate-render-targets'
  | 'inner-blocks-preset'
  | 'data-storage'
  | 'persistence-policy';

type AddKindRegistryEntry = {
  completion: {
    nextSteps: (values: Record<string, string>) => string[];
    summaryLines: (
      values: Record<string, string>,
      projectDir: string,
    ) => string[];
    title: string;
  };
  description: string;
  hiddenStringSubmitFields?: readonly string[];
  nameLabel: string;
  visibleFieldNames: (options: {
    template?: string;
  }) => readonly AddFieldName[];
};

const BLOCK_VISIBLE_FIELD_ORDER = [
  'kind',
  'name',
  'template',
  'alternate-render-targets',
  'inner-blocks-preset',
  'data-storage',
  'persistence-policy',
] as const satisfies ReadonlyArray<AddFieldName>;

export function isAddKindId(value?: string): value is AddKindId {
  return (
    typeof value === 'string' &&
    (ADD_KIND_IDS as readonly string[]).includes(value)
  );
}

export function isAddPersistenceTemplate(template?: string): boolean {
  return template === 'persistence' || template === 'compound';
}

export const ADD_KIND_REGISTRY = {
  'admin-view': {
    completion: {
      nextSteps: (values) => [
        `Review src/admin-views/${values.adminViewSlug}/ and inc/admin-views/${values.adminViewSlug}.php.`,
        'Run your workspace build or dev command to verify the generated DataViews admin screen.',
      ],
      summaryLines: (values, projectDir) => [
        `Admin view: ${values.adminViewSlug}`,
        ...(values.source ? [`Source: ${values.source}`] : []),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added DataViews admin screen',
    },
    description: 'Add an opt-in DataViews-powered admin screen',
    nameLabel: 'Admin view name',
    visibleFieldNames: () => ['kind', 'name', 'source'],
  },
  'binding-source': {
    completion: {
      nextSteps: (values) => [
        `Review src/bindings/${values.bindingSourceSlug}/server.php and src/bindings/${values.bindingSourceSlug}/editor.ts.`,
        ...(values.blockSlug && values.attributeName
          ? [
              `Review src/blocks/${values.blockSlug}/block.json for the ${values.attributeName} bindable attribute.`,
            ]
          : []),
        'Run your workspace build or dev command to verify the binding source hooks and editor registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Binding source: ${values.bindingSourceSlug}`,
        ...(values.blockSlug && values.attributeName
          ? [`Target: ${values.blockSlug}.${values.attributeName}`]
          : []),
        `Project directory: ${projectDir}`,
      ],
      title: 'Added binding source',
    },
    description: 'Add a shared block bindings source',
    nameLabel: 'Binding source name',
    visibleFieldNames: () => ['kind', 'name', 'block', 'attribute'],
  },
  block: {
    completion: {
      nextSteps: () => [
        'Review the generated sources under src/blocks/ and the updated scripts/block-config.ts entry.',
        'Run your workspace build or dev command to verify the new scaffolded block family.',
      ],
      summaryLines: (values, projectDir) => [
        `Blocks: ${values.blockSlugs}`,
        `Template family: ${values.templateId}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace block',
    },
    description: 'Add a real block slice',
    hiddenStringSubmitFields: ['external-layer-id', 'external-layer-source'],
    nameLabel: 'Block name',
    visibleFieldNames: ({ template }) =>
      BLOCK_VISIBLE_FIELD_ORDER.filter((fieldName) => {
        if (fieldName === 'alternate-render-targets') {
          return isAddPersistenceTemplate(template);
        }
        if (fieldName === 'inner-blocks-preset') {
          return template === 'compound';
        }
        if (
          fieldName === 'data-storage' ||
          fieldName === 'persistence-policy'
        ) {
          return isAddPersistenceTemplate(template);
        }
        return true;
      }),
  },
  ability: {
    completion: {
      nextSteps: (values) => [
        `Review src/abilities/${values.abilitySlug}/ and inc/abilities/${values.abilitySlug}.php.`,
        'Run `wp-typia sync` or `npm run sync-abilities -- --check` and then your workspace build/dev command to verify the generated workflow ability.',
      ],
      summaryLines: (values, projectDir) => [
        `Ability: ${values.abilitySlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workflow ability',
    },
    description: 'Add a typed server/client workflow ability scaffold',
    nameLabel: 'Ability name',
    visibleFieldNames: () => ['kind', 'name'],
  },
  'editor-plugin': {
    completion: {
      nextSteps: (values) => [
        `Review src/editor-plugins/${values.editorPluginSlug}/.`,
        'Run your workspace build or dev command to verify the new editor plugin registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Editor plugin: ${values.editorPluginSlug}`,
        `Slot: ${values.slot}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added editor plugin',
    },
    description: 'Add a slot-aware document editor extension shell',
    nameLabel: 'Editor plugin name',
    visibleFieldNames: () => ['kind', 'name', 'slot'],
  },
  'hooked-block': {
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/block.json for the new blockHooks entry.`,
        'Run your workspace build or dev command to verify the updated hooked-block metadata.',
      ],
      summaryLines: (values, projectDir) => [
        `Block: ${values.blockSlug}`,
        `Anchor: ${values.anchorBlockName}`,
        `Position: ${values.position}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added blockHooks metadata',
    },
    description: 'Add block.json hook metadata to an existing block',
    nameLabel: 'Target block',
    visibleFieldNames: () => ['kind', 'name', 'anchor', 'position'],
  },
  pattern: {
    completion: {
      nextSteps: (values) => [
        `Review src/patterns/${values.patternSlug}.php.`,
        'Run your workspace build or dev command to verify the new pattern registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Pattern: ${values.patternSlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace pattern',
    },
    description: 'Add a PHP block pattern shell',
    nameLabel: 'Pattern name',
    visibleFieldNames: () => ['kind', 'name'],
  },
  'rest-resource': {
    completion: {
      nextSteps: (values) => [
        `Review src/rest/${values.restResourceSlug}/ and inc/rest/${values.restResourceSlug}.php.`,
        'Run your workspace build or dev command to verify the generated REST resource contract.',
      ],
      summaryLines: (values, projectDir) => [
        `REST resource: ${values.restResourceSlug}`,
        `Namespace: ${values.namespace}`,
        `Methods: ${values.methods}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added plugin-level REST resource',
    },
    description: 'Add a plugin-level typed REST resource',
    nameLabel: 'REST resource name',
    visibleFieldNames: () => ['kind', 'name', 'namespace', 'methods'],
  },
  'ai-feature': {
    completion: {
      nextSteps: (values) => [
        `Review src/ai-features/${values.aiFeatureSlug}/ and inc/ai-features/${values.aiFeatureSlug}.php.`,
        'Run `wp-typia sync-rest` and `wp-typia sync ai` or your workspace build/dev command to verify the generated REST artifacts and AI schema.',
      ],
      summaryLines: (values, projectDir) => [
        `AI feature: ${values.aiFeatureSlug}`,
        `Namespace: ${values.namespace}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added server-only AI feature',
    },
    description: 'Add a server-owned WordPress AI feature endpoint',
    nameLabel: 'AI feature name',
    visibleFieldNames: () => ['kind', 'name', 'namespace'],
  },
  variation: {
    completion: {
      nextSteps: (values) => [
        `Review src/blocks/${values.blockSlug}/variations/${values.variationSlug}.ts.`,
        'Run your workspace build or dev command to pick up the new variation.',
      ],
      summaryLines: (values, projectDir) => [
        `Variation: ${values.variationSlug}`,
        `Target block: ${values.blockSlug}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace variation',
    },
    description: 'Add a variation to an existing block',
    nameLabel: 'Variation name',
    visibleFieldNames: () => ['kind', 'name', 'block'],
  },
} as const satisfies Record<AddKindId, AddKindRegistryEntry>;

export function buildAddKindCompletionDetails(
  kind: AddKindId,
  options: {
    projectDir: string;
    values: Record<string, string>;
  },
) {
  const descriptor = ADD_KIND_REGISTRY[kind].completion;

  return {
    nextSteps: descriptor.nextSteps(options.values),
    summaryLines: descriptor.summaryLines(options.values, options.projectDir),
    title: descriptor.title,
  };
}

export function formatAddKindList(): string {
  return ADD_KIND_IDS.join(', ');
}

export function formatAddKindUsagePlaceholder(): string {
  return `<${ADD_KIND_IDS.join('|')}>`;
}

export function getAddHiddenStringSubmitFieldNames(kind?: string): string[] {
  const resolvedKind = isAddKindId(kind) ? kind : 'block';
  const entry: AddKindRegistryEntry = ADD_KIND_REGISTRY[resolvedKind];
  return [...(entry.hiddenStringSubmitFields ?? [])];
}

export function getAddKindOptions() {
  return ADD_KIND_IDS.map((kind) => ({
    description: ADD_KIND_REGISTRY[kind].description,
    name: kind,
    value: kind,
  }));
}

export function getAddNameLabel(kind?: string): string {
  const resolvedKind = isAddKindId(kind) ? kind : 'block';
  return ADD_KIND_REGISTRY[resolvedKind].nameLabel;
}

export function getAddVisibleFieldNames(options: {
  kind?: string;
  template?: string;
}): AddFieldName[] {
  const resolvedKind = isAddKindId(options.kind) ? options.kind : 'block';
  return [
    ...ADD_KIND_REGISTRY[resolvedKind].visibleFieldNames({
      template: options.template,
    }),
  ];
}
