import { expect, test } from 'bun:test';

import {
  ADD_KIND_IDS,
  ADD_KIND_REGISTRY,
  type AddKindId,
  type AddKindExecutionPlanFor,
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

test('keeps shared add-kind ids aligned with registry sort order', () => {
  expect(
    Object.entries(ADD_KIND_REGISTRY)
      .sort(([, left], [, right]) => left.sortOrder - right.sortOrder)
      .map(([kind]) => kind),
  ).toEqual([...ADD_KIND_IDS]);
});
