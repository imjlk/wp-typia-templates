const BLOCK_NESTING_RELATION_KEYS = [
  'parent',
  'ancestor',
  'allowedBlocks',
] as const;

type BlockNestingRelationKey = (typeof BLOCK_NESTING_RELATION_KEYS)[number];

export type BlockInnerBlocksTemplateAttributes = Readonly<Record<string, unknown>>;

export type BlockInnerBlocksTemplateItem = readonly [
  blockName: string,
  attributes?: BlockInnerBlocksTemplateAttributes,
  innerBlocks?: BlockInnerBlocksTemplate,
];

export type BlockInnerBlocksTemplate = readonly BlockInnerBlocksTemplateItem[];

export type BlockInnerBlocksTemplateContract = Readonly<
  Record<string, BlockInnerBlocksTemplate>
>;

export interface BlockNestingRule {
  ancestor?: readonly string[];
  allowedBlocks?: readonly string[];
  parent?: readonly string[];
  template?: BlockInnerBlocksTemplate;
}

export type BlockNestingContract = Readonly<Record<string, BlockNestingRule>>;

export interface ValidateBlockNestingContractOptions {
  allowExternalBlockNames?: boolean;
  knownBlockNames?: readonly string[];
}

interface NormalizedBlockNestingRule {
  ancestor?: string[];
  allowedBlocks?: string[];
  parent?: string[];
}

type NormalizedBlockInnerBlocksTemplateItem = [
  blockName: string,
  attributes?: Record<string, unknown>,
  innerBlocks?: NormalizedBlockInnerBlocksTemplate,
];

type NormalizedBlockInnerBlocksTemplate = NormalizedBlockInnerBlocksTemplateItem[];

interface KnownBlockNameValidationContext {
  allowExternalBlockNames: boolean;
  knownBlockNames: ReadonlySet<string>;
  knownBlockNamespaces: ReadonlySet<string>;
}

export interface ValidateInnerBlocksTemplatesOptions
  extends ValidateBlockNestingContractOptions {
  nesting?: BlockNestingContract;
}

export interface RenderInnerBlocksTemplateModuleOptions {
  exportName?: string;
}

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function formatKnownBlockNames(knownBlockNames: ReadonlySet<string>): string {
  return [...knownBlockNames].sort().join(', ');
}

function getBlockNamespace(blockName: string): string {
  return blockName.slice(0, blockName.indexOf('/'));
}

function assertBlockName(name: string, context: string): void {
  if (name.length === 0 || name !== name.trim() || !name.includes('/')) {
    throw new Error(`${context} must be a non-empty namespaced block name.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertJsonSerializable(
  value: unknown,
  context: string,
  seen = new Set<object>(),
): void {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`${context} must be JSON-serializable.`);
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error(
        `${context} must be JSON-serializable and must not contain circular references.`,
      );
    }
    seen.add(value);
    value.forEach((item, index) => {
      assertJsonSerializable(item, `${context}[${index}]`, seen);
    });
    seen.delete(value);
    return;
  }

  if (isRecord(value)) {
    if (seen.has(value)) {
      throw new Error(
        `${context} must be JSON-serializable and must not contain circular references.`,
      );
    }
    seen.add(value);
    for (const [key, item] of Object.entries(value)) {
      assertJsonSerializable(item, `${context}.${key}`, seen);
    }
    seen.delete(value);
    return;
  }

  throw new Error(`${context} must be JSON-serializable.`);
}

function normalizeRelationList(
  value: unknown,
  context: string,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array of block names.`);
  }

  const seen = new Set<string>();
  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`${context}[${index}] must be a block name string.`);
    }
    assertBlockName(item, `${context}[${index}]`);
    if (seen.has(item)) {
      throw new Error(`${context} must not contain duplicate block "${item}".`);
    }
    seen.add(item);
    return item;
  });
}

function normalizeInnerBlocksTemplate(
  value: unknown,
  context: string,
): NormalizedBlockInnerBlocksTemplate {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array of InnerBlocks template tuples.`);
  }

  return value.map((item, index) => {
    const itemContext = `${context}[${index}]`;
    if (!Array.isArray(item) || item.length < 1 || item.length > 3) {
      throw new Error(
        `${itemContext} must be an InnerBlocks tuple: [blockName, attributes?, innerBlocks?].`,
      );
    }

    const blockName = item[0];
    if (typeof blockName !== 'string') {
      throw new Error(`${itemContext}[0] must be a block name string.`);
    }
    assertBlockName(blockName, `${itemContext}[0]`);

    const normalizedItem: NormalizedBlockInnerBlocksTemplateItem = [blockName];
    if (item.length >= 2) {
      const attributes = item[1];
      if (!isRecord(attributes)) {
        throw new Error(`${itemContext}[1] must be a template attributes object.`);
      }
      assertJsonSerializable(attributes, `${itemContext}[1]`);
      normalizedItem[1] = attributes;
    }
    if (item.length === 3) {
      normalizedItem[2] = normalizeInnerBlocksTemplate(
        item[2],
        `${itemContext}[2]`,
      );
    }

    return normalizedItem;
  });
}

function normalizeBlockNestingRule(
  blockName: string,
  rule: unknown,
): NormalizedBlockNestingRule {
  if (!isRecord(rule)) {
    throw new Error(`Block nesting rule for "${blockName}" must be an object.`);
  }

  const normalized: NormalizedBlockNestingRule = {};
  for (const key of BLOCK_NESTING_RELATION_KEYS) {
    if (!hasOwn(rule, key)) {
      continue;
    }

    normalized[key] = normalizeRelationList(
      (rule as Record<string, unknown>)[key],
      `Block nesting rule "${blockName}".${key}`,
    );
  }

  if (hasOwn(rule, 'template')) {
    normalizeInnerBlocksTemplate(
      (rule as Record<string, unknown>).template,
      `Block nesting rule "${blockName}".template`,
    );
  }

  return normalized;
}

function createKnownBlockNameValidationContext(
  options: ValidateBlockNestingContractOptions,
): KnownBlockNameValidationContext | null {
  if (!options.knownBlockNames) {
    return null;
  }

  const knownBlockNames = new Set(options.knownBlockNames);
  return {
    allowExternalBlockNames: options.allowExternalBlockNames === true,
    knownBlockNames,
    knownBlockNamespaces: new Set(
      [...knownBlockNames].map((blockName) => getBlockNamespace(blockName)),
    ),
  };
}

function validateKnownBlockName(
  issues: string[],
  knownBlockNameContext: KnownBlockNameValidationContext | null,
  blockName: string,
  context: string,
  options: {
    allowExternalBlockName?: boolean;
  } = {},
): void {
  if (
    !knownBlockNameContext ||
    knownBlockNameContext.knownBlockNames.has(blockName)
  ) {
    return;
  }

  const isExternalBlockName =
    options.allowExternalBlockName === true &&
    knownBlockNameContext.allowExternalBlockNames &&
    !knownBlockNameContext.knownBlockNamespaces.has(getBlockNamespace(blockName));

  if (isExternalBlockName) {
    return;
  }

  issues.push(
    `${context} references unknown block "${blockName}". Expected one of: ${formatKnownBlockNames(
      knownBlockNameContext.knownBlockNames,
    )}.`,
  );
}

function normalizeBlockNestingContract(
  contract: BlockNestingContract,
): Record<string, NormalizedBlockNestingRule> {
  if (!isRecord(contract)) {
    throw new Error('Block nesting contract must be an object.');
  }

  return Object.fromEntries(
    Object.entries(contract).map(([blockName, rule]) => {
      assertBlockName(blockName, `Block nesting contract key "${blockName}"`);
      return [blockName, normalizeBlockNestingRule(blockName, rule)];
    }),
  );
}

export function defineBlockNesting<const Contract extends BlockNestingContract>(
  contract: Contract,
): Contract {
  validateBlockNestingContract(contract);
  return contract;
}

export function defineInnerBlocksTemplates<
  const Contract extends BlockInnerBlocksTemplateContract,
>(templates: Contract): Contract {
  validateInnerBlocksTemplates(templates);
  return templates;
}

export function validateBlockNestingContract(
  contract: BlockNestingContract,
  options: ValidateBlockNestingContractOptions = {},
): void {
  const normalized = normalizeBlockNestingContract(contract);
  const knownBlockNameContext =
    createKnownBlockNameValidationContext(options);
  const issues: string[] = [];

  for (const [blockName, rule] of Object.entries(normalized)) {
    validateKnownBlockName(issues, knownBlockNameContext, blockName, 'Contract key');

    for (const key of BLOCK_NESTING_RELATION_KEYS) {
      const relatedBlockNames = rule[key];
      if (!relatedBlockNames) {
        continue;
      }

      for (const relatedBlockName of relatedBlockNames) {
        validateKnownBlockName(
          issues,
          knownBlockNameContext,
          relatedBlockName,
          `${blockName}.${key}`,
          { allowExternalBlockName: true },
        );
        if (
          relatedBlockName === blockName &&
          (key === 'parent' || key === 'ancestor')
        ) {
          issues.push(`${blockName}.${key} must not reference itself.`);
        }
      }
    }
  }

  const embeddedTemplates = getInnerBlocksTemplatesFromNesting(contract);
  validateInnerBlocksTemplatesAgainstNormalizedNesting(
    embeddedTemplates,
    normalized,
    issues,
    knownBlockNameContext,
  );

  for (const [childBlockName, rule] of Object.entries(normalized)) {
    for (const parentBlockName of rule.parent ?? []) {
      const parentRule = normalized[parentBlockName];
      if (
        parentRule?.allowedBlocks &&
        parentRule.allowedBlocks.length > 0 &&
        !parentRule.allowedBlocks.includes(childBlockName)
      ) {
        issues.push(
          `${childBlockName}.parent includes "${parentBlockName}", but ${parentBlockName}.allowedBlocks does not include "${childBlockName}".`,
        );
      }
    }
  }

  for (const [parentBlockName, rule] of Object.entries(normalized)) {
    for (const childBlockName of rule.allowedBlocks ?? []) {
      const childRule = normalized[childBlockName];
      if (
        childRule?.parent &&
        childRule.parent.length > 0 &&
        !childRule.parent.includes(parentBlockName)
      ) {
        issues.push(
          `${parentBlockName}.allowedBlocks includes "${childBlockName}", but ${childBlockName}.parent does not include "${parentBlockName}".`,
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Invalid block nesting contract:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
  }
}

export function getInnerBlocksTemplatesFromNesting(
  nesting: BlockNestingContract,
): BlockInnerBlocksTemplateContract {
  if (!isRecord(nesting)) {
    throw new Error('Block nesting contract must be an object.');
  }

  const templates: Record<string, BlockInnerBlocksTemplate> = {};
  for (const [blockName, rule] of Object.entries(nesting)) {
    if (isRecord(rule) && hasOwn(rule, 'template')) {
      assertBlockName(blockName, `Block nesting contract key "${blockName}"`);
      templates[blockName] = rule.template as BlockInnerBlocksTemplate;
    }
  }

  return templates;
}

function normalizeInnerBlocksTemplateContract(
  templates: BlockInnerBlocksTemplateContract,
): Record<string, NormalizedBlockInnerBlocksTemplate> {
  if (!isRecord(templates)) {
    throw new Error('InnerBlocks template contract must be an object.');
  }

  return Object.fromEntries(
    Object.entries(templates).map(([blockName, template]) => {
      assertBlockName(blockName, `InnerBlocks template key "${blockName}"`);
      return [
        blockName,
        normalizeInnerBlocksTemplate(
          template,
          `InnerBlocks template "${blockName}"`,
        ),
      ];
    }),
  );
}

function hasRelationshipOverlap(
  expectedBlockNames: readonly string[],
  actualBlockNames: readonly string[],
): boolean {
  return expectedBlockNames.some((blockName) => actualBlockNames.includes(blockName));
}

function validateInnerBlocksTemplateList(
  issues: string[],
  template: NormalizedBlockInnerBlocksTemplate,
  parentBlockName: string,
  ancestorBlockNames: readonly string[],
  nesting: Record<string, NormalizedBlockNestingRule>,
  knownBlockNameContext: KnownBlockNameValidationContext | null,
  context: string,
): void {
  const parentRule = nesting[parentBlockName];

  template.forEach((item, index) => {
    const childBlockName = item[0];
    const itemContext = `${context}[${index}]`;
    validateKnownBlockName(
      issues,
      knownBlockNameContext,
      childBlockName,
      `${itemContext}[0]`,
      { allowExternalBlockName: true },
    );

    if (
      parentRule?.allowedBlocks &&
      parentRule.allowedBlocks.length > 0 &&
      !parentRule.allowedBlocks.includes(childBlockName)
    ) {
      issues.push(
        `${itemContext} uses "${childBlockName}", but ${parentBlockName}.allowedBlocks does not include "${childBlockName}".`,
      );
    }

    const childRule = nesting[childBlockName];
    if (
      childRule?.parent &&
      childRule.parent.length > 0 &&
      !childRule.parent.includes(parentBlockName)
    ) {
      issues.push(
        `${itemContext} uses "${childBlockName}", but ${childBlockName}.parent does not include "${parentBlockName}".`,
      );
    }

    const childAncestors = [...ancestorBlockNames, parentBlockName];
    if (
      childRule?.ancestor &&
      childRule.ancestor.length > 0 &&
      !hasRelationshipOverlap(childRule.ancestor, childAncestors)
    ) {
      issues.push(
        `${itemContext} uses "${childBlockName}", but ${childBlockName}.ancestor does not include any ancestor in ${childAncestors.join(' -> ')}.`,
      );
    }

    if (item[2]) {
      validateInnerBlocksTemplateList(
        issues,
        item[2],
        childBlockName,
        childAncestors,
        nesting,
        knownBlockNameContext,
        `${itemContext}[2]`,
      );
    }
  });
}

function validateInnerBlocksTemplatesAgainstNormalizedNesting(
  templates: BlockInnerBlocksTemplateContract,
  nesting: Record<string, NormalizedBlockNestingRule>,
  issues: string[],
  knownBlockNameContext: KnownBlockNameValidationContext | null,
): void {
  const normalizedTemplates = normalizeInnerBlocksTemplateContract(templates);

  for (const [blockName, template] of Object.entries(normalizedTemplates)) {
    validateKnownBlockName(
      issues,
      knownBlockNameContext,
      blockName,
      'InnerBlocks template key',
    );
    validateInnerBlocksTemplateList(
      issues,
      template,
      blockName,
      [],
      nesting,
      knownBlockNameContext,
      `InnerBlocks template "${blockName}"`,
    );
  }
}

export function validateInnerBlocksTemplates(
  templates: BlockInnerBlocksTemplateContract,
  options: ValidateInnerBlocksTemplatesOptions = {},
): void {
  const nesting = options.nesting
    ? normalizeBlockNestingContract(options.nesting)
    : {};
  const knownBlockNameContext =
    createKnownBlockNameValidationContext(options);
  const issues: string[] = [];

  validateInnerBlocksTemplatesAgainstNormalizedNesting(
    templates,
    nesting,
    issues,
    knownBlockNameContext,
  );

  if (issues.length > 0) {
    throw new Error(`Invalid InnerBlocks template contract:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
  }
}

export function renderInnerBlocksTemplateModule(
  templates: BlockInnerBlocksTemplateContract,
  options: RenderInnerBlocksTemplateModuleOptions = {},
): string {
  validateInnerBlocksTemplates(templates);

  const exportName = options.exportName ?? 'INNER_BLOCKS_TEMPLATES';
  const serializedTemplates = JSON.stringify(templates, null, '\t');

  return [
    '/* This file is generated by wp-typia. Do not edit manually. */',
    '',
    'export type WpTypiaInnerBlocksTemplateAttributes = Record<string, unknown>;',
    'export type WpTypiaInnerBlocksTemplateItem = [',
    '\tblockName: string,',
    '\tattributes?: WpTypiaInnerBlocksTemplateAttributes,',
    '\tinnerBlocks?: WpTypiaInnerBlocksTemplate,',
    '];',
    'export type WpTypiaInnerBlocksTemplate = WpTypiaInnerBlocksTemplateItem[];',
    '',
    `export const ${exportName} = ${serializedTemplates} satisfies Record<string, WpTypiaInnerBlocksTemplate>;`,
    '',
    `export type WpTypiaInnerBlocksTemplateName = keyof typeof ${exportName};`,
    '',
  ].join('\n');
}

export function applyBlockNestingMetadata({
  blockJson,
  blockName,
  nesting,
}: {
  blockJson: Record<string, unknown>;
  blockName: string;
  nesting?: BlockNestingContract;
}): BlockNestingRelationKey[] {
  if (!nesting || !hasOwn(nesting, blockName)) {
    return [];
  }

  validateBlockNestingContract(nesting);

  const rule = normalizeBlockNestingRule(blockName, nesting[blockName]);
  const appliedKeys: BlockNestingRelationKey[] = [];

  for (const key of BLOCK_NESTING_RELATION_KEYS) {
    if (hasOwn(rule, key)) {
      blockJson[key] = rule[key];
      appliedKeys.push(key);
    } else {
      delete blockJson[key];
    }
  }

  return appliedKeys;
}
