/* eslint-disable no-console */
import { store, getContext } from '@wordpress/interactivity';
import { MyTypiaBlockState } from './types';

const { state } = store( 'create-block/my-typia-block', {
	state: {
		isActive: false,
		isVisible: true,
		isLoading: false,
	} as MyTypiaBlockState,

	actions: {
		toggle() {
			state.isActive = ! state.isActive;
			console.log( 'MyTypiaBlock toggled:', state.isActive );
		},

		hide() {
			state.isVisible = false;
		},

		show() {
			state.isVisible = true;
		},

		async loadContent() {
			state.isLoading = true;

			try {
				// Simulate async operation
				await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );

				// Get context data
				const context = getContext< {
					content: string;
					alignment: string;
				} >();

				console.log( 'MyTypiaBlock content loaded:', context );
			} catch ( error ) {
				state.error =
					error instanceof Error ? error.message : 'Unknown error';
				console.error( 'MyTypiaBlock loading failed:', error );
			} finally {
				state.isLoading = false;
			}
		},
	},

	callbacks: {
		init() {
			console.log(
				'MyTypiaBlock initialized with Typia validation and Interactivity API'
			);
		},

		mounted() {
			const context = getContext();
			console.log( 'MyTypiaBlock mounted with context:', context );
		},
	},
} );
