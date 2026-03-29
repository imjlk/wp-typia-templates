/* eslint-disable no-console */
import typia from 'typia';
import currentManifest from '../typia.manifest.json';
import {
	type ManifestDefaultsDocument,
	applyTemplateDefaultsFromManifest,
} from '@wp-typia/create/runtime/defaults';
import { MyTypiaBlockAttributes } from './types';

/**
 * Typia validators for the block attributes
 */
export const validators = {
	validate: typia.createValidate< MyTypiaBlockAttributes >(),
	assert: typia.createAssert< MyTypiaBlockAttributes >(),
	is: typia.createIs< MyTypiaBlockAttributes >(),
	random: typia.createRandom< MyTypiaBlockAttributes >(),
	clone: typia.misc.createClone< MyTypiaBlockAttributes >(),
	prune: typia.misc.createPrune< MyTypiaBlockAttributes >(),
};

export function sanitizeMyTypiaBlockAttributes(
	attributes: Partial< MyTypiaBlockAttributes >
): MyTypiaBlockAttributes {
	return applyTemplateDefaultsFromManifest< MyTypiaBlockAttributes >(
		currentManifest as ManifestDefaultsDocument,
		attributes
	) as MyTypiaBlockAttributes;
}

/**
 * Create safe attribute updater with validation
 * @param attributes
 * @param setAttributes
 * @param validator
 */
export function createAttributeUpdater(
	attributes: MyTypiaBlockAttributes,
	setAttributes: ( attrs: Partial< MyTypiaBlockAttributes > ) => void,
	validator = validators.validate
) {
	return < K extends keyof MyTypiaBlockAttributes >(
		key: K,
		value: MyTypiaBlockAttributes[ K ]
	) => {
		const newAttrs = { ...attributes, [ key ]: value };

		const validation = validator( newAttrs );
		if ( validation.success ) {
			setAttributes( {
				[ key ]: value,
			} as Partial< MyTypiaBlockAttributes > );
			return true;
		}
		console.error(
			`Validation failed for ${ String( key ) }:`,
			validation.errors
		);
		return false;
	};
}
