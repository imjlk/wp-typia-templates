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
  listQuery?: TEndpoints extends { list: ApiEndpoint<infer TRequest, any> }
    ? RestResourceListQueryBridge<TListQuerySource, TRequest>
    : never;
  namespace?: string;
  path?: string;
}

type EndpointRequest<TEndpoint> =
  TEndpoint extends ApiEndpoint<infer TRequest, any> ? TRequest : never;
type EndpointResponse<TEndpoint> =
  TEndpoint extends ApiEndpoint<any, infer TResponse> ? TResponse : never;

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

type RestResourceListMethods<TEndpoints extends RestResourceEndpointSet> =
  TEndpoints extends { list: infer TEndpoint extends AnyApiEndpoint }
    ? {
        list: (
          request: EndpointRequest<TEndpoint>,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<TEndpoint>,
            EndpointResponse<TEndpoint>
          >
        >;
      }
    : {};

type RestResourceReadMethods<TEndpoints extends RestResourceEndpointSet> =
  TEndpoints extends { read: infer TEndpoint extends AnyApiEndpoint }
    ? {
        read: (
          request: EndpointRequest<TEndpoint>,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<TEndpoint>,
            EndpointResponse<TEndpoint>
          >
        >;
      }
    : {};

type RestResourceCreateMethods<TEndpoints extends RestResourceEndpointSet> =
  TEndpoints extends { create: infer TEndpoint extends AnyApiEndpoint }
    ? {
        create: (
          request: EndpointRequest<TEndpoint>,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<TEndpoint>,
            EndpointResponse<TEndpoint>
          >
        >;
      }
    : {};

type RestResourceUpdateMethods<TEndpoints extends RestResourceEndpointSet> =
  TEndpoints extends { update: infer TEndpoint extends AnyApiEndpoint }
    ? {
        update: (
          request: EndpointRequest<TEndpoint>,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<TEndpoint>,
            EndpointResponse<TEndpoint>
          >
        >;
      }
    : {};

type RestResourceDeleteMethods<TEndpoints extends RestResourceEndpointSet> =
  TEndpoints extends { delete: infer TEndpoint extends AnyApiEndpoint }
    ? {
        delete: (
          request: EndpointRequest<TEndpoint>,
          options?: EndpointCallOptions,
        ) => Promise<
          EndpointValidationResult<
            EndpointRequest<TEndpoint>,
            EndpointResponse<TEndpoint>
          >
        >;
      }
    : {};

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
