import type {
  EndpointDataClient,
  EndpointInvalidateTargets,
  EndpointInvalidateTarget,
  InternalEndpointDataClient,
  AnyEndpointValidationResult,
} from './react-client-types.js';
import type {
  EndpointRequestValidationResult,
  EndpointResponseValidationResult,
  EndpointValidationResult,
  ValidationResult,
} from './client.js';

/**
 * Normalize cache invalidation targets into a predictable readonly array.
 *
 * @param targets - One invalidation target, many targets, or `undefined`.
 * @returns A readonly list of invalidation targets.
 * @category React
 */
export function normalizeInvalidateTargets(
  targets: EndpointInvalidateTargets,
): readonly EndpointInvalidateTarget[] {
  if (!targets) {
    return [];
  }

  return (
    Array.isArray(targets) ? targets : [targets]
  ) as readonly EndpointInvalidateTarget[];
}

export function asInternalClient(
  client: EndpointDataClient,
): InternalEndpointDataClient {
  return client as InternalEndpointDataClient;
}

export function castEndpointValidationResult<Req, Res>(
  validation: AnyEndpointValidationResult,
): EndpointValidationResult<Req, Res> {
  return validation as EndpointValidationResult<Req, Res>;
}

export function selectEndpointData<Res, Selected>(
  data: Res | undefined,
  select?: (data: Res) => Selected,
): Selected {
  if (select) {
    return select(data as Res);
  }

  return data as unknown as Selected;
}

export function isInvalidValidationResult<Req>(
  validation: ValidationResult<Req>,
): validation is ValidationResult<Req> & { isValid: false } {
  return validation.isValid === false;
}

export function toEndpointRequestValidationResult<Req>(
  validation: ValidationResult<Req> & { isValid: false },
): EndpointRequestValidationResult<Req> {
  return {
    ...validation,
    validationTarget: 'request',
  };
}

export function toEndpointResponseValidationResult<Res>(
  validation: ValidationResult<Res>,
): EndpointResponseValidationResult<Res> {
  return {
    ...validation,
    validationTarget: 'response',
  };
}
