import type {
  UseEndpointMutationOptions,
  UseEndpointMutationResult,
  UseEndpointQueryOptions,
  UseEndpointQueryResult,
} from './react-client.js';
import { useEndpointMutation } from './react-mutation.js';
import { useEndpointQuery } from './react-query.js';
import type {
  RestResourceWithCreate,
  RestResourceWithDelete,
  RestResourceWithList,
  RestResourceWithRead,
  RestResourceWithUpdate,
} from './resource.js';

export function useRestResourceListQuery<
  TRequest,
  TResponse,
  Selected = TResponse,
>(
  resource: RestResourceWithList<TRequest, TResponse>,
  request: TRequest,
  options: UseEndpointQueryOptions<TRequest, TResponse, Selected> = {},
): UseEndpointQueryResult<TResponse, Selected, TRequest> {
  return useEndpointQuery(resource.endpoints.list, request, options);
}

export function useRestResourceReadQuery<
  TRequest,
  TResponse,
  Selected = TResponse,
>(
  resource: RestResourceWithRead<TRequest, TResponse>,
  request: TRequest,
  options: UseEndpointQueryOptions<TRequest, TResponse, Selected> = {},
): UseEndpointQueryResult<TResponse, Selected, TRequest> {
  return useEndpointQuery(resource.endpoints.read, request, options);
}

export function useRestResourceCreateMutation<
  TRequest,
  TResponse,
  Context = unknown,
>(
  resource: RestResourceWithCreate<TRequest, TResponse>,
  options: UseEndpointMutationOptions<TRequest, TResponse, Context> = {},
): UseEndpointMutationResult<TRequest, TResponse> {
  return useEndpointMutation(resource.endpoints.create, options);
}

export function useRestResourceUpdateMutation<
  TRequest,
  TResponse,
  Context = unknown,
>(
  resource: RestResourceWithUpdate<TRequest, TResponse>,
  options: UseEndpointMutationOptions<TRequest, TResponse, Context> = {},
): UseEndpointMutationResult<TRequest, TResponse> {
  return useEndpointMutation(resource.endpoints.update, options);
}

export function useRestResourceDeleteMutation<
  TRequest,
  TResponse,
  Context = unknown,
>(
  resource: RestResourceWithDelete<TRequest, TResponse>,
  options: UseEndpointMutationOptions<TRequest, TResponse, Context> = {},
): UseEndpointMutationResult<TRequest, TResponse> {
  return useEndpointMutation(resource.endpoints.delete, options);
}
