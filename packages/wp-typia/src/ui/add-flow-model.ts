import { z } from 'zod';

import {
  ADD_KIND_IDS,
  type AddFieldName,
  getAddHiddenStringSubmitFieldNames,
  getAddVisibleFieldNames as getRegisteredAddVisibleFieldNames,
  isAddPersistenceTemplate as isRegisteredAddPersistenceTemplate,
} from '../add-kind-registry';
import {
  appendNormalizedOptionalStringFields,
  sanitizeVisibleSubmitValues,
} from './submit-value-sanitizers';

import {
  FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
  getFirstPartyScrollTop,
  getFirstPartyViewportHeight,
} from './first-party-form-model';

export const addFlowSchema = z.object({
  'alternate-render-targets': z.string().optional(),
  anchor: z.string().optional(),
  block: z.string().optional(),
  'data-storage': z.string().optional(),
  'external-layer-id': z.string().optional(),
  'external-layer-source': z.string().optional(),
  'inner-blocks-preset': z.string().optional(),
  kind: z.enum(ADD_KIND_IDS).default('block'),
  methods: z.string().optional(),
  name: z.string().optional(),
  namespace: z.string().optional(),
  'persistence-policy': z.string().optional(),
  position: z.string().optional(),
  slot: z.string().optional(),
  template: z.string().optional(),
});

export type AddFlowValues = z.infer<typeof addFlowSchema>;

const ADD_FIELD_HEIGHTS: Record<AddFieldName, number> = {
  anchor: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
  block: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  'data-storage': FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  'alternate-render-targets': FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
  'inner-blocks-preset': FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  kind: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  methods: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
  name: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
  namespace: FIRST_PARTY_TEXT_FIELD_BODY_HEIGHT,
  'persistence-policy': FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  position: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  slot: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
  template: FIRST_PARTY_SELECT_FIELD_BODY_HEIGHT,
};

export function isAddPersistenceTemplate(template?: string): boolean {
  return isRegisteredAddPersistenceTemplate(template);
}

export function getVisibleAddFieldNames(
  values: Partial<AddFlowValues>,
): Array<AddFieldName> {
  return getRegisteredAddVisibleFieldNames({
    kind: values.kind,
    template: values.template,
  });
}

export function getAddViewportHeight(terminalHeight = 24): number {
  return getFirstPartyViewportHeight(terminalHeight);
}

export function getAddScrollTop(options: {
  activeFieldName: string | null;
  values: Partial<AddFlowValues>;
  viewportHeight: number;
}): number {
  const { activeFieldName, values, viewportHeight } = options;
  return getFirstPartyScrollTop({
    activeFieldName,
    fieldHeights: ADD_FIELD_HEIGHTS,
    visibleFieldNames: getVisibleAddFieldNames(values),
    viewportHeight,
  });
}

export function sanitizeAddSubmitValues(
  values: AddFlowValues,
): Record<string, unknown> {
  const sanitized = sanitizeVisibleSubmitValues(
    values,
    getVisibleAddFieldNames(values),
  );

  return appendNormalizedOptionalStringFields(
    sanitized,
    values,
    getAddHiddenStringSubmitFieldNames(values.kind),
  );
}
