import { registerBlockType } from '@wordpress/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import './style.scss';

import type { PersistenceLikeButtonAttributes } from './types';

registerBlockType< PersistenceLikeButtonAttributes >( metadata.name, {
	title: metadata.title,
	description: metadata.description,
	category: metadata.category as any,
	icon: metadata.icon as any,
	supports: metadata.supports,
	attributes: metadata.attributes as any,
	example: metadata.example,
	edit: Edit,
	save: Save,
} );
