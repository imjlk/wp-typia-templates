import {
  callEndpoint,
  type ApiEndpoint,
  type EndpointCallOptions,
  type EndpointValidationResult,
} from './client.js';

type AnyApiEndpoint = ApiEndpoint<any, any>;

export interface RestResourceListQueryBridge<TSource, TRequest> {
  toRequest: (source: TSource) => TRequest;
}

export interface RestResourceEndpointSet {
  create?: AnyApiEndpoint;
  delete?: AnyApiEndpoint;
  list?: AnyApiEndpoint;
  read?: AnyApiEndpoint;
  update?: AnyApiEndpoint;
}

export interface RestResourceDefinition<
  TEndpoints extends RestResourceEndpointSet,
  TIdField extends string | undefined = string | undefined,
  TListQuerySource = never,
> {
  endpoints: TEndpoints;
  idField?: TIdField;
  listQuery?: [RestResourceEndpointForKey<TEndpoints, 'list'>] extends [never]
    ? never
    : RestResourceListQueryBridge<
        TListQuerySource,
        EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'list'>>
      >;
  namespace?: string;
  path?: string;
}

type EndpointRequest<TEndpoint> =
  TEndpoint extends ApiEndpoint<infer TRequest, any> ? TRequest : never;
type EndpointResponse<TEndpoint> =
  TEndpoint extends ApiEndpoint<any, infer TResponse> ? TResponse : never;
type RestResourceEndpointForKey<
  TEndpoints extends RestResourceEndpointSet,
  TKey extends keyof RestResourceEndpointSet,
> = Extract<TEndpoints[TKey], AnyApiEndpoint>;
type HasRequiredEndpointKey<
  TEndpoints extends RestResourceEndpointSet,
  TKey extends keyof RestResourceEndpointSet,
> = TEndpoints extends Record<TKey, AnyApiEndpoint> ? true : false;

export type RestResourceListRequest<
  TResource extends RestResourceWithList<any, any>,
> = EndpointRequest<TResource['endpoints']['list']>;
export type RestResourceListResponse<
  TResource extends RestResourceWithList<any, any>,
> = EndpointResponse<TResource['endpoints']['list']>;
export type RestResourceReadRequest<
  TResource extends RestResourceWithRead<any, any>,
> = EndpointRequest<TResource['endpoints']['read']>;
export type RestResourceReadResponse<
  TResource extends RestResourceWithRead<any, any>,
> = EndpointResponse<TResource['endpoints']['read']>;
export type RestResourceCreateRequest<
  TResource extends RestResourceWithCreate<any, any>,
> = EndpointRequest<TResource['endpoints']['create']>;
export type RestResourceCreateResponse<
  TResource extends RestResourceWithCreate<any, any>,
> = EndpointResponse<TResource['endpoints']['create']>;
export type RestResourceUpdateRequest<
  TResource extends RestResourceWithUpdate<any, any>,
> = EndpointRequest<TResource['endpoints']['update']>;
export type RestResourceUpdateResponse<
  TResource extends RestResourceWithUpdate<any, any>,
> = EndpointResponse<TResource['endpoints']['update']>;
export type RestResourceDeleteRequest<
  TResource extends RestResourceWithDelete<any, any>,
> = EndpointRequest<TResource['endpoints']['delete']>;
export type RestResourceDeleteResponse<
  TResource extends RestResourceWithDelete<any, any>,
> = EndpointResponse<TResource['endpoints']['delete']>;

export type RestResourceWithList<TRequest, TResponse> = {
  endpoints: {
    list: ApiEndpoint<TRequest, TResponse>;
  };
};

export type RestResourceWithRead<TRequest, TResponse> = {
  endpoints: {
    read: ApiEndpoint<TRequest, TResponse>;
  };
};

export type RestResourceWithCreate<TRequest, TResponse> = {
  endpoints: {
    create: ApiEndpoint<TRequest, TResponse>;
  };
};

export type RestResourceWithUpdate<TRequest, TResponse> = {
  endpoints: {
    update: ApiEndpoint<TRequest, TResponse>;
  };
};

export type RestResourceWithDelete<TRequest, TResponse> = {
  endpoints: {
    delete: ApiEndpoint<TRequest, TResponse>;
  };
};

type RestResourceListMethods<TEndpoints extends RestResourceEndpointSet> = [
  RestResourceEndpointForKey<TEndpoints, 'list'>,
] extends [never]
  ? {}
  : HasRequiredEndpointKey<TEndpoints, 'list'> extends true
    ? {
        list: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'list'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'list'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'list'>>
          >
        >;
      }
    : {
        list?: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'list'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'list'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'list'>>
          >
        >;
      };

type RestResourceReadMethods<TEndpoints extends RestResourceEndpointSet> = [
  RestResourceEndpointForKey<TEndpoints, 'read'>,
] extends [never]
  ? {}
  : HasRequiredEndpointKey<TEndpoints, 'read'> extends true
    ? {
        read: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'read'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'read'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'read'>>
          >
        >;
      }
    : {
        read?: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'read'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'read'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'read'>>
          >
        >;
      };

type RestResourceCreateMethods<TEndpoints extends RestResourceEndpointSet> = [
  RestResourceEndpointForKey<TEndpoints, 'create'>,
] extends [never]
  ? {}
  : HasRequiredEndpointKey<TEndpoints, 'create'> extends true
    ? {
        create: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'create'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'create'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'create'>>
          >
        >;
      }
    : {
        create?: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'create'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'create'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'create'>>
          >
        >;
      };

type RestResourceUpdateMethods<TEndpoints extends RestResourceEndpointSet> = [
  RestResourceEndpointForKey<TEndpoints, 'update'>,
] extends [never]
  ? {}
  : HasRequiredEndpointKey<TEndpoints, 'update'> extends true
    ? {
        update: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'update'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'update'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'update'>>
          >
        >;
      }
    : {
        update?: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'update'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'update'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'update'>>
          >
        >;
      };

type RestResourceDeleteMethods<TEndpoints extends RestResourceEndpointSet> = [
  RestResourceEndpointForKey<TEndpoints, 'delete'>,
] extends [never]
  ? {}
  : HasRequiredEndpointKey<TEndpoints, 'delete'> extends true
    ? {
        delete: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'delete'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'delete'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'delete'>>
          >
        >;
      }
    : {
        delete?: (
          request: EndpointRequest<
            RestResourceEndpointForKey<TEndpoints, 'delete'>
          >,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<RestResourceEndpointForKey<TEndpoints, 'delete'>>,
            EndpointResponse<RestResourceEndpointForKey<TEndpoints, 'delete'>>
          >
        >;
      };

export type RestResource<
  TEndpoints extends RestResourceEndpointSet,
  TIdField extends string | undefined = string | undefined,
  TListQuerySource = never,
> = RestResourceDefinition<TEndpoints, TIdField, TListQuerySource> &
  RestResourceListMethods<TEndpoints> &
  RestResourceReadMethods<TEndpoints> &
  RestResourceCreateMethods<TEndpoints> &
  RestResourceUpdateMethods<TEndpoints> &
  RestResourceDeleteMethods<TEndpoints>;

function createResourceMethod<Req, Res>(endpoint: ApiEndpoint<Req, Res>) {
  return (request: Req, options?: EndpointCallOptions) =>
    callEndpoint(endpoint, request, options);
}

export function defineRestResourceListQuery<TSource, TRequest>(
  toRequest: (source: TSource) => TRequest,
): RestResourceListQueryBridge<TSource, TRequest> {
  return { toRequest };
}

export function toRestResourceListRequest<TSource, TRequest, TResponse>(
  resource: RestResourceWithList<TRequest, TResponse> & {
    listQuery?: RestResourceListQueryBridge<TSource, TRequest>;
  },
  source: TSource,
): TRequest {
  if (!resource.listQuery) {
    throw new Error(
      'toRestResourceListRequest requires the resource to define listQuery.',
    );
  }

  return resource.listQuery.toRequest(source);
}

export function defineRestResource<
  TEndpoints extends RestResourceEndpointSet,
  TIdField extends string | undefined = string | undefined,
  TListQuerySource = never,
>(
  definition: RestResourceDefinition<TEndpoints, TIdField, TListQuerySource>,
): RestResource<TEndpoints, TIdField, TListQuerySource> {
  return {
    ...definition,
    ...(definition.endpoints.list
      ? {
          list: createResourceMethod(definition.endpoints.list),
        }
      : {}),
    ...(definition.endpoints.read
      ? {
          read: createResourceMethod(definition.endpoints.read),
        }
      : {}),
    ...(definition.endpoints.create
      ? {
          create: createResourceMethod(definition.endpoints.create),
        }
      : {}),
    ...(definition.endpoints.update
      ? {
          update: createResourceMethod(definition.endpoints.update),
        }
      : {}),
    ...(definition.endpoints.delete
      ? {
          delete: createResourceMethod(definition.endpoints.delete),
        }
      : {}),
  } as RestResource<TEndpoints, TIdField, TListQuerySource>;
}
