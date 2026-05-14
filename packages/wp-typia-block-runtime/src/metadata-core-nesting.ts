const BLOCK_NESTING_RELATION_KEYS = [
  'parent',
  'ancestor',
  'allowedBlocks',
] as const;

type BlockNestingRelationKey = (typeof BLOCK_NESTING_RELATION_KEYS)[number];

export interface BlockNestingRule {
  ancestor?: readonly string[];
  allowedBlocks?: readonly string[];
  parent?: readonly string[];
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

interface KnownBlockNameValidationContext {
  allowExternalBlockNames: boolean;
  knownBlockNames: ReadonlySet<string>;
  knownBlockNamespaces: ReadonlySet<string>;
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

function normalizeBlockNestingRule(
  blockName: string,
  rule: unknown,
): NormalizedBlockNestingRule {
  if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) {
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
  if (contract === null || typeof contract !== 'object' || Array.isArray(contract)) {
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
