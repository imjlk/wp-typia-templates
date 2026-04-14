import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	type ScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import './style.scss';

import type { PersistenceLikeButtonAttributes } from './types';

const registration = buildScaffoldBlockRegistration<
	BlockConfiguration< PersistenceLikeButtonAttributes >
>( metadata as ScaffoldBlockMetadata, {
	edit: Edit,
	save: Save,
} );

registerBlockType< PersistenceLikeButtonAttributes >(
	registration.name,
	registration.settings
);
