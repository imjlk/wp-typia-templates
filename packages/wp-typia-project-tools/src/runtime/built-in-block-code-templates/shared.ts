export const SHARED_HOOKS_TEMPLATE = `import { useMemo } from '@wordpress/element';

import {
	createUseTypiaValidationHook,
	formatValidationError,
	formatValidationErrors,
} from '@wp-typia/block-runtime/validation';

export {
	formatValidationError,
	formatValidationErrors,
	type TypiaValidationError,
	type ValidationResult,
	type ValidationState,
} from '@wp-typia/block-runtime/validation';

export const useTypiaValidation = createUseTypiaValidationHook( {
	useMemo,
} );
`;

export const BLOCK_METADATA_WRAPPER_TEMPLATE = `import rawMetadata from './block.json';
import { defineScaffoldBlockMetadata } from '@wp-typia/block-runtime/blocks';

const metadata = defineScaffoldBlockMetadata(rawMetadata);

export default metadata;
`;

export const MANIFEST_DOCUMENT_WRAPPER_TEMPLATE = `import rawCurrentManifest from './typia.manifest.json';
import { defineManifestDocument } from '@wp-typia/block-runtime/editor';

const currentManifest = defineManifestDocument(rawCurrentManifest);

export default currentManifest;
`;

export const MANIFEST_DEFAULTS_DOCUMENT_WRAPPER_TEMPLATE = `import rawCurrentManifest from './typia.manifest.json';
import { defineManifestDefaultsDocument } from '@wp-typia/block-runtime/defaults';

const currentManifest = defineManifestDefaultsDocument(rawCurrentManifest);

export default currentManifest;
`;
