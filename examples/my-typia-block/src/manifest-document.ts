import rawCurrentManifest from '../typia.manifest.json';
import { defineManifestDocument } from '@wp-typia/block-runtime/editor';

const currentManifest = defineManifestDocument( rawCurrentManifest );

export default currentManifest;
