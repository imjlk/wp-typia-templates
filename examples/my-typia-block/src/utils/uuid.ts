/**
 * Generate UUID v4
 */
export function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function ( c ) {
			const r = Math.floor( Math.random() * 16 );
			const v = c === 'x' ? r : ( r % 4 ) + 8;
			return v.toString( 16 );
		}
	);
}

/**
 * Generate short ID (8 characters)
 */
export function generateShortId(): string {
	return Math.random().toString( 36 ).substring( 2, 10 );
}
