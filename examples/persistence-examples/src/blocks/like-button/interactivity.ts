import { getContext, store } from '@wordpress/interactivity';

import { fetchLikeBootstrap, fetchLikeStatus, toggleLike } from './api';
import type {
	PersistenceLikeButtonContext,
	PersistenceLikeButtonState,
} from './types';

function getButtonLabel(
	context: PersistenceLikeButtonContext,
	liked: boolean
): string {
	return liked ? context.unlikeLabel : context.likeLabel;
}

const { actions, state } = store( 'persistenceExamplesLikeButton', {
	state: {
		bootstrapReady: false,
		buttonLabel: 'Like this',
		canWrite: false,
		count: 0,
		error: undefined,
		isBootstrapping: false,
		isHydrated: false,
		isLoading: false,
		isSaving: false,
		likedByCurrentUser: false,
		restNonce: undefined,
	} as PersistenceLikeButtonState,

	actions: {
		async loadStatus() {
			const context = getContext< PersistenceLikeButtonContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}

			state.isLoading = true;
			state.error = undefined;

			try {
				const result = await fetchLikeStatus( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to load like state';
					return;
				}

				state.count = result.data.count;
			} catch ( error ) {
				state.error =
					error instanceof Error
						? error.message
						: 'Unknown loading error';
			} finally {
				state.isLoading = false;
			}
		},
		async loadBootstrap() {
			const context = getContext< PersistenceLikeButtonContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				state.bootstrapReady = true;
				state.buttonLabel = context.likeLabel;
				state.canWrite = false;
				state.likedByCurrentUser = false;
				state.restNonce = undefined;
				return;
			}

			state.isBootstrapping = true;

			try {
				const result = await fetchLikeBootstrap( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					state.bootstrapReady = true;
					state.canWrite = false;
					state.likedByCurrentUser = false;
					state.restNonce = undefined;
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to initialize write access';
					return;
				}

				state.bootstrapReady = true;
				state.restNonce =
					typeof result.data.restNonce === 'string' &&
					result.data.restNonce.length > 0
						? result.data.restNonce
						: undefined;
				state.canWrite =
					result.data.canWrite === true &&
					typeof state.restNonce === 'string' &&
					state.restNonce.length > 0;
				state.likedByCurrentUser =
					result.data.likedByCurrentUser === true;
				state.buttonLabel = getButtonLabel(
					context,
					state.likedByCurrentUser
				);
			} catch ( error ) {
				state.bootstrapReady = true;
				state.canWrite = false;
				state.likedByCurrentUser = false;
				state.restNonce = undefined;
				state.error =
					error instanceof Error
						? error.message
						: 'Unknown bootstrap error';
			} finally {
				state.isBootstrapping = false;
			}
		},
		async toggle() {
			const context = getContext< PersistenceLikeButtonContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( ! state.bootstrapReady ) {
				state.error = 'Write access is still initializing.';
				return;
			}
			if ( ! state.canWrite ) {
				state.error = 'Sign in to like this item.';
				return;
			}

			state.isSaving = true;
			state.error = undefined;

			try {
				const result = await toggleLike(
					{
						postId: context.postId,
						resourceKey: context.resourceKey,
					},
					state.restNonce
				);
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ?? 'Unable to toggle like';
					return;
				}

				state.count = result.data.count;
				state.likedByCurrentUser = result.data.likedByCurrentUser;
				state.buttonLabel = getButtonLabel(
					context,
					result.data.likedByCurrentUser
				);
			} catch ( error ) {
				state.error =
					error instanceof Error
						? error.message
						: 'Unknown update error';
			} finally {
				state.isSaving = false;
			}
		},
	},

	callbacks: {
		init() {
			const context = getContext< PersistenceLikeButtonContext >();
			state.bootstrapReady = false;
			state.buttonLabel = context.likeLabel;
			state.canWrite = false;
			state.count = 0;
			state.likedByCurrentUser = false;
			state.restNonce = undefined;
		},
		mounted() {
			state.isHydrated = true;
			if ( typeof document !== 'undefined' ) {
				document.documentElement.dataset.persistenceLikeButtonHydrated =
					'true';
			}
			void Promise.allSettled( [
				actions.loadStatus(),
				actions.loadBootstrap(),
			] );
		},
	},
} );
