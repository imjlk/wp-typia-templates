/**
 * WordPress {{title}} Block
 * 
 * Typia 기반 타입 안전 블록
 */

import { registerBlockType } from '@wordpress/blocks';
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
registerBlockType<{{pascalCase}}Attributes>(metadata.name, {
  title: metadata.title,
  description: metadata.description,
  category: metadata.category as any,
  icon: metadata.icon,
  supports: {
    html: false,
    multiple: true,
    align: ['wide', 'full'],
  },
  attributes: metadata.attributes,
  example: {
    attributes: validators.random(),
  },
  edit: Edit,
  save: Save,
});
