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

type BindingSourcePlanCompatibility = ExpectTrue<
  IsEqual<
    Awaited<ReturnType<AddKindExecutionPlanFor<'binding-source'>['execute']>>,
    Parameters<AddKindExecutionPlanFor<'binding-source'>['getValues']>[0]
  >
>;
type SharedAddKindIdCompatibility = ExpectTrue<
  IsEqual<keyof typeof ADD_KIND_REGISTRY, AddKindId>
>;

const addKindPlanCompatibilityChecks: {
  'admin-view': AdminViewPlanCompatibility;
  'binding-source': BindingSourcePlanCompatibility;
  registryKeys: SharedAddKindIdCompatibility;
} = {
  'admin-view': true,
  'binding-source': true,
  registryKeys: true,
};

test('preserves compile-time compatibility between execute and getValues for representative add kinds', () => {
  expect(addKindPlanCompatibilityChecks).toEqual({
    'admin-view': true,
    'binding-source': true,
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
