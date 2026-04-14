import { registerBlockType } from '@wordpress/blocks';
import type {
	BlockConfiguration,
	BlockDeprecationList,
	RegisterBlockTypeResult,
} from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	type ScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';
import metadata from '../block.json';
import { deprecated } from './deprecated';
import Edit from './edit';
import Save from './save';
import { MyTypiaBlockAttributes } from './types';
import { validators } from './validators';
import './style.scss';

const registration = buildScaffoldBlockRegistration<
	BlockConfiguration< MyTypiaBlockAttributes >
>( metadata as ScaffoldBlockMetadata, {
	example: {
		attributes: validators.random(),
	},
	deprecated: deprecated as BlockDeprecationList< MyTypiaBlockAttributes >,
	edit: Edit,
	save: Save,
} );

const registeredBlock: RegisterBlockTypeResult< MyTypiaBlockAttributes > =
	registerBlockType< MyTypiaBlockAttributes >(
		registration.name,
		registration.settings
	);

void registeredBlock;
