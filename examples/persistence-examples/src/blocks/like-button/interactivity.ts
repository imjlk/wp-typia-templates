import { getContext, store } from '@wordpress/interactivity';

import { fetchLikeStatus, toggleLike } from './api';
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
		buttonLabel: 'Like this',
		canWrite: false,
		count: 0,
		error: undefined,
		isHydrated: false,
		isLoading: false,
		isSaving: false,
		likedByCurrentUser: false,
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
				const result = await fetchLikeStatus(
					{
						postId: context.postId,
						resourceKey: context.resourceKey,
					},
					context.restNonce
				);
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to load like state';
					return;
				}

				context.count = result.data.count;
				context.likedByCurrentUser = result.data.likedByCurrentUser;
				context.buttonLabel = getButtonLabel(
					context,
					result.data.likedByCurrentUser
				);
				state.buttonLabel = context.buttonLabel;
				state.count = result.data.count;
				state.likedByCurrentUser = result.data.likedByCurrentUser;
			} catch ( error ) {
				state.error =
					error instanceof Error
						? error.message
						: 'Unknown loading error';
			} finally {
				state.isLoading = false;
			}
		},
		async toggle() {
			const context = getContext< PersistenceLikeButtonContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( ! context.canWrite || ! state.canWrite ) {
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
					context.restNonce
				);
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ?? 'Unable to toggle like';
					return;
				}

				context.count = result.data.count;
				context.likedByCurrentUser = result.data.likedByCurrentUser;
				context.buttonLabel = getButtonLabel(
					context,
					result.data.likedByCurrentUser
				);
				state.buttonLabel = context.buttonLabel;
				state.count = result.data.count;
				state.likedByCurrentUser = result.data.likedByCurrentUser;
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
			state.buttonLabel = context.buttonLabel;
			state.canWrite = context.canWrite;
			state.count = context.count;
			state.likedByCurrentUser = context.likedByCurrentUser;
		},
		mounted() {
			state.isHydrated = true;
			if ( typeof document !== 'undefined' ) {
				document.documentElement.dataset.persistenceLikeButtonHydrated =
					'true';
			}
			void actions.loadStatus();
		},
	},
} );
