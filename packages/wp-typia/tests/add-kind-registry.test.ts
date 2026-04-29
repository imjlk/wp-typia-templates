import { expect, test } from 'bun:test';

import { type AddKindExecutionPlanFor } from '../src/add-kind-registry';

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

const addKindPlanCompatibilityChecks: {
  'admin-view': AdminViewPlanCompatibility;
  'binding-source': BindingSourcePlanCompatibility;
} = {
  'admin-view': true,
  'binding-source': true,
};

test('preserves compile-time compatibility between execute and getValues for representative add kinds', () => {
  expect(addKindPlanCompatibilityChecks).toEqual({
    'admin-view': true,
    'binding-source': true,
  });
});
