import { registerBlockType } from '@wordpress/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import '../compound-patterns/style.scss';

import type { CompoundPatternsItemAttributes } from './types';

registerBlockType< CompoundPatternsItemAttributes >( metadata.name, {
	title: metadata.title,
	description: metadata.description,
	category: metadata.category as any,
	icon: metadata.icon as any,
	supports: metadata.supports,
	attributes: metadata.attributes as any,
	example: metadata.example,
	parent: metadata.parent,
	edit: Edit,
	save: Save,
} );
