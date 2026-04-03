/**
 * WordPress {{title}} Block
 *
 * Typia-powered type-safe block
 */

import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

// Import components
import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import './style.scss';

// Import types
import { {{pascalCase}}Attributes } from './types';
import { validators } from './validators';

// Register the block
const blockMetadata = metadata as BlockConfiguration<{{pascalCase}}Attributes> & {
  name: string;
};

registerBlockType<{{pascalCase}}Attributes>(blockMetadata.name, {
  title: blockMetadata.title,
  description: blockMetadata.description,
  category: blockMetadata.category as any,
  icon: blockMetadata.icon,
  supports: {
    html: false,
    multiple: true,
    align: ['wide', 'full'],
  },
  attributes: blockMetadata.attributes,
  example: {
    attributes: validators.random(),
  },
  edit: Edit,
  save: Save,
});
