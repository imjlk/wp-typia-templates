import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import '../compound-patterns/style.scss';

import type { CompoundPatternsItemAttributes } from './types';

const registration = buildScaffoldBlockRegistration(
	parseScaffoldBlockMetadata<
		BlockConfiguration< CompoundPatternsItemAttributes >
	>( metadata ),
	{
		edit: Edit,
		save: Save,
	}
);

registerBlockType< CompoundPatternsItemAttributes >(
	registration.name,
	registration.settings
);
