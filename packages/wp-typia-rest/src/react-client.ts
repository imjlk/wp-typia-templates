import { createContext, createElement, useContext } from '@wordpress/element';

import { createEndpointDataClient } from './react-client-state.js';
import type { EndpointDataClient } from './react-client-types.js';

export type {
  EndpointDataClient,
  EndpointInvalidateTarget,
  InternalEndpointDataClient,
  UseEndpointMutationOptions,
  UseEndpointMutationResult,
  UseEndpointQueryOptions,
  UseEndpointQueryResult,
} from './react-client-types.js';
export { createCacheKey } from './react-client-cache-key.js';
export {
  asInternalClient,
  castEndpointValidationResult,
  isInvalidValidationResult,
  normalizeInvalidateTargets,
  selectEndpointData,
  toEndpointRequestValidationResult,
  toEndpointResponseValidationResult,
} from './react-client-utils.js';
export { createEndpointDataClient } from './react-client-state.js';

/**
 * Props for `EndpointDataProvider`.
 *
 * @category React
 */
export interface EndpointDataProviderProps {
  children?: Parameters<typeof createElement>[2];
  client: EndpointDataClient;
}

const EndpointDataClientContext = createContext<EndpointDataClient | null>(
  null,
);
const defaultEndpointDataClient = createEndpointDataClient();

/**
 * Provide a shared endpoint cache client to descendant components.
 *
 * @param props - Provider props including the cache client and optional children.
 * @returns A context provider element for endpoint cache access.
 * @category React
 */
export function EndpointDataProvider(
  props: EndpointDataProviderProps,
): ReturnType<typeof createElement> {
  const { children, client } = props;
  return children === undefined
    ? createElement(EndpointDataClientContext.Provider, { value: client })
    : createElement(
        EndpointDataClientContext.Provider,
        { value: client },
        children,
      );
}

/**
 * Read the nearest endpoint cache client from context.
 *
 * @returns The active endpoint cache client, or the default singleton client.
 * @category React
 */
export function useEndpointDataClient(): EndpointDataClient {
  return useContext(EndpointDataClientContext) ?? defaultEndpointDataClient;
}
