import { createElement } from '@wordpress/element';

/**
 * Minimal edit function to avoid stack overflow
 */
export default function Edit() {
	return createElement('div', {
		className: 'wp-block-create-block-my-typia-block'
	}, 'My Typia Block - Simple Version');
}
