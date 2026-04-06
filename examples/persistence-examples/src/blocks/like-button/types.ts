import type { ValidationResult } from '@wp-typia/block-runtime/validation';
import { tags } from 'typia';

export type {
	ValidationResult,
	TypiaValidationError,
} from '@wp-typia/block-runtime/validation';

export interface PersistenceLikeButtonAttributes {
	content: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 250 > &
		tags.Default< 'Persistence like button example' >;
	showCount?: boolean & tags.Default< true >;
	likeLabel?: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 40 > &
		tags.Default< 'Like this' >;
	unlikeLabel?: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 40 > &
		tags.Default< 'Unlike' >;
	resourceKey?: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 100 > &
		tags.Default< 'primary' >;
}

export interface PersistenceLikeButtonContext {
	buttonLabel: string;
	canWrite: boolean;
	count: number;
	likeLabel: string;
	likedByCurrentUser: boolean;
	postId: number;
	resourceKey: string;
	restNonce?: string;
	storage: 'custom-table';
	unlikeLabel: string;
}

export interface PersistenceLikeButtonState {
	buttonLabel: string;
	canWrite: boolean;
	count: number;
	error?: string;
	isHydrated: boolean;
	isLoading: boolean;
	isSaving: boolean;
	likedByCurrentUser: boolean;
}

export type PersistenceLikeButtonValidationResult =
	ValidationResult< PersistenceLikeButtonAttributes >;
