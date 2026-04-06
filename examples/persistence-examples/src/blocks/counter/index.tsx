import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import {
	buildScaffoldBlockRegistration,
	type ScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import './style.scss';

import type { PersistenceCounterAttributes } from './types';

const registration = buildScaffoldBlockRegistration<
	BlockConfiguration< PersistenceCounterAttributes >
>( metadata as ScaffoldBlockMetadata, {
	edit: Edit,
	save: Save,
} );

registerBlockType< PersistenceCounterAttributes >(
	registration.name,
	registration.settings
);
