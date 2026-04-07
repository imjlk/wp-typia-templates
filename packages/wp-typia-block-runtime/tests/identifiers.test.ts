import { afterEach, describe, expect, test } from 'bun:test';

import {
	generateBlockId,
	generatePublicWriteRequestId,
	generateResourceKey,
	generateScopedClientId,
} from '@wp-typia/block-runtime/identifiers';

const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
	globalThis,
	'crypto'
);
const originalMathRandom = Math.random;

afterEach( () => {
	if ( originalCryptoDescriptor ) {
		Object.defineProperty( globalThis, 'crypto', originalCryptoDescriptor );
	} else {
		Reflect.deleteProperty( globalThis, 'crypto' );
	}

	Math.random = originalMathRandom;
} );

describe( '@wp-typia/block-runtime/identifiers', () => {
	test( 'generateBlockId uses crypto.randomUUID when available', () => {
		const nativeUuid = '00000000-0000-4000-8000-000000000000';
		mockCrypto( {
			randomUUID: () => nativeUuid,
		} );

		expect( generateBlockId() ).toBe( nativeUuid );
	} );

	test( 'UUID helpers fall back to getRandomValues before Math.random', () => {
		mockCrypto( {
			getRandomValues: ( target ) => {
				target.set( [
					0x00, 0x01, 0x02, 0x03,
					0x04, 0x05, 0x06, 0x07,
					0x08, 0x09, 0x0a, 0x0b,
					0x0c, 0x0d, 0x0e, 0x0f,
				] );
				return target;
			},
		} );

		expect( generateBlockId() ).toBe( '00010203-0405-4607-8809-0a0b0c0d0e0f' );
		expect( generatePublicWriteRequestId() ).toBe(
			'00010203-0405-4607-8809-0a0b0c0d0e0f'
		);
	} );

	test( 'UUID helpers fall back to Math.random when crypto is unavailable', () => {
		mockCrypto( undefined );
		Math.random = () => 0.5;

		expect( generateBlockId() ).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		);
		expect( generatePublicWriteRequestId() ).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		);
	} );

	test( 'prefixed helpers preserve the prefix-suffix shape', () => {
		mockCrypto( {
			getRandomValues: ( target ) => {
				target.set( [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ] );
				return target;
			},
		} );

		expect( generateScopedClientId( 'demo' ) ).toBe( 'demo-012345678' );
		expect( generateResourceKey( 'demo' ) ).toBe( 'demo-012345678' );
	} );

	test( 'prefixed helpers fall back to Math.random when crypto is unavailable', () => {
		mockCrypto( undefined );
		Math.random = () => 0.5;

		expect( generateScopedClientId( 'demo' ) ).toMatch( /^demo-[a-z0-9]{9}$/ );
		expect( generateResourceKey( 'demo' ) ).toMatch( /^demo-[a-z0-9]{9}$/ );
	} );
} );

function mockCrypto(
	value:
		| {
				getRandomValues?: ( target: Uint8Array ) => Uint8Array;
				randomUUID?: () => string;
		  }
		| undefined
) {
	Object.defineProperty( globalThis, 'crypto', {
		configurable: true,
		value,
	});
}
