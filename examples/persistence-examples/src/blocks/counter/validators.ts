/* eslint-disable no-console */
import typia from 'typia';
import currentManifest from './typia.manifest.json';
import {
	type ManifestDefaultsDocument,
	applyTemplateDefaultsFromManifest,
} from '@wp-typia/block-runtime/defaults';
import {
	createAttributeUpdater as createValidatedAttributeUpdater,
	type ValidationResult,
	toValidationResult,
} from '@wp-typia/block-runtime/validation';
import type {
	PersistenceCounterAttributes,
	PersistenceCounterValidationResult,
} from './types';

const validate = typia.createValidate< PersistenceCounterAttributes >();
const assert = typia.createAssert< PersistenceCounterAttributes >();
const is = typia.createIs< PersistenceCounterAttributes >();
const random = typia.createRandom< PersistenceCounterAttributes >();
const clone = typia.misc.createClone< PersistenceCounterAttributes >();
const prune = typia.misc.createPrune< PersistenceCounterAttributes >();

export const validatePersistenceCounterAttributes = (
	attributes: unknown
): PersistenceCounterValidationResult => {
	return toValidationResult( validate( attributes ) );
};

export const validators = {
	assert,
	clone,
	is,
	prune,
	random,
	validate: validatePersistenceCounterAttributes,
};

export const sanitizePersistenceCounterAttributes = (
	attributes: Partial< PersistenceCounterAttributes >
): PersistenceCounterAttributes => {
	const normalized =
		applyTemplateDefaultsFromManifest< PersistenceCounterAttributes >(
			currentManifest as ManifestDefaultsDocument,
			attributes
		);

	return validators.assert( {
		...normalized,
		resourceKey:
			normalized.resourceKey && normalized.resourceKey.length > 0
				? normalized.resourceKey
				: generateResourceKey(),
	} );
};

export function createAttributeUpdater(
	attributes: PersistenceCounterAttributes,
	setAttributes: ( attrs: Partial< PersistenceCounterAttributes > ) => void,
	validator = validatePersistenceCounterAttributes
) {
	return createValidatedAttributeUpdater(
		attributes,
		setAttributes,
		validator as (
			value: PersistenceCounterAttributes
		) => ValidationResult< PersistenceCounterAttributes >,
		( validation, key ) => {
			console.error(
				`Validation failed for ${ String( key ) }:`,
				validation.errors
			);
		}
	);
}

const generateResourceKey = (): string =>
	'persistence-counter-' + Math.random().toString( 36 ).slice( 2, 11 );
