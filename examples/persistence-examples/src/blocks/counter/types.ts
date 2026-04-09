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
	postId: number;
	resourceKey: string;
	storage: 'custom-table';
}

export interface PersistenceCounterState {
	bootstrapReady: boolean;
	canWrite: boolean;
	count: number;
	error?: string;
	isBootstrapping: boolean;
	isHydrated: boolean;
	isLoading: boolean;
	isSaving: boolean;
	publicWriteExpiresAt?: number;
	publicWriteToken?: string;
}

export type PersistenceCounterValidationResult =
	ValidationResult< PersistenceCounterAttributes >;
