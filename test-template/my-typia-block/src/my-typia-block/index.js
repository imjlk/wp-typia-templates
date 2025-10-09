import { registerBlockType } from '@wordpress/blocks';

console.log('My Typia Block: Script loading...');

// 즉시 블록 등록 시도
console.log('My Typia Block: Attempting to register block...');

try {
	const result = registerBlockType('create-block/my-typia-block', {
		title: 'My Typia Block',
		icon: 'smiley',
		category: 'text',
		description: 'A simple test block with Typia',
		keywords: ['typia', 'test', 'example'],
		edit: () => {
			console.log('My Typia Block: Edit component rendering');
			return wp.element.createElement('div', {
				className: 'my-typia-block-editor',
				style: { padding: '20px', border: '2px solid #0073aa', background: '#f0f6fc' }
			}, 'My Typia Block - Editor View');
		},
		save: () => {
			console.log('My Typia Block: Save component rendering');
			return wp.element.createElement('div', {
				className: 'my-typia-block-frontend',
				style: { padding: '20px', border: '2px solid #00a32a', background: '#f0fff4' }
			}, 'My Typia Block - Frontend View');
		}
	});

	console.log('My Typia Block: Registration SUCCESS!', result);
	console.log('My Typia Block: Block name:', result?.name);
	console.log('My Typia Block: Block title:', result?.title);

} catch (error) {
	console.error('My Typia Block: Registration FAILED:', error);
}
