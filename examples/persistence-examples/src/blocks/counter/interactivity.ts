import { getContext, store } from '@wordpress/interactivity';
import { generatePublicWriteRequestId } from '@wp-typia/block-runtime/identifiers';

import {
	fetchCounter,
	fetchCounterBootstrap,
	incrementCounter,
} from './api';
import type {
	PersistenceCounterContext,
	PersistenceCounterState,
} from './types';

function hasExpiredPublicWriteToken(
	expiresAt?: number
): boolean {
	return (
		typeof expiresAt === 'number' &&
		expiresAt > 0 &&
		Date.now() >= expiresAt * 1000
	);
}

function getWriteBlockedMessage(): string {
	return 'Public writes are temporarily unavailable.';
}

const { actions, state } = store( 'persistenceExamplesCounter', {
	state: {
		bootstrapReady: false,
		canWrite: false,
		count: 0,
		error: undefined,
		isBootstrapping: false,
		isHydrated: false,
		isLoading: false,
		isSaving: false,
		publicWriteExpiresAt: undefined,
		publicWriteToken: undefined,
	} as PersistenceCounterState,

	actions: {
		async loadCounter() {
			const context = getContext< PersistenceCounterContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}

			state.isLoading = true;
			state.error = undefined;

			try {
				const result = await fetchCounter( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to load the counter';
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
			const context = getContext< PersistenceCounterContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				state.bootstrapReady = true;
				state.canWrite = false;
				state.publicWriteExpiresAt = undefined;
				state.publicWriteToken = undefined;
				return;
			}

			state.isBootstrapping = true;

			try {
				const result = await fetchCounterBootstrap( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					state.bootstrapReady = true;
					state.canWrite = false;
					state.publicWriteExpiresAt = undefined;
					state.publicWriteToken = undefined;
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to initialize write access';
					return;
				}

				state.publicWriteExpiresAt =
					typeof result.data.publicWriteExpiresAt === 'number' &&
					result.data.publicWriteExpiresAt > 0
						? result.data.publicWriteExpiresAt
						: undefined;
				state.publicWriteToken =
					typeof result.data.publicWriteToken === 'string' &&
					result.data.publicWriteToken.length > 0
						? result.data.publicWriteToken
						: undefined;
				state.bootstrapReady = true;
				state.canWrite =
					result.data.canWrite === true &&
					typeof state.publicWriteToken === 'string' &&
					state.publicWriteToken.length > 0 &&
					! hasExpiredPublicWriteToken( state.publicWriteExpiresAt );
			} catch ( error ) {
				state.bootstrapReady = true;
				state.canWrite = false;
				state.publicWriteExpiresAt = undefined;
				state.publicWriteToken = undefined;
				state.error =
					error instanceof Error
						? error.message
						: 'Unknown bootstrap error';
			} finally {
				state.isBootstrapping = false;
			}
		},
		async increment() {
			const context = getContext< PersistenceCounterContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( ! state.bootstrapReady ) {
				state.error = 'Write access is still initializing.';
				return;
			}
			if ( hasExpiredPublicWriteToken( state.publicWriteExpiresAt ) ) {
				await actions.loadBootstrap();
			}
			if ( hasExpiredPublicWriteToken( state.publicWriteExpiresAt ) ) {
				state.canWrite = false;
				state.error = getWriteBlockedMessage();
				return;
			}
			if ( ! state.canWrite ) {
				state.error = getWriteBlockedMessage();
				return;
			}

			state.isSaving = true;
			state.error = undefined;

			try {
				const result = await incrementCounter( {
					delta: 1,
					postId: context.postId,
					publicWriteRequestId: generatePublicWriteRequestId(),
					publicWriteToken: state.publicWriteToken,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to update the counter';
					return;
				}

				state.count = result.data.count;
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
			state.bootstrapReady = false;
			state.canWrite = false;
			state.count = 0;
			state.publicWriteExpiresAt = undefined;
			state.publicWriteToken = undefined;
		},
		mounted() {
			state.isHydrated = true;
			if ( typeof document !== 'undefined' ) {
				document.documentElement.dataset.persistenceCounterHydrated =
					'true';
			}
			void Promise.allSettled( [
				actions.loadCounter(),
				actions.loadBootstrap(),
			] );
		},
	},
} );
