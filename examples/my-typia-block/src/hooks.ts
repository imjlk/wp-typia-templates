/* eslint-disable no-console */
import { useEffect, useState } from '@wordpress/element';

export interface TypiaValidationError {
	description?: string;
	expected: string;
	path: string;
	value: unknown;
}

/**
 * Custom hooks for My Typia Block
 */
export * from './hooks/useDebounce';
export * from './hooks/useLocalStorage';

/**
 * Hook for Typia validation with real-time feedback
 * @param data      Value to validate.
 * @param validator Validation function.
 * @return Validation state and current errors.
 */
export function useTypiaValidation< T >(
	data: T,
	validator: ( value: T ) => {
		success: boolean;
		errors?: TypiaValidationError[];
	}
) {
	const [ isValid, setIsValid ] = useState( true );
	const [ errors, setErrors ] = useState< TypiaValidationError[] >( [] );

	useEffect( () => {
		const result = validator( data );
		setIsValid( result.success );
		setErrors( result.errors || [] );
	}, [ data, validator ] );

	return { isValid, errors };
}

/**
 * Hook for generating UUID
 * @return A stable UUID for the lifetime of the component.
 */
export function useUUID() {
	const [ uuid ] = useState( () => {
		if ( globalThis.crypto?.randomUUID ) {
			return globalThis.crypto.randomUUID();
		}

		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
			/[xy]/g,
			( c ) => {
				const r = Math.floor( Math.random() * 16 );
				const v = c === 'x' ? r : ( r % 4 ) + 8;
				return v.toString( 16 );
			}
		);
	} );

	return uuid;
}

/**
 * Hook for logging attribute changes in development
 * @param attributes Current block attributes.
 */
export function useAttributeLogger( attributes: Record< string, unknown > ) {
	useEffect( () => {
		if ( process.env.NODE_ENV === 'development' ) {
			// eslint-disable-next-line no-console
			console.log( 'My Typia Block attributes changed:', attributes );
		}
	}, [ attributes ] );
}
