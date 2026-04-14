import { registerBlockType } from '@wordpress/blocks';
import type {
	BlockDeprecationList,
	BlockConfiguration,
	RegisterBlockTypeResult,
} from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';
import metadata from '../block.json';
import { deprecated } from './deprecated';
import Edit from './edit';
import Save from './save';
import { MyTypiaBlockAttributes } from './types';
import { validators } from './validators';
import './style.scss';

const registration = buildScaffoldBlockRegistration(
	parseScaffoldBlockMetadata< BlockConfiguration< MyTypiaBlockAttributes > >(
		metadata
	),
	{
		example: {
			attributes: validators.random(),
		},
		deprecated:
			deprecated as BlockDeprecationList< MyTypiaBlockAttributes >,
		edit: Edit,
		save: Save,
	}
);

const registeredBlock: RegisterBlockTypeResult< MyTypiaBlockAttributes > =
	registerBlockType< MyTypiaBlockAttributes >(
		registration.name,
		registration.settings
	);

void registeredBlock;
