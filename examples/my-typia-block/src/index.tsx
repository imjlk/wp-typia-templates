import { registerBlockType, type BlockConfiguration } from '@wordpress/blocks';
import metadata from '../block.json';
import { deprecated } from './deprecated';
import Edit from './edit';
import Save from './save';
import { MyTypiaBlockAttributes } from './types';
import { validators } from './validators';
import './style.scss';

registerBlockType< MyTypiaBlockAttributes >(
	metadata as BlockConfiguration< MyTypiaBlockAttributes >,
	{
		example: {
			attributes: validators.random(),
		},
		deprecated: deprecated as unknown as NonNullable<
			Parameters<
				typeof registerBlockType< MyTypiaBlockAttributes >
			>[ 1 ]
		>[ 'deprecated' ],
		edit: Edit,
		save: Save,
	}
);
