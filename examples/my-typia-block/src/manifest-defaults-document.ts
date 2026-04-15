import rawCurrentManifest from '../typia.manifest.json';
import { defineManifestDefaultsDocument } from '@wp-typia/block-runtime/defaults';

const currentManifest = defineManifestDefaultsDocument( rawCurrentManifest );

export default currentManifest;
