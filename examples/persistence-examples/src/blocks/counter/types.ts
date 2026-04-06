import type { ValidationResult } from '@wp-typia/block-runtime/validation';
import { tags } from 'typia';

export type {
	ValidationResult,
	TypiaValidationError,
} from '@wp-typia/block-runtime/validation';

export interface PersistenceCounterAttributes {
	content: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 250 > &
		tags.Default< 'Persistence counter example' >;
	showCount?: boolean & tags.Default< true >;
	buttonLabel?: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 40 > &
		tags.Default< 'Persist Count' >;
	resourceKey?: string &
		tags.MinLength< 1 > &
		tags.MaxLength< 100 > &
		tags.Default< 'primary' >;
}

export interface PersistenceCounterContext {
	buttonLabel: string;
	canWrite: boolean;
	count: number;
	postId: number;
	publicWriteExpiresAt?: number;
	publicWriteToken?: string;
	resourceKey: string;
	storage: 'custom-table';
}

export interface PersistenceCounterState {
	canWrite: boolean;
	count: number;
	error?: string;
	isHydrated: boolean;
	isLoading: boolean;
	isSaving: boolean;
}

export type PersistenceCounterValidationResult =
	ValidationResult< PersistenceCounterAttributes >;
