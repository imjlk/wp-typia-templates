import { tags } from 'typia';

export interface PersistenceLikeStatusQuery {
	postId: number & tags.Type< 'uint32' >;
	resourceKey: string & tags.MinLength< 1 > & tags.MaxLength< 100 >;
}

export interface PersistenceToggleLikeRequest {
	postId: number & tags.Type< 'uint32' >;
	resourceKey: string & tags.MinLength< 1 > & tags.MaxLength< 100 >;
}

export interface PersistenceLikeStatusResponse {
	postId: number & tags.Type< 'uint32' >;
	resourceKey: string & tags.MinLength< 1 > & tags.MaxLength< 100 >;
	count: number & tags.Minimum< 0 > & tags.Type< 'uint32' >;
	likedByCurrentUser: boolean;
	storage: 'custom-table';
}
