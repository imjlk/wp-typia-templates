import { createElement } from '@wordpress/element';

/**
 * Minimal save function to avoid stack overflow
 */
export default function save() {
	return createElement('div', {
		className: 'wp-block-create-block-my-typia-block'
	}, 'My Typia Block - Saved Content');
}
