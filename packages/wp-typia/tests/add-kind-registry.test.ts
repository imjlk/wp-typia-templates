import { expect, test } from 'bun:test';

import {
  ADD_KIND_IDS,
  ADD_KIND_REGISTRY,
  type AddKindId,
  type AddKindExecutionContext,
  type AddKindExecutionPlanFor,
  getAddVisibleFieldNames,
} from '../src/add-kind-registry';

type ExpectTrue<TValue extends true> = TValue;
type IsEqual<TLeft, TRight> =
  (<TValue>() => TValue extends TLeft ? 1 : 2) extends <
    TValue,
  >() => TValue extends TRight ? 1 : 2
    ? true
    : false;

type AdminViewPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'admin-view'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'admin-view'>['getValues']>[0]
  >
>;

type BlockPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'block'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'block'>['getValues']>[0]
  >
>;

type VariationPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'variation'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'variation'>['getValues']>[0]
  >
>;

type StylePlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'style'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'style'>['getValues']>[0]
  >
>;

type TransformPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'transform'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'transform'>['getValues']>[0]
  >
>;

type PatternPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'pattern'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'pattern'>['getValues']>[0]
  >
>;

type BindingSourcePlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'binding-source'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'binding-source'>['getValues']>[0]
  >
>;

type RestResourcePlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'rest-resource'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'rest-resource'>['getValues']>[0]
  >
>;

type AbilityPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'ability'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'ability'>['getValues']>[0]
  >
>;

type AiFeaturePlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'ai-feature'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'ai-feature'>['getValues']>[0]
  >
>;

type HookedBlockPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'hooked-block'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'hooked-block'>['getValues']>[0]
  >
>;

type EditorPluginPlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'editor-plugin'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'editor-plugin'>['getValues']>[0]
  >
>;

type SharedAddKindIdCompatibility = ExpectTrue<
  IsEqual<keyof typeof ADD_KIND_REGISTRY, AddKindId>
>;

const addKindPlanCompatibilityChecks = {
  'admin-view': true,
  block: true,
  variation: true,
  style: true,
  transform: true,
  pattern: true,
  'binding-source': true,
  'rest-resource': true,
  ability: true,
  'ai-feature': true,
  'hooked-block': true,
  'editor-plugin': true,
  registryKeys: true,
} satisfies {
  'admin-view': AdminViewPlanCompatibility;
  block: BlockPlanCompatibility;
  variation: VariationPlanCompatibility;
  style: StylePlanCompatibility;
  transform: TransformPlanCompatibility;
  pattern: PatternPlanCompatibility;
  'binding-source': BindingSourcePlanCompatibility;
  'rest-resource': RestResourcePlanCompatibility;
  ability: AbilityPlanCompatibility;
  'ai-feature': AiFeaturePlanCompatibility;
  'hooked-block': HookedBlockPlanCompatibility;
  'editor-plugin': EditorPluginPlanCompatibility;
  registryKeys: SharedAddKindIdCompatibility;
};

test('preserves compile-time compatibility between execute and getValues for every add kind', () => {
  expect(addKindPlanCompatibilityChecks).toEqual({
    'admin-view': true,
    block: true,
    variation: true,
    style: true,
    transform: true,
    pattern: true,
    'binding-source': true,
    'rest-resource': true,
    ability: true,
    'ai-feature': true,
    'hooked-block': true,
    'editor-plugin': true,
    registryKeys: true,
  });
});

test('aggregates one registry entry for every canonical add kind', () => {
  expect(Object.keys(ADD_KIND_REGISTRY).sort()).toEqual(
    [...ADD_KIND_IDS].sort(),
  );

  for (const kind of ADD_KIND_IDS) {
    const entry = ADD_KIND_REGISTRY[kind];
    expect(entry.description.length).toBeGreaterThan(0);
    expect(entry.usage).toContain(`wp-typia add ${kind}`);
  }
});

test('keeps shared add-kind ids aligned with registry sort order', () => {
  expect(
    Object.entries(ADD_KIND_REGISTRY)
      .sort(([, left], [, right]) => left.sortOrder - right.sortOrder)
      .map(([kind]) => kind),
  ).toEqual([...ADD_KIND_IDS]);
});

test('keeps shared visible-field groups aligned for refactored add kinds', () => {
  expect(getAddVisibleFieldNames({ kind: 'admin-view' })).toEqual([
    'kind',
    'name',
    'source',
  ]);
  expect(getAddVisibleFieldNames({ kind: 'style' })).toEqual([
    'kind',
    'name',
    'block',
  ]);
  expect(getAddVisibleFieldNames({ kind: 'variation' })).toEqual([
    'kind',
    'name',
    'block',
  ]);
  expect(getAddVisibleFieldNames({ kind: 'transform' })).toEqual([
    'kind',
    'name',
    'from',
    'to',
  ]);
  expect(getAddVisibleFieldNames({ kind: 'hooked-block' })).toEqual([
    'kind',
    'name',
    'anchor',
    'position',
  ]);
  expect(getAddVisibleFieldNames({ kind: 'block', template: 'basic' })).toEqual(
    ['kind', 'name', 'template'],
  );
  expect(
    getAddVisibleFieldNames({ kind: 'block', template: 'compound' }),
  ).toEqual([
    'kind',
    'name',
    'template',
    'alternate-render-targets',
    'inner-blocks-preset',
    'data-storage',
    'persistence-policy',
  ]);
});

const warnLinePlanFixtures = {
  'admin-view': {
    flags: {},
    name: 'sample-admin-view',
  },
  ability: {
    flags: {},
    name: 'sample-ability',
  },
  'ai-feature': {
    flags: {},
    name: 'sample-ai-feature',
  },
  'binding-source': {
    flags: {},
    name: 'sample-binding-source',
  },
  block: {
    flags: {},
    name: 'sample-block',
  },
  'editor-plugin': {
    flags: {},
    name: 'sample-editor-plugin',
  },
  'hooked-block': {
    flags: {
      anchor: 'core/post-content',
      position: 'after',
    },
    name: 'sample-block',
  },
  pattern: {
    flags: {},
    name: 'sample-pattern',
  },
  'rest-resource': {
    flags: {},
    name: 'sample-rest-resource',
  },
  style: {
    flags: {
      block: 'sample-block',
    },
    name: 'sample-style',
  },
  transform: {
    flags: {
      from: 'core/paragraph',
      to: 'sample/block',
    },
    name: 'sample-transform',
  },
  variation: {
    flags: {
      block: 'sample-block',
    },
    name: 'sample-variation',
  },
} satisfies Record<
  AddKindId,
  {
    flags: Record<string, unknown>;
    name: string;
  }
>;

test('passes the warning line printer through every add-kind execution plan', async () => {
  const warnLine = () => {};
  const planWarnLineResults = Object.fromEntries(
    await Promise.all(
      ADD_KIND_IDS.map(async (kind) => {
        const fixture = warnLinePlanFixtures[kind];
        const plan = await ADD_KIND_REGISTRY[kind].prepareExecution({
          addRuntime: {} as AddKindExecutionContext['addRuntime'],
          cwd: `/tmp/wp-typia-${kind}-test`,
          flags: fixture.flags,
          getOrCreatePrompt: async () => {
            throw new Error(`${kind} add-kind should not prompt in this test`);
          },
          isInteractiveSession: false,
          name: fixture.name,
          warnLine,
        });

        return [kind, plan.warnLine === warnLine];
      }),
    ),
  );

  expect(planWarnLineResults).toEqual({
    'admin-view': true,
    ability: true,
    'ai-feature': true,
    'binding-source': true,
    block: true,
    'editor-plugin': true,
    'hooked-block': true,
    pattern: true,
    'rest-resource': true,
    style: true,
    transform: true,
    variation: true,
  });
});
