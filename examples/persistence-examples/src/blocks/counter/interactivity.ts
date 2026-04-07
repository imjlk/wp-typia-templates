import { getContext, store } from '@wordpress/interactivity';
import { generatePublicWriteRequestId } from '@wp-typia/block-runtime/identifiers';

import { fetchCounter, incrementCounter } from './api';
import type {
	PersistenceCounterContext,
	PersistenceCounterState,
} from './types';

function hasExpiredPublicWriteToken(
	context: PersistenceCounterContext
): boolean {
	return (
		typeof context.publicWriteExpiresAt === 'number' &&
		context.publicWriteExpiresAt > 0 &&
		Date.now() >= context.publicWriteExpiresAt * 1000
	);
}

const { actions, state } = store( 'persistenceExamplesCounter', {
	state: {
		canWrite: false,
		count: 0,
		error: undefined,
		isHydrated: false,
		isLoading: false,
		isSaving: false,
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

				context.count = result.data.count;
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
		async increment() {
			const context = getContext< PersistenceCounterContext >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( hasExpiredPublicWriteToken( context ) ) {
				context.canWrite = false;
				state.canWrite = false;
				state.error = 'Reload the page to refresh this write token.';
				return;
			}
			if ( ! context.canWrite || ! state.canWrite ) {
				state.error = 'Reload the page to refresh this write token.';
				return;
			}

			state.isSaving = true;
			state.error = undefined;

			try {
				const result = await incrementCounter( {
					delta: 1,
					postId: context.postId,
					publicWriteRequestId: generatePublicWriteRequestId(),
					publicWriteToken: context.publicWriteToken,
					resourceKey: context.resourceKey,
				} );
				if ( ! result.isValid || ! result.data ) {
					state.error =
						result.errors[ 0 ]?.expected ??
						'Unable to update the counter';
					return;
				}

				context.count = result.data.count;
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
			const context = getContext< PersistenceCounterContext >();
			context.canWrite =
				context.canWrite && ! hasExpiredPublicWriteToken( context );
			state.canWrite = context.canWrite;
			state.count = context.count;
		},
		mounted() {
			state.isHydrated = true;
			if ( typeof document !== 'undefined' ) {
				document.documentElement.dataset.persistenceCounterHydrated =
					'true';
			}
			void actions.loadCounter();
		},
	},
} );
