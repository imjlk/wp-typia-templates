type CryptoLike = Partial<
	Pick< Crypto, 'getRandomValues' | 'randomUUID' >
>;

const UUID_HEX_RADIX = 16;
const SCOPED_SUFFIX_LENGTH = 9;

/**
 * Generate a UUID v4-style id for block attributes.
 */
export function generateBlockId(): string {
	return generateUuidV4();
}

/**
 * Generate a prefixed runtime id for client-side attributes such as uniqueId.
 * @param prefix Prefix chosen by the scaffold/template.
 */
export function generateScopedClientId( prefix: string ): string {
	return generatePrefixedScopedId( prefix );
}

/**
 * Generate a prefixed persistence resource key.
 * @param prefix Prefix chosen by the scaffold/template.
 */
export function generateResourceKey( prefix: string ): string {
	return generatePrefixedScopedId( prefix );
}

/**
 * Generate an opaque id for one public write attempt.
 */
export function generatePublicWriteRequestId(): string {
	return generateUuidV4();
}

function generateUuidV4(): string {
	const cryptoObject = getCryptoObject();

	if ( typeof cryptoObject?.randomUUID === 'function' ) {
		return cryptoObject.randomUUID();
	}

	const bytes = fillRandomBytes( 16 );
	if ( bytes ) {
		bytes[ 6 ] = ( bytes[ 6 ] & 0x0f ) | 0x40;
		bytes[ 8 ] = ( bytes[ 8 ] & 0x3f ) | 0x80;
		return formatUuidBytes( bytes );
	}

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		( character ) => {
			const randomNibble = Math.floor( Math.random() * UUID_HEX_RADIX );
			const value =
				character === 'x'
					? randomNibble
					: ( randomNibble & 0x03 ) | 0x08;
			return value.toString( UUID_HEX_RADIX );
		}
	);
}

function generatePrefixedScopedId( prefix: string ): string {
	return `${ prefix }-${ generateScopedSuffix() }`;
}

function generateScopedSuffix(): string {
	const bytes = fillRandomBytes( SCOPED_SUFFIX_LENGTH );

	if ( bytes ) {
		return Array.from(
			bytes,
			( byte ) => ( byte % 36 ).toString( 36 )
		).join( '' );
	}

	return Math.random()
		.toString( 36 )
		.slice( 2, 2 + SCOPED_SUFFIX_LENGTH )
		.padEnd( SCOPED_SUFFIX_LENGTH, '0' );
}

function formatUuidBytes( bytes: Uint8Array ): string {
	const hex = Array.from(
		bytes,
		( byte ) => byte.toString( UUID_HEX_RADIX ).padStart( 2, '0' )
	).join( '' );

	return [
		hex.slice( 0, 8 ),
		hex.slice( 8, 12 ),
		hex.slice( 12, 16 ),
		hex.slice( 16, 20 ),
		hex.slice( 20 ),
	].join( '-' );
}

function fillRandomBytes( size: number ): Uint8Array | null {
	const cryptoObject = getCryptoObject();
	if ( typeof cryptoObject?.getRandomValues !== 'function' ) {
		return null;
	}

	const bytes = new Uint8Array( size );
	cryptoObject.getRandomValues( bytes );
	return bytes;
}

function getCryptoObject(): CryptoLike | undefined {
	return typeof globalThis.crypto === 'object' && globalThis.crypto
		? ( globalThis.crypto as CryptoLike )
		: undefined;
}
