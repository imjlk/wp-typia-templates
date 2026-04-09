import { getContext, store } from '@wordpress/interactivity';

import { fetchLikeBootstrap, fetchLikeStatus, toggleLike } from './api';
import type {
	PersistenceLikeButtonClientState,
	PersistenceLikeButtonContext,
	PersistenceLikeButtonState,
} from './types';

function getButtonLabel(
	context: PersistenceLikeButtonContext,
	liked: boolean
): string {
	return liked ? context.unlikeLabel : context.likeLabel;
}

function getClientState(
	context: PersistenceLikeButtonContext
): PersistenceLikeButtonClientState {
	if ( context.client ) {
		return context.client;
	}

	context.client = {
		liked: false,
		writeNonce: '',
	};

	return context.client;
}

const { actions, state } = store( 'persistenceExamplesLikeButton', {
	state: {
		isHydrated: false,
	} as PersistenceLikeButtonState,

	actions: {
		async loadStatus() {
			const context = getContext< PersistenceLikeButtonContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}

			context.isLoading = true;
			context.error = '';

			try {
				const result = await fetchLikeStatus( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					context.error =
						result.errors[ 0 ]?.expected ??
						'Unable to load like state';
					return;
				}

				context.count = result.data.count;
			} catch ( error ) {
				context.error =
					error instanceof Error
						? error.message
						: 'Unknown loading error';
			} finally {
				context.isLoading = false;
			}
		},
		async loadBootstrap() {
			const context = getContext< PersistenceLikeButtonContext >();
			const clientState = getClientState( context );
			if ( context.postId <= 0 || ! context.resourceKey ) {
				context.bootstrapReady = true;
				context.buttonLabel = context.likeLabel;
				context.canWrite = false;
				clientState.liked = false;
				clientState.writeNonce = '';
				return;
			}

			context.isBootstrapping = true;

			try {
				const result = await fetchLikeBootstrap( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					context.bootstrapReady = true;
					context.canWrite = false;
					clientState.liked = false;
					clientState.writeNonce = '';
					context.error =
						result.errors[ 0 ]?.expected ??
						'Unable to initialize write access';
					return;
				}

				context.bootstrapReady = true;
				clientState.writeNonce =
					typeof result.data.restNonce === 'string' &&
					result.data.restNonce.length > 0
						? result.data.restNonce
						: '';
				context.canWrite =
					result.data.canWrite === true &&
					clientState.writeNonce.length > 0;
				clientState.liked =
					result.data.likedByCurrentUser === true;
				context.buttonLabel = getButtonLabel(
					context,
					clientState.liked
				);
			} catch ( error ) {
				context.bootstrapReady = true;
				context.canWrite = false;
				clientState.liked = false;
				clientState.writeNonce = '';
				context.error =
					error instanceof Error
						? error.message
						: 'Unknown bootstrap error';
			} finally {
				context.isBootstrapping = false;
			}
		},
		async toggle() {
			const context = getContext< PersistenceLikeButtonContext >();
			const clientState = getClientState( context );
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( ! context.bootstrapReady ) {
				context.error = 'Write access is still initializing.';
				return;
			}
			if ( ! context.canWrite ) {
				context.error = 'Sign in to like this item.';
				return;
			}

			context.isSaving = true;
			context.error = '';

			try {
				const result = await toggleLike(
					{
						postId: context.postId,
						resourceKey: context.resourceKey,
					},
					clientState.writeNonce
				);
				if ( ! result.isValid || ! result.data ) {
					context.error =
						result.errors[ 0 ]?.expected ?? 'Unable to toggle like';
						return;
				}

				context.count = result.data.count;
				clientState.liked = result.data.likedByCurrentUser;
				context.buttonLabel = getButtonLabel(
					context,
					result.data.likedByCurrentUser
				);
			} catch ( error ) {
				context.error =
					error instanceof Error
						? error.message
						: 'Unknown update error';
			} finally {
				context.isSaving = false;
			}
		},
	},

	callbacks: {
		init() {
			const context = getContext< PersistenceLikeButtonContext >();
			context.client = {
				liked: false,
				writeNonce: '',
			};
			context.bootstrapReady = false;
			context.buttonLabel = context.likeLabel;
			context.canWrite = false;
			context.count = 0;
			context.error = '';
			context.isBootstrapping = false;
			context.isLoading = false;
			context.isSaving = false;
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
